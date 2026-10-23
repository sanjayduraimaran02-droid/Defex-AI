import { useState, useEffect, useRef, useCallback } from 'react';

export interface MachineLiveTelemetry {
  name: string;
  status: 'RUNNING' | 'IDLE' | 'FAULT' | 'SETUP_MODE' | 'OFFLINE';
  spindle_rpm: number;
  feed_rate_mmpm: number;
  vibration_g: number;
  temperature_c: number;
  uptime_pct: number;
  tool_wear_pct?: number;
  last_cycle_s?: number;
}

export interface TelemetryTickPayload {
  type: string;
  timestamp: string;
  plc_connected: boolean;
  plc_protocol: string;
  plc_latency_ms: number;
  interlock_state: 'ACTIVE_GO' | 'HOLD_ENGAGED' | 'HARD_STOP_TRIPPED';
  digital_outputs: Record<string, boolean>;
  machines: Record<string, MachineLiveTelemetry>;
  demo_mode?: boolean;
}

export interface HardwareEvent {
  type: string;
  timestamp: string;
  [key: string]: any;
}

export function useHardwareTelemetry() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLiveHardware, setIsLiveHardware] = useState<boolean>(false);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [plcProtocol, setPlcProtocol] = useState<string>('Modbus-TCP / OPC-UA');
  const [plcLatencyMs, setPlcLatencyMs] = useState<number>(8.4);
  const [interlockState, setInterlockState] = useState<'ACTIVE_GO' | 'HOLD_ENGAGED' | 'HARD_STOP_TRIPPED'>('ACTIVE_GO');
  const [digitalOutputs, setDigitalOutputs] = useState<Record<string, boolean>>({
    DO_0_GO: true,
    DO_1_HOLD: false,
    DO_2_STOP: false,
    DO_3_DIVERT: false,
    DO_4_ALARM_STROBE: false,
  });
  const [machineTelemetries, setMachineTelemetries] = useState<Record<string, MachineLiveTelemetry>>({});
  const [lastEvent, setLastEvent] = useState<HardwareEvent | null>(null);
  const [eventCounter, setEventCounter] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    // Try Vite proxy first (/ws/telemetry), fallback to direct ws://127.0.0.1:8000/ws/telemetry
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Ping initial hello
        ws.send(JSON.stringify({ action: 'PING', timestamp: Date.now() }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'telemetry_tick' || data.type === 'connection_established') {
            setIsLiveHardware(Boolean(data.plc_connected && !data.demo_mode));
            if (data.demo_mode !== undefined) setDemoMode(data.demo_mode);
            if (data.plc_protocol) setPlcProtocol(data.plc_protocol);
            if (data.plc_latency_ms !== undefined) setPlcLatencyMs(data.plc_latency_ms);
            if (data.interlock_state) setInterlockState(data.interlock_state);
            if (data.digital_outputs) setDigitalOutputs(data.digital_outputs);
            if (data.machines) setMachineTelemetries(data.machines);
          } else {
            // Push notification event (e.g. inspection_completed, interlock_tripped)
            setLastEvent(data);
            setEventCounter((c) => c + 1);

            if (data.type === 'interlock_tripped') {
              setInterlockState('HARD_STOP_TRIPPED');
              setDigitalOutputs((prev) => ({ ...prev, DO_0_GO: false, DO_2_STOP: true }));
            } else if (data.type === 'interlock_reset') {
              setInterlockState('ACTIVE_GO');
              setDigitalOutputs((prev) => ({ ...prev, DO_0_GO: true, DO_2_STOP: false }));
            }
          }
        } catch {}
      };

      ws.onerror = () => {
        setIsConnected(false);
        setIsLiveHardware(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsLiveHardware(false);
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch {
      setIsConnected(false);
      reconnectTimeoutRef.current = window.setTimeout(connect, 4000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const triggerEStop = (reason: string = 'Manual Dashboard Emergency STOP') => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'TRIGGER_ESTOP', reason }));
    }
  };

  const resetInterlock = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'RESET_INTERLOCK' }));
    }
  };

  return {
    isConnected,
    isLiveHardware,
    demoMode,
    plcProtocol,
    plcLatencyMs,
    interlockState,
    digitalOutputs,
    machineTelemetries,
    lastEvent,
    eventCounter,
    triggerEStop,
    resetInterlock,
  };
}
