import React from 'react';
import { CheckCircle2, QrCode, MapPin, Clock, Car, Navigation } from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

export const ReservationSuccessModal: React.FC = () => {
  const { 
    successModalOpen, 
    closeSuccessModal, 
    lastReservation, 
    setActiveTab 
  } = useParking();

  if (!successModalOpen || !lastReservation) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={closeSuccessModal}
        className="animate-fade-in"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Ticket Card */}
      <div
        className="animate-pop-in"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          padding: '24px 20px',
          zIndex: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Animated Green Check Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#ecfdf5',
          border: '4px solid #d1fae5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#10b981',
          marginBottom: '12px',
        }}>
          <CheckCircle2 size={32} strokeWidth={2.4} />
        </div>

        <span style={{
          fontSize: '11px',
          fontWeight: '800',
          color: '#cf0011',
          letterSpacing: '0.6px',
          textTransform: 'uppercase',
        }}>
          ¡RESERVA CONFIRMADA!
        </span>

        <h3 style={{
          fontSize: '20px',
          fontWeight: '800',
          color: '#111827',
          marginTop: '2px',
          marginBottom: '2px',
        }}>
          {lastReservation.spotName}
        </h3>

        <p style={{ fontSize: '12.5px', color: '#6b7280', marginBottom: '16px' }}>
          Código de acceso: <strong style={{ color: '#cf0011' }}>{lastReservation.code}</strong>
        </p>

        {/* Access Pass Box with QR Code Simulation */}
        <div style={{
          width: '100%',
          backgroundColor: '#f9fafb',
          border: '1px dashed #d1d5db',
          borderRadius: '16px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '10px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            }}>
              <QrCode size={90} color="#111827" />
            </div>
          </div>

          <div style={{
            fontSize: '11px',
            color: '#6b7280',
            fontWeight: '500',
          }}>
            Acerca este código al lector del sensor en la barrera de entrada.
          </div>

          <div style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            textAlign: 'left',
            fontSize: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#374151' }}>
              <MapPin size={14} color="#cf0011" />
              <span>{lastReservation.accessPoint}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#374151' }}>
              <Clock size={14} color="#cf0011" />
              <span>{lastReservation.date} · {lastReservation.arrivalTime} ({lastReservation.duration})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#374151' }}>
              <Car size={14} color="#cf0011" />
              <span>{lastReservation.vehicleModel} ({lastReservation.vehiclePlate})</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px' }}>
          <button
            onClick={() => {
              closeSuccessModal();
              setActiveTab('map');
            }}
            style={{
              width: '100%',
              backgroundColor: '#cf0011',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(207, 0, 17, 0.3)',
            }}
          >
            <Navigation size={16} />
            <span>Ver en el mapa</span>
          </button>

          <button
            onClick={closeSuccessModal}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#6b7280',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
