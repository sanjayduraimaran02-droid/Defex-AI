import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { NewInspection } from './pages/NewInspection';
import { InspectionDetail } from './pages/InspectionDetail';
import { ReviewQueue } from './pages/ReviewQueue';
import { PartsCatalog } from './pages/PartsCatalog';
import { MachineCellsPage } from './pages/MachineCellsPage';
import { MachineProgramPage } from './pages/MachineProgramPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="inspection/new" element={<NewInspection />} />
              <Route path="inspection-station" element={<NewInspection />} />
              <Route path="inspection/:id" element={<InspectionDetail />} />
              <Route path="queue" element={<ReviewQueue />} />
              <Route path="triage-queue" element={<Navigate to="/queue" replace />} />
              <Route path="parts" element={<PartsCatalog />} />
              <Route path="machines" element={<Navigate to="/machine-cells" replace />} />
              <Route path="machine-cells" element={<MachineCellsPage />} />
              <Route path="machine-cells/:machineId/program" element={<MachineProgramPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
