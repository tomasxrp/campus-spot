import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { ParkingCard } from './ParkingCard';

export const SummaryView: React.FC = () => {
  const { selectedCampus, filteredSpots, setFilterModalOpen } = useParking();

  // Primary 3 featured spots matching the screenshot (Minas, Casino, Biblioteca Central)
  // 32 + 18 + 41 = 91 plazas libres!
  const featuredAvailableSum = filteredSpots
    .slice(0, 3)
    .reduce((acc, s) => acc + s.availableSpots, 0);

  return (
    <div className="summary-container">
      <div className="summary-inner">
        {/* Top Header Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          paddingBottom: '2px',
        }}>
          {/* Uppercase Red Badge */}
          <span style={{
            fontSize: '11px',
            fontWeight: '800',
            color: '#cf0011',
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
          }}>
            DISPONIBILIDAD AHORA
          </span>

          {/* Row: Main Title + Filter Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#111827',
              letterSpacing: '-0.4px',
              margin: 0,
            }}>
              Encuentra tu lugar
            </h2>

            <button
              onClick={() => setFilterModalOpen(true)}
              aria-label="Filtrar estacionamientos"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#374151',
                flexShrink: 0,
              }}
            >
              <SlidersHorizontal size={17} strokeWidth={2} />
            </button>
          </div>

          {/* Subtitle */}
          <p style={{
            fontSize: '13.5px',
            color: '#6b7280',
            margin: 0,
          }}>
            {featuredAvailableSum} plazas libres en {selectedCampus.name}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="summary-cards-grid">
          {filteredSpots.map((spot) => (
            <ParkingCard key={spot.id} spot={spot} />
          ))}

          {filteredSpots.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px 20px',
              color: '#9ca3af',
              fontSize: '14px',
            }}>
              No se encontraron estacionamientos con los filtros seleccionados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
