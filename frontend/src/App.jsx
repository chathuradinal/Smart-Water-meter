import React, { useState, useEffect } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { aquaticTheme } from './theme/aquaticTheme';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardView from './views/DashboardView';
import SnapshotHistoryView from './views/SnapshotHistoryView';
import CameraStudioView from './views/CameraStudioView';
import AiAnalyticsView from './views/AiAnalyticsView';
import AssistantView from './views/AssistantView';
import GuidanceView from './views/GuidanceView';

export default function App() {
  // Page state: 'app' (main dashboard) | 'login' (separate login page) | 'register' (separate register page)
  const [currentPage, setCurrentPage] = useState('app');
  // Navigation tab inside dashboard: 'overview' | 'snapshots' | 'camera' | 'ai_insights' | 'chat'
  const [activeTab, setActiveTab] = useState('overview');

  const [snapshotCount, setSnapshotCount] = useState(6);

  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('water_meter_user') || 'admin';
  });

  const [status, setStatus] = useState({
    current_reading_m3: 37.2468,
    flow_rate_lpm: 0.0,
    estimated_bill_lkr: 300.0,
    current_slab_rate_lkr: 60.0,
    fixed_charge_lkr: 300.0,
    consumed_period_units_m3: 0.0,
    is_leak_active: false,
    active_alerts: [],
    last_updated: ''
  });

  const [readings, setReadings] = useState([]);

  const handleLoginSuccess = (username) => {
    setCurrentUser(username);
    localStorage.setItem('water_meter_user', username);
    setCurrentPage('app');
    setActiveTab('overview');
  };

  const handleLogout = () => {
    setCurrentPage('login');
  };

  const fetchData = async () => {
    try {
      const [statusRes, readingsRes, snapsRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/readings?limit=25'),
        fetch('/api/snapshots?limit=50')
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }

      if (readingsRes.ok) {
        const readingsData = await readingsRes.json();
        setReadings(readingsData);
      }

      if (snapsRes.ok) {
        const snapsData = await snapsRes.json();
        setSnapshotCount(snapsData.length);
      }
    } catch (err) {
      console.error("Telemetry fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async (mode) => {
    try {
      await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      fetchData();
    } catch (err) {
      console.error("Simulation error:", err);
    }
  };

  const handleQuickCapture = async () => {
    try {
      await fetch('/api/snapshots/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'normal' })
      });
      fetchData();
    } catch (err) {
      console.error("Quick capture error:", err);
    }
  };

  return (
    <ConfigProvider theme={aquaticTheme}>
      <AntdApp>
        {/* ── Separate Page 1: Standalone Login Page ───────────────────────── */}
        {currentPage === 'login' && (
          <LoginPage 
            onLoginSuccess={handleLoginSuccess}
            onNavigateRegister={() => setCurrentPage('register')}
          />
        )}

        {/* ── Separate Page 2: Standalone Register Page ────────────────────── */}
        {currentPage === 'register' && (
          <RegisterPage 
            onRegisterSuccess={handleLoginSuccess}
            onNavigateLogin={() => setCurrentPage('login')}
          />
        )}

        {/* ── Main Application Dashboard with Sidebar Navigation ──────────── */}
        {currentPage === 'app' && (
          <AppLayout
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            onLogout={handleLogout}
            isLeakActive={status.is_leak_active}
            snapshotCount={snapshotCount}
            lastUpdated={status.last_updated}
            onQuickCapture={handleQuickCapture}
          >
            {/* View 1: Live Dashboard Overview */}
            {activeTab === 'overview' && (
              <DashboardView 
                status={status}
                readings={readings}
                onSimulate={handleSimulate}
                onNavigateSnapshots={() => setActiveTab('snapshots')}
                onNavigateGuidance={() => setActiveTab('guidance')}
              />
            )}

            {/* View 2: Dedicated Snapshot History Archive */}
            {activeTab === 'snapshots' && (
              <SnapshotHistoryView 
                onSnapshotCaptured={fetchData}
              />
            )}

            {/* View 3: Dedicated Camera Vision Studio */}
            {activeTab === 'camera' && (
              <CameraStudioView 
                onNavigateGuidance={() => setActiveTab('guidance')}
              />
            )}

            {/* View 4: Dedicated AI Diagnostics & Forecast */}
            {activeTab === 'ai_insights' && (
              <AiAnalyticsView 
                onNavigateGuidance={() => setActiveTab('guidance')}
              />
            )}

            {/* View 5: Dedicated Conversational RAG Assistant */}
            {activeTab === 'chat' && (
              <AssistantView 
                currentUser={currentUser}
                onOpenAuth={() => setCurrentPage('login')}
              />
            )}

            {/* View 6: Dedicated System Guidance & Hardware Operations Manual */}
            {activeTab === 'guidance' && (
              <GuidanceView />
            )}
          </AppLayout>
        )}
      </AntdApp>
    </ConfigProvider>
  );
}
