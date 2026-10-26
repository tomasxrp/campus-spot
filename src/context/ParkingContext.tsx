import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { 
  ArduinoSensorEvent, 
  Campus, 
  FilterOptions, 
  NewReservationPayload, 
  ParkingSpot, 
  Reservation, 
  TabType 
} from '../types';
import { parkingService } from '../services/parkingService';
import { CAMPUS_LIST } from '../services/mockData';

interface ParkingContextType {
  campuses: Campus[];
  selectedCampus: Campus;
  setSelectedCampus: (campus: Campus) => void;
  spots: ParkingSpot[];
  selectedSpot: ParkingSpot | null;
  setSelectedSpot: (spot: ParkingSpot | null) => void;
  totalAvailableInCampus: number;
  totalCapacityInCampus: number;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  reservationModalOpen: boolean;
  openReservationModal: (spot?: ParkingSpot) => void;
  closeReservationModal: () => void;
  targetReservationSpot: ParkingSpot | null;
  activeReservations: Reservation[];
  createReservation: (payload: NewReservationPayload) => Promise<Reservation>;
  cancelReservation: (id: string) => Promise<void>;
  lastReservation: Reservation | null;
  successModalOpen: boolean;
  closeSuccessModal: () => void;
  filterModalOpen: boolean;
  setFilterModalOpen: (open: boolean) => void;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  filteredSpots: ParkingSpot[];
  userProfileOpen: boolean;
  setUserProfileOpen: (open: boolean) => void;
  arduinoSimulationActive: boolean;
  toggleArduinoSimulation: () => void;
  triggerManualArduinoPing: () => void;
  lastArduinoEvent: ArduinoSensorEvent | null;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

export const ParkingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [campuses] = useState<Campus[]>(CAMPUS_LIST);
  const [selectedCampus, setSelectedCampus] = useState<Campus>(CAMPUS_LIST[0]);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('map');

  // Modales
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [targetReservationSpot, setTargetReservationSpot] = useState<ParkingSpot | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [lastReservation, setLastReservation] = useState<Reservation | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [userProfileOpen, setUserProfileOpen] = useState(false);

  // Reservas activas
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);

  // Filtros
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    onlyAvailable: false,
    type: 'all',
    onlyAccessible: false,
  });

  // IoT / Arduino simulation
  const [arduinoSimulationActive, setArduinoSimulationActive] = useState(false);
  const [lastArduinoEvent, setLastArduinoEvent] = useState<ArduinoSensorEvent | null>(null);

  useEffect(() => {
    const unsubSpots = parkingService.subscribeToSpots((newSpots) => {
      setSpots(newSpots);
      // Mantener seleccionado CTA por defecto si no hay ninguno seleccionado
      setSelectedSpot((prev) => {
        if (!prev) {
          return newSpots.find((s) => s.id === 'est-cta') || newSpots[0] || null;
        }
        return newSpots.find((s) => s.id === prev.id) || prev;
      });
    });

    const unsubArduino = parkingService.subscribeToArduino((event) => {
      setLastArduinoEvent(event);
    });

    parkingService.getActiveReservations().then(setActiveReservations);

    return () => {
      unsubSpots();
      unsubArduino();
    };
  }, []);

  // Update selected spot when user switches campus
  useEffect(() => {
    if (spots.length > 0) {
      const spotInCampus = spots.find((s) => s.campusId === selectedCampus.id);
      if (spotInCampus) {
        setSelectedSpot(spotInCampus);
      }
    }
  }, [selectedCampus, spots]);

  const totalAvailableInCampus = useMemo(() => {
    return spots
      .filter((s) => s.campusId === selectedCampus.id)
      .reduce((acc, curr) => acc + curr.availableSpots, 0);
  }, [spots, selectedCampus]);

  const totalCapacityInCampus = useMemo(() => {
    return spots
      .filter((s) => s.campusId === selectedCampus.id)
      .reduce((acc, curr) => acc + curr.totalSpots, 0);
  }, [spots, selectedCampus]);

  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => {
      if (spot.campusId !== selectedCampus.id) return false;
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = spot.name.toLowerCase().includes(query);
        const matchesSector = spot.sector.toLowerCase().includes(query);
        if (!matchesName && !matchesSector) return false;
      }
      if (filters.onlyAvailable && spot.availableSpots <= 0) return false;
      if (filters.type && filters.type !== 'all' && spot.type !== filters.type) return false;
      if (filters.onlyAccessible && spot.accessibleSpots <= 0) return false;
      return true;
    });
  }, [spots, selectedCampus, filters]);

  const openReservationModal = (spot?: ParkingSpot) => {
    const target = spot || selectedSpot || spots[0];
    setTargetReservationSpot(target);
    setReservationModalOpen(true);
  };

  const closeReservationModal = () => {
    setReservationModalOpen(false);
  };

  const closeSuccessModal = () => {
    setSuccessModalOpen(false);
  };

  const createReservation = async (payload: NewReservationPayload): Promise<Reservation> => {
    const res = await parkingService.createReservation(payload);
    setLastReservation(res);
    const updated = await parkingService.getActiveReservations();
    setActiveReservations(updated);
    setReservationModalOpen(false);
    setSuccessModalOpen(true);
    return res;
  };

  const cancelReservation = async (id: string): Promise<void> => {
    await parkingService.cancelReservation(id);
    const updated = await parkingService.getActiveReservations();
    setActiveReservations(updated);
  };

  const toggleArduinoSimulation = () => {
    const nextState = !arduinoSimulationActive;
    setArduinoSimulationActive(nextState);
    parkingService.toggleLiveSimulation(nextState, 6000);
  };

  const triggerManualArduinoPing = () => {
    const event = parkingService.simulateArduinoSensorPing();
    if (event) setLastArduinoEvent(event);
  };

  return (
    <ParkingContext.Provider
      value={{
        campuses,
        selectedCampus,
        setSelectedCampus,
        spots,
        selectedSpot,
        setSelectedSpot,
        totalAvailableInCampus,
        totalCapacityInCampus,
        activeTab,
        setActiveTab,
        reservationModalOpen,
        openReservationModal,
        closeReservationModal,
        targetReservationSpot,
        activeReservations,
        createReservation,
        cancelReservation,
        lastReservation,
        successModalOpen,
        closeSuccessModal,
        filterModalOpen,
        setFilterModalOpen,
        filters,
        setFilters,
        filteredSpots,
        userProfileOpen,
        setUserProfileOpen,
        arduinoSimulationActive,
        toggleArduinoSimulation,
        triggerManualArduinoPing,
        lastArduinoEvent,
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
};

export const useParking = () => {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return context;
};
