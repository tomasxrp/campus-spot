import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Car,
  Check,
  Clock,
  Zap,
  AlertCircle,
  ShieldCheck,
  Timer,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import type { ParkingSensorSlot, ParkingSpot } from '../../types';
import { useParking } from '../../context/ParkingContext';
import { DURATION_OPTIONS, VEHICLE_PRESETS } from '../../services/mockData';
import { releaseFirebaseCtaSlot } from '../../services/firebase';

interface CtaReservationViewProps {
  spot: ParkingSpot;
  onClose: () => void;
}

export const CtaReservationView: React.FC<CtaReservationViewProps> = ({ spot, onClose }) => {
  const { createReservation, firebaseStatus } = useParking();

  const sensors = useMemo(() => spot.sensors || [], [spot.sensors]);

  // Encontrar la primera plaza libre por defecto
  const firstAvailableSensor = sensors.find((s) => s.ledColor === 'verde' && !s.isOccupied);

  const [selectedSensorId, setSelectedSensorId] = useState<string>(
    firstAvailableSensor?.sensorId || sensors[0]?.sensorId || 'sensor4'
  );
  const [vehiclePlate, setVehiclePlate] = useState<string>(VEHICLE_PRESETS[0].plate);
  const [vehicleModel, setVehicleModel] = useState<string>(VEHICLE_PRESETS[0].model);
  const [selectedDuration, setSelectedDuration] = useState<string>(DURATION_OPTIONS[1].label);
  const [arrivalTime, setArrivalTime] = useState<string>('13:30');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [cancellingSensorId, setCancellingSensorId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reloj local para cuenta regresiva en tiempo real del temporizador de 20 min
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Verificar auto-liberación si expira el temporizador de 20 minutos de alguna plaza reservada
  useEffect(() => {
    sensors.forEach((s) => {
      if (s.ledColor === 'amarillo' && s.reservaExpira && now >= s.reservaExpira) {
        if (!s.isOccupied && !s.objetoDetectado) {
          releaseFirebaseCtaSlot(s.sensorId, 'Temporizador de 20 minutos agotado');
        }
      }
    });
  }, [now, sensors]);

  const selectedSensor = sensors.find((s) => s.sensorId === selectedSensorId);
  const isSelectedSlotFree = selectedSensor?.ledColor === 'verde' && !selectedSensor.isOccupied;

  // Manejar cancelación directa de una reserva (libera la plaza en Firebase)
  const handleCancelSlotReservation = async (e: React.MouseEvent, sensor: ParkingSensorSlot) => {
    e.stopPropagation();
    if (cancellingSensorId) return;

    setCancellingSensorId(sensor.sensorId);
    setErrorMsg(null);
    try {
      await releaseFirebaseCtaSlot(sensor.sensorId, 'Cancelado por usuario desde la app');
      setSuccessMsg(`Reserva de ${sensor.name} (${sensor.sensorId}) cancelada y liberada con éxito.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al liberar la plaza en Firebase');
      setTimeout(() => setErrorMsg(null), 3500);
    } finally {
      setCancellingSensorId(null);
    }
  };

  // Manejar selección de plaza
  const handleSelectSlot = (sensor: ParkingSensorSlot) => {
    if (sensor.ledColor === 'amarillo') {
      setErrorMsg(`La ${sensor.name} (${sensor.sensorId}) ya se encuentra reservada.`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    if (sensor.isOccupied && sensor.ledColor === 'rojo') {
      setErrorMsg(`La ${sensor.name} (${sensor.sensorId}) está ocupada por otro vehículo actualmente.`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setErrorMsg(null);
    setSelectedSensorId(sensor.sensorId);
  };

  // Manejar cambio de patente
  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setVehiclePlate(val);
  };

  const handleSelectPreset = (preset: typeof VEHICLE_PRESETS[0]) => {
    setVehiclePlate(preset.plate);
    setVehicleModel(preset.model);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehiclePlate.trim()) {
      setErrorMsg('Debes ingresar una patente válida para la reserva.');
      return;
    }

    if (!selectedSensor || !isSelectedSlotFree) {
      setErrorMsg('Por favor selecciona una plaza que esté disponible (color verde).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await createReservation({
        spotId: spot.id,
        sensorId: selectedSensor.sensorId,
        slotNumber: selectedSensor.slotNumber,
        date: 'Hoy, ' + new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }),
        arrivalTime: arrivalTime,
        duration: selectedDuration,
        vehiclePlate: vehiclePlate.trim().toUpperCase(),
        vehicleModel: vehicleModel || 'Vehículo Particular',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la reserva en Firebase');
      setIsSubmitting(false);
    }
  };

  // Helper para dar formato mm:ss al temporizador de 20 minutos
  const formatCountdown = (expira?: number) => {
    if (!expira) return '20:00';
    const diff = expira - now;
    if (diff <= 0) return '00:00';
    const totalSec = Math.floor(diff / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="modal-sheet-container animate-slide-up" style={{ maxHeight: '92vh', overflowY: 'auto' }}>
      {/* Top Drag Handle Indicator */}
      <div style={{
        width: '38px',
        height: '4px',
        backgroundColor: '#e5e7eb',
        borderRadius: '99px',
        margin: '0 auto 6px auto',
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingBottom: '12px',
        borderBottom: '1px solid #f1f5f9',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              color: '#cf0011',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
            }}>
              ESTACIONAMIENTO CTA · FIREBASE IOT
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: '700',
              color: '#ea580c',
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              padding: '1px 6px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: firebaseStatus === 'connected' ? '#22c55e' : '#f97316',
              }} />
              En Vivo
            </span>
          </div>

          <h2 style={{
            fontSize: '20px',
            fontWeight: '800',
            color: '#111827',
            letterSpacing: '-0.3px',
            margin: '2px 0 0',
          }}>
            Reserva de Plaza
          </h2>

          <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
            Plazas en tiempo real. 🟢 Verde = Libre · 🟡 Amarillo = Reservado · 🔴 Rojo = Ocupado
          </p>
        </div>

        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
          }}
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
        {/* ============================================================== */}
        {/* SECCIÓN: 4 RECTÁNGULOS VERTICALES UNO AL LADO DEL OTRO        */}
        {/* ============================================================== */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Bahía de Estacionamientos (4 Spots)
            </span>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>
              Toca una plaza <span style={{ color: '#15803d', fontWeight: '800' }}>Verde</span>
            </span>
          </div>

          {/* 4 RECTÁNGULOS VERTICALES EN FILA */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            backgroundColor: '#070b14',
            padding: '14px 8px',
            borderRadius: '20px',
            border: '2px solid #1e293b',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            {sensors.map((sensor) => {
              const isSelected = selectedSensorId === sensor.sensorId;
              const isFree = sensor.ledColor === 'verde' && !sensor.isOccupied;
              const isMisplaced = Boolean(sensor.isMisplaced);
              const isReserved = (sensor.isReserved || sensor.ledColor === 'amarillo') && !isMisplaced;
              const isOccupied = (sensor.isOccupied && sensor.ledColor === 'rojo') || isMisplaced;

              // Colores según requerimiento exacto:
              // ROJO = OCUPADO
              // AMARILLO = RESERVADO
              // VERDE = DISPONIBLE
              // NARANJA/ROJO ALERTA = AUTO EN MALA POSICIÓN
              let borderColor = '#22c55e';
              let bgColor = '#052316';
              let bulbColor = '#22c55e';
              let statusLabel = 'DISPONIBLE';
              let statusColor = '#4ade80';

              if (isMisplaced) {
                borderColor = '#f97316';
                bgColor = '#2a1205';
                bulbColor = '#f97316';
                statusLabel = 'MALA POSICIÓN';
                statusColor = '#fb923c';
              } else if (isOccupied) {
                borderColor = '#ef4444';
                bgColor = '#260b0b';
                bulbColor = '#ef4444';
                statusLabel = 'OCUPADO';
                statusColor = '#f87171';
              } else if (isReserved) {
                borderColor = '#eab308';
                bgColor = '#271a04';
                bulbColor = '#eab308';
                statusLabel = 'RESERVADO';
                statusColor = '#fde047';
              } else if (isFree) {
                borderColor = '#22c55e';
                bgColor = '#052316';
                bulbColor = '#22c55e';
                statusLabel = 'DISPONIBLE';
                statusColor = '#4ade80';
              }

              // Si está seleccionada por el usuario
              if (isSelected && isFree) {
                borderColor = '#38bdf8';
                bgColor = '#0c2838';
              }

              const countdownText = formatCountdown(sensor.reservaExpira);

              return (
                <div
                  key={sensor.sensorId}
                  onClick={() => handleSelectSlot(sensor)}
                  style={{
                    backgroundColor: bgColor,
                    border: `2.5px solid ${borderColor}`,
                    borderRadius: '14px',
                    padding: '10px 4px',
                    cursor: isFree ? 'pointer' : 'not-allowed',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected && isFree
                      ? '0 0 18px rgba(56, 189, 248, 0.45)'
                      : `0 0 10px ${bulbColor}25`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '240px',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top: Plaza ID + Sensor ID + LED Bulb */}
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingBottom: '6px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '0 4px',
                    }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '900',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                      }}>
                        P{sensor.slotNumber}
                      </span>

                      {/* Glowing LED */}
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: bulbColor,
                        boxShadow: `0 0 10px ${bulbColor}`,
                      }} />
                    </div>

                    <span style={{
                      fontSize: '9px',
                      color: '#94a3b8',
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      padding: '1px 4px',
                      borderRadius: '3px',
                    }}>
                      {sensor.sensorId}
                    </span>
                  </div>

                  {/* Center: Interior de la plaza vertical */}
                  <div style={{
                    width: '100%',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 2px',
                    textAlign: 'center',
                  }}>
                    {/* CASO: AUTO EN MALA POSICIÓN (RESERVADO PERO PATENTE NO COINCIDE) */}
                    {isMisplaced && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', width: '100%' }}>
                        <div style={{
                          width: '32px',
                          height: '38px',
                          backgroundColor: '#451a03',
                          border: '1.5px solid #f97316',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <AlertTriangle size={18} color="#fdba74" />
                        </div>
                        <span style={{ fontSize: '8px', color: '#fb923c', fontWeight: '800', lineHeight: 1.1 }}>
                          AUTO EN MALA POSICIÓN
                        </span>
                        {sensor.patenteDetectada && (
                          <span style={{
                            fontSize: '7.5px',
                            backgroundColor: '#000000',
                            color: '#fb923c',
                            padding: '1px 3px',
                            borderRadius: '3px',
                            fontFamily: 'monospace',
                            fontWeight: '700',
                          }}>
                            Detectada: {sensor.patenteDetectada}
                          </span>
                        )}
                        {sensor.patenteEsperada && (
                          <span style={{ fontSize: '7px', color: '#fed7aa', fontFamily: 'monospace' }}>
                            Reserva: {sensor.patenteEsperada}
                          </span>
                        )}
                        {/* Botón pequeño para cancelar reserva y liberar plaza */}
                        <button
                          type="button"
                          onClick={(e) => handleCancelSlotReservation(e, sensor)}
                          disabled={cancellingSensorId === sensor.sensorId}
                          title="Cancelar reserva y liberar plaza en Firebase"
                          style={{
                            marginTop: '2px',
                            padding: '2px 5px',
                            fontSize: '8px',
                            fontWeight: '700',
                            backgroundColor: '#9a3412',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <RotateCcw size={8} />
                          <span>{cancellingSensorId === sensor.sensorId ? '...' : 'Liberar'}</span>
                        </button>
                      </div>
                    )}

                    {/* CASO ROJO: OCUPADO REGULAR (O PATENTE VALIDADA) */}
                    {!isMisplaced && isOccupied && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', width: '100%' }}>
                        <div style={{
                          width: '32px',
                          height: '42px',
                          backgroundColor: '#450a0a',
                          border: '1.5px solid #ef4444',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Car size={20} color="#fca5a5" />
                        </div>
                        <span style={{ fontSize: '9px', color: '#fca5a5', fontWeight: '800' }}>
                          OCUPADO
                        </span>
                        {sensor.distanciaMm && (
                          <span style={{ fontSize: '8.5px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                            {(sensor.distanciaMm / 10).toFixed(0)}cm
                          </span>
                        )}
                        {sensor.patenteDetectada && (
                          <span style={{
                            fontSize: '8px',
                            backgroundColor: '#000000',
                            color: '#38bdf8',
                            padding: '1px 3px',
                            borderRadius: '3px',
                            fontFamily: 'monospace',
                            fontWeight: '700',
                          }}>
                            {sensor.patenteDetectada}
                          </span>
                        )}
                        {/* Si estaba reservado, permitir también liberar */}
                        {(sensor.isReserved || sensor.patenteEsperada) && (
                          <button
                            type="button"
                            onClick={(e) => handleCancelSlotReservation(e, sensor)}
                            disabled={cancellingSensorId === sensor.sensorId}
                            title="Liberar plaza en Firebase"
                            style={{
                              marginTop: '2px',
                              padding: '2px 5px',
                              fontSize: '8px',
                              fontWeight: '700',
                              backgroundColor: '#7f1d1d',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            <RotateCcw size={8} />
                            <span>{cancellingSensorId === sensor.sensorId ? '...' : 'Liberar'}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* CASO AMARILLO: RESERVADO CON TIMER DE 20 MINUTOS */}
                    {isReserved && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        width: '100%',
                      }}>
                        {/* Patente esperada */}
                        <div style={{
                          backgroundColor: '#eab308',
                          color: '#000000',
                          fontWeight: '900',
                          fontSize: '10px',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          letterSpacing: '0.3px',
                          width: '90%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {sensor.patenteEsperada || 'RESERVA'}
                        </div>

                        {/* TEMPORIZADOR DE 20 MINUTOS */}
                        <div style={{
                          backgroundColor: 'rgba(234, 179, 8, 0.25)',
                          border: '1px solid #eab308',
                          borderRadius: '6px',
                          padding: '4px 2px',
                          width: '94%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '1px',
                        }}>
                          <div style={{
                            fontSize: '8px',
                            color: '#fef08a',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}>
                            <Timer size={9} className="animate-pulse" />
                            <span>EXPIRA</span>
                          </div>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '900',
                            color: '#fef08a',
                            fontFamily: 'monospace',
                            letterSpacing: '0.5px',
                          }}>
                            {countdownText}
                          </span>
                        </div>

                        {/* Botón pequeño de cancelar reserva */}
                        <button
                          type="button"
                          onClick={(e) => handleCancelSlotReservation(e, sensor)}
                          disabled={cancellingSensorId === sensor.sensorId}
                          title="Cancelar reserva y liberar plaza en Firebase"
                          style={{
                            padding: '3px 6px',
                            fontSize: '8.5px',
                            fontWeight: '700',
                            backgroundColor: '#78350f',
                            color: '#fef08a',
                            border: '1px solid #d97706',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <RotateCcw size={9} />
                          <span>{cancellingSensorId === sensor.sensorId ? 'Liberando...' : 'Cancelar reserva'}</span>
                        </button>
                      </div>
                    )}

                    {/* CASO VERDE: DISPONIBLE / SELECCIONADA */}
                    {isFree && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#38bdf8' : 'rgba(34, 197, 94, 0.25)',
                          color: isSelected ? '#000000' : '#4ade80',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '900',
                          fontSize: '15px',
                          border: `1.5px solid ${isSelected ? '#38bdf8' : '#22c55e'}`,
                        }}>
                          {isSelected ? <Check size={18} strokeWidth={3.5} /> : 'P'}
                        </div>

                        <span style={{
                          fontSize: '9px',
                          color: isSelected ? '#38bdf8' : '#86efac',
                          fontWeight: '800',
                        }}>
                          {isSelected ? '✓ ELEGIDA' : 'TOCA AQUÍ'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Status Pill */}
                  <div style={{
                    width: '100%',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                  }}>
                    <span style={{
                      fontSize: '8.5px',
                      fontWeight: '900',
                      color: statusColor,
                      letterSpacing: '0.2px',
                    }}>
                      {statusLabel}
                    </span>
                    <span style={{
                      fontSize: '7.5px',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                    }}>
                      LED {sensor.ledColor}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notificación de éxito si se canceló / liberó una reserva */}
        {successMsg && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Check size={15} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Notificación de error si se hace clic en plaza ocupada/reservada */}
        {errorMsg && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECCIÓN 2: INGRESO DE PATENTE (patente_esperada)               */}
        {/* ============================================================== */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: '16px',
          padding: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label htmlFor="cta-plate-input" style={{ fontSize: '12.5px', fontWeight: '800', color: '#111827' }}>
              Patente del Vehículo
            </label>
          </div>

          {/* Tarjeta de Patente estilo Placa */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            border: '2px solid #0f172a',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
            marginBottom: '10px',
          }}>
            <div style={{
              backgroundColor: '#003399',
              color: '#ffffff',
              padding: '10px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
            }}>
              <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px' }}>CL</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
            </div>

            <input
              id="cta-plate-input"
              type="text"
              value={vehiclePlate}
              onChange={handlePlateChange}
              placeholder="ABCD12"
              maxLength={8}
              autoCapitalize="characters"
              autoComplete="off"
              style={{
                flex: 1,
                padding: '10px 14px',
                fontSize: '20px',
                fontWeight: '900',
                letterSpacing: '3px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                color: '#0f172a',
                border: 'none',
                outline: 'none',
                textTransform: 'uppercase',
              }}
            />
          </div>

          {/* Presets rápidos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>
              Presets:
            </span>
            {VEHICLE_PRESETS.map((p) => (
              <button
                key={p.plate}
                type="button"
                onClick={() => handleSelectPreset(p)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: vehiclePlate === p.plate ? '800' : '600',
                  backgroundColor: vehiclePlate === p.plate ? '#0f172a' : '#ffffff',
                  color: vehiclePlate === p.plate ? '#ffffff' : '#334155',
                  border: '1px solid #cbd5e1',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.plate} ({p.model})
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECCIÓN 3: HORARIO Y TEMPORIZADOR                             */}
        {/* ============================================================== */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="#64748b" />
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                Hora estimada de llegada
              </span>
            </div>
            <select
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#111827',
              }}
            >
              <option value="12:30">12:30 hrs</option>
              <option value="13:00">13:00 hrs</option>
              <option value="13:30">13:30 hrs</option>
              <option value="14:00">14:00 hrs</option>
              <option value="14:30">14:30 hrs</option>
              <option value="15:00">15:00 hrs</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingTop: '4px' }}>
            {DURATION_OPTIONS.slice(0, 4).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDuration(d.label)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: selectedDuration === d.label ? '800' : '600',
                  backgroundColor: selectedDuration === d.label ? '#cf0011' : '#ffffff',
                  color: selectedDuration === d.label ? '#ffffff' : '#64748b',
                  border: selectedDuration === d.label ? 'none' : '1px solid #cbd5e1',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.hours}h
              </button>
            ))}
          </div>
        </div>

        {/* Explicación del temporizador de 20 minutos */}
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '10px 12px',
          fontSize: '11.5px',
          color: '#1e40af',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
        }}>
          <ShieldCheck size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            La plaza seleccionada se reservará cambiando <code style={{ fontWeight: '700' }}>amarillo: true</code> en Firebase y activará un <strong>temporizador de 20 minutos</strong>. Si el auto no llega antes de que expire el tiempo, la plaza se libera automáticamente.
          </div>
        </div>

        {/* Botón Principal de Reserva */}
        <button
          type="submit"
          disabled={isSubmitting || !isSelectedSlotFree || !vehiclePlate.trim()}
          style={{
            backgroundColor: !isSelectedSlotFree || !vehiclePlate.trim() ? '#9ca3af' : '#cf0011',
            color: '#ffffff',
            padding: '14px',
            borderRadius: '14px',
            fontSize: '14px',
            fontWeight: '800',
            letterSpacing: '-0.2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: !isSelectedSlotFree ? 'none' : '0 4px 14px rgba(207, 0, 17, 0.35)',
            cursor: !isSelectedSlotFree || !vehiclePlate.trim() ? 'not-allowed' : 'pointer',
            transition: 'transform 0.15s ease, background-color 0.15s ease',
          }}
        >
          {isSubmitting ? (
            <span>Conectando con Firebase RTDB...</span>
          ) : (
            <>
              <Zap size={16} />
              <span>
                Reservar {selectedSensor?.name || 'Plaza'} ({selectedSensor?.sensorId || 'sensor'}) · Temporizador 20 Min
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
