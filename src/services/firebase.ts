import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, get, set, update, type Database } from 'firebase/database'; import type { ParkingSensorSlot } from '../types';


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
  const reservas = rawData.reservas || {};
  const entries = Object.entries(sensores);

  const totalSpots = entries.length;
  let availableSpots = 0;

  const sensors: ParkingSensorSlot[] = entries.map(([sensorKey, data]: [string, any], index) => {
    const slotNumber = index + 1;
    const reservaNode = reservas[sensorKey];

    // Se considera reservado si:
    // 1. En reservas[sensorKey].activa es true o tiene patente reservada
    // 2. data.led_amarillo === true o leds[sensorKey]?.amarillo === true
    // 3. data.reservado === true o data.estado_final === 'reservado'
    const isReserved = Boolean(
      reservaNode?.activa ||
      (reservaNode?.patente && reservaNode.patente.trim() !== '') ||
      data.reservado ||
      data.estado_final === 'reservado' ||
      data.led_amarillo ||
      leds[sensorKey]?.amarillo
    );

    // Patente esperada / de la reserva (desde nodo reservas o data del sensor)
    const patenteEsperada = (
      (reservaNode?.patente && reservaNode.patente.trim() !== '' ? reservaNode.patente : '') ||
      data.patente_esperada ||
      data.patente_reserva_analizada ||
      ''
    ).toUpperCase().trim();

    // Patente detectada por la cámara en la plaza
    const patenteDetectada = (
      data.patente_detectada ||
      data.patente_aceptada ||
      ''
    ).toUpperCase().trim();

    // Si está reservado y hay una patente detectada por la cámara,
    // se comparan ambas patentes:
    // - Si coinciden -> la plaza queda como 'ocupado' (rojo)
    // - Si no coinciden -> queda como 'auto en mala posición'
    let isMisplaced = false;
    let isOccupied = false;
    let ledColor: 'verde' | 'rojo' | 'amarillo' = 'verde';

    if (isReserved) {
      if (patenteDetectada !== '') {
        if (patenteEsperada !== '' && patenteDetectada === patenteEsperada) {
          // Coinciden las patentes: queda como ocupado correctamente
          isOccupied = true;
          ledColor = 'rojo';
        } else {
          // No coinciden: auto en mala posición
          isOccupied = true;
          isMisplaced = true;
          ledColor = 'rojo';
        }
      } else if (data.objeto_detectado || data.led_rojo || data.estado_final === 'ocupado') {
        // Objeto detectado en espacio reservado pero aún sin patente leída o en proceso
        isOccupied = true;
        ledColor = 'amarillo';
      } else {
        // Reservado a la espera del vehículo
        isOccupied = true;
        ledColor = 'amarillo';
      }
    } else {
      // Espacio NO reservado: lógica estándar según sensor / LEDs
      const isGreen = Boolean(data.led_verde || data.estado_final === 'libre');
      const isRed = Boolean(data.led_rojo || data.objeto_detectado || data.estado_final === 'ocupado');

      if (isGreen) {
        ledColor = 'verde';
        isOccupied = false;
        availableSpots += 1;
      } else if (isRed) {
        ledColor = 'rojo';
        isOccupied = true;
      } else {
        isOccupied = data.estado_final !== 'libre';
        ledColor = isOccupied ? 'rojo' : 'verde';
        if (!isOccupied) availableSpots += 1;
      }
    }

    const now = Date.now();
    let reservaTimestamp: number | undefined = data.reserva_timestamp;
    let reservaExpira: number | undefined = data.reserva_expira;

    // Si está reservado pero no tenía timestamp de expiración registrado,
    // fijamos el temporizador de 20 minutos
    if (isReserved && !reservaExpira) {
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
      patenteEsperada: patenteEsperada || undefined,
      patenteDetectada: patenteDetectada || undefined,
      camaraValidada: data.camara_validada,
      validacionVigente: data.validacion_vigente,
      timestamp: data.timestamp_sensor || data.timestamp_camara,
      reservaTimestamp,
      reservaExpira,
      reservaValidada: Boolean(data.reserva_validada),
      isReserved,
      isMisplaced,
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
    return () => { };
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

    // 2. reservas/[sensorId] = { activa: true, patente: cleanPatente }
    const reservaSensorRef = ref(rtdb, `reservas/${sensorId}`);
    await set(reservaSensorRef, {
      activa: true,
      patente: cleanPatente,
    });

    // 3. sensores/[sensorId]/patente_esperada = cleanPatente
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

    await update(ref(rtdb), {
      [`leds/${sensorId}/amarillo`]: false,
      [`reservas/${sensorId}/activa`]: false,
      [`reservas/${sensorId}/patente`]: '',
      [`sensores/${sensorId}/patente_esperada`]: null,
      [`sensores/${sensorId}/reserva_timestamp`]: null,
      [`sensores/${sensorId}/reserva_expira`]: null,
      [`sensores/${sensorId}/reserva_validada`]: false,
      [`sensores/${sensorId}/reservado`]: false,
    });

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
// VERIFICADORES DE AUTO-LIBERACIÓN
// 1. Temporizador de 20 minutos (si el auto no llega)
// 2. Liberación tras salida (10 segundos después de que el auto correcto se va)
// ==============================================================
// ==============================================================
// VERIFICADORES DE AUTO-LIBERACIÓN
// 1. Salida del auto que SÍ tenía la reserva -> libera 10 s después
// 2. Timeout de 20 min si el auto nunca llegó
// ==============================================================
// ==============================================================
// VERIFICADORES DE AUTO-LIBERACIÓN
// 1. Salida del auto que SÍ tenía la reserva -> libera 10 s después
// 2. Timeout de 20 min si el auto nunca llegó
// ==============================================================
const EXIT_RELEASE_MS = 10_000;

let autoReleaseInterval: number | null = null;

// sensorId -> patente validada. Se "arma" cuando el script de Python marca
// reserva_validada = true y se mantiene aunque ese flag se resetee luego.
const validatedReservations = new Map<string, string>();
// sensorId -> momento en que dejó de detectarse el objeto
const departureTimers = new Map<string, number>();
// Evita liberaciones duplicadas mientras la escritura está en curso
const releasingSlots = new Set<string>();

async function releaseSlotOnce(sensorId: string, motivo: string) {
  if (releasingSlots.has(sensorId)) return;
  releasingSlots.add(sensorId);
  try {
    const ok = await releaseFirebaseCtaSlot(sensorId, motivo);
    if (ok) {
      validatedReservations.delete(sensorId);
      departureTimers.delete(sensorId);
    }
  } finally {
    releasingSlots.delete(sensorId);
  }
}

export function startAutoReleaseMonitor() {
  if (autoReleaseInterval || typeof window === 'undefined') return;

  autoReleaseInterval = window.setInterval(() => {
    if (!lastParsedData || !lastParsedData.sensors) return;

    const now = Date.now();

    lastParsedData.sensors.forEach((s) => {
      const id = s.sensorId;
      if (releasingSlots.has(id)) return;

      // ---------- Armar / desarmar el seguimiento ----------
      if (s.reservaValidada) {
        const plateMismatch =
          s.patenteEsperada && s.patenteDetectada && s.patenteEsperada !== s.patenteDetectada;
        if (!plateMismatch && !validatedReservations.has(id)) {
          validatedReservations.set(id, s.patenteEsperada || '');
          addFirebaseLog('info', 'RESERVA_VALIDADA', `Auto con reserva validada en ${id}. Se liberará 10 s después de que se vaya.`);
        }
      }

      if (validatedReservations.has(id)) {
        const armedPlate = validatedReservations.get(id)!;
        const reservationGone = !s.isReserved && !s.patenteEsperada;
        const reservationChanged = !!s.patenteEsperada && !!armedPlate && s.patenteEsperada !== armedPlate;
        if (reservationGone || reservationChanged) {
          validatedReservations.delete(id);
          departureTimers.delete(id);
        }
      }

      // ---------- REGLA 1: salida del auto validado ----------
      if (validatedReservations.has(id)) {
        if (s.objetoDetectado) {
          if (departureTimers.has(id)) {
            departureTimers.delete(id);
            addFirebaseLog('info', 'SALIDA_CANCELADA', `Vehículo volvió a detectarse en ${id}. Contador cancelado.`);
          }
        } else if (!departureTimers.has(id)) {
          departureTimers.set(id, now);
          addFirebaseLog('info', 'SALIDA_AUTO', `Vehículo validado salió de ${id}. Liberando en 10 segundos...`);
        } else if (now - departureTimers.get(id)! >= EXIT_RELEASE_MS) {
          addFirebaseLog('success', 'LIBERAR_10S', `Pasaron 10 s desde la salida del vehículo reservado en ${id}. Liberando...`);
          releaseSlotOnce(id, 'Auto-liberación 10s después de la salida del vehículo reservado');
          return;
        }
      } else {
        departureTimers.delete(id);
      }

      // ---------- REGLA 2: timeout de 20 min sin llegada ----------
      // OJO: una plaza reservada tiene isOccupied=true, así que no se puede usar isOccupied.
      if (
        s.ledColor === 'amarillo' &&
        s.reservaExpira &&
        now >= s.reservaExpira &&
        !s.objetoDetectado &&
        !s.reservaValidada &&
        !validatedReservations.has(id)
      ) {
        addFirebaseLog('warn', 'TIMEOUT_20MIN', `Expiraron los 20 min en ${id} sin llegada de vehículo. Liberando...`);
        releaseSlotOnce(id, 'Auto-liberación por timeout de 20 min');
      }
    });
  }, 1000);
}

// Iniciar el monitor automáticamente
startAutoReleaseMonitor();
/* Actualiza el estado de reserva(LED amarillo) de un sensor específico en Firebase RTDB
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
