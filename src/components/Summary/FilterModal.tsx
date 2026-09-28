import React from 'react';
import { X } from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

export const FilterModal: React.FC = () => {
  const { filterModalOpen, setFilterModalOpen, filters, setFilters } = useParking();

  if (!filterModalOpen) return null;

  return (
    <div className="modal-overlay">
      {/* Backdrop */}
      <div
        onClick={() => setFilterModalOpen(false)}
        className="animate-fade-in"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Sheet / Modal */}
      <div className="modal-sheet-container animate-slide-up" style={{ gap: '18px' }}>
        <div style={{
          width: '38px',
          height: '4px',
          backgroundColor: '#e5e7eb',
          borderRadius: '99px',
          margin: '0 auto',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0 }}>
            Filtrar Estacionamientos
          </h3>
          <button
            onClick={() => setFilterModalOpen(false)}
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

        {/* Tipo de estacionamiento */}
        <div>
          <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>
            Tipo de techo
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'Cubierto', 'Exterior'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilters((prev) => ({ ...prev, type: t }))}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '12px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  backgroundColor: filters.type === t ? '#fef2f2' : '#f9fafb',
                  color: filters.type === t ? '#cf0011' : '#4b5563',
                  border: filters.type === t ? '1.5px solid #cf0011' : '1px solid #e5e7eb',
                }}
              >
                {t === 'all' ? 'Todos' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Only available */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            padding: '10px 12px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
          }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>
              Solo con plazas disponibles ahora
            </span>
            <input
              type="checkbox"
              checked={filters.onlyAvailable || false}
              onChange={(e) => setFilters((prev) => ({ ...prev, onlyAvailable: e.target.checked }))}
              style={{ width: '18px', height: '18px', accentColor: '#cf0011' }}
            />
          </label>

          {/* Only accessible */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            padding: '10px 12px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
          }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>
              Solo con espacios de accesibilidad universal
            </span>
            <input
              type="checkbox"
              checked={filters.onlyAccessible || false}
              onChange={(e) => setFilters((prev) => ({ ...prev, onlyAccessible: e.target.checked }))}
              style={{ width: '18px', height: '18px', accentColor: '#cf0011' }}
            />
          </label>
        </div>

        {/* Apply & Reset Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button
            onClick={() => {
              setFilters({ type: 'all', onlyAvailable: false, onlyAccessible: false });
              setFilterModalOpen(false);
            }}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: '#f3f4f6',
              color: '#4b5563',
              fontSize: '13.5px',
              fontWeight: '600',
            }}
          >
            Limpiar
          </button>

          <button
            onClick={() => setFilterModalOpen(false)}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: '#cf0011',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: '700',
              boxShadow: '0 3px 10px rgba(207, 0, 17, 0.3)',
            }}
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};
