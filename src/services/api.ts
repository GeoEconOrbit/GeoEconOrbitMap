import { NewsItem, Aircraft } from '../types';

export const processIntel = (raw: any): NewsItem => {
  const text = (raw.titulo + ' ' + raw.desc).toLowerCase();
  
  let type: NewsItem['type'] = 'normal';
  let severity = 5;

  if (text.match(/nuclear|radiation|enrichment|warhead|iaea/)) {
    type = 'nuclear';
    severity = 10;
  } else if (text.match(/attack|strike|bomb|missile|killed|explosion|shelling|invasion|assault/)) {
    type = 'attack';
    severity = 8;
  } else if (text.match(/sanctions|oil|gold|inflation|gdp|imf|debt|currency/)) {
    type = 'economic';
    severity = 7;
  } else if (text.match(/election|coup|president|government|protest|resignation/)) {
    type = 'political';
    severity = 6;
  }

  return {
    ...raw,
    type,
    severity,
    urgente: severity >= 8
  };
};

export const fetchNews = async (): Promise<NewsItem[]> => {
  try {
    const gdeltRes = await fetch('/api/gdelt');
    if (gdeltRes.ok) {
      const data = await gdeltRes.json();
      return (data.articles || [])
        .filter((a: any) => {
          const nonEnglish = /[^\x00-\x7F]/.test(a.title);
          return !nonEnglish && a.title.length > 10;
        })
        .map((a: any) => processIntel({
          titulo: a.title,
          desc: a.source || 'Intelligence Report',
          fuente: 'GDELT INTELLIGENCE',
          hora: new Date().toLocaleTimeString(),
          coords: a.coords // if available
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
