import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, get, set, type Database } from 'firebase/database';
import type { ParkingSensorSlot } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBydJJjmXVf0dyWM2KYG2OjDOVZpkZnxO4",
  authDomain: "campusspot-a82da.firebaseapp.com",
  databaseURL: "https://campusspot-a82da-default-rtdb.firebaseio.com",
  projectId: "campusspot-a82da",
  storageBucket: "campusspot-a82da.firebasestorage.app",
  messagingSenderId: "479606413805",
  appId: "1:479606413805:web:e52997e4b1b24b3602afe4",
  measurementId: "G-PYHKWZ4NHT"
};

export const app = initializeApp(firebaseConfig);
export const rtdb: Database = getDatabase(app);

export interface FirebaseCtaData {
  totalSpots: number;
  availableSpots: number;
  sensors: ParkingSensorSlot[];
}

export type FirebaseConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface FirebaseLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'data';
  tag: string;
  message: string;
  payload?: any;
}

export type CtaCallback = (data: FirebaseCtaData) => void;
export type LogsCallback = (logs: FirebaseLogEntry[]) => void;
export type StatusCallback = (status: FirebaseConnectionStatus) => void;
export type RawCallback = (raw: any) => void;

// ==========================================
// ESTADO INTERNO DEL LOGGER / CONSOLA
// ==========================================
let currentStatus: FirebaseConnectionStatus = 'connecting';
let logs: FirebaseLogEntry[] = [];
let lastRawData: any = null;
let lastParsedData: FirebaseCtaData | null = null;
let lastUpdateTimestamp: string | null = null;

const logListeners = new Set<LogsCallback>();
const statusListeners = new Set<StatusCallback>();
const rawListeners = new Set<RawCallback>();

function emitStatus(newStatus: FirebaseConnectionStatus) {
  currentStatus = newStatus;
  statusListeners.forEach((cb) => cb(currentStatus));
}

function emitLogs() {
  const currentLogs = [...logs];
  logListeners.forEach((cb) => cb(currentLogs));
}

function emitRaw(data: any) {
  lastRawData = data;
  rawListeners.forEach((cb) => cb(lastRawData));
}

export function addFirebaseLog(
  type: FirebaseLogEntry['type'],
  tag: string,
  message: string,
  payload?: any
) {
  const entry: FirebaseLogEntry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    }),
    type,
    tag,
    message,
    payload,
  };

  // Mantener últimos 150 registros en memoria
  logs = [entry, ...logs].slice(0, 150);
  emitLogs();
}

export function clearFirebaseLogs() {
  logs = [];
  addFirebaseLog('info', 'CONSOLE', 'Consola de registros limpiada por el usuario.');
}

export function getFirebaseLogs(): FirebaseLogEntry[] {
  return [...logs];
}

export function getFirebaseStatus(): FirebaseConnectionStatus {
  return currentStatus;
}

export function getFirebaseLastRaw(): any {
  return lastRawData;
}

export function getFirebaseLastParsed(): FirebaseCtaData | null {
  return lastParsedData;
}

export function getFirebaseLastUpdateTimestamp(): string | null {
  return lastUpdateTimestamp;
}

export function subscribeToFirebaseLogs(callback: LogsCallback): () => void {
  logListeners.add(callback);
  callback([...logs]);
  return () => logListeners.delete(callback);
}

export function subscribeToFirebaseStatus(callback: StatusCallback): () => void {
  statusListeners.add(callback);
  callback(currentStatus);
  return () => statusListeners.delete(callback);
}

export function subscribeToFirebaseRaw(callback: RawCallback): () => void {
  rawListeners.add(callback);
  callback(lastRawData);
  return () => rawListeners.delete(callback);
}

// Log inicial de arranque
addFirebaseLog(
  'info',
  'INIT',
  `Inicializando Firebase Realtime Database (${firebaseConfig.databaseURL})...`
);

// Escuchar estado de conexión de socket de Firebase (.info/connected)
try {
  const connectedRef = ref(rtdb, '.info/connected');
  onValue(connectedRef, (snapshot) => {
    const isConnected = snapshot.val() === true;
    if (isConnected) {
      emitStatus('connected');
      addFirebaseLog('success', 'SOCKET', 'Conexión WebSocket activa con Firebase RTDB.');
    } else {
      emitStatus('disconnected');
      addFirebaseLog('warn', 'SOCKET', 'Desconectado del servidor de Firebase. Reintentando...');
    }
  });
} catch (e: any) {
  addFirebaseLog('error', 'SOCKET', `Error al suscribir a .info/connected: ${e?.message}`);
}

/**
 * Parsea los datos recibidos directamente desde Firebase Realtime Database.
 * Interpreta el estado de las plazas según el color de sus LEDs:
 * - LED Verde (led_verde === true) -> Plaza libre (disponible)
 * - LED Rojo (led_rojo === true) -> Plaza ocupada
 * - LED Amarillo (led_amarillo === true) -> Plaza reservada
 */
export function parseFirebaseCtaSchema(rawData: any): FirebaseCtaData {
  if (!rawData || typeof rawData !== 'object') {
    return {
      totalSpots: 0,
      availableSpots: 0,
      sensors: [],
    };
  }

  const sensores = rawData.sensores || {};
  const leds = rawData.leds || {};
  const entries = Object.entries(sensores);

  const totalSpots = entries.length;
  let availableSpots = 0;

  const sensors: ParkingSensorSlot[] = entries.map(([sensorKey, data]: [string, any], index) => {
    const slotNumber = index + 1;
    const isYellow = Boolean(data.led_amarillo || leds[sensorKey]?.amarillo);
    const isGreen = Boolean(data.led_verde);
    const isRed = Boolean(data.led_rojo);

    let ledColor: 'verde' | 'rojo' | 'amarillo' = 'rojo';
    let isOccupied = true;

    if (isGreen) {
      ledColor = 'verde';
      isOccupied = false;
      availableSpots += 1;
    } else if (isYellow) {
      ledColor = 'amarillo';
      isOccupied = true;
    } else if (isRed) {
      ledColor = 'rojo';
      isOccupied = true;
    } else {
      isOccupied = data.estado_final !== 'libre';
      ledColor = isOccupied ? 'rojo' : 'verde';
      if (!isOccupied) availableSpots += 1;
    }

    const now = Date.now();
    let reservaTimestamp: number | undefined = data.reserva_timestamp;
    let reservaExpira: number | undefined = data.reserva_expira;

    // Si el LED amarillo está activo pero no tenía timestamp de expiración registrado,
    // fijamos el temporizador de 20 minutos
    if (isYellow && !reservaExpira) {
      reservaTimestamp = now;
      reservaExpira = now + 20 * 60 * 1000;
    }

    return {
      sensorId: sensorKey,
      name: `Plaza ${slotNumber}`,
      slotNumber,
      isOccupied,
      ledColor,
      distanciaMm: data.distancia_mm,
      distanciaValida: data.distancia_valida,
      objetoDetectado: data.objeto_detectado,
      ocupacionConfirmada: data.ocupacion_confirmada,
      patenteEsperada: data.patente_esperada || undefined,
      patenteDetectada: data.patente_detectada || undefined,
      camaraValidada: data.camara_validada,
      validacionVigente: data.validacion_vigente,
      timestamp: data.timestamp_sensor || data.timestamp_camara,
      reservaTimestamp,
      reservaExpira,
    };
  });

  return { totalSpots, availableSpots, sensors };
}

/**
 * Suscripción en tiempo real a Firebase Realtime Database
 * Exclusivamente para el estacionamiento del CTA.
 * Toda la información proviene directamente de la base de datos de Firebase.
 */
export function subscribeToFirebaseCta(callback: CtaCallback): () => void {
  try {
    addFirebaseLog('info', 'SUBSCRIBE', 'Iniciando escucha en vivo de la raíz "/" en Firebase...');
    const rootRef = ref(rtdb);
    
    const unsubscribe = onValue(
      rootRef,
      (snapshot) => {
        lastUpdateTimestamp = new Date().toLocaleTimeString('es-CL');
        if (snapshot.exists()) {
          const val = snapshot.val();
          emitRaw(val);
          emitStatus('connected');

          const parsed = parseFirebaseCtaSchema(val);
          lastParsedData = parsed;

          addFirebaseLog(
            'success',
            'SNAPSHOT',
            `Snapshot recibido de Firebase: ${parsed.totalSpots} sensores detectados en base de datos.`
          );

          parsed.sensors.forEach((s) => {
            const estadoTexto = s.ledColor === 'amarillo' 
              ? '🟡 RESERVADO' 
              : s.isOccupied 
                ? '🔴 OCUPADO' 
                : '🟢 LIBRE';
            const ledInfo = `LED ${s.ledColor.toUpperCase()}`;
            const distInfo = s.distanciaMm !== undefined ? `${s.distanciaMm.toFixed(1)} mm` : 'N/A';
            const plateInfo = s.patenteEsperada ? ` | Esperada: "${s.patenteEsperada}"` : '';
            const detectedInfo = s.patenteDetectada ? ` | Detectada: "${s.patenteDetectada}"` : '';
            addFirebaseLog(
              s.ledColor === 'amarillo' ? 'warn' : s.isOccupied ? 'error' : 'success',
              'SENSOR',
              `[${s.sensorId}] ${s.name}: ${estadoTexto} | ${ledInfo} | Dist: ${distInfo}${plateInfo}${detectedInfo}`
            );
          });

          addFirebaseLog(
            'data',
            'ESTADO_CTA',
            `CTA actualizado: ${parsed.availableSpots} plazas libres de ${parsed.totalSpots} totales.`
          );

          callback(parsed);
        } else {
          emitStatus('warn' as any);
          addFirebaseLog('warn', 'SNAPSHOT', 'El nodo raíz de Firebase no contiene datos (snapshot vacío).');
          callback({ totalSpots: 0, availableSpots: 0, sensors: [] });
        }
      },
      (error) => {
        emitStatus('error');
        addFirebaseLog('error', 'ERROR', `Error al leer de Firebase: ${error.message}`, error);
      }
    );

    return () => {
      addFirebaseLog('info', 'SUBSCRIBE', 'Cancelando suscripción a Firebase.');
      unsubscribe();
    };
  } catch (err: any) {
    emitStatus('error');
    addFirebaseLog('error', 'FATAL', `Fallo al iniciar suscripción a Firebase: ${err?.message}`);
    return () => {};
  }
}

/**
 * Fuerza una lectura puntual a Firebase Realtime Database
 */
export async function fetchFirebaseCtaOnce(): Promise<FirebaseCtaData> {
  addFirebaseLog('info', 'FETCH_ONCE', 'Consultando Firebase Realtime Database manualmente (get)...');
  try {
    const rootRef = ref(rtdb);
    const snapshot = await get(rootRef);
    if (snapshot.exists()) {
      const val = snapshot.val();
      emitRaw(val);
      const parsed = parseFirebaseCtaSchema(val);
      lastParsedData = parsed;
      lastUpdateTimestamp = new Date().toLocaleTimeString('es-CL');
      addFirebaseLog(
        'success',
        'FETCH_ONCE',
        `Lectura manual exitosa: ${parsed.totalSpots} sensores procesados (${parsed.availableSpots} libres).`
      );
      return parsed;
    } else {
      addFirebaseLog('warn', 'FETCH_ONCE', 'Lectura manual: Base de datos vacía.');
      return { totalSpots: 0, availableSpots: 0, sensors: [] };
    }
  } catch (err: any) {
    addFirebaseLog('error', 'FETCH_ONCE', `Error en lectura manual: ${err.message}`);
    throw err;
  }
}

/**
 * Realiza la reserva de una plaza en el CTA en Firebase Realtime Database:
 * 1. Establece leds/[sensorId]/amarillo = true
 * 2. Guarda sensores/[sensorId]/patente_esperada = [patente]
 * 3. Guarda temporizador de 20 minutos (reserva_timestamp y reserva_expira)
 */
export async function reserveFirebaseCtaSlot(sensorId: string, patente: string): Promise<boolean> {
  const cleanPatente = patente.toUpperCase().trim();
  const now = Date.now();
  const expira = now + 20 * 60 * 1000; // 20 minutos de tolerancia

  try {
    addFirebaseLog(
      'info',
      'RESERVA_CTA',
      `Iniciando reserva en ${sensorId}: activando LED amarillo, patente "${cleanPatente}" y temporizador de 20 minutos...`
    );

    // 1. leds/[sensorId]/amarillo = true
    const ledRef = ref(rtdb, `leds/${sensorId}/amarillo`);
    await set(ledRef, true);

    // 2. sensores/[sensorId]/patente_esperada = cleanPatente
    const sensorPatenteRef = ref(rtdb, `sensores/${sensorId}/patente_esperada`);
    await set(sensorPatenteRef, cleanPatente);

    // 3. sensores/[sensorId]/reserva_timestamp y reserva_expira
    const timestampRef = ref(rtdb, `sensores/${sensorId}/reserva_timestamp`);
    await set(timestampRef, now);

    const expiraRef = ref(rtdb, `sensores/${sensorId}/reserva_expira`);
    await set(expiraRef, expira);

    addFirebaseLog(
      'success',
      'RESERVA_CTA',
      `¡Reserva confirmada en Firebase! Plaza: ${sensorId} | LED Amarillo: TRUE | Patente: "${cleanPatente}" | Temporizador: 20 min.`
    );
    return true;
  } catch (err: any) {
    addFirebaseLog('error', 'RESERVA_CTA', `Fallo al registrar reserva en Firebase: ${err?.message}`);
    console.error('Error reserving in Firebase:', err);
    return false;
  }
}

/**
 * Libera la reserva de una plaza en el CTA en Firebase:
 * 1. Establece leds/[sensorId]/amarillo = false
 * 2. Remueve sensores/[sensorId]/patente_esperada y temporizadores
 */
export async function releaseFirebaseCtaSlot(sensorId: string, motivo = 'Liberación de reserva'): Promise<boolean> {
  try {
    addFirebaseLog('info', 'LIBERAR_CTA', `Liberando reserva en ${sensorId} (${motivo})...`);

    const ledRef = ref(rtdb, `leds/${sensorId}/amarillo`);
    await set(ledRef, false);

    const sensorPatenteRef = ref(rtdb, `sensores/${sensorId}/patente_esperada`);
    await set(sensorPatenteRef, null);

    const timestampRef = ref(rtdb, `sensores/${sensorId}/reserva_timestamp`);
    await set(timestampRef, null);

    const expiraRef = ref(rtdb, `sensores/${sensorId}/reserva_expira`);
    await set(expiraRef, null);

    addFirebaseLog(
      'success',
      'LIBERAR_CTA',
      `Plaza ${sensorId} liberada en Firebase (${motivo}): LED Amarillo = FALSE, patente y temporizador removidos.`
    );
    return true;
  } catch (err: any) {
    addFirebaseLog('error', 'LIBERAR_CTA', `Error al liberar plaza en Firebase: ${err?.message}`);
    return false;
  }
}

// ==============================================================
// VERIFICADOR DE TEMPORIZADOR DE 20 MINUTOS (AUTO-LIBERACIÓN)
// ==============================================================
let autoReleaseInterval: number | null = null;

export function startAutoReleaseMonitor() {
  if (autoReleaseInterval || typeof window === 'undefined') return;

  autoReleaseInterval = window.setInterval(() => {
    if (!lastParsedData || !lastParsedData.sensors) return;

    const now = Date.now();
    lastParsedData.sensors.forEach((s) => {
      // Si la plaza está en amarillo (reservada) y ya expiró el temporizador de 20 minutos
      if (s.ledColor === 'amarillo' && s.reservaExpira && now >= s.reservaExpira) {
        // Si el auto NO ha llegado (el sensor no detecta ocupación física)
        if (!s.isOccupied && !s.objetoDetectado) {
          addFirebaseLog(
            'warn',
            'TIMEOUT_20MIN',
            `Expiraron los 20 minutos de tolerancia para ${s.sensorId} sin llegada de vehículo. Liberando automáticamente...`
          );
          releaseFirebaseCtaSlot(s.sensorId, 'Auto-liberación por timeout de 20 min');
        }
      }
    });
  }, 4000);
}

// Iniciar el monitor automáticamente
startAutoReleaseMonitor();

/**
 * Actualiza el estado de reserva (LED amarillo) de un sensor específico en Firebase RTDB
 */
export async function updateFirebaseSensorReservation(sensorId: string, reserved: boolean) {
  try {
    addFirebaseLog(
      'info',
      'RESERVA',
      `Actualizando en Firebase: leds/${sensorId}/amarillo = ${reserved}`
    );
    const ledRef = ref(rtdb, `leds/${sensorId}/amarillo`);
    await set(ledRef, reserved);
    addFirebaseLog(
      'success',
      'RESERVA',
      `LED amarillo de ${sensorId} actualizado en Firebase a ${reserved}.`
    );
  } catch (err: any) {
    addFirebaseLog('error', 'RESERVA', `Error al actualizar reserva en Firebase: ${err?.message}`);
    console.warn('No se pudo actualizar Firebase RTDB para reserva:', err);
  }
}
