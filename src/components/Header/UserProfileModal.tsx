import React from 'react';
import { 
  X, 
  User, 
  Cpu, 
  Trash2, 
  Play, 
  Pause, 
  Zap 
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

export const UserProfileModal: React.FC = () => {
  const { 
    userProfileOpen, 
    setUserProfileOpen, 
    activeReservations, 
    cancelReservation,
    arduinoSimulationActive,
    toggleArduinoSimulation,
    triggerManualArduinoPing,
    lastArduinoEvent,
  } = useParking();

  if (!userProfileOpen) return null;

  return (
    <div className="modal-overlay">
      {/* Backdrop */}
      <div
        onClick={() => setUserProfileOpen(false)}
        className="animate-fade-in"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Sheet / Modal */}
      <div className="modal-sheet-container animate-slide-up" style={{ gap: '16px' }}>
        <div style={{
          width: '38px',
          height: '4px',
          backgroundColor: '#e5e7eb',
          borderRadius: '99px',
          margin: '0 auto',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cf0011',
            }}>
              <User size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#111827', margin: 0 }}>
                Usuario Campus
              </h3>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                estudiante@beauchef.uchile.cl
              </p>
            </div>
          </div>

          <button
            onClick={() => setUserProfileOpen(false)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4b5563',
            }}
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        {/* Reservas Activas Section */}
        <div>
          <h4 style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px',
          }}>
            Mis Reservas Activas ({activeReservations.length})
          </h4>

          {activeReservations.length === 0 ? (
            <div style={{
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '14px',
              textAlign: 'center',
              fontSize: '12.5px',
              color: '#9ca3af',
              border: '1px dashed #e5e7eb',
            }}>
              No tienes reservas activas en este momento.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeReservations.map((res) => (
                <div
                  key={res.id}
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #fecaca',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#111827' }}>
                      {res.spotName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Código: <strong style={{ color: '#cf0011' }}>{res.code}</strong> · {res.arrivalTime}
                    </div>
                  </div>

                  <button
                    onClick={() => cancelReservation(res.id)}
                    title="Cancelar reserva"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#fee2e2',
                      color: '#b91c1c',
                      fontSize: '11.5px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Liberar</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de Integración Arduino / IoT */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '18px',
          padding: '16px',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="#38bdf8" />
              <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '-0.2px' }}>
                Integración IoT Arduino / ESP32
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              color: '#4ade80',
              fontWeight: '600',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
              <span>MQTT Activo</span>
            </div>
          </div>

          <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
            Módulo desacoplado para capturar lecturas en tiempo real de sensores ultrasónicos (HC-SR04) y barreras vehiculares.
          </p>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={triggerManualArduinoPing}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                fontSize: '11.5px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: '1px solid #334155',
              }}
            >
              <Zap size={13} color="#f59e0b" />
              <span>Ping Sensor</span>
            </button>

            <button
              onClick={toggleArduinoSimulation}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                backgroundColor: arduinoSimulationActive ? '#cf0011' : '#1e293b',
                color: '#ffffff',
                fontSize: '11.5px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: arduinoSimulationActive ? 'none' : '1px solid #334155',
              }}
            >
              {arduinoSimulationActive ? <Pause size={13} /> : <Play size={13} />}
              <span>{arduinoSimulationActive ? 'Detener Tráfico' : 'Simular Tráfico'}</span>
            </button>
          </div>

          {/* Last Arduino Sensor Event Feed */}
          {lastArduinoEvent && (
            <div style={{
              backgroundColor: '#020617',
              borderRadius: '10px',
              padding: '8px 10px',
              fontFamily: 'monospace',
              fontSize: '10.5px',
              color: '#38bdf8',
              border: '1px solid #1e293b',
            }}>
              <div>Node: {lastArduinoEvent.sensorId}</div>
              <div>Slot: #{lastArduinoEvent.slotNumber} · Estado: {lastArduinoEvent.isOccupied ? '🚗 OCUPADO' : '🟢 LIBRE'}</div>
              <div>Distancia: {lastArduinoEvent.distanceCm} cm</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
