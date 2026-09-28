import type { 
  ArduinoSensorEvent, 
  Campus, 
  NewReservationPayload, 
  ParkingSpot, 
  Reservation 
} from '../types';
import { CAMPUS_LIST, INITIAL_SPOTS } from './mockData';

type SensorCallback = (event: ArduinoSensorEvent) => void;
type SpotsCallback = (spots: ParkingSpot[]) => void;

class ParkingService {
  private spots: ParkingSpot[] = [...INITIAL_SPOTS];
  private campuses: Campus[] = [...CAMPUS_LIST];
  private reservations: Reservation[] = [];
  private sensorListeners: Set<SensorCallback> = new Set();
  private spotListeners: Set<SpotsCallback> = new Set();
  private autoSimulationInterval: number | null = null;

  constructor() {
    this.loadFromStorage();
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
      vehiclePlate: payload.vehiclePlate,
      vehicleModel: payload.vehicleModel,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min de tolerancia
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
    const targetSpot = spotId 
      ? this.spots.find(s => s.id === spotId) 
      : this.spots[Math.floor(Math.random() * this.spots.length)];

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

  private notifySpotsChanged() {
    const current = [...this.spots];
    this.spotListeners.forEach(cb => cb(current));
  }
}

export const parkingService = new ParkingService();
