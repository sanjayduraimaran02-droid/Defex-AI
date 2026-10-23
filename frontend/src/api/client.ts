import axios from 'axios';
import {
  User,
  Part,
  Machine,
  Inspection,
  Alert,
  HardwareStatus,
  InterlockEvent,
  DashboardStats,
  TrendDataPoint,
} from '../types';
import {
  mockUsers,
  mockParts,
  mockMachines,
  mockInspections,
  mockAlerts,
  mockHardwareStatus,
  getMockDashboardStats,
  getMockTrend,
  getMockDefectDistribution,
  generateMockCsv,
  handleMockCreateInspection,
  handleMockReviewInspection,
  handleMockDeleteInspection,
  triggerMockEmergencyStop,
  resetMockInterlock,
} from './mockData';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Inject Bearer token if present in localStorage
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('defex_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Offline detection flag
let isBackendOffline = false;

export function getIsBackendOffline(): boolean {
  return isBackendOffline;
}

/**
 * Check if an error indicates backend is down / unreachable / 503 proxy error
 */
function isNetworkOrOfflineError(err: any): boolean {
  if (!err) return false;
  if (
    err.code === 'ERR_NETWORK' ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'ECONNABORTED' ||
    err.message === 'Network Error' ||
    err.message?.includes('timeout')
  ) {
    return true;
  }
  if (!err.response) return true;
  if (
    err.response.status === 502 ||
    err.response.status === 503 ||
    err.response.status === 504
  ) {
    return true;
  }
  if (err.response.data?.offline_fallback) {
    return true;
  }
  return false;
}

/**
 * Executes an API request and falls back to mock data seamlessly if the backend is offline.
 */
async function withFallback<T>(
  requestFn: () => Promise<T>,
  fallbackFn: () => T | Promise<T>
): Promise<T> {
  try {
    const result = await requestFn();
    isBackendOffline = false;
    return result;
  } catch (err: any) {
    if (isNetworkOrOfflineError(err)) {
      if (!isBackendOffline) {
        console.warn(
          '[Defex AI] Backend server unreachable. Gracefully switching to offline local simulation mode.'
        );
      }
      isBackendOffline = true;
      return await fallbackFn();
    }
    throw err;
  }
}

export const api = {
  // Auth
  auth: {
    login: async (username_or_email: string, _password: string) => {
      return withFallback(
        async () => {
          const res = await client.post<{ access_token: string; token_type: string; user: User }>(
            '/auth/login',
            { username_or_email, password: _password }
          );
          return res.data;
        },
        () => {
          let user = Object.values(mockUsers).find(
            (u) => u.username === username_or_email || u.email === username_or_email
          );
          if (!user) {
            if (username_or_email.includes('operator')) user = mockUsers.operator;
            else if (username_or_email.includes('inspector')) user = mockUsers.quality_inspector;
            else user = mockUsers.administrator;
          }
          return {
            access_token: 'mock-token-' + user.role,
            token_type: 'bearer',
            user,
          };
        }
      );
    },
    switchDemoRole: async (role: string) => {
      return withFallback(
        async () => {
          const res = await client.post<{ access_token: string; token_type: string; user: User }>(
            `/auth/demo-switch/${role}`
          );
          return res.data;
        },
        () => {
          const user = mockUsers[role] || mockUsers.administrator;
          return {
            access_token: 'mock-token-' + role,
            token_type: 'bearer',
            user,
          };
        }
      );
    },
    me: async () => {
      return withFallback(
        async () => {
          const res = await client.get<User>('/auth/me');
          return res.data;
        },
        () => {
          const token = localStorage.getItem('defex_token');
          if (token && token.includes('operator')) return mockUsers.operator;
          if (token && token.includes('inspector')) return mockUsers.quality_inspector;
          return mockUsers.administrator;
        }
      );
    },
  },

  // Parts
  parts: {
    list: async () => {
      return withFallback(
        async () => {
          const res = await client.get<Part[]>('/parts');
          return res.data;
        },
        () => [...mockParts]
      );
    },
    get: async (id: number) => {
      return withFallback(
        async () => {
          const res = await client.get<Part>(`/parts/${id}`);
          return res.data;
        },
        () => mockParts.find((p) => p.id === id) || mockParts[0]
      );
    },
    create: async (data: Partial<Part>) => {
      return withFallback(
        async () => {
          const res = await client.post<Part>('/parts', data);
          return res.data;
        },
        () => {
          const newPart: Part = {
            id: Date.now(),
            code: data.code || `PRT-NEW-${mockParts.length + 1}`,
            name: data.name || 'New Industrial Component',
            description: data.description || null,
            material: data.material || null,
            defect_classes: data.defect_classes || ['crack', 'porosity', 'scratch', 'burr'],
            nominal_dimensions: data.nominal_dimensions || { length: 150.0, width: 80.0, height: 45.0, unit: 'mm' },
            tolerances: data.tolerances || { length: 0.05, width: 0.05, height: 0.08 },
            cad_reference: data.cad_reference || null,
            sample_image_url: null,
            is_active: true,
            created_at: new Date().toISOString(),
          };
          mockParts.unshift(newPart);
          return newPart;
        }
      );
    },
    update: async (id: number, data: Partial<Part>) => {
      return withFallback(
        async () => {
          const res = await client.put<Part>(`/parts/${id}`, data);
          return res.data;
        },
        () => {
          const idx = mockParts.findIndex((p) => p.id === id);
          if (idx !== -1) {
            mockParts[idx] = { ...mockParts[idx], ...data };
            return mockParts[idx];
          }
          return { ...mockParts[0], ...data };
        }
      );
    },
    delete: async (id: number) => {
      return withFallback(
        async () => {
          const res = await client.delete(`/parts/${id}`);
          return res.data;
        },
        () => {
          const idx = mockParts.findIndex((p) => p.id === id);
          if (idx !== -1) mockParts.splice(idx, 1);
          return { success: true };
        }
      );
    },
  },

  // Machines
  machines: {
    list: async () => {
      return withFallback(
        async () => {
          const res = await client.get<Machine[]>('/machines');
          return res.data;
        },
        () => [...mockMachines]
      );
    },
    get: async (id: number) => {
      return withFallback(
        async () => {
          const res = await client.get<Machine>(`/machines/${id}`);
          return res.data;
        },
        () => mockMachines.find((m) => m.id === id) || mockMachines[0]
      );
    },
    create: async (data: Partial<Machine>) => {
      return withFallback(
        async () => {
          const res = await client.post<Machine>('/machines', data);
          return res.data;
        },
        () => {
          const newMachine: Machine = {
            id: Date.now(),
            name: data.name || 'New Hardware Inspection Cell',
            code: data.code || `CELL-0${mockMachines.length + 1}-OPTIC`,
            status: data.status || 'CONNECTED',
            station: data.station || 'Line 3 Quality Bay',
            machine_type: data.machine_type || 'camera_station',
            ip_address: data.ip_address || '192.168.1.130',
            protocol: data.protocol || 'GigE Vision / OPC-UA',
            telemetry: data.telemetry || { temperature_c: 30.5, status: 'NORMAL' },
            is_active: true,
            last_heartbeat: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };
          mockMachines.push(newMachine);
          return newMachine;
        }
      );
    },
    update: async (id: number, data: Partial<Machine>) => {
      return withFallback(
        async () => {
          const res = await client.put<Machine>(`/machines/${id}`, data);
          return res.data;
        },
        () => {
          const idx = mockMachines.findIndex((m) => m.id === id);
          if (idx !== -1) {
            mockMachines[idx] = { ...mockMachines[idx], ...data };
            return mockMachines[idx];
          }
          return { ...mockMachines[0], ...data };
        }
      );
    },
    heartbeat: async (id: number) => {
      return withFallback(
        async () => {
          const res = await client.post<Machine>(`/machines/${id}/heartbeat`);
          return res.data;
        },
        () => {
          const m = mockMachines.find((m) => m.id === id);
          if (m) {
            m.last_heartbeat = new Date().toISOString();
            return m;
          }
          return mockMachines[0];
        }
      );
    },
    toggleStatus: async (id: number, new_status: string) => {
      return withFallback(
        async () => {
          const res = await client.post<{ id: number; status: string }>(
            `/machines/${id}/toggle-status`,
            null,
            { params: { new_status } }
          );
          return res.data;
        },
        () => {
          const m = mockMachines.find((m) => m.id === id);
          if (m) m.status = new_status as any;
          return { id, status: new_status };
        }
      );
    },
  },

  // Inspections
  inspections: {
    create: async (formData: FormData) => {
      return withFallback(
        async () => {
          const res = await client.post<Inspection>('/inspections', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return res.data;
        },
        () => handleMockCreateInspection(formData)
      );
    },
    list: async (params?: {
      outcome?: string;
      part_id?: number;
      machine_id?: number;
      reviewed?: boolean;
      limit?: number;
    }) => {
      return withFallback(
        async () => {
          const res = await client.get<Inspection[]>('/inspections', { params });
          return res.data;
        },
        () => {
          let list = [...mockInspections];
          if (params?.outcome && params.outcome !== 'ALL') {
            list = list.filter((i) => i.outcome === params.outcome);
          }
          if (params?.part_id) {
            list = list.filter((i) => i.part_id === params.part_id);
          }
          if (params?.machine_id) {
            list = list.filter((i) => i.machine_id === params.machine_id);
          }
          if (params?.reviewed !== undefined) {
            list = list.filter((i) => i.reviewed === params.reviewed);
          }
          if (params?.limit) {
            list = list.slice(0, params.limit);
          }
          return list;
        }
      );
    },
    getQueue: async () => {
      return withFallback(
        async () => {
          const res = await client.get<Inspection[]>('/inspections/queue');
          return res.data;
        },
        () =>
          mockInspections.filter(
            (i) => (i.outcome === 'UNCERTAIN' || (i.outcome === 'FAIL' && i.confidence < 0.85)) && !i.reviewed
          )
      );
    },
    get: async (id: number) => {
      return withFallback(
        async () => {
          const res = await client.get<Inspection>(`/inspections/${id}`);
          return res.data;
        },
        () => {
          const found = mockInspections.find((i) => i.id === id);
          if (found) return found;
          return {
            ...mockInspections[0],
            id,
          };
        }
      );
    },
    review: async (id: number, decision: 'PASS' | 'FAIL', notes: string) => {
      return withFallback(
        async () => {
          const res = await client.post<Inspection>(`/inspections/${id}/review`, {
            decision,
            notes,
          });
          return res.data;
        },
        () => handleMockReviewInspection(id, decision, notes)
      );
    },
    delete: async (id: number) => {
      return withFallback(
        async () => {
          const res = await client.delete<{ message: string }>(`/inspections/${id}`);
          return res.data;
        },
        () => handleMockDeleteInspection(id)
      );
    },
  },

  // Alerts
  alerts: {
    list: async (params?: { severity?: string; is_resolved?: boolean; is_read?: boolean }) => {
      return withFallback(
        async () => {
          const res = await client.get<Alert[]>('/alerts', { params });
          return res.data;
        },
        () => {
          let list = [...mockAlerts];
          if (params?.severity && params.severity !== 'ALL') {
            list = list.filter((a) => a.severity === params.severity);
          }
          if (params?.is_resolved !== undefined) {
            list = list.filter((a) => a.is_resolved === params.is_resolved);
          }
          if (params?.is_read !== undefined) {
            list = list.filter((a) => a.is_read === params.is_read);
          }
          return list;
        }
      );
    },
    markRead: async (id: number) => {
      return withFallback(
        async () => {
          const res = await client.post<Alert>(`/alerts/${id}/read`);
          return res.data;
        },
        () => {
          const a = mockAlerts.find((item) => item.id === id);
          if (a) a.is_read = true;
          return a || mockAlerts[0];
        }
      );
    },
    resolve: async (id: number) => {
      return withFallback(
        async () => {
          const res = await client.post<Alert>(`/alerts/${id}/resolve`);
          return res.data;
        },
        () => {
          const a = mockAlerts.find((item) => item.id === id);
          if (a) {
            a.is_resolved = true;
            a.resolved_at = new Date().toISOString();
          }
          return a || mockAlerts[0];
        }
      );
    },
    resolveAll: async () => {
      return withFallback(
        async () => {
          const res = await client.post<{ message: string }>('/alerts/resolve-all');
          return res.data;
        },
        () => {
          mockAlerts.forEach((a) => {
            a.is_resolved = true;
            a.resolved_at = new Date().toISOString();
          });
          return { message: 'All alerts marked as resolved' };
        }
      );
    },
    create: async (data: { title: string; message: string; severity?: 'CRITICAL' | 'WARNING' | 'INFO'; machine_id?: number | null }) => {
      return withFallback(
        async () => {
          const res = await client.post<Alert>('/alerts', data);
          return res.data;
        },
        () => {
          const newAlert: Alert = {
            id: Date.now(),
            title: data.title,
            message: data.message,
            severity: data.severity || 'INFO',
            machine_id: data.machine_id || null,
            is_read: false,
            is_resolved: false,
            created_at: new Date().toISOString(),
          };
          mockAlerts.unshift(newAlert);
          return newAlert;
        }
      );
    },
  },

  // Interlock
  interlock: {
    getStatus: async () => {
      return withFallback(
        async () => {
          const res = await client.get<HardwareStatus>('/interlock/status');
          return res.data;
        },
        () => ({ ...mockHardwareStatus })
      );
    },
    emergencyStop: async (reason?: string, machine_id?: number) => {
      return withFallback(
        async () => {
          const res = await client.post('/interlock/emergency-stop', { reason, machine_id });
          return res.data;
        },
        () => triggerMockEmergencyStop(reason, machine_id)
      );
    },
    reset: async (machine_id?: number) => {
      return withFallback(
        async () => {
          const res = await client.post('/interlock/reset', { machine_id });
          return res.data;
        },
        () => resetMockInterlock(machine_id)
      );
    },
    getEvents: async () => {
      return withFallback(
        async () => {
          const res = await client.get<InterlockEvent[]>('/interlock/events');
          return res.data;
        },
        () => [...mockHardwareStatus.recent_events]
      );
    },
  },

  // Physical Industrial Hardware Integration Layer
  hardware: {
    getStatus: async () => {
      return withFallback(
        async () => {
          const res = await client.get('/hardware/status');
          return res.data;
        },
        () => ({
          status: 'simulated',
          demo_mode: true,
          plc_connected: false,
          interlock_state: 'SIL3_ARMED',
          message: 'Frontend fallback: running in simulated mode',
        })
      );
    },
    postTelemetry: async (data: any) => {
      const res = await client.post('/hardware/telemetry', data);
      return res.data;
    },
    triggerInterlock: async (action: 'ESTOP' | 'RESET', reason?: string) => {
      const res = await client.post('/hardware/interlock', { action, reason });
      return res.data;
    },
    getVideoFeedUrl: () => '/api/hardware/video_feed',
  },

  // Real-Time Camera Vision Inspection System
  vision: {
    getFeedUrl: () => '/api/vision/feed',
    getStatus: async () => {
      return withFallback(
        async () => {
          const res = await client.get('/vision/status');
          return res.data;
        },
        () => ({
          source_type: 'simulated',
          target_part_code: 'PRT-BRK-01',
          target_part_name: 'Brake Caliper Housing',
          auto_inspect: true,
          outcome: 'PASS',
          status_text: 'PASSED - Cleared for CNC',
          match_pct: 95.4,
          confidence: 0.954,
          latency_ms: 14.2,
          fps: 29.8,
          defects: [],
          interlock_tripped: false,
          total_inspections: 248,
          defects_blocked: 14,
        })
      );
    },
    configure: async (config: {
      source_type?: string;
      device_index?: number;
      rtsp_url?: string;
      target_part_code?: string;
      auto_inspect?: boolean;
      simulate_defect_mode?: string;
    }) => {
      return withFallback(
        async () => {
          const res = await client.post('/vision/configure', config);
          return res.data;
        },
        () => ({
          status: 'CONFIGURED',
          ...config,
        })
      );
    },
    verify: async () => {
      return withFallback(
        async () => {
          const res = await client.post('/vision/verify');
          return res.data;
        },
        () => ({
          outcome: 'PASS',
          status_text: 'PASSED - Cleared for CNC',
          match_pct: 96.2,
          confidence: 0.962,
          latency_ms: 15.0,
        })
      );
    },
    resetInterlock: async () => {
      return withFallback(
        async () => {
          const res = await client.post('/vision/reset-interlock');
          return res.data;
        },
        () => ({
          status: 'RESET_COMPLETED',
          interlock_tripped: false,
        })
      );
    },
    getSnapshotUrl: () => '/api/vision/snapshot',
  },

  // Analytics
  analytics: {
    getDashboard: async () => {
      return withFallback(
        async () => {
          const res = await client.get<DashboardStats>('/analytics/dashboard');
          return res.data;
        },
        () => getMockDashboardStats()
      );
    },
    getTrend: async (days: number = 7) => {
      return withFallback(
        async () => {
          const res = await client.get<TrendDataPoint[]>('/analytics/trend', { params: { days } });
          return res.data;
        },
        () => getMockTrend(days)
      );
    },
    getDefects: async () => {
      return withFallback(
        async () => {
          const res = await client.get<{ name: string; count: number }[]>('/analytics/defect-distribution');
          return res.data;
        },
        () => getMockDefectDistribution()
      );
    },
    getExportUrl: (outcome?: string) => {
      if (isBackendOffline) {
        return 'data:text/csv;charset=utf-8,' + encodeURIComponent(generateMockCsv(outcome));
      }
      return `/api/analytics/export-csv${outcome ? `?outcome=${outcome}` : ''}`;
    },
  },
};
