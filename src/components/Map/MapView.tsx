import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair, SlidersHorizontal, Layers } from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { FloatingSpotCard } from './FloatingSpotCard';

export const MapView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapLayerMode, setMapLayerMode] = useState<'google-roadmap' | 'google-satellite'>('google-roadmap');

  const {
    selectedCampus,
    spots,
    selectedSpot,
    setSelectedSpot,
    totalAvailableInCampus,
    setFilterModalOpen,
  } = useParking();

  // Initialize Leaflet Map with Google Maps Tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: selectedCampus.center,
        zoom: selectedCampus.defaultZoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Google Maps Roadmap Tiles
      const googleTiles = L.tileLayer('https://mt1.google.com/vt/lyrs=m&hl=es&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      }).addTo(map);

      tileLayerRef.current = googleTiles;

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }
  }, []);

  // Switch between Google Maps Callejero & Google Maps Satélite
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const map = mapInstanceRef.current;
    map.removeLayer(tileLayerRef.current);

    const tileUrl = mapLayerMode === 'google-roadmap'
      ? 'https://mt1.google.com/vt/lyrs=m&hl=es&x={x}&y={y}&z={z}'
      : 'https://mt1.google.com/vt/lyrs=y&hl=es&x={x}&y={y}&z={z}';

    const newTiles = L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(map);

    tileLayerRef.current = newTiles;
  }, [mapLayerMode]);

  // Update map center when selected campus changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(selectedCampus.center, selectedCampus.defaultZoom, {
        animate: true,
      });
    }
  }, [selectedCampus]);

  // Update markers when spots or selectedSpot change
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();

    spots
      .filter((s) => s.campusId === selectedCampus.id)
      .forEach((spot) => {
        const isSelected = selectedSpot?.id === spot.id;
        const displayName = spot.id === 'est-cta' ? 'CTA' : spot.name.replace('Estacionamiento ', '');

        // Custom HTML Marker Icon
        const iconHtml = isSelected
          ? `
            <div class="cs-active-pin-wrapper">
              <div class="cs-pin-pulse"></div>
              <div class="cs-active-pin-badge">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#ffffff">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
                <span>${spot.availableSpots}</span>
              </div>
              <div class="cs-active-pin-label">${displayName}</div>
            </div>
          `
          : `
            <div class="cs-map-pill">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="#cf0011">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
              <span>${spot.availableSpots}</span>
            </div>
          `;

        const customIcon = L.divIcon({
          className: 'cs-marker-container',
          html: iconHtml,
          iconSize: isSelected ? [80, 60] : [64, 32],
          iconAnchor: isSelected ? [40, 30] : [32, 16],
        });

        const marker = L.marker(spot.coordinates, { icon: customIcon });

        marker.on('click', () => {
          setSelectedSpot(spot);
          mapInstanceRef.current?.panTo(spot.coordinates, { animate: true });
        });

        markersLayerRef.current?.addLayer(marker);
      });
  }, [spots, selectedSpot, selectedCampus, setSelectedSpot]);

  const handleRecenter = () => {
    if (selectedSpot && mapInstanceRef.current) {
      mapInstanceRef.current.setView(selectedSpot.coordinates, 17, { animate: true });
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(selectedCampus.center, selectedCampus.defaultZoom, { animate: true });
    }
  };

  const toggleMapLayer = () => {
    setMapLayerMode((prev) => (prev === 'google-roadmap' ? 'google-satellite' : 'google-roadmap'));
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      flex: 1,
      overflow: 'hidden',
      backgroundColor: '#f3f4f6',
    }}>
      {/* Map Leaflet Container with Google Maps */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          zIndex: 10,
        }}
      />

      {/* Floating Top Badge: "🟢 128 plazas disponibles" */}
      <div
        className="animate-pop-in"
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '999px',
          padding: '7px 14px 7px 12px',
          boxShadow: '0 3px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 25,
          pointerEvents: 'auto',
        }}
      >
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          boxShadow: '0 0 6px #10b981',
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: '12.5px',
          fontWeight: '600',
          color: '#111827',
          letterSpacing: '-0.1px',
        }}>
          {totalAvailableInCampus} plazas disponibles
        </span>
      </div>

      {/* Floating Top-Right Action Controls */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 25,
        }}
      >
        {/* Recenter / Location button */}
        <button
          onClick={handleRecenter}
          aria-label="Centrar en mi ubicación o estacionamiento"
          title="Centrar en campus / estacionamiento"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '13px',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#cf0011',
          }}
        >
          <Crosshair size={20} strokeWidth={2.2} />
        </button>

        {/* Google Maps Layer Switcher (Callejero vs Satelital) */}
        <button
          onClick={toggleMapLayer}
          aria-label="Cambiar tipo de mapa Google Maps"
          title={mapLayerMode === 'google-roadmap' ? 'Cambiar a Satélite Google Maps' : 'Cambiar a Callejero Google Maps'}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '13px',
            backgroundColor: mapLayerMode === 'google-satellite' ? '#cf0011' : '#ffffff',
            color: mapLayerMode === 'google-satellite' ? '#ffffff' : '#374151',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Layers size={18} strokeWidth={2} />
        </button>

        {/* Filter Sliders button */}
        <button
          onClick={() => setFilterModalOpen(true)}
          aria-label="Abrir filtros de estacionamiento"
          title="Filtros"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '13px',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#374151',
          }}
        >
          <SlidersHorizontal size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Floating Bottom Spot Detail Card */}
      {selectedSpot && <FloatingSpotCard spot={selectedSpot} />}
    </div>
  );
};
