'use client';

import { getIconByKey } from '@/constants/landingIcons';

interface LandingIconProps {
  iconKey: string;
  className?: string;
}

export function LandingIcon({ iconKey, className }: LandingIconProps) {
  if (!iconKey || typeof iconKey !== 'string') {
    return null;
  }

  const IconComponent = getIconByKey(iconKey);
  
  if (!IconComponent) {
    return null;
  }

  return <IconComponent className={className} />;
}

