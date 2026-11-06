import type { 
  ArduinoSensorEvent, 
  Campus, 
  NewReservationPayload, 
  ParkingSensorSlot,
  ParkingSpot, 
  Reservation 
} from '../types';
import { CAMPUS_LIST, INITIAL_SPOTS } from './mockData';
import { subscribeToFirebaseCta, reserveFirebaseCtaSlot, releaseFirebaseCtaSlot } from './firebase';

type SensorCallback = (event: ArduinoSensorEvent) => void;
type SpotsCallback = (spots: ParkingSpot[]) => void;

class ParkingService {
  private spots: ParkingSpot[] = [...INITIAL_SPOTS];
  private campuses: Campus[] = [...CAMPUS_LIST];
  private reservations: Reservation[] = [];
  private sensorListeners: Set<SensorCallback> = new Set();
  private spotListeners: Set<SpotsCallback> = new Set();
  private autoSimulationInterval: number | null = null;
  private unsubscribeFirebaseCta: (() => void) | null = null;

  constructor() {
    this.loadFromStorage();
    this.initFirebaseCtaSubscription();
  }

  /**
   * Conexión en tiempo real con Firebase Realtime Database para el estacionamiento del CTA.
   * Sólo este estacionamiento opera con Firebase, los demás mantienen su lógica estándar.
   */
  private initFirebaseCtaSubscription() {
    this.unsubscribeFirebaseCta = subscribeToFirebaseCta((data) => {
      const ctaIndex = this.spots.findIndex((s) => s.id === 'est-cta');
      if (ctaIndex !== -1) {
        this.spots[ctaIndex] = {
          ...this.spots[ctaIndex],
          totalSpots: data.totalSpots,
          availableSpots: data.availableSpots,
          sensors: data.sensors,
        };
        this.notifySpotsChanged();
      }
    });
  }

  private loadFromStorage() {
    try {
      const savedReservations = localStorage.getItem('cs_reservations');
      if (savedReservations) {
        this.reservations = JSON.parse(savedReservations);
      }
    } catch {
      // Storage unavailable, fallback to memory
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('cs_reservations', JSON.stringify(this.reservations));
    } catch {
      // Ignore
    }
  }

  /**
   * Obtiene la lista de campus disponibles
   */
  async getCampuses(): Promise<Campus[]> {
    return Promise.resolve([...this.campuses]);
  }

  /**
   * Obtiene los estacionamientos de un campus
   */
  async getSpots(campusId: string): Promise<ParkingSpot[]> {
    return Promise.resolve(this.spots.filter(s => s.campusId === campusId));
  }

  /**
   * Obtiene un estacionamiento por ID
   */
  async getSpotById(spotId: string): Promise<ParkingSpot | undefined> {
    return Promise.resolve(this.spots.find(s => s.id === spotId));
  }

  /**
   * Crea una nueva reserva
   * Lista para conectarse a endpoint POST /api/reservations (MongoDB)
   */
  async createReservation(payload: NewReservationPayload): Promise<Reservation> {
    const spot = this.spots.find(s => s.id === payload.spotId);
    if (!spot) throw new Error('Estacionamiento no encontrado');
    if (spot.availableSpots <= 0) throw new Error('No hay plazas disponibles');

    // Descontar una plaza disponible
    spot.availableSpots = Math.max(0, spot.availableSpots - 1);

    let reservedSensorId = payload.sensorId;
    let reservedSlotNumber = payload.slotNumber;

    // Si es el estacionamiento del CTA conectado a Firebase, actualizar LED amarillo y patente_esperada
    if (spot.id === 'est-cta') {
      if (spot.sensors && spot.sensors.length > 0) {
        const targetSensor = payload.sensorId
          ? spot.sensors.find((s: ParkingSensorSlot) => s.sensorId === payload.sensorId)
          : spot.sensors.find((s: ParkingSensorSlot) => s.ledColor === 'verde' && !s.isOccupied);

        if (targetSensor) {
          reservedSensorId = targetSensor.sensorId;
          reservedSlotNumber = targetSensor.slotNumber;
          await reserveFirebaseCtaSlot(targetSensor.sensorId, payload.vehiclePlate);
        }
      }
    }

    this.notifySpotsChanged();

    const reservation: Reservation = {
      id: 'res_' + Math.random().toString(36).substring(2, 9),
      code: 'CS-' + Math.floor(1000 + Math.random() * 9000),
      spotId: spot.id,
      spotName: spot.name,
      campusId: spot.campusId,
      accessPoint: spot.accessPoint,
      date: payload.date,
      arrivalTime: payload.arrivalTime,
      duration: payload.duration,
      departureTime: '15:30',
      vehiclePlate: payload.vehiclePlate.toUpperCase().trim(),
      vehicleModel: payload.vehicleModel,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min de tolerancia
      sensorId: reservedSensorId,
      slotNumber: reservedSlotNumber,
    };

    this.reservations.unshift(reservation);
    this.saveToStorage();

    return reservation;
  }

  /**
   * Cancela una reserva
   */
  async cancelReservation(reservationId: string): Promise<boolean> {
    const idx = this.reservations.findIndex(r => r.id === reservationId);
    if (idx === -1) return false;

    const res = this.reservations[idx];
    res.status = 'cancelled';

    // Devolver plaza
    const spot = this.spots.find(s => s.id === res.spotId);
    if (spot && spot.availableSpots < spot.totalSpots) {
      spot.availableSpots += 1;

      // Si es el CTA conectado a Firebase, liberar reserva de LED amarillo y patente_esperada
      if (spot.id === 'est-cta') {
        if (res.sensorId) {
          await releaseFirebaseCtaSlot(res.sensorId);
        } else if (spot.sensors) {
          const reservedSensor = spot.sensors.find((s: ParkingSensorSlot) => s.ledColor === 'amarillo');
          if (reservedSensor) {
            await releaseFirebaseCtaSlot(reservedSensor.sensorId);
          }
        }
      }

      this.notifySpotsChanged();
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Lista de reservas activas
   */
  async getActiveReservations(): Promise<Reservation[]> {
    return Promise.resolve(this.reservations.filter(r => r.status === 'active'));
  }

  /**
   * ==========================================
   * INTEGRACIÓN IOT / ARDUINO
   * ==========================================
   * Este método maneja las lecturas que envían los sensores ultrasónicos
   * (HC-SR04), infrarrojos o cámaras conectadas a microcontroladores
   * Arduino / ESP32 a través de MQTT o WebSockets.
   */
  handleArduinoSensorEvent(event: ArduinoSensorEvent) {
    const spot = this.spots.find(s => s.id === event.spotId);
    if (!spot) return;

    if (event.isOccupied && spot.availableSpots > 0) {
      spot.availableSpots = Math.max(0, spot.availableSpots - 1);
    } else if (!event.isOccupied && spot.availableSpots < spot.totalSpots) {
      spot.availableSpots = Math.min(spot.totalSpots, spot.availableSpots + 1);
    }

    this.notifySpotsChanged();
    this.sensorListeners.forEach(cb => cb(event));
  }

  /**
   * Simulación interactiva de sensor Arduino (útil para pruebas y demos)
   */
  simulateArduinoSensorPing(spotId?: string, forceOccupied?: boolean) {
    // Excluir CTA de la simulación aleatoria para preservar las lecturas reales de Firebase RTDB
    const nonFirebaseSpots = this.spots.filter(s => s.id !== 'est-cta');
    const pool = nonFirebaseSpots.length > 0 ? nonFirebaseSpots : this.spots;

    const targetSpot = spotId 
      ? this.spots.find(s => s.id === spotId) 
      : pool[Math.floor(Math.random() * pool.length)];

    if (!targetSpot) return;

    const isOccupied = forceOccupied !== undefined 
      ? forceOccupied 
      : Math.random() > 0.4;

    const event: ArduinoSensorEvent = {
      sensorId: `ARDUINO-NODE-${targetSpot.id.toUpperCase()}-S04`,
      spotId: targetSpot.id,
      slotNumber: Math.floor(Math.random() * 20) + 1,
      isOccupied,
      timestamp: Date.now(),
      distanceCm: isOccupied ? 45 : 230,
      batteryPercent: 96,
    };

    this.handleArduinoSensorEvent(event);
    return event;
  }

  /**
   * Inicia o detiene la simulación en vivo de tráfico de autos
   */
  toggleLiveSimulation(enabled: boolean, intervalMs = 8000) {
    if (this.autoSimulationInterval) {
      clearInterval(this.autoSimulationInterval);
      this.autoSimulationInterval = null;
    }

    if (enabled) {
      this.autoSimulationInterval = window.setInterval(() => {
        this.simulateArduinoSensorPing();
      }, intervalMs);
    }
  }

  /**
   * Subscripción a cambios de estacionamientos
   */
  subscribeToSpots(callback: SpotsCallback): () => void {
    this.spotListeners.add(callback);
    callback([...this.spots]);
    return () => this.spotListeners.delete(callback);
  }

  /**
   * Subscripción a eventos de Arduino
   */
  subscribeToArduino(callback: SensorCallback): () => void {
    this.sensorListeners.add(callback);
    return () => this.sensorListeners.delete(callback);
  }

  /**
   * Limpia suscripciones activas
   */
  destroy() {
    if (this.unsubscribeFirebaseCta) {
      this.unsubscribeFirebaseCta();
      this.unsubscribeFirebaseCta = null;
    }
    if (this.autoSimulationInterval) {
      clearInterval(this.autoSimulationInterval);
      this.autoSimulationInterval = null;
    }
  }

  private notifySpotsChanged() {
    const current = [...this.spots];
    this.spotListeners.forEach(cb => cb(current));
  }
}

export const parkingService = new ParkingService();
