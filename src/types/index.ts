export type ParkingType = 'Cubierto' | 'Exterior';

export interface ParkingSensorSlot {
  sensorId: string;
  name: string;
  slotNumber: number;
  isOccupied: boolean;
  ledColor: 'verde' | 'rojo' | 'amarillo';
  distanciaMm?: number;
  distanciaValida?: boolean;
  objetoDetectado?: boolean;
  ocupacionConfirmada?: boolean;
  patenteEsperada?: string;
  patenteDetectada?: string;
  camaraValidada?: boolean;
  validacionVigente?: boolean;
  timestamp?: number;
  reservaTimestamp?: number;
  reservaExpira?: number;
}

export interface ParkingSpot {
  id: string;
  name: string;
  campusId: string;
  sector: string;
  accessPoint: string;
  availableSpots: number;
  totalSpots: number;
  walkingTimeMinutes: number;
  type: ParkingType;
  accessibleSpots: number;
  hours: string;
  coordinates: [number, number]; // [lat, lng]
  image: string;
  isFull?: boolean;
  sensors?: ParkingSensorSlot[];
  isFirebaseConnected?: boolean;
}

export interface Campus {
  id: string;
  name: string;
  shortName: string;
  city: string;
  center: [number, number];
  defaultZoom: number;
  totalSpots: number;
  availableSpots: number;
}

export interface Reservation {
  id: string;
  code: string;
  spotId: string;
  spotName: string;
  campusId: string;
  accessPoint: string;
  date: string;
  arrivalTime: string;
  duration: string;
  departureTime: string;
  vehiclePlate: string;
  vehicleModel: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  expiresAt: string;
  sensorId?: string;
  slotNumber?: number;
}

export interface NewReservationPayload {
  spotId: string;
  date: string;
  arrivalTime: string;
  duration: string;
  vehiclePlate: string;
  vehicleModel: string;
  sensorId?: string;
  slotNumber?: number;
}

export interface FilterOptions {
  searchQuery?: string;
  onlyAvailable?: boolean;
  type?: 'all' | 'Cubierto' | 'Exterior';
  onlyAccessible?: boolean;
}

/**
 * Interface for Arduino / IoT Sensor events
 * Compatible with ultrasonic (HC-SR04), infrared, or magnetic parking sensors.
 */
export interface ArduinoSensorEvent {
  sensorId: string;
  spotId: string;
  slotNumber: number;
  isOccupied: boolean;
  timestamp: number;
  distanceCm?: number;
  batteryPercent?: number;
}

export type TabType = 'map' | 'summary';
