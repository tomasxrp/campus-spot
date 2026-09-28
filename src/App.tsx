import React from 'react';
import { ParkingProvider, useParking } from './context/ParkingContext';
import { Header } from './components/Header/Header';
import { MapView } from './components/Map/MapView';
import { SummaryView } from './components/Summary/SummaryView';
import { BottomNav } from './components/Navigation/BottomNav';
import { ReservationModal } from './components/Reservation/ReservationModal';
import { ReservationSuccessModal } from './components/Reservation/ReservationSuccessModal';
import { FilterModal } from './components/Summary/FilterModal';
import { UserProfileModal } from './components/Header/UserProfileModal';

const AppContent: React.FC = () => {
  const { activeTab } = useParking();

  return (
    <div className="app-container">
      {/* Header with Campus Spot logo, Campus selector, and User Profile */}
      <Header />

      {/* Main Dynamic View: MAPA or Resumen */}
      <main className="app-main">
        {activeTab === 'map' ? <MapView /> : <SummaryView />}
      </main>

      {/* Bottom Navigation Bar (MAPA / Resumen) */}
      <BottomNav />

      {/* Modals and Sheets */}
      <ReservationModal />
      <ReservationSuccessModal />
      <FilterModal />
      <UserProfileModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ParkingProvider>
      <AppContent />
    </ParkingProvider>
  );
};

export default App;
