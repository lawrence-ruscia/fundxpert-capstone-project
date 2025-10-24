import {
  Award,
  Briefcase,
  ClipboardList,
  FileCheck,
  Users,
} from 'lucide-react';

type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

interface HRRoleBadgeProps {
  hrRole:
    | 'BenefitsAssistant'
    | 'BenefitsOfficer'
    | 'DeptHead'
    | 'MgmtApprover'
    | 'GeneralHR';
  size?: BadgeSize;
  className?: string;
  showIcon?: boolean;
  showLabel?: boolean;
}

export const HRRoleBadge = ({
  hrRole,
  size = 'md',
  className = '',
  showIcon = true,
  showLabel = true,
}: HRRoleBadgeProps) => {
  const hrRoleConfig = {
    BenefitsAssistant: {
      icon: ClipboardList,
      label: 'Benefits Assistant',
      shortLabel: 'Benefits Assistant',
      className: 'border-cyan-300 bg-cyan-50 text-cyan-900',
      description: 'Benefits Administration Support',
    },
    BenefitsOfficer: {
      icon: Award,
      label: 'Benefits Officer',
      shortLabel: 'Benefits Officer',
      className: 'border-blue-300 bg-blue-50 text-blue-900',
      description: 'Benefits Program Management',
    },
    DeptHead: {
      icon: Users,
      label: 'Department Head',
      shortLabel: 'Dept. Head',
      className: 'border-violet-300 bg-violet-50 text-violet-900',
      description: 'Departmental Leadership',
    },
    MgmtApprover: {
      icon: FileCheck,
      label: 'Management Approver',
      shortLabel: 'Mgmt. Approver',
      className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
      description: 'Authorization & Approval',
    },
    GeneralHR: {
      icon: Briefcase,
      label: 'General HR',
      shortLabel: 'General HR',
      className: 'border-indigo-300 bg-indigo-50 text-indigo-900',
      description: 'Human Resources Operations',
    },
  };

  const sizeConfig = {
    xs: {
      container: 'gap-1 px-1.5 py-0.5 text-xs rounded',
      icon: 'h-3 w-3',
      useShortLabel: false,
    },
    sm: {
      container: 'gap-1.5 px-2 py-1 text-xs rounded-md',
      icon: 'h-3.5 w-3.5',
      useShortLabel: false,
    },
    md: {
      container: 'gap-2 px-3 py-1.5 text-xs rounded-lg',
      icon: 'h-4 w-4',
      useShortLabel: false,
    },
    lg: {
      container: 'gap-2.5 px-4 py-2 text-sm rounded-lg',
      icon: 'h-5 w-5',
      useShortLabel: false,
    },
  };

  const config = hrRoleConfig[hrRole];
  if (!config) return null;

  const Icon = config.icon;
  const sizes = sizeConfig[size];
  const label = sizes.useShortLabel ? config.shortLabel : config.label;

  return (
    <span
      className={`inline-flex items-center border font-semibold tracking-wide ${sizes.container} ${config.className} ${className}`}
    >
      {showIcon && <Icon className={sizes.icon} />}
      {showLabel && label}
    </span>
  );
};
