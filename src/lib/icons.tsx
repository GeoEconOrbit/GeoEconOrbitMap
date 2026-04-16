export const SHIP_ICONS = {
  CARGO: `
    <svg viewBox="0 0 100 60" class="w-full h-full fill-none stroke-current stroke-[2.5]">
      <path d="M10 40 L90 40 L80 55 L20 55 Z" />
      <rect x="25" y="25" width="12" height="15" />
      <rect x="40" y="25" width="12" height="15" />
      <rect x="55" y="25" width="12" height="15" />
      <path d="M75 20 L85 20 L85 40 L75 40 Z" />
      <path d="M78 15 L78 20" />
    </svg>
  `,
  WARSHIP: `
    <svg viewBox="0 0 100 60" class="w-full h-full fill-none stroke-current stroke-[2.5]">
      <path d="M10 45 L90 45 L85 55 L15 55 Z" />
      <path d="M30 45 L30 35 L50 35 L55 45" />
      <path d="M50 35 L50 25 L65 25 L70 45" />
      <circle cx="40" cy="20" r="3" />
      <path d="M40 17 L40 10" />
      <path d="M20 45 L25 40 L35 40" />
    </svg>
  `,
  CARRIER: `
    <svg viewBox="0 0 100 60" class="w-full h-full fill-none stroke-current stroke-[2.5]">
      <path d="M5 40 L95 40 L90 55 L10 55 Z" />
      <path d="M65 40 L65 20 L85 20 L85 40" />
      <path d="M70 20 L70 10 L80 10 L80 20" />
      <path d="M20 35 L35 35 M45 35 L60 35" />
      <path d="M25 30 L30 35 L20 35 Z" />
      <path d="M50 30 L55 35 L45 35 Z" />
    </svg>
  `,
  FISHING: `
    <svg viewBox="0 0 100 60" class="w-full h-full fill-none stroke-current stroke-[2.5]">
      <path d="M20 45 L80 45 L75 55 L25 55 Z" />
      <path d="M50 45 L50 25 L70 25 L70 45" />
      <path d="M35 45 L35 15" />
      <path d="M35 20 L50 35" />
      <circle cx="30" cy="30" r="2" />
    </svg>
  `
};

export const SATELLITE_ICONS = {
  COMM: `
    <svg viewBox="0 0 24 24" class="w-full h-full fill-none stroke-current stroke-2">
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" />
    </svg>
  `,
  OPTICAL: `
    <svg viewBox="0 0 24 24" class="w-full h-full fill-none stroke-current stroke-2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  `,
  RADAR: `
    <svg viewBox="0 0 24 24" class="w-full h-full fill-none stroke-current stroke-2">
      <path d="M19.07 4.93a10 10 0 0 0-14.14 0" />
      <path d="M15.53 8.47a5 5 0 0 0-7.07 0" />
      <circle cx="12" cy="12" r="1" />
      <path d="M12 12l5 5" />
    </svg>
  `,
  GENERIC: `
    <svg viewBox="0 0 24 24" class="w-full h-full fill-none stroke-current stroke-2">
      <rect x="9" y="9" width="6" height="6" />
      <path d="M2 12h7M15 12h7M12 2v7M12 15v7" />
    </svg>
  `
};

export const getShipIcon = (type: string, color: string = 'currentColor') => {
  const t = type.toUpperCase();
  let svg = SHIP_ICONS.CARGO;
  if (t.includes('CARRIER')) svg = SHIP_ICONS.CARRIER;
  else if (t.includes('DESTROYER') || t.includes('FRIGATE') || t.includes('WARSHIP') || t.includes('NAVY')) svg = SHIP_ICONS.WARSHIP;
  else if (t.includes('FISHING') || t.includes('TRAWLER') || t.includes('TUG')) svg = SHIP_ICONS.FISHING;
  
  return svg.replaceAll('stroke-current', `stroke="${color}"`);
};

export const getSatelliteIcon = (type: string, color: string = 'currentColor') => {
  const t = type.toUpperCase();
  let svg = SATELLITE_ICONS.GENERIC;
  
  if (t.includes('OPTICAL') || t.includes('IMAGING')) svg = SATELLITE_ICONS.OPTICAL;
  else if (t.includes('RADAR') || t.includes('SAR')) svg = SATELLITE_ICONS.RADAR;
  else if (t.includes('ELINT') || t.includes('COMM') || t.includes('SIGNAL')) svg = SATELLITE_ICONS.COMM;
  
  return svg.replaceAll('stroke-current', `stroke="${color}"`);
};
