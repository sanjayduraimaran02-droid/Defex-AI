import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scan,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your workstation email or username.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const success = await login(email, password || 'password123');
    setSubmitting(false);

    if (success) {
      navigate('/dashboard');
    } else {
      setErrorMessage('Authentication rejected by industrial security gateway. Please verify your credentials.');
    }
  };

  const handleQuickLogin = async (demoEmail: string, roleName: string) => {
    setEmail(demoEmail);
    setPassword('DemoPass2026!');
    setErrorMessage(null);
    setSubmitting(true);

    const success = await login(demoEmail, 'DemoPass2026!');
    setSubmitting(false);

    if (success) {
      navigate('/dashboard');
    } else {
      setErrorMessage(`Failed to switch to ${roleName}.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-12 font-sans relative selection:bg-blue-600/20 selection:text-blue-700">
      {/* Subtle background ambient mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[440px] z-10">
        {/* Main Card */}
        <div
          className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-xl"
          style={{
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
          }}
        >
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#2563EB] text-white shadow-md shadow-blue-500/25 mb-3.5">
              <Scan className="w-6 h-6 text-white" />
            </div>

            <div className="flex items-center justify-center space-x-1.5 mb-1.5">
              <span className="text-xl font-bold tracking-tight text-[#0F172A]">
                Defex<span className="text-blue-600">AI</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                v1.0 SIL 3
              </span>
            </div>

            <h1 className="text-base font-bold text-[#0F172A]">
              Defex AI — Industrial Inspection Station
            </h1>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Sign in to access machine vision telemetry and triage controls
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#9F1239] flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-[#F43F5E] flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                Workstation Email / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. operator@defex.internal"
                  className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10 rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569]">
                  Security Passkey
                </label>
                <span className="text-[11px] text-slate-400">Default: any password</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10 rounded-lg pl-9 pr-9 py-2.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs tracking-wide rounded-lg px-[18px] py-[10px] shadow-[0_2px_4px_rgba(37,99,235,0.2)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{submitting ? 'Connecting to Workstation...' : 'Sign in to Workstation'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E2E8F0]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
              <span className="bg-white px-3 text-[#64748B]">
                Quick Demo Personas (1-Click Access)
              </span>
            </div>
          </div>

          {/* One-Click Demo Login Chips */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('operator@defex.internal', 'Demo Operator')}
              disabled={submitting}
              className="w-full p-2.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-left transition-all flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#0F172A] group-hover:text-blue-600 transition-colors">
                    Demo Operator
                  </div>
                  <div className="text-[10px] text-[#64748B] font-mono">operator@defex.internal</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Login →
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('inspector@defex.internal', 'Demo Quality Inspector')}
              disabled={submitting}
              className="w-full p-2.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-left transition-all flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#0F172A] group-hover:text-amber-600 transition-colors">
                    Demo Quality Inspector
                  </div>
                  <div className="text-[10px] text-[#64748B] font-mono">inspector@defex.internal</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Login →
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin@defex.internal', 'Demo Administrator')}
              disabled={submitting}
              className="w-full p-2.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-left transition-all flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#0F172A] group-hover:text-slate-900 transition-colors">
                    Demo Administrator
                  </div>
                  <div className="text-[10px] text-[#64748B] font-mono">admin@defex.internal</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Login →
              </span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 text-center text-[11px] text-[#94A3B8]">
          Defex AI Optical & Laser Metrology Safety Suite · Connected Station Node
        </div>
      </div>
    </div>
  );
};
