import React from 'react';
import {
  Cog,
  Disc,
  Flame,
  Bot,
  Ruler,
  Scan,
  Layers,
  Workflow,
  Boxes,
  Zap,
} from 'lucide-react';
import { ManufacturingMachineType } from '../../types/machineCells';

interface MachineTypeIconProps {
  type: ManufacturingMachineType;
  className?: string;
}

export const MachineTypeIcon: React.FC<MachineTypeIconProps> = ({ type, className = 'w-5 h-5' }) => {
  switch (type) {
    case 'CNC_MILLING':
      return <Cog className={className} />;
    case 'CNC_LATHE':
      return <Disc className={className} />;
    case 'LASER_CUTTING':
      return <Flame className={className} />;
    case 'ROBOTIC_WELDING':
      return <Bot className={className} />;
    case 'CMM_INSPECTION':
      return <Ruler className={className} />;
    case 'OPTICAL_3D_SCANNER':
      return <Scan className={className} />;
    case 'PRESS_BRAKE':
      return <Layers className={className} />;
    case 'CONVEYOR_ASSEMBLY':
      return <Workflow className={className} />;
    case 'INJECTION_MOLDING':
      return <Boxes className={className} />;
    case 'EDM_MACHINE':
      return <Zap className={className} />;
    default:
      return <Cog className={className} />;
  }
};
