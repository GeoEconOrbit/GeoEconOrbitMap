import { NewsItem, Aircraft } from '../types';

export const fetchNews = async (): Promise<NewsItem[]> => {
  try {
    const res = await fetch('https://loved-wallaby-71460.upstash.io/lrange/geobot:noticias_mapa/0/249', {
      headers: { 'Authorization': 'Bearer Ap6mAAIjcDE1ZGUwN2M1ZWEyMTE0YmY0YmE0YmUyM2M1YmI5N2I0MHAxMA' }
    });
    if (res.ok) return await res.json();
    
    const gdeltRes = await fetch('/api/gdelt');
    if (gdeltRes.ok) {
      const data = await gdeltRes.json();
      return (data.articles || []).map((a: any) => ({
        titulo: a.title,
        desc: a.source,
        fuente: 'GDELT INTELLIGENCE',
        hora: new Date().toLocaleTimeString(),
        urgente: a.title.toLowerCase().includes('attack') || a.title.toLowerCase().includes('missile'),
        type: a.title.toLowerCase().includes('attack') ? 'attack' : 'normal'
      }));
    }
  } catch (e) {
    console.error('News service error:', e);
  }
  return [];
};

export const fetchAircraft = async (): Promise<Aircraft[]> => {
  try {
    const res = await fetch('/api/aircraft');
    if (res.ok) {
      const data = await res.json();
      return (data.states || []).map((s: any) => ({
        icao: s[0],
        callsign: s[1]?.trim() || 'UNKNOWN',
        country: s[2],
        alt: s[7] || 0,
        speed: s[9] || 0,
        heading: s[10] || 0,
        isMilitary: s[1]?.trim().match(/^(FORTE|RCH|LAGR|DUKE|HOMER|JAKE|B52|F16|F22|F35|K35|C17|C130|AE)/i) !== null,
        coords: [s[6], s[5]]
      })).filter((a: any) => a.coords[0] && a.coords[1]);
    }
  } catch (e) {
    console.error('Aircraft service error:', e);
  }
  return [];
};
