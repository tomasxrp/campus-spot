import React from 'react';
import type { ParkingSpot } from '../../types';
import { useParking } from '../../context/ParkingContext';

interface ParkingCardProps {
  spot: ParkingSpot;
}

export const ParkingCard: React.FC<ParkingCardProps> = ({ spot }) => {
  const { openReservationModal, setSelectedSpot } = useParking();

  // Determine metadata text to match mockup:
  // e.g. "2 min · Cubierto", "4 min · Exterior", "3 min · 4 accesibles"
  const metaText = spot.accessibleSpots > 2
    ? `${spot.walkingTimeMinutes} min · ${spot.accessibleSpots} accesibles`
    : `${spot.walkingTimeMinutes} min · ${spot.type}`;

  const handleCardClick = () => {
    setSelectedSpot(spot);
  };

  const handleReserveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openReservationModal(spot);
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        padding: '12px 14px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
        border: '1px solid #f1f3f5',
        display: 'flex',
        alignItems: 'center',
        gap: '13px',
        cursor: 'pointer',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.05)';
      }}
    >
      {/* Thumbnail Image */}
      <div style={{
        width: '78px',
        height: '78px',
        borderRadius: '13px',
        overflow: 'hidden',
        flexShrink: 0,
        backgroundColor: '#f3f4f6',
        position: 'relative',
      }}>
        <img
          src={spot.image}
          alt={spot.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          loading="lazy"
        />
      </div>

      {/* Info Column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {/* Title */}
        <h4 style={{
          fontSize: '14.5px',
          fontWeight: '700',
          color: '#111827',
          letterSpacing: '-0.2px',
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {spot.name}
        </h4>

        {/* Subtitle / Sector */}
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {spot.sector} · {spot.accessPoint}
        </p>

        {/* Status Line: Green dot + available count */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          margin: '3px 0 2px',
          fontSize: '12.5px',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'inline-block',
          }} />
          <span style={{
            fontWeight: '700',
            color: '#10b981',
          }}>
            {spot.availableSpots} libres
          </span>
          <span style={{
            color: '#9ca3af',
            fontWeight: '400',
          }}>
            de {spot.totalSpots}
          </span>
        </div>

        {/* Bottom Row: Meta text & Red Reserve Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '2px',
        }}>
          <span style={{
            fontSize: '11.5px',
            color: '#6b7280',
          }}>
            {metaText}
          </span>

          {/* Red Action Button */}
          <button
            onClick={handleReserveClick}
            aria-label={`Reservar lugar en ${spot.name}`}
            style={{
              backgroundColor: '#cf0011',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: '600',
              padding: '6px 18px',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(207, 0, 17, 0.28)',
              transition: 'background-color 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b2000f';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#cf0011';
            }}
          >
            Reservar
          </button>
        </div>
      </div>
    </div>
  );
};
