import L from 'leaflet';
import { 
  MILITARY_BASES, 
  SHIPS, 
  CHOKEPOINTS, 
  PIPELINES, 
  COMMODITIES,
  ROUTES,
  CONNECTIONS,
  COUNTRY_RESOURCES,
  POLITICAL_IDEOLOGY,
  NUCLEAR_SITES,
  CYBER_ATTACKS,
  SATELLITES,
  UNDERSEA_CABLES,
  SEMICONDUCTOR_FABS,
  SPACE_CENTERS
} from '../constants';
import { getShipIcon, getSatelliteIcon } from './icons';

export const renderStaticLayers = (
  layers: Record<string, L.LayerGroup | L.MarkerClusterGroup>,
  iconTheme: 'emoji' | 'minimal' | 'tactical'
) => {
  Object.values(layers).forEach((l: any) => {
    if (l && typeof l.clearLayers === 'function') l.clearLayers();
  });

  // Warships
  SHIPS.forEach(ship => {
    const heading = (ship as any).heading || 0;
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: iconTheme === 'emoji' 
        ? `<div class="text-lg drop-shadow-[0_0_5px_rgba(0,212,255,0.5)]">🛳️</div>`
        : `<div class="w-7 h-7 text-luxury-gold drop-shadow-[0_0_5px_rgba(212,175,55,0.3)]" style="transform: rotate(${heading}deg)">
            ${getShipIcon(ship.t, '#d4af37')}
          </div>`,
      iconSize: [28, 28]
    });
    L.marker([ship.p[1], ship.p[0]], { icon })
      .bindPopup(`
        <div class="p-2">
          ${ship.img ? `<img src="${ship.img}" class="w-full h-32 object-cover mb-2 rounded" referrerPolicy="no-referrer">` : ''}
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xl">${ship.f}</span>
            <h3 class="font-bold text-intel-gold">${ship.n}</h3>
          </div>
          <p class="text-xs opacity-80 mb-1">${ship.t}</p>
          <p class="text-sm">${ship.d}</p>
        </div>
      `)
      .addTo(layers.warships);
  });

  // Bases
  MILITARY_BASES.forEach(base => {
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: iconTheme === 'emoji'
        ? `<div class="text-lg drop-shadow-[0_0_5px_rgba(239,64,76,0.6)]">🛡️</div>`
        : iconTheme === 'tactical'
          ? `<div class="w-2.5 h-2.5 bg-red-500 border border-white rounded-sm"></div>`
          : `<div class="w-1.5 h-1.5 border border-luxury-gold bg-luxury-gold/50 rotate-45"></div>`,
      iconSize: [20, 20]
    });
    L.marker([base.p[1], base.p[0]], { icon })
      .bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-intel-gold">${base.n}</h3>
          <p class="text-xs opacity-80 mb-1">${base.co} | ${base.t}</p>
          <p class="text-sm">${base.d}</p>
        </div>
      `)
      .addTo(layers.bases);
  });

  // Chokepoints
  CHOKEPOINTS.forEach(cp => {
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="text-lg drop-shadow-[0_0_5px_rgba(255,0,0,0.4)] animate-pulse">🚩</div>`,
      iconSize: [24, 24]
    });
    L.marker([cp.coords[1], cp.coords[0]], { icon })
      .bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-red-500 mb-1">${cp.name}</h3>
          <p class="text-xs opacity-80">${cp.desc}</p>
          <div class="mt-2 text-[8px] uppercase tracking-widest text-red-500/60">Status: Critical Monitoring</div>
        </div>
      `)
      .addTo(layers.chokepoints);
  });

  // Pipelines
  PIPELINES.forEach(pipe => {
    const latlngs = pipe.path.map(p => [p[1], p[0]] as [number, number]);
    L.polyline(latlngs, {
      color: pipe.status === 'SABOTAGED' ? '#ef4444' : '#f59e0b',
      weight: 3,
      dashArray: pipe.status === 'SABOTAGED' ? '5, 10' : '10, 10',
      opacity: 0.8,
      className: pipe.status === 'SABOTAGED' ? 'sabotaged-pipe' : 'active-pipe'
    }).addTo(layers.pipelines);

    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="text-xl drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">⛽</div>`,
      iconSize: [24, 24]
    });
    L.marker([pipe.coords[1], pipe.coords[0]], { icon })
      .bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-amber-500 mb-1">${pipe.name}</h3>
          <p class="text-xs uppercase tracking-widest ${pipe.status === 'SABOTAGED' ? 'text-red-500' : 'text-green-500'}">${pipe.status}</p>
        </div>
      `)
      .addTo(layers.pipelines);
  });

  // Oil Fields
  COMMODITIES.OIL.forEach(field => {
    if (field.poly) {
      L.polygon(field.poly.map(p => [p[1], p[0]] as [number, number]), {
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.1,
        weight: 1,
        dashArray: '3, 3'
      }).addTo(layers.oil);
    }
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="text-lg drop-shadow-[0_0_5px_rgba(245,158,11,0.4)]" style="font-size: ${10 + field.v}px">🛢️</div>`,
      iconSize: [24, 24]
    });
    L.marker([field.coords[1], field.coords[0]], { icon })
      .bindPopup(`<h3 class="font-bold text-amber-500">${field.name}</h3><p class="text-xs">Capacity Index: ${field.v}</p>`)
      .addTo(layers.oil);
  });

  // Wheat
  COMMODITIES.WHEAT.forEach(field => {
    if (field.poly) {
      L.polygon(field.poly.map(p => [p[1], p[0]] as [number, number]), {
        color: '#e9c349',
        fillColor: '#e9c349',
        fillOpacity: 0.2,
        weight: 1
      }).addTo(layers.wheat);
    }
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="text-xl" style="font-size: ${10 + field.v}px">🌾</div>`,
      iconSize: [24, 24]
    });
    L.marker([field.coords[1], field.coords[0]], { icon }).addTo(layers.wheat);
  });

  // Routes
  ROUTES.SHIPPING.forEach(route => {
    L.polyline(route.path.map(p => [p[1], p[0]] as [number, number]), {
      color: '#00d4ff',
      weight: 2,
      dashArray: '5, 10',
      opacity: 0.5
    }).addTo(layers.routes);
  });

  // Connections (Arcs)
  CONNECTIONS.forEach(conn => {
    const start = [conn.from[1], conn.from[0]] as [number, number];
    const end = [conn.to[1], conn.to[0]] as [number, number];
    
    const midLat = (start[0] + end[0]) / 2 + (end[1] - start[1]) * 0.2;
    const midLng = (start[1] + end[1]) / 2 + (start[0] - end[0]) * 0.2;
    
    const curvePoints: [number, number][] = [];
    for (let t = 0; t <= 1; t += 0.05) {
      const lat = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * midLat + t * t * end[0];
      const lng = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * midLng + t * t * end[1];
      curvePoints.push([lat, lng]);
    }

    L.polyline(curvePoints, {
      color: conn.type === 'Energy' ? '#ff8800' : 
             conn.type === 'Military' ? '#ef404c' : 
             conn.type === 'Trade' ? '#00d4ff' : '#e9c349',
      weight: conn.weight / 3,
      opacity: 0.4,
      smoothFactor: 2,
      className: 'animated-arc'
    }).addTo(layers.connections);
  });

  // Resources
  COUNTRY_RESOURCES.forEach(res => {
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="flex items-center gap-1 bg-navy-deep/80 border border-intel-gold/30 px-2 py-0.5 rounded-full text-[9px] whitespace-nowrap">
          <span>${res.emoji}</span>
          <span class="font-bold">${res.label}</span>
        </div>
      `,
      iconSize: [80, 20]
    });
    L.marker([res.coords[1], res.coords[0]], { icon }).addTo(layers.resources);
  });

  // Ideology
  POLITICAL_IDEOLOGY.forEach(pol => {
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="flex items-center gap-1 bg-navy-deep/80 border border-intel-gold/30 px-2 py-0.5 rounded-full text-[9px] whitespace-nowrap">
          <div class="w-1.5 h-1.5 rounded-full" style="background: ${pol.color}"></div>
          <span class="font-bold">${pol.label}</span>
        </div>
      `,
      iconSize: [80, 20]
    });
    L.marker([pol.coords[1], pol.coords[0]], { icon })
      .bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-intel-gold">${pol.name}</h3>
          <p class="text-xs opacity-80 mb-1">${pol.leader} | ${pol.ideology}</p>
        </div>
      `)
      .addTo(layers.ideology);
  });

  // Nuclear Sites
  NUCLEAR_SITES.forEach(site => {
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="text-2xl drop-shadow-[0_0_8px_rgba(255,255,0,0.8)]">☢️</div>`,
      iconSize: [32, 32]
    });
    
    const marker = L.marker([site.p[1], site.p[0]], { icon })
      .bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-yellow-400 mb-1">${site.name}</h3>
          <p class="text-xs opacity-80 mb-1">${site.co} | ${site.t}</p>
          <p class="text-sm">${site.d}</p>
          ${site.r > 0 ? `<p class="text-[10px] mt-2 text-yellow-400/60 uppercase tracking-widest">Strike Radius: ${site.r}km</p>` : ''}
        </div>
      `)
      .addTo(layers.nuclear);

    if (site.r > 0) {
      L.circle([site.p[1], site.p[0]], {
        radius: site.r * 1000,
        color: '#e9c349',
        weight: 1,
        fillOpacity: 0.05,
        dashArray: '5, 5'
      }).addTo(layers.nuclear);
    }
  });

  // Cyber Attacks
  CYBER_ATTACKS.forEach(attack => {
    const start = [attack.from[1], attack.from[0]] as [number, number];
    const end = [attack.to[1], attack.to[0]] as [number, number];
    
    const midLat = (start[0] + end[0]) / 2 + (end[1] - start[1]) * 0.1;
    const midLng = (start[1] + end[1]) / 2 + (start[0] - end[0]) * 0.1;
    
    const curvePoints: [number, number][] = [];
    for (let t = 0; t <= 1; t += 0.05) {
      const lat = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * midLat + t * t * end[0];
      const lng = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * midLng + t * t * end[1];
      curvePoints.push([lat, lng]);
    }

    L.polyline(curvePoints, {
      color: '#00ff00',
      weight: 2,
      opacity: 0.6,
      className: 'animated-arc'
    }).addTo(layers.cyber);

    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="text-xl animate-pulse">👾</div>`,
      iconSize: [24, 24]
    });
    L.marker(end, { icon })
      .bindPopup(`
        <div class="p-2 cyber-glitch">
          <h3 class="font-bold text-green-400 mb-1">CYBER_INTRUSION: ${attack.label}</h3>
          <p class="text-xs opacity-80">Type: ${attack.type}</p>
          <p class="text-xs opacity-80">Intensity: ${(attack.intensity * 100).toFixed(0)}%</p>
        </div>
      `)
      .addTo(layers.cyber);
  });

  // Satellites
  SATELLITES.forEach((sat, i) => {
    const offset = (Date.now() / 10000 + i) % (Math.PI * 2);
    const lat = 40 * Math.sin(offset);
    const lng = 180 * Math.cos(offset / 2);

    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative satellite-icon">
          <div class="w-6 h-6 text-cyan-400 drop-shadow-[0_0_5px_rgba(0,212,255,0.8)]">
            ${getSatelliteIcon(sat.type, '#22d3ee')}
          </div>
          <div class="absolute -inset-2 border border-cyan-400/20 rounded-full animate-ping"></div>
        </div>
      `,
      iconSize: [24, 24]
    });
    
    L.marker([lat, lng], { icon })
      .bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-cyan-400 mb-1">${sat.name}</h3>
          <p class="text-xs opacity-80">${sat.co} | ${sat.type}</p>
          <p class="text-[10px] opacity-40 mt-1">ALT: ${sat.alt}KM | ORBIT: ${sat.orbit}</p>
        </div>
      `)
      .addTo(layers.satellites);
  });

  // Undersea Cables
  UNDERSEA_CABLES.forEach(cable => {
    const start = [cable.from[1], cable.from[0]] as [number, number];
    const end = [cable.to[1], cable.to[0]] as [number, number];
    
    L.polyline([start, end], {
      color: '#00d4ff',
      weight: 1.5,
      opacity: 0.4,
      dashArray: '5, 5'
    }).addTo(layers.cables);

    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="text-[10px] bg-cyan-500/20 border border-cyan-500/40 px-1 rounded text-cyan-200">${cable.name}</div>`,
      iconSize: [40, 15]
    });
    L.marker([(start[0] + end[0]) / 2, (start[1] + end[1]) / 2], { icon })
      .bindPopup(`<h3 class="font-bold text-cyan-400">${cable.name}</h3><p class="text-xs">Capacity: ${cable.cap}</p><p class="text-[10px] opacity-60">${cable.label}</p>`)
      .addTo(layers.cables);
  });

  // Semiconductor Fabs
  SEMICONDUCTOR_FABS.forEach(fab => {
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="text-2xl drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">📟</div>`,
      iconSize: [32, 32]
    });
    L.marker([fab.p[1], fab.p[0]], { icon })
      .bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-cyan-400 mb-1">${fab.name}</h3>
          <p class="text-xs opacity-80 mb-1">${fab.co} | ${fab.t}</p>
          <p class="text-sm">${fab.d}</p>
        </div>
      `)
      .addTo(layers.fabs);
  });

  // Space Centers
  SPACE_CENTERS.forEach(center => {
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="text-2xl drop-shadow-[0_0_8px_rgba(255,100,0,0.8)]">🚀</div>`,
      iconSize: [32, 32]
    });
    L.marker([center.p[1], center.p[0]], { icon })
      .bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-orange-400 mb-1">${center.name}</h3>
          <p class="text-xs opacity-80 mb-1">${center.co} | ${center.t}</p>
          <p class="text-sm">${center.d}</p>
        </div>
      `)
      .addTo(layers.space);
  });
};
