import React from 'react';
import { Clock, Accessibility, Terminal } from 'lucide-react';
import type { ParkingSpot } from '../../types';
import { useParking } from '../../context/ParkingContext';

interface FloatingSpotCardProps {
  spot: ParkingSpot;
}

export const FloatingSpotCard: React.FC<FloatingSpotCardProps> = ({ spot }) => {
  const { openReservationModal, openDbConsole } = useParking();

  return (
    <div
      onClick={() => openReservationModal(spot)}
      className="floating-spot-card animate-slide-up"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '22px',
        padding: '16px 18px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}>
        {/* Left Info */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#111827',
              letterSpacing: '-0.2px',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {spot.name}
            </h3>

            {spot.isFirebaseConnected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDbConsole();
                }}
                title="Abrir consola de base de datos Firebase"
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#ea580c',
                  backgroundColor: '#fff7ed',
                  border: '1px solid #ffedd5',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fed7aa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff7ed';
                }}
              >
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#f97316' }} />
                <span>Firebase RTDB</span>
                <Terminal size={10} color="#ea580c" />
              </button>
            )}
          </div>

          <p style={{
            fontSize: '12.5px',
            color: '#6b7280',
            marginBottom: '9px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            A {spot.walkingTimeMinutes} min caminando · {spot.sector}
          </p>

          {/* Metadata Icons Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontSize: '11.5px',
            color: '#6b7280',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} color="#9ca3af" strokeWidth={2.2} />
              <span>{spot.hours}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Accessibility size={13} color="#9ca3af" strokeWidth={2.2} />
              <span>{spot.accessibleSpots} accesibles</span>
            </div>
          </div>
        </div>

        {/* Right: Green Availability Badge */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#e8f8f0',
          borderRadius: '16px',
          padding: '8px 14px',
          minWidth: '58px',
          flexShrink: 0,
          border: '1px solid rgba(16, 185, 129, 0.15)',
        }}>
          <span style={{
            fontSize: '20px',
            fontWeight: '800',
            color: '#059669',
            lineHeight: '1.1',
          }}>
            {spot.availableSpots}
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#059669',
            letterSpacing: '0.2px',
          }}>
            libres
          </span>
        </div>
      </div>

      {/* Realtime Sensors Slot Strip (from Firebase Realtime Database) */}
      {spot.sensors && spot.sensors.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid #f1f5f9',
          width: '100%',
        }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
            Estado de sensores (LED):
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {spot.sensors.map((s) => {
              const isMisplaced = Boolean(s.isMisplaced);
              const bg = isMisplaced ? '#ffedd5' : s.ledColor === 'verde' ? '#dcfce7' : s.ledColor === 'amarillo' ? '#fef9c3' : '#fee2e2';
              const text = isMisplaced ? '#c2410c' : s.ledColor === 'verde' ? '#166534' : s.ledColor === 'amarillo' ? '#854d0e' : '#991b1b';
              const border = isMisplaced ? '#fdba74' : s.ledColor === 'verde' ? '#bbf7d0' : s.ledColor === 'amarillo' ? '#fde047' : '#fecaca';
              const dot = isMisplaced ? '#f97316' : s.ledColor === 'verde' ? '#22c55e' : s.ledColor === 'amarillo' ? '#eab308' : '#ef4444';
              const statusText = isMisplaced ? '⚠️ Auto en mala posición' : s.ledColor === 'verde' ? '🟢 Libre' : s.ledColor === 'amarillo' ? '🟡 Reservado' : '🔴 Ocupado';

              return (
                <div
                  key={s.sensorId}
                  title={`${s.name} (${s.sensorId}): ${statusText}${s.distanciaMm ? ` · ${s.distanciaMm.toFixed(1)} mm` : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10.5px',
                    fontWeight: '700',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    backgroundColor: bg,
                    color: text,
                    border: `1px solid ${border}`,
                  }}
                >
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: dot,
                  }} />
                  <span>P{s.slotNumber}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
