import React, { useState } from 'react';
import { ChevronDown, User, Check, Building2 } from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

export const Header: React.FC = () => {
  const { selectedCampus, setSelectedCampus, campuses, setUserProfileOpen, activeReservations } = useParking();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="header-inner">
      {/* Brand: Logo + Name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        userSelect: 'none',
      }}>
        {/* Red App Icon */}
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: '#cf0011',
          borderRadius: '9px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(207, 0, 17, 0.28)',
          flexShrink: 0,
        }}>
          {/* Location Pin with Car silhouette inside */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
              fill="#ffffff"
            />
            <circle cx="12" cy="9" r="3.2" fill="#cf0011" />
          </svg>
        </div>

        <span style={{
          fontSize: '15px',
          fontWeight: '700',
          color: '#111827',
          letterSpacing: '-0.3px',
          whiteSpace: 'nowrap',
        }}>
          Campus Spot
        </span>
      </div>

      {/* Campus Selector Pill */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-label="Seleccionar campus"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '999px',
            padding: '6px 12px 6px 14px',
            fontSize: '12.5px',
            fontWeight: '600',
            color: '#1f2937',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
          }}
        >
          <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedCampus.name}
          </span>
          <ChevronDown
            size={14}
            color="#6b7280"
            style={{
              transition: 'transform 0.2s ease',
              transform: dropdownOpen ? 'rotate(180deg)' : 'none',
            }}
          />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <>
            <div
              onClick={() => setDropdownOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 45,
              }}
            />
            <div
              className="animate-pop-in"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '6px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
                minWidth: '200px',
                zIndex: 50,
              }}
            >
              <div style={{ padding: '6px 10px 4px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>
                Selecciona Campus
              </div>
              {campuses.map((camp) => (
                <button
                  key={camp.id}
                  onClick={() => {
                    setSelectedCampus(camp);
                    setDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    backgroundColor: camp.id === selectedCampus.id ? '#fef2f2' : 'transparent',
                    color: camp.id === selectedCampus.id ? '#cf0011' : '#374151',
                    fontSize: '13px',
                    fontWeight: camp.id === selectedCampus.id ? '700' : '500',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={15} color={camp.id === selectedCampus.id ? '#cf0011' : '#9ca3af'} />
                    <span>{camp.name}</span>
                  </div>
                  {camp.id === selectedCampus.id && <Check size={14} color="#cf0011" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* User Profile Button */}
      <button
        onClick={() => setUserProfileOpen(true)}
        aria-label="Perfil de usuario"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          border: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          position: 'relative',
        }}
      >
        <User size={18} color="#cf0011" strokeWidth={1.8} />
        {/* Active reservation badge indicator */}
        {activeReservations.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '-1px',
            right: '-1px',
            width: '10px',
            height: '10px',
            backgroundColor: '#cf0011',
            border: '2px solid #ffffff',
            borderRadius: '50%',
          }} />
        )}
      </button>
      </div>
    </header>
  );
};
