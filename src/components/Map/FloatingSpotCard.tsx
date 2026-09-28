import React from 'react';
import { Clock, Accessibility } from 'lucide-react';
import type { ParkingSpot } from '../../types';
import { useParking } from '../../context/ParkingContext';

interface FloatingSpotCardProps {
  spot: ParkingSpot;
}

export const FloatingSpotCard: React.FC<FloatingSpotCardProps> = ({ spot }) => {
  const { openReservationModal } = useParking();

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
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Left Info */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#111827',
          letterSpacing: '-0.2px',
          marginBottom: '3px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {spot.name}
        </h3>

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
  );
};
