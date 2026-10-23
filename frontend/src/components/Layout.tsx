import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Scan,
  Inbox,
  Boxes,
  Cpu,
  AlertTriangle,
  FileBarChart2,
  AlertOctagon,
  Menu,
  X,
  UserCheck,
  Zap,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { api } from '../api/client';
import { EmergencyStopModal } from './EmergencyStopModal';
import { UserRole } from '../types';
import { useHardwareTelemetry } from '../hooks/useHardwareTelemetry';

export const Layout: React.FC = () => {
  const { user, role, switchRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [queueCount, setQueueCount] = useState<number>(0);
  const [alertCount, setAlertCount] = useState<number>(0);
  const [plcConnected, setPlcConnected] = useState<boolean>(true);
  const [isEstopModalOpen, setIsEstopModalOpen] = useState<boolean>(false);
  const [isEstopTripped, setIsEstopTripped] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Real-time hardware telemetry stream via WebSocket
  const {
    isConnected: isWsConnected,
    isLiveHardware,
    plcLatencyMs,
    interlockState,
  } = useHardwareTelemetry();

  const effectiveTripped = isEstopTripped || interlockState === 'HARD_STOP_TRIPPED';
  const effectivePlcConnected = isWsConnected ? true : plcConnected;

  // Poll hardware status & queue counts every 8 seconds
  const fetchTelemetry = async () => {
    try {
      const stats = await api.analytics.getDashboard();
      setQueueCount(stats.queue_count);
      setAlertCount(stats.open_alerts);

      const hw = await api.interlock.getStatus();
      setPlcConnected(hw.plc_connected);
      setIsEstopTripped(!hw.safety_circuit_ok);
    } catch {
      // Offline fallback handles state seamlessly
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 8000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      name: 'Inspection Station',
      path: '/inspection/new',
      icon: <Scan className="w-4 h-4" />,
      highlight: true,
    },
    {
      name: 'Triage Queue',
      path: '/queue',
      icon: <Inbox className="w-4 h-4" />,
      badge: queueCount > 0 ? queueCount : undefined,
      badgeColor: 'bg-[#F59E0B] text-white font-bold',
    },
    {
      name: 'Parts Catalog',
      path: '/parts',
      icon: <Boxes className="w-4 h-4" />,
    },
    {
      name: 'Machine Cells',
      path: '/machine-cells',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      name: 'Alerts & Events',
      path: '/alerts',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: alertCount > 0 ? alertCount : undefined,
      badgeColor: 'bg-[#EF4444] text-white font-bold',
    },
    {
      name: 'Reports & Export',
      path: '/reports',
      icon: <FileBarChart2 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="h-screen bg-[#F8F9FA] text-[#1A1A2E] flex flex-col font-sans overflow-hidden">
      {/* Top Workstation Navigation Bar - Reduced to 48px */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40 px-3 md:px-5 h-12 min-h-[48px] flex items-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between w-full mx-auto">
          {/* Logo & Reticle */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-[#6B7280] hover:text-[#1A1A2E] p-1 rounded-lg hover:bg-[#F8F9FA]"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <Link to="/dashboard" className="flex items-center space-x-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-xs">
                <Scan className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-sm font-bold tracking-tight text-[#1A1A2E] group-hover:text-[#2563EB] transition-colors">
                  Defex<span className="text-[#2563EB] ml-0.5">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                  Operations
                </span>
              </div>
            </Link>
          </div>

          {/* Telemetry Status Indicators - White Pill Backgrounds */}
          <div className="hidden lg:flex items-center space-x-2 text-xs">
            <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-full border border-[#E5E7EB] text-[#1A1A2E] shadow-2xs">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  effectivePlcConnected
                    ? isLiveHardware
                      ? 'bg-[#22C55E] animate-beacon'
                      : 'bg-[#3B82F6]'
                    : 'bg-[#EF4444]'
                }`}
              />
              <span className="text-[#6B7280] text-[11px] font-medium">PLC Interlock:</span>
              <span
                className={`text-[11px] font-semibold ${
                  effectivePlcConnected
                    ? isLiveHardware
                      ? 'text-[#15803D]'
                      : 'text-[#2563EB]'
                    : 'text-[#EF4444]'
                }`}
              >
                {effectivePlcConnected
                  ? `${isLiveHardware ? 'Online' : 'Simulated'} (${plcLatencyMs.toFixed(1)}ms)`
                  : 'Offline'}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-full border border-[#E5E7EB] text-[#1A1A2E] shadow-2xs">
              <Zap className={`w-3 h-3 ${effectiveTripped ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`} />
              <span className="text-[#6B7280] text-[11px] font-medium">Safety Circuit:</span>
              <span
                className={`text-[11px] font-semibold ${
                  effectiveTripped ? 'text-[#EF4444]' : 'text-[#15803D]'
                }`}
              >
                {effectiveTripped ? 'Tripped (STOP)' : 'SIL 3 Armed'}
              </span>
            </div>
          </div>

          {/* Right Action Cluster: E-STOP Button, Role Switcher */}
          <div className="flex items-center space-x-2">
            {/* Quick Emergency STOP Trigger Button - White Pill Background */}
            <button
              type="button"
              onClick={() => setIsEstopModalOpen(true)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-200 shadow-2xs focus:outline-none ${
                effectiveTripped
                  ? 'bg-white text-[#EF4444] border-2 border-[#EF4444] animate-soft-pulse focus:ring-2 focus:ring-red-100'
                  : 'bg-white hover:bg-rose-50 text-[#DC2626] border border-[#FECDD3] hover:border-[#DC2626]'
              }`}
            >
              <AlertOctagon className="w-3 h-3 text-[#DC2626]" />
              <span>{effectiveTripped ? 'E-STOP Active' : 'E-STOP'}</span>
            </button>

            {/* Role Switcher Dropdown */}
            <div className="flex items-center bg-white border border-[#E5E7EB] hover:border-slate-300 rounded-lg px-2 py-1 text-[11px] transition-colors shadow-2xs">
              <UserCheck className="w-3 h-3 text-[#6B7280] mr-1.5" />
              <select
                value={role}
                onChange={(e) => switchRole(e.target.value as UserRole)}
                className="bg-transparent text-[#1A1A2E] text-[11px] font-semibold focus:outline-none cursor-pointer pr-0.5"
              >
                <option value="administrator">Administrator</option>
                <option value="quality_inspector">Lead Inspector</option>
                <option value="operator">Station Operator</option>
              </select>
            </div>

            {/* Login / Auth Portal Link */}
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center px-2 py-1 rounded-lg bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#334155] text-[11px] font-semibold transition-colors shadow-2xs"
              title="Open Dedicated Sign-in Portal"
            >
              <span>Login Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar: Humanized Clean White with subtle border */}
        <aside className="hidden md:flex flex-col justify-between w-60 bg-white p-3 select-none border-r border-[#E5E7EB] shadow-[2px_0_8px_rgba(0,0,0,0.02)] h-full overflow-hidden">
          {/* Main Navigation Group */}
          <div className="flex flex-col min-h-0 flex-1">
            <div className="text-[10.5px] font-semibold text-[#6B7280] uppercase tracking-wider px-2.5 mb-2 shrink-0">
              Operations & Control
            </div>

            <nav className="space-y-0.5 flex-1 overflow-y-auto pr-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-[8px] text-[13px] transition-all duration-200 ${
                      isActive
                        ? 'bg-[#EEF2FF] text-[#4F46E5] font-semibold border-l-4 border-[#4F46E5]'
                        : 'text-[#6B7280] hover:text-[#1A1A2E] hover:bg-[#F8F9FA] font-medium border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={isActive ? 'text-[#4F46E5]' : 'text-[#6B7280]'}>
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Station Diagnostics Indicator - Compact */}
            <div className="mt-2 text-[11px] text-[#6B7280] space-y-1 bg-[#F8F9FA] rounded-[8px] p-2 border border-[#E5E7EB] shrink-0">
              <div className="flex justify-between items-center">
                <span>Workstation</span>
                <span className="text-[#1A1A2E] font-mono font-semibold bg-white border border-[#E5E7EB] px-1 py-0.2 rounded text-[10px]">
                  CELL-01-A
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Active User</span>
                <span className="text-[#4F46E5] font-semibold truncate max-w-[105px]">
                  {user?.full_name?.split(' ')[0] || user?.username || 'Admin'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>System Node</span>
                <span className="text-[#15803D] font-semibold flex items-center text-[10.5px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mr-1" />
                  Online (SIL 3)
                </span>
              </div>
            </div>
          </div>

          {/* Thin Divider Line (#E5E7EB) Separating Nav Items from Settings & Logout */}
          <div className="my-2 border-t border-[#E5E7EB] shrink-0" />

          {/* Pinned Bottom Actions: Settings & Logout (Always Visible at Bottom) */}
          <div className="mt-auto shrink-0 space-y-0.5">
            {/* Settings Item */}
            <Link
              to="/settings"
              className={`flex items-center space-x-2.5 px-2.5 py-1.5 rounded-[8px] text-[13px] transition-all duration-200 ${
                location.pathname === '/settings'
                  ? 'bg-[#EEF2FF] text-[#4F46E5] font-semibold border-l-4 border-[#4F46E5]'
                  : 'text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF] font-medium border-l-4 border-transparent'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>

            {/* Logout Item */}
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-[8px] text-[13px] text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2] font-medium border-l-4 border-transparent transition-all duration-200 text-left cursor-pointer group"
            >
              <LogOut className="w-4 h-4 text-[#6B7280] group-hover:text-[#EF4444] transition-colors" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="w-60 bg-white p-3 flex flex-col justify-between border-r border-[#E5E7EB] shadow-lg h-full">
              <div className="flex flex-col min-h-0 flex-1">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E7EB]">
                  <span className="font-semibold text-[#1A1A2E] text-xs">Navigation</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[#6B7280] hover:text-[#1A1A2E] p-1 rounded-[8px] transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <nav className="space-y-0.5 flex-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-[8px] text-[13px] transition-all duration-200 ${
                          isActive
                            ? 'bg-[#EEF2FF] text-[#4F46E5] font-semibold border-l-4 border-[#4F46E5]'
                            : 'text-[#6B7280] hover:text-[#1A1A2E] hover:bg-[#F8F9FA] font-medium border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          {item.icon}
                          <span>{item.name}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Thin Divider Line (#E5E7EB) Separating Nav Items from Settings & Logout */}
              <div className="my-2 border-t border-[#E5E7EB] shrink-0" />

              {/* Mobile Drawer Bottom Actions */}
              <div className="mt-auto shrink-0 space-y-0.5">
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2.5 px-2.5 py-1.5 rounded-[8px] text-[13px] transition-all duration-200 ${
                    location.pathname === '/settings'
                      ? 'bg-[#EEF2FF] text-[#4F46E5] font-semibold border-l-4 border-[#4F46E5]'
                      : 'text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF] font-medium border-l-4 border-transparent'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-[8px] text-[13px] text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2] font-medium border-l-4 border-transparent transition-all duration-200 text-left cursor-pointer group"
                >
                  <LogOut className="w-4 h-4 text-[#6B7280] group-hover:text-[#EF4444] transition-colors" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
            <div
              className="flex-1 bg-black/20 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
          </div>
        )}

        {/* Dynamic Route Content Area - Soft White #F8F9FA */}
        <main className="flex-1 overflow-y-auto p-3.5 md:p-5 bg-[#F8F9FA]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Emergency Stop / Circuit Reset Modal */}
      <EmergencyStopModal
        isOpen={isEstopModalOpen}
        onClose={() => setIsEstopModalOpen(false)}
        isTripped={effectiveTripped}
        onSuccess={() => {
          setIsEstopModalOpen(false);
          fetchTelemetry();
        }}
      />

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[12px] p-6 max-w-sm w-full border border-[#E5E7EB] text-left"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#EF4444] flex items-center justify-center border border-red-100 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1A2E]">Logout?</h3>
                <p className="text-[11.5px] text-[#6B7280]">
                  Sign out of {user?.full_name || user?.username || 'Defex AI'} session
                </p>
              </div>
            </div>

            <p className="text-[13px] text-[#6B7280] leading-relaxed">
              Are you sure you want to logout?
            </p>

            <div className="flex items-center justify-end space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-3.5 py-1.5 rounded-[8px] border border-[#E5E7EB] text-[#1A1A2E] text-xs font-semibold hover:bg-[#F8F9FA] transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold shadow-xs transition-all duration-200 flex items-center space-x-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
