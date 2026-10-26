import React from 'react';
import { CheckCircle2, MapPin, Car, Navigation, ShieldCheck, Calendar } from 'lucide-react';
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

      {/* Summary Card */}
      <div
        className="animate-pop-in"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          padding: '26px 22px',
          zIndex: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Animated Green Check Icon */}
        <div style={{
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          backgroundColor: '#ecfdf5',
          border: '4px solid #d1fae5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#10b981',
          marginBottom: '12px',
        }}>
          <CheckCircle2 size={34} strokeWidth={2.4} />
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
          fontSize: '21px',
          fontWeight: '800',
          color: '#111827',
          marginTop: '4px',
          marginBottom: '2px',
          textAlign: 'center',
        }}>
          {lastReservation.spotName}
        </h3>

        {/* Code Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#fff4f4',
          border: '1px solid rgba(207, 0, 17, 0.2)',
          padding: '4px 14px',
          borderRadius: '99px',
          marginTop: '6px',
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: '11.5px', color: '#6b7280', fontWeight: '500' }}>Código:</span>
          <strong style={{ fontSize: '14px', color: '#cf0011', letterSpacing: '0.5px' }}>{lastReservation.code}</strong>
        </div>

        {/* Detailed Breakdown Card */}
        <div style={{
          width: '100%',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '18px',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderBottom: '1px solid #f1f3f5',
            paddingBottom: '6px',
          }}>
            Resumen de la Reserva
          </div>

          {/* Ubicación */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
              <MapPin size={15} color="#cf0011" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Lugar y Acceso</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                {lastReservation.spotName} · {lastReservation.accessPoint}
              </div>
            </div>
          </div>

          {/* Fecha y Horario */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
              <Calendar size={15} color="#cf0011" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Fecha y Horario</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                {lastReservation.date} a las {lastReservation.arrivalTime} hrs
              </div>
              <div style={{ fontSize: '11.5px', color: '#6b7280' }}>
                Duración: {lastReservation.duration}
              </div>
            </div>
          </div>

          {/* Vehículo */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
              <Car size={15} color="#cf0011" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Vehículo Registrado</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                {lastReservation.vehicleModel} <span style={{ color: '#cf0011' }}>({lastReservation.vehiclePlate})</span>
              </div>
            </div>
          </div>

          {/* Aviso de tolerancia */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '8px 10px',
            fontSize: '11.5px',
            color: '#166534',
            marginTop: '2px',
          }}>
            <ShieldCheck size={15} color="#16a34a" style={{ flexShrink: 0 }} />
            <span>Lugar reservado con 15 minutos de tolerancia tras la llegada.</span>
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
              padding: '13px',
              borderRadius: '13px',
              fontSize: '14.5px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              boxShadow: '0 4px 14px rgba(207, 0, 17, 0.3)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b2000f';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#cf0011';
            }}
          >
            <Navigation size={16} />
            <span>Ver en el mapa</span>
          </button>

          <button
            onClick={closeSuccessModal}
            style={{
              width: '100%',
              padding: '9px',
              fontSize: '13.5px',
              fontWeight: '600',
              color: '#6b7280',
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
