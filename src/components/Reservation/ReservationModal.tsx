import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Timer, 
  Car, 
  Info, 
  Check, 
  ChevronDown 
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { DURATION_OPTIONS, VEHICLE_PRESETS } from '../../services/mockData';

export const ReservationModal: React.FC = () => {
  const { 
    reservationModalOpen, 
    closeReservationModal, 
    targetReservationSpot,
    createReservation,
  } = useParking();

  // Form states matching mockup
  const [selectedDate, setSelectedDate] = useState('Hoy, 28 sep');
  const [arrivalTime, setArrivalTime] = useState('13:30');
  const [selectedDuration, setSelectedDuration] = useState('2 horas · salida 15:30');
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLE_PRESETS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown expansion toggles
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);

  if (!reservationModalOpen || !targetReservationSpot) return null;

  const dateOptions = ['Hoy, 28 sep', 'Mañana, 29 sep', 'Miércoles, 30 sep'];
  const timeOptions = ['12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '16:00'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createReservation({
        spotId: targetReservationSpot.id,
        date: selectedDate,
        arrivalTime: arrivalTime,
        duration: selectedDuration,
        vehiclePlate: selectedVehicle.plate,
        vehicleModel: selectedVehicle.model,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      {/* Blurred Backdrop */}
      <div
        onClick={closeReservationModal}
        className="animate-fade-in"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
      />

      {/* Floating Bottom Sheet / Modal */}
      <div className="modal-sheet-container animate-slide-up">
        {/* Top Drag Handle Indicator */}
        <div style={{
          width: '38px',
          height: '4px',
          backgroundColor: '#e5e7eb',
          borderRadius: '99px',
          margin: '0 auto 4px auto',
        }} />

        {/* Header: NUEVA RESERVA + Spot Title + Close Button */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              color: '#cf0011',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
            }}>
              NUEVA RESERVA
            </span>

            <h2 style={{
              fontSize: '21px',
              fontWeight: '800',
              color: '#111827',
              letterSpacing: '-0.3px',
              margin: 0,
            }}>
              {targetReservationSpot.name}
            </h2>

            <p style={{
              fontSize: '12.5px',
              color: '#6b7280',
              margin: 0,
            }}>
              {targetReservationSpot.sector} · {targetReservationSpot.accessPoint}
            </p>
          </div>

          {/* Close Button (X) */}
          <button
            onClick={closeReservationModal}
            aria-label="Cerrar formulario"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4b5563',
              flexShrink: 0,
            }}
          >
            <X size={17} strokeWidth={2.4} />
          </button>
        </div>

        {/* Highlight Availability Banner (Light Pinkish/Red Card) */}
        <div style={{
          backgroundColor: '#fff4f4',
          border: '1px solid rgba(207, 0, 17, 0.12)',
          borderRadius: '16px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Red Car Icon Box */}
            <div style={{
              width: '38px',
              height: '38px',
              backgroundColor: '#cf0011',
              borderRadius: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(207, 0, 17, 0.25)',
              flexShrink: 0,
            }}>
              <Car size={20} strokeWidth={2.2} />
            </div>

            <div>
              <div style={{
                fontSize: '13.5px',
                fontWeight: '700',
                color: '#111827',
                lineHeight: '1.2',
              }}>
                {targetReservationSpot.availableSpots} plazas disponibles
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '1px',
              }}>
                A {targetReservationSpot.walkingTimeMinutes} min de tu ubicación
              </div>
            </div>
          </div>

          {/* Green Circle with Checkmark */}
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: '2px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            flexShrink: 0,
          }}>
            <Check size={14} strokeWidth={3} />
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
          {/* Row: Fecha & Hora de llegada */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Fecha */}
            <div style={{ flex: 1, position: 'relative' }}>
              <label style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: '500',
                color: '#6b7280',
                marginBottom: '5px',
              }}>
                Fecha
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowDatePicker(!showDatePicker);
                  setShowTimePicker(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#1f2937',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Calendar size={15} color="#cf0011" strokeWidth={2.2} />
                  <span>{selectedDate}</span>
                </div>
                <ChevronDown size={14} color="#9ca3af" />
              </button>

              {showDatePicker && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
                  zIndex: 20,
                  overflow: 'hidden',
                }}>
                  {dateOptions.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setSelectedDate(d);
                        setShowDatePicker(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '12.5px',
                        backgroundColor: selectedDate === d ? '#fef2f2' : 'transparent',
                        color: selectedDate === d ? '#cf0011' : '#374151',
                        fontWeight: selectedDate === d ? '700' : '500',
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hora de llegada */}
            <div style={{ flex: 1, position: 'relative' }}>
              <label style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: '500',
                color: '#6b7280',
                marginBottom: '5px',
              }}>
                Hora de llegada
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowTimePicker(!showTimePicker);
                  setShowDatePicker(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#1f2937',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Clock size={15} color="#cf0011" strokeWidth={2.2} />
                  <span>{arrivalTime}</span>
                </div>
                <ChevronDown size={14} color="#9ca3af" />
              </button>

              {showTimePicker && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
                  zIndex: 20,
                  maxHeight: '140px',
                  overflowY: 'auto',
                }}>
                  {timeOptions.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setArrivalTime(t);
                        setShowTimePicker(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '12.5px',
                        backgroundColor: arrivalTime === t ? '#fef2f2' : 'transparent',
                        color: arrivalTime === t ? '#cf0011' : '#374151',
                        fontWeight: arrivalTime === t ? '700' : '500',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Duración */}
          <div style={{ position: 'relative' }}>
            <label style={{
              display: 'block',
              fontSize: '11.5px',
              fontWeight: '500',
              color: '#6b7280',
              marginBottom: '5px',
            }}>
              Duración
            </label>

            <button
              type="button"
              onClick={() => setShowDurationPicker(!showDurationPicker)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1f2937',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Timer size={16} color="#cf0011" strokeWidth={2.2} />
                <span>{selectedDuration}</span>
              </div>
              <ChevronDown size={14} color="#9ca3af" />
            </button>

            {showDurationPicker && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
                zIndex: 20,
                overflow: 'hidden',
              }}>
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedDuration(opt.label);
                      setShowDurationPicker(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      textAlign: 'left',
                      fontSize: '12.5px',
                      backgroundColor: selectedDuration === opt.label ? '#fef2f2' : 'transparent',
                      color: selectedDuration === opt.label ? '#cf0011' : '#374151',
                      fontWeight: selectedDuration === opt.label ? '700' : '500',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehículo / patente */}
          <div style={{ position: 'relative' }}>
            <label style={{
              display: 'block',
              fontSize: '11.5px',
              fontWeight: '500',
              color: '#6b7280',
              marginBottom: '5px',
            }}>
              Vehículo / patente
            </label>

            <button
              type="button"
              onClick={() => setShowVehiclePicker(!showVehiclePicker)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1f2937',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={16} color="#cf0011" strokeWidth={2.2} />
                <span>{selectedVehicle.label}</span>
              </div>
              <ChevronDown size={14} color="#9ca3af" />
            </button>

            {showVehiclePicker && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
                zIndex: 20,
                overflow: 'hidden',
              }}>
                {VEHICLE_PRESETS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedVehicle(v);
                      setShowVehiclePicker(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      textAlign: 'left',
                      fontSize: '12.5px',
                      backgroundColor: selectedVehicle.id === v.id ? '#fef2f2' : 'transparent',
                      color: selectedVehicle.id === v.id ? '#cf0011' : '#374151',
                      fontWeight: selectedVehicle.id === v.id ? '700' : '500',
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Notice: 15 min tolerance */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '2px 4px',
            marginTop: '2px',
          }}>
            <Info size={14} color="#9ca3af" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{
              fontSize: '11.5px',
              color: '#6b7280',
              lineHeight: '1.4',
            }}>
              Tu lugar se mantendrá por 15 minutos después de la hora de llegada.
            </span>
          </div>

          {/* Actions: Confirmar reserva + Cancelar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                backgroundColor: '#cf0011',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '700',
                padding: '13px',
                borderRadius: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(207, 0, 17, 0.35)',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#b2000f';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#cf0011';
              }}
            >
              <Check size={18} strokeWidth={2.6} />
              <span>{isSubmitting ? 'Procesando...' : 'Confirmar reserva'}</span>
            </button>

            <button
              type="button"
              onClick={closeReservationModal}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '13.5px',
                fontWeight: '600',
                color: '#4b5563',
                textAlign: 'center',
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
