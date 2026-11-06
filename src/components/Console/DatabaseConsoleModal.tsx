import React, { useEffect, useState, useRef } from 'react';
import { 
  Terminal, 
  X, 
  RotateCw, 
  Trash2, 
  Copy, 
  Check, 
  Activity, 
  Radio, 
  Cpu, 
  Code2
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { 
  subscribeToFirebaseLogs, 
  subscribeToFirebaseRaw, 
  clearFirebaseLogs, 
  fetchFirebaseCtaOnce,
  getFirebaseLastUpdateTimestamp,
  type FirebaseLogEntry 
} from '../../services/firebase';

type TabType = 'logs' | 'sensors' | 'raw';

export const DatabaseConsoleModal: React.FC = () => {
  const { dbConsoleOpen, closeDbConsole, firebaseStatus, spots } = useParking();

  const [activeTab, setActiveTab] = useState<TabType>('logs');
  const [logs, setLogs] = useState<FirebaseLogEntry[]>([]);
  const [rawSnapshot, setRawSnapshot] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterTag, setFilterTag] = useState<'ALL' | 'SENSOR' | 'SNAPSHOT' | 'SOCKET'>('ALL');
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // CTA spot actual
  const ctaSpot = spots.find((s) => s.id === 'est-cta');

  useEffect(() => {
    if (!dbConsoleOpen) return;

    const unsubLogs = subscribeToFirebaseLogs(setLogs);
    const unsubRaw = subscribeToFirebaseRaw((raw) => {
      setRawSnapshot(raw);
      setLastUpdate(getFirebaseLastUpdateTimestamp());
    });

    return () => {
      unsubLogs();
      unsubRaw();
    };
  }, [dbConsoleOpen]);

  // Auto-scroll al fondo cuando llegan logs
  useEffect(() => {
    if (activeTab === 'logs') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  if (!dbConsoleOpen) return null;

  const handleCopyJson = () => {
    if (!rawSnapshot) return;
    navigator.clipboard.writeText(JSON.stringify(rawSnapshot, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchFirebaseCtaOnce();
      setLastUpdate(getFirebaseLastUpdateTimestamp());
    } catch {
      // Los errores se registran en los logs
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Filtrar logs
  const filteredLogs = logs.filter((log) => {
    if (filterTag === 'ALL') return true;
    if (filterTag === 'SENSOR') return log.tag === 'SENSOR';
    if (filterTag === 'SNAPSHOT') return log.tag === 'SNAPSHOT';
    if (filterTag === 'SOCKET') return log.tag === 'SOCKET';
    return true;
  });

  // Estado de conexión badge
  const statusConfig = {
    connected: { label: 'En Línea (RTDB)', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
    connecting: { label: 'Conectando...', color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)' },
    disconnected: { label: 'Desconectado', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' },
    error: { label: 'Error de Red', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  }[firebaseStatus] || { label: 'Desconocido', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      {/* Backdrop */}
      <div
        onClick={closeDbConsole}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.75)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
        }}
      />

      {/* Console Modal Sheet */}
      <div
        className="animate-slide-up"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '88vh',
          backgroundColor: '#090d16',
          borderRadius: '24px',
          border: '1px solid #1e293b',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 10,
          margin: 'auto 14px',
        }}
      >
        {/* Top Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              backgroundColor: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #334155',
            }}>
              <Terminal size={17} color="#38bdf8" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.2px' }}>
                  Consola Firebase RTDB
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: statusConfig.color,
                  backgroundColor: statusConfig.bg,
                  border: `1px solid ${statusConfig.color}40`,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: statusConfig.color,
                    boxShadow: `0 0 8px ${statusConfig.color}`,
                  }} />
                  {statusConfig.label}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                campusspot-a82da-default-rtdb
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Forzar lectura desde Firebase"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #334155',
              }}
            >
              <RotateCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={clearFirebaseLogs}
              title="Limpiar registros"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #334155',
              }}
            >
              <Trash2 size={14} />
            </button>

            <button
              onClick={closeDbConsole}
              aria-label="Cerrar consola"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #334155',
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Live CTA KPI Strip */}
        <div style={{
          backgroundColor: '#0c1322',
          padding: '10px 18px',
          borderBottom: '1px solid #1e293b',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          textAlign: 'center',
        }}>
          <div style={{ backgroundColor: '#131d33', padding: '6px 4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>TOTAL CTA</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc' }}>
              {ctaSpot?.totalSpots ?? 0}
            </div>
          </div>

          <div style={{ backgroundColor: '#131d33', padding: '6px 4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '10px', color: '#4ade80', fontWeight: '600' }}>LIBRES (VERDE)</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#4ade80' }}>
              {ctaSpot?.availableSpots ?? 0}
            </div>
          </div>

          <div style={{ backgroundColor: '#131d33', padding: '6px 4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '10px', color: '#f87171', fontWeight: '600' }}>OCUPADOS (ROJO)</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#f87171' }}>
              {Math.max(0, (ctaSpot?.totalSpots ?? 0) - (ctaSpot?.availableSpots ?? 0))}
            </div>
          </div>

          <div style={{ backgroundColor: '#131d33', padding: '6px 4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '600' }}>ÚLTIMA SYNC</div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1', paddingTop: '3px' }}>
              {lastUpdate || 'Esperando...'}
            </div>
          </div>
        </div>

        {/* Tab Selector Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 18px',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#0a0f1d',
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('logs')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: activeTab === 'logs' ? '#38bdf8' : '#1e293b',
                color: activeTab === 'logs' ? '#090d16' : '#94a3b8',
                border: 'none',
              }}
            >
              <Activity size={13} />
              <span>Eventos ({logs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('sensors')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: activeTab === 'sensors' ? '#38bdf8' : '#1e293b',
                color: activeTab === 'sensors' ? '#090d16' : '#94a3b8',
                border: 'none',
              }}
            >
              <Radio size={13} />
              <span>Sensores ({ctaSpot?.sensors?.length ?? 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('raw')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: activeTab === 'raw' ? '#38bdf8' : '#1e293b',
                color: activeTab === 'raw' ? '#090d16' : '#94a3b8',
                border: 'none',
              }}
            >
              <Code2 size={13} />
              <span>JSON Crudo</span>
            </button>
          </div>

          {activeTab === 'logs' && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['ALL', 'SENSOR', 'SNAPSHOT'] as const).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '5px',
                    fontSize: '10px',
                    fontWeight: '700',
                    backgroundColor: filterTag === tag ? '#334155' : 'transparent',
                    color: filterTag === tag ? '#f8fafc' : '#64748b',
                    border: 'none',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'raw' && (
            <button
              onClick={handleCopyJson}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                backgroundColor: copied ? '#14532d' : '#1e293b',
                color: copied ? '#86efac' : '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: '1px solid #334155',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          )}
        </div>

        {/* Tab 1: Live Event Logs Stream */}
        {activeTab === 'logs' && (
          <div
            style={{
              flex: 1,
              minHeight: '280px',
              maxHeight: '440px',
              overflowY: 'auto',
              padding: '12px 14px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '11.5px',
              lineHeight: '1.6',
              display: 'flex',
              flexDirection: 'column-reverse',
              gap: '6px',
              backgroundColor: '#060911',
            }}
          >
            <div ref={logsEndRef} />

            {filteredLogs.map((log) => {
              const tagColors: Record<string, { bg: string; text: string }> = {
                SENSOR: { bg: '#1e293b', text: '#38bdf8' },
                SNAPSHOT: { bg: '#064e3b', text: '#6ee7b7' },
                SOCKET: { bg: '#312e81', text: '#a5b4fc' },
                ESTADO_CTA: { bg: '#701a75', text: '#f0abfc' },
                FETCH_ONCE: { bg: '#78350f', text: '#fde047' },
                ERROR: { bg: '#7f1d1d', text: '#fca5a5' },
              };

              const currentTagColor = tagColors[log.tag] || { bg: '#1e293b', text: '#cbd5e1' };

              return (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '3px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <span style={{ color: '#475569', fontSize: '10px', flexShrink: 0 }}>
                    {log.timestamp}
                  </span>

                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: '800',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: currentTagColor.bg,
                      color: currentTagColor.text,
                      flexShrink: 0,
                    }}
                  >
                    {log.tag}
                  </span>

                  <span style={{
                    color: log.type === 'error' ? '#f87171' : log.type === 'warn' ? '#fbbf24' : log.type === 'success' ? '#4ade80' : '#e2e8f0',
                    wordBreak: 'break-word',
                  }}>
                    {log.message}
                  </span>
                </div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div style={{ color: '#475569', textAlign: 'center', padding: '40px 0', fontSize: '12px' }}>
                No hay registros con el filtro seleccionado.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Sensors Live Visual Grid */}
        {activeTab === 'sensors' && (
          <div
            style={{
              flex: 1,
              minHeight: '280px',
              maxHeight: '440px',
              overflowY: 'auto',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: '#060911',
            }}
          >
            {ctaSpot?.sensors && ctaSpot.sensors.length > 0 ? (
              ctaSpot.sensors.map((sensor) => {
                const isReserved = sensor.ledColor === 'amarillo';
                const isOccupied = sensor.isOccupied && sensor.ledColor === 'rojo';

                let bulbBg = '#052e16';
                let bulbBorder = '#22c55e';
                let bulbColor = '#22c55e';
                let statusText = '🟢 DISPONIBLE';
                let statusColor = '#4ade80';
                let statusBg = 'rgba(34, 197, 94, 0.15)';

                if (isReserved) {
                  bulbBg = '#422006';
                  bulbBorder = '#eab308';
                  bulbColor = '#eab308';
                  statusText = '🟡 RESERVADO';
                  statusColor = '#fde047';
                  statusBg = 'rgba(234, 179, 8, 0.15)';
                } else if (isOccupied) {
                  bulbBg = '#450a0a';
                  bulbBorder = '#ef4444';
                  bulbColor = '#ef4444';
                  statusText = '🔴 OCUPADO';
                  statusColor = '#f87171';
                  statusBg = 'rgba(239, 68, 68, 0.15)';
                }

                const hasBoth = Boolean(sensor.patenteEsperada && sensor.patenteDetectada);
                const platesMatch = hasBoth && sensor.patenteEsperada?.toUpperCase() === sensor.patenteDetectada?.toUpperCase();

                return (
                  <div
                    key={sensor.sensorId}
                    style={{
                      backgroundColor: '#0f172a',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      border: `1px solid ${bulbBorder}40`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* LED Bulb Indicator */}
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          backgroundColor: bulbBg,
                          border: `1px solid ${bulbBorder}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 0 14px ${bulbBorder}40`,
                        }}>
                          <span style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: bulbColor,
                          }} />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
                              {sensor.name}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              color: '#38bdf8',
                              backgroundColor: '#1e293b',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}>
                              {sensor.sensorId}
                            </span>
                          </div>

                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            Distancia: <strong style={{ color: '#f1f5f9' }}>{sensor.distanciaMm ? `${sensor.distanciaMm.toFixed(1)} mm` : 'N/A'}</strong>
                            {sensor.distanciaMm && ` (${(sensor.distanciaMm / 10).toFixed(1)} cm)`}
                          </div>
                        </div>
                      </div>

                      {/* Right Status Badge */}
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: statusBg,
                          color: statusColor,
                          border: `1px solid ${bulbBorder}50`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          {statusText}
                        </span>
                        <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '3px' }}>
                          LED {sensor.ledColor.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Patentes (Esperada vs Detectada) */}
                    {(sensor.patenteEsperada || sensor.patenteDetectada) && (
                      <div style={{
                        backgroundColor: '#020617',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid #1e293b',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {sensor.patenteEsperada && (
                            <span>
                              <span style={{ color: '#94a3b8' }}>Esperada: </span>
                              <strong style={{ color: '#fde047', fontFamily: 'monospace' }}>{sensor.patenteEsperada}</strong>
                            </span>
                          )}

                          {sensor.patenteDetectada && (
                            <span>
                              <span style={{ color: '#94a3b8' }}>Cámara: </span>
                              <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{sensor.patenteDetectada}</strong>
                            </span>
                          )}
                        </div>

                        {hasBoth && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            color: platesMatch ? '#4ade80' : '#f87171',
                          }}>
                            {platesMatch ? '✓ Coincide' : '⚠ No coincide'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                <Cpu size={28} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '13px' }}>Esperando datos de sensores desde Firebase...</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Raw JSON Viewer */}
        {activeTab === 'raw' && (
          <div
            style={{
              flex: 1,
              minHeight: '280px',
              maxHeight: '440px',
              overflowY: 'auto',
              padding: '14px',
              backgroundColor: '#060911',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '11.5px',
              color: '#38bdf8',
            }}
          >
            {rawSnapshot ? (
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#a5f3fc' }}>
                {JSON.stringify(rawSnapshot, null, 2)}
              </pre>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                No se ha recibido aún ningún snapshot desde Firebase.
              </div>
            )}
          </div>
        )}

        {/* Bottom Status Footer */}
        <div style={{
          padding: '10px 18px',
          borderTop: '1px solid #1e293b',
          backgroundColor: '#0b1120',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#64748b',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={12} color={statusConfig.color} />
            <span>Target: Estacionamiento CTA (Curicó)</span>
          </div>

          <span style={{ fontFamily: 'monospace' }}>
            Firebase SDK v11.x
          </span>
        </div>
      </div>
    </div>
  );
};
