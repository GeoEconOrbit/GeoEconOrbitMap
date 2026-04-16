import { PLACE_COORDS } from '../constants';

export const jitter = (coords: [number, number], index: number): [number, number] => {
  const r = 0.05 * Math.sqrt(index);
  const theta = index * 2.39996; // Golden angle
  return [
    coords[0] + r * Math.cos(theta),
    coords[1] + r * Math.sin(theta)
  ];
};

export const findCoordsForNews = (title: string): [number, number] | null => {
  const lowerTitle = title.toLowerCase();
  for (const [place, coords] of Object.entries(PLACE_COORDS)) {
    if (lowerTitle.includes(place)) return coords;
  }
  // Broad region fallbacks
  if (lowerTitle.includes('middle east')) return [45, 25];
  if (lowerTitle.includes('europe')) return [15, 50];
  if (lowerTitle.includes('asia')) return [100, 35];
  if (lowerTitle.includes('africa')) return [20, 10];
  return null;
};
