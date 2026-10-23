import React from 'react';
import { CheckCircle2, AlertCircle, HelpCircle, AlertTriangle } from 'lucide-react';
import { InspectionOutcome } from '../types';

interface StatusBadgeProps {
  status: InspectionOutcome | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  pulsing?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  pulsing = false,
}) => {
  const normalized = (status || '').toUpperCase();

  const configs: Record<
    string,
    {
      label: string;
      bg: string;
      text: string;
      border: string;
      dotColor: string;
      icon: React.ReactNode;
    }
  > = {
    PASS: {
      label: 'Pass',
      bg: 'bg-white hover:bg-emerald-50/50 shadow-2xs',
      text: 'text-[#15803D]',
      border: 'border-[#BBF7D0]',
      dotColor: 'bg-[#22C55E]',
      icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-[#22C55E]" />,
    },
    FAIL: {
      label: 'Fail',
      bg: 'bg-white hover:bg-rose-50/50 shadow-2xs',
      text: 'text-[#B91C1C]',
      border: 'border-[#FECACA]',
      dotColor: 'bg-[#EF4444]',
      icon: <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-[#EF4444]" />,
    },
    UNCERTAIN: {
      label: 'Uncertain',
      bg: 'bg-white hover:bg-amber-50/50 shadow-2xs',
      text: 'text-[#B45309]',
      border: 'border-[#FDE68A]',
      dotColor: 'bg-[#F59E0B]',
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-[#F59E0B]" />,
    },
    BORDERLINE: {
      label: 'Borderline',
      bg: 'bg-white hover:bg-amber-50/50 shadow-2xs',
      text: 'text-[#B45309]',
      border: 'border-[#FDE68A]',
      dotColor: 'bg-[#F59E0B]',
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-[#F59E0B]" />,
    },
  };

  const config = configs[normalized] || {
    label: normalized || 'Unknown',
    bg: 'bg-slate-100 hover:bg-slate-200/70',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dotColor: 'bg-slate-500',
    icon: <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-slate-500" />,
  };

  const sizeClasses = {
    sm: 'text-[11px] font-semibold px-2 py-0.5',
    md: 'text-xs font-semibold px-2.5 py-1',
    lg: 'text-sm font-bold px-3.5 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors duration-150 tracking-normal ${sizeClasses[size]} ${config.bg} ${config.text} ${config.border} ${
        pulsing ? 'animate-soft-pulse' : ''
      }`}
    >
      {showIcon ? (
        config.icon
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} mr-1.5`} />
      )}
      <span>{config.label}</span>
    </span>
  );
};
