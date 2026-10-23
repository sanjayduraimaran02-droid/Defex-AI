import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Plus,
  AlertOctagon,
  Radio,
  X,
  Server,
} from 'lucide-react';
import { api } from '../api/client';
import { Machine, HardwareStatus } from '../types';
import { EmergencyStopModal } from '../components/EmergencyStopModal';

export const MachinesManager: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [hwStatus, setHwStatus] = useState<HardwareStatus | null>(null);
  const [isEstopOpen, setIsEstopOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Machine Form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [station, setStation] = useState('');
  const [machineType, setMachineType] = useState('camera_station');
  const [ipAddress, setIpAddress] = useState('192.168.1.105');
  const [protocol, setProtocol] = useState('GigE Vision / OPC-UA');

  const loadData = useCallback(async () => {
    try {
      const [machData, statusData] = await Promise.all([
        api.machines.list(),
        api.interlock.getStatus(),
      ]);
      setMachines(machData);
      setHwStatus(statusData);
    } catch (err) {
      console.error('Failed to load machine data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleHeartbeat = async (id: number) => {
    try {
      await api.machines.heartbeat(id);
      loadData();
    } catch (err) {
      console.error('Heartbeat ping failed:', err);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus =
      currentStatus === 'CONNECTED'
        ? 'FAULT'
        : currentStatus === 'FAULT'
        ? 'MAINTENANCE'
        : 'CONNECTED';
    await api.machines.toggleStatus(id, nextStatus);
    loadData();
  };

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.machines.create({
        name,
        code,
        station,
        machine_type: machineType as any,
        ip_address: ipAddress,
        protocol,
        status: 'CONNECTED',
      });
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Create machine failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Hardware Topology & Actuators</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Machine Stations & Interlocks</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage vision inspection cells, laser metrology stations, and hardware safety relay controllers.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsEstopOpen(true)}
            className="py-[10px] px-[18px] rounded-lg bg-[#FFF1F2] hover:bg-[#DC2626] text-[#DC2626] hover:text-white border border-[#FECDD3] hover:border-[#DC2626] font-semibold text-xs tracking-wide shadow-2xs flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-[#DC2626] group-hover:text-white" />
            <span>Emergency STOP / Reset</span>
          </button>

          <button
            onClick={() => {
              setCode(`CELL-0${machines.length + 1}-OPTIC`);
              setName(`Station Cell ${machines.length + 1}`);
              setStation(`Line 2 Station ${machines.length + 1}`);
              setIsAddModalOpen(true);
            }}
            className="py-[10px] px-[18px] rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs tracking-wide shadow-[0_2px_4px_rgba(37,99,235,0.2)] flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Cell</span>
          </button>
        </div>
      </div>

      {/* Safety Interlock Controller Hardware Telemetry Box */}
      {hwStatus && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A]">
                  Safety PLC Controller Telemetry
                </h3>
                <span className="text-xs text-slate-500">{hwStatus.controller_type}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full font-medium ${
                  hwStatus.safety_circuit_ok
                    ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                    : 'bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3] animate-soft-pulse'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    hwStatus.safety_circuit_ok ? 'bg-[#10B981]' : 'bg-[#F43F5E]'
                  }`}
                />
                {hwStatus.safety_circuit_ok ? 'Safety Circuit Armed (SIL 3)' : 'Safety Circuit Tripped (STOP)'}
              </span>
              <span className="text-slate-500 font-mono">
                Cycle: <strong className="text-[#0F172A]">{hwStatus.cycle_time_ms} ms</strong>
              </span>
            </div>
          </div>

          {/* Digital Output Relays Real-Time Pin Matrix */}
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Live Digital Output Relay Registers (DO Pin States):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {Object.entries(hwStatus.digital_outputs || {}).map(([pin, isHigh]) => (
              <div
                key={pin}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  isHigh
                    ? pin.includes('GO')
                      ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                      : pin.includes('HOLD')
                      ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                      : 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400">{pin.split('_')[0]}_{pin.split('_')[1]}</div>
                <div className="font-semibold text-xs mt-0.5">{pin.split('_').slice(2).join('_')}</div>
                <div className="text-[11px] font-mono font-bold mt-1">{isHigh ? '1 (HIGH)' : '0 (LOW)'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Machine Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {machines.map((m) => (
          <div
            key={m.id}
            className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 mt-0.5">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-medium text-blue-600 uppercase">
                      {m.code}
                    </span>
                    <h3 className="text-base font-semibold text-[#0F172A] mt-0.5">{m.name}</h3>
                    <div className="text-xs text-slate-500">{m.station}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(m.id, m.status)}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    m.status === 'CONNECTED'
                      ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0] hover:bg-[#D1FAE5]'
                      : m.status === 'FAULT'
                      ? 'bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3] animate-soft-pulse hover:bg-[#FFE4E6]'
                      : 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A] hover:bg-[#FEF3C7]'
                  }`}
                  title="Click to cycle status for simulation"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      m.status === 'CONNECTED'
                        ? 'bg-[#10B981]'
                        : m.status === 'FAULT'
                        ? 'bg-[#F43F5E]'
                        : 'bg-[#F59E0B]'
                    }`}
                  />
                  <span>{m.status}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/80 my-3 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans font-medium">Type</span>
                  <span className="font-semibold text-slate-700 capitalize">{m.machine_type.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans font-medium">IP / Bus</span>
                  <span className="font-semibold text-blue-600">{m.ip_address}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans font-medium">Protocol</span>
                  <span className="font-semibold text-slate-700">{m.protocol}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans font-medium">Heartbeat</span>
                  <span className="font-semibold text-slate-700">
                    {m.last_heartbeat ? new Date(m.last_heartbeat).toLocaleTimeString() : 'Active'}
                  </span>
                </div>
              </div>

              {m.telemetry && (
                <div className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider block mb-1">
                    Live Telemetry Sensors
                  </span>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px]">
                    {Object.entries(m.telemetry).map(([k, v]) => (
                      <span key={k}>
                        <span className="text-slate-400">{k}:</span> <strong className="text-slate-700">{String(v)}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between items-center text-xs">
              <span className="text-slate-400 text-[11px]">Fail-safe channel active</span>
              <button
                type="button"
                onClick={() => handleHeartbeat(m.id)}
                className="py-1.5 px-3 rounded-lg bg-[#475569] hover:bg-[#334155] text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors shadow-2xs"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Heartbeat Ping</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Machine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="bg-white border border-[#E2E8F0] rounded-[12px] max-w-lg w-full p-6 relative"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-[8px] hover:bg-slate-100 transition-all duration-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-[#0F172A] mb-4">
              Register New Inspection Cell
            </h3>

            <form onSubmit={handleCreateMachine} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold text-[11px] uppercase tracking-wider">Station Code / Identifier</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg p-2.5 text-[#0F172A] font-mono focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold text-[11px] uppercase tracking-wider">Machine Cell Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg p-2.5 text-[#0F172A] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold text-[11px] uppercase tracking-wider">Physical Location / Bay</label>
                <input
                  type="text"
                  required
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg p-2.5 text-[#0F172A] focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold text-[11px] uppercase tracking-wider">Station Type</label>
                  <select
                    value={machineType}
                    onChange={(e) => setMachineType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg p-2.5 text-[#0F172A] focus:outline-none transition-colors"
                  >
                    <option value="camera_station">Camera Station</option>
                    <option value="laser_station">Laser Station</option>
                    <option value="plc_controller">PLC Controller</option>
                    <option value="hybrid">Hybrid Station</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold text-[11px] uppercase tracking-wider">IP Address</label>
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg p-2.5 text-[#0F172A] font-mono focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold text-[11px] uppercase tracking-wider">Communication Protocol</label>
                <input
                  type="text"
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg p-2.5 text-[#0F172A] focus:outline-none transition-colors"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-[10px] px-[18px] rounded-lg bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#334155] font-semibold text-xs border border-[#E2E8F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-[10px] px-[18px] rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs transition-colors shadow-[0_2px_4px_rgba(37,99,235,0.2)]"
                >
                  Register Machine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Stop Modal */}
      <EmergencyStopModal
        isOpen={isEstopOpen}
        onClose={() => setIsEstopOpen(false)}
        isTripped={!hwStatus?.safety_circuit_ok}
        onSuccess={() => {
          setIsEstopOpen(false);
          loadData();
        }}
      />
    </div>
  );
};
