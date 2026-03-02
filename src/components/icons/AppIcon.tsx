import React from 'react';

export type AppIconName =
  | 'dashboard'
  | 'encoder'
  | 'crypto'
  | 'time'
  | 'regex'
  | 'formatter'
  | 'qrcode'
  | 'diff'
  | 'http'
  | 'network'
  | 'recipe'
  | 'globe'
  | 'sun'
  | 'moon'
  | 'alert'
  | 'close'
  | 'menuFold'
  | 'menuUnfold';

interface AppIconProps {
  name: AppIconName;
  size?: number;
  className?: string;
}

const BaseIcon: React.FC<{ size: number; className?: string; children: React.ReactNode }> = ({
  size,
  className,
  children,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

export const AppIcon: React.FC<AppIconProps> = ({ name, size = 16, className }) => {
  switch (name) {
    case 'dashboard':
      return (
        <BaseIcon size={size} className={className}>
          <rect x="4" y="4" width="7" height="7" />
          <rect x="13" y="4" width="7" height="7" />
          <rect x="4" y="13" width="7" height="7" />
          <rect x="13" y="13" width="7" height="7" />
        </BaseIcon>
      );
    case 'encoder':
      return (
        <BaseIcon size={size} className={className}>
          <path d="M9 6l-5 6 5 6" />
          <path d="M15 6l5 6-5 6" />
          <path d="M13 4l-2 16" />
        </BaseIcon>
      );
    case 'crypto':
      return (
        <BaseIcon size={size} className={className}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          <circle cx="12" cy="15.5" r="1.5" />
        </BaseIcon>
      );
    case 'time':
      return (
        <BaseIcon size={size} className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </BaseIcon>
      );
    case 'regex':
      return (
        <BaseIcon size={size} className={className}>
          <path d="M5 18l6-12 2 4 3-2 3 10" />
          <circle cx="7" cy="8" r="1" />
          <circle cx="17" cy="15" r="1" />
        </BaseIcon>
      );
    case 'formatter':
      return (
        <BaseIcon size={size} className={className}>
          <path d="M5 7h14" />
          <path d="M5 12h10" />
          <path d="M5 17h14" />
          <path d="M17 10l2 2-2 2" />
        </BaseIcon>
      );
    case 'qrcode':
      return (
        <BaseIcon size={size} className={className}>
          <rect x="4" y="4" width="6" height="6" />
          <rect x="14" y="4" width="6" height="6" />
          <rect x="4" y="14" width="6" height="6" />
          <path d="M14 14h2v2h-2z" />
          <path d="M18 14h2v6h-6v-2h4z" />
        </BaseIcon>
      );
    case 'diff':
      return (
        <BaseIcon size={size} className={className}>
          <path d="M7 7h10" />
          <path d="M7 17h10" />
          <path d="M11 4l-3 3 3 3" />
          <path d="M13 14l3 3-3 3" />
        </BaseIcon>
      );
    case 'http':
      return (
        <BaseIcon size={size} className={className}>
          <path d="M4 8h12" />
          <path d="M12 5l4 3-4 3" />
          <path d="M20 16H8" />
          <path d="M12 13l-4 3 4 3" />
        </BaseIcon>
      );
    case 'network':
    case 'globe':
      return (
        <BaseIcon size={size} className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a15 15 0 0 1 0 18" />
          <path d="M12 3a15 15 0 0 0 0 18" />
        </BaseIcon>
      );
    case 'recipe':
      return (
        <BaseIcon size={size} className={className}>
          <path d="M4 8h16l-2 4H6z" />
          <path d="M6 14h12l-1.5 4h-9z" />
          <path d="M8 5h8" />
        </BaseIcon>
      );
    case 'sun':
      return (
        <BaseIcon size={size} className={className}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3" />
          <path d="M12 19v3" />
          <path d="M2 12h3" />
          <path d="M19 12h3" />
          <path d="M5 5l2 2" />
          <path d="M17 17l2 2" />
          <path d="M19 5l-2 2" />
          <path d="M7 17l-2 2" />
        </BaseIcon>
      );
    case 'moon':
      return (
        <BaseIcon size={size} className={className}>
          <path d="M16 3a9 9 0 1 0 5 15A10 10 0 0 1 16 3z" />
        </BaseIcon>
      );
    case 'alert':
      return (
        <BaseIcon size={size} className={className}>
          <path d="M12 3l9 16H3z" />
          <path d="M12 9v5" />
          <path d="M12 17h.01" />
        </BaseIcon>
      );
    case 'close':
      return (
        <BaseIcon size={size} className={className}>
          <path d="M6 6l12 12" />
          <path d="M18 6l-12 12" />
        </BaseIcon>
      );
    case 'menuFold':
      return (
        <BaseIcon size={size} className={className}>
          <path d="M5 4v16" />
          <path d="M19 7l-5 5 5 5" />
          <path d="M9 7h3" />
          <path d="M9 12h3" />
          <path d="M9 17h3" />
        </BaseIcon>
      );
    case 'menuUnfold':
      return (
        <BaseIcon size={size} className={className}>
          <path d="M19 4v16" />
          <path d="M5 7l5 5-5 5" />
          <path d="M12 7h3" />
          <path d="M12 12h3" />
          <path d="M12 17h3" />
        </BaseIcon>
      );
    default:
      return null;
  }
};
