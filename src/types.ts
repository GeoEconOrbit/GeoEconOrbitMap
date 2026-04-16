export interface NewsItem {
  titulo: string;
  desc: string;
  fuente: string;
  hora: string;
  urgente: boolean;
  coords?: [number, number];
  type?: 'attack' | 'breaking' | 'normal';
}

export interface Aircraft {
  icao: string;
  callsign: string;
  country: string;
  alt: number;
  speed: number;
  heading: number;
  isMilitary: boolean;
  coords: [number, number];
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  color: string;
}

export interface StrategicAsset {
  name: string;
  icon: string;
  value: string;
}

export interface LeaderData {
  name: string;
  flag: string;
  leader: string;
  title: string;
  party: string;
  since: string;
  gdp: string;
  growth?: string;
  debt?: string;
  inflation?: string;
  debt_gdp?: string;
  main_resource?: string;
  military_budget?: string;
  nuclear?: boolean;
  strategic_note?: string;
  allies?: string[];
  rivals?: string[];
}
