import React from 'react';
import { useParking } from '../../context/ParkingContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useParking();

  return (
    <nav className="bottom-nav-container">
      <div className="bottom-nav-inner">
        {/* MAPA Tab */}
        <button
          onClick={() => setActiveTab('map')}
          aria-label="Ver Mapa"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: activeTab === 'map' ? '#cf0011' : '#9ca3af',
            padding: '4px 18px',
            position: 'relative',
          }}
        >
          {/* Folded Map Icon */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={activeTab === 'map' ? 2.3 : 1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </svg>

          <span style={{
            fontSize: '11px',
            fontWeight: activeTab === 'map' ? '700' : '500',
            letterSpacing: '0.2px',
          }}>
            MAPA
          </span>

          {/* Active Red Dot Indicator */}
          {activeTab === 'map' && (
            <span style={{
              width: '4px',
              height: '4px',
              backgroundColor: '#cf0011',
              borderRadius: '50%',
              marginTop: '1px',
            }} />
          )}
          {activeTab !== 'map' && <span style={{ width: '4px', height: '4px', marginTop: '1px' }} />}
        </button>

        {/* Resumen Tab */}
        <button
          onClick={() => setActiveTab('summary')}
          aria-label="Ver Resumen"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: activeTab === 'summary' ? '#cf0011' : '#9ca3af',
            padding: '4px 18px',
            position: 'relative',
          }}
        >
          {/* Grid / Layout 4 Squares Icon */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={activeTab === 'summary' ? 2.3 : 1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>

          <span style={{
            fontSize: '11px',
            fontWeight: activeTab === 'summary' ? '700' : '500',
            letterSpacing: '0.2px',
          }}>
            Resumen
          </span>

          {/* Active Red Dot Indicator */}
          {activeTab === 'summary' && (
            <span style={{
              width: '4px',
              height: '4px',
              backgroundColor: '#cf0011',
              borderRadius: '50%',
              marginTop: '1px',
            }} />
          )}
          {activeTab !== 'summary' && <span style={{ width: '4px', height: '4px', marginTop: '1px' }} />}
        </button>
      </div>

      {/* iOS Home Bottom Bar indicator */}
      <div className="ios-home-indicator" style={{
        width: '128px',
        height: '4px',
        backgroundColor: '#111827',
        borderRadius: '99px',
        marginTop: '8px',
        opacity: 0.18,
      }} />
    </nav>
  );
};
