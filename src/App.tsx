import L from 'leaflet';
import 'leaflet.markercluster';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  MILITARY_BASES, 
  SHIPS, 
  CHOKEPOINTS, 
  PIPELINES, 
  PLACE_COORDS,
  COMMODITIES,
  ROUTES,
  CONNECTIONS,
  COUNTRY_RESOURCES,
  POLITICAL_IDEOLOGY,
  LIVE_SHIPS,
  LEADERS,
  FINANCIALS,
  NUCLEAR_SITES,
  CYBER_ATTACKS,
  SATELLITES,
  UNDERSEA_CABLES,
  SEMICONDUCTOR_FABS,
  SPACE_CENTERS
} from './constants';
import { 
  Shield, 
  Plane, 
  Ship, 
  Flame, 
  Globe, 
  Zap, 
  Anchor, 
  Settings, 
  Search,
  ChevronRight,
  Clock,
  ExternalLink,
  AlertTriangle,
  Droplets,
  Wheat,
  Zap as Energy,
  Cpu,
  Battery,
  Link as LinkIcon,
  Users,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Send,
  Palette,
  X,
  Radio,
  Activity,
  Satellite as SatelliteIcon,
  Cable,
  Microchip,
  Rocket,
  Maximize2,
  Minimize2,
  Crosshair,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

// Types & Components
import { NewsItem, Aircraft, ChatMessage } from './types';
import { getShipIcon, getSatelliteIcon } from './lib/icons';
import { LayerSection } from './components/LayerSection';
import { TacticalOverlay } from './components/TacticalOverlay';
import { CountryDetailPanel } from './components/CountryDetailPanel';
import { StrategicAnalysis } from './components/StrategicAnalysis';
import { fetchNews as fetchNewsService, fetchAircraft as fetchAircraftService } from './services/api';
import { jitter, findCoordsForNews } from './lib/mapUtils';

// --- App Component ---

export default function App() {
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Record<string, L.LayerGroup | L.MarkerClusterGroup>>({});
  const wsRef = useRef<WebSocket | null>(null);
  
  const [isUiMinimized, setIsUiMinimized] = useState(false);
  const [showCoords, setShowCoords] = useState(true);
  
  const [stats, setStats] = useState({ news: 0, attacks: 0, aircraft: 0, ships: 14 });
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    news: true,
    attacks: true,
    civil_air: true,
    mil_air: true,
    warships: true,
    bases: true,
    oil: false,
    wheat: false,
    chokepoints: true,
    pipelines: true,
    routes: false,
    connections: false,
    resources: false,
    ideology: false,
    live_ships: true,
    nuclear: false,
    cyber: false,
    satellites: false,
    cables: false,
    fabs: false,
    space: false
  });
  
  const [iconTheme, setIconTheme] = useState<'emoji' | 'minimal' | 'tactical'>('emoji');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [userName] = useState(`Intel_${Math.floor(Math.random() * 9999)}`);
  const [userColor] = useState(`#${Math.floor(Math.random()*16777215).toString(16)}`);
  
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  
  const [milAircraft, setMilAircraft] = useState<Aircraft[]>([]);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryPanelOpen, setCountryPanelOpen] = useState(false);
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL'>('LOW');
  const [showAlert, setShowAlert] = useState(false);
  const [alertHistory, setAlertHistory] = useState<{ time: string, level: string, msg: string }[]>([]);
  const [tacticalMode, setTacticalMode] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [showSystemLog, setShowSystemLog] = useState(false);
  const [showStrategicAnalysis, setShowStrategicAnalysis] = useState(false);
  const [systemLogs, setSystemLogs] = useState<{ time: string, msg: string, type: 'info' | 'warn' | 'error' }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [logFlash, setLogFlash] = useState(false);
  const [mapPing, setMapPing] = useState(false);

  const triggerMapPing = () => {
    setMapPing(true);
    addLog('Global asset ping initiated.', 'info');
    setTimeout(() => setMapPing(false), 2000);
  };

  const addLog = useCallback((msg: string, type: 'info' | 'warn' | 'error' = 'info') => {
    setSystemLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 50));
    setLogFlash(true);
    setTimeout(() => setLogFlash(false), 1000);
  }, []);

  useEffect(() => {
    addLog('System initialized. Luxury Intelligence Protocol active.', 'info');
    addLog('Establishing secure WebSocket connection...', 'info');
    addLog('Fetching global news feed...', 'info');
    addLog('Scanning for tactical air assets...', 'info');
  }, [addLog]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase();
    
    // Search in countries
    const countryKey = Object.keys(LEADERS).find(c => 
      c.toLowerCase().includes(query) || 
      LEADERS[c].name.toLowerCase().includes(query)
    );
    
    if (countryKey) {
      setSelectedCountry(countryKey);
      setCountryPanelOpen(true);
      const coords = LEADERS[countryKey].cap || LEADERS[countryKey].coords;
      if (coords) mapRef.current?.flyTo([coords[1], coords[0]], 5);
      return;
    }

    // Search in bases
    const base = MILITARY_BASES.find(b => b.n.toLowerCase().includes(query));
    if (base) {
      mapRef.current?.flyTo([base.p[1], base.p[0]], 8);
      return;
    }

    // Search in ships
    const ship = SHIPS.find(s => s.n.toLowerCase().includes(query));
    if (ship) {
      mapRef.current?.flyTo([ship.p[1], ship.p[0]], 8);
      return;
    }
  };

  const applyPreset = (preset: 'CLEAR' | 'MILITARY' | 'ECONOMIC' | 'CYBER') => {
    const newLayers = { ...activeLayers };
    Object.keys(newLayers).forEach(k => newLayers[k] = false);

    if (preset === 'MILITARY') {
      ['attacks', 'nuclear', 'mil_air', 'warships', 'bases', 'satellites'].forEach(k => newLayers[k] = true);
    } else if (preset === 'ECONOMIC') {
      ['oil', 'wheat', 'resources', 'fabs', 'cables', 'pipelines', 'chokepoints'].forEach(k => newLayers[k] = true);
    } else if (preset === 'CYBER') {
      ['cyber', 'satellites', 'cables', 'fabs'].forEach(k => newLayers[k] = true);
    }
    setActiveLayers(newLayers);
  };

  useEffect(() => {
    const attackCount = newsFeed.filter(n => n.titulo.toLowerCase().includes('attack') || n.titulo.toLowerCase().includes('missile')).length;
    let newLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (attackCount > 10) newLevel = 'CRITICAL';
    else if (attackCount > 5) newLevel = 'HIGH';
    else if (attackCount > 2) newLevel = 'ELEVATED';
    
    if (newLevel !== riskLevel) {
      setAlertHistory(prev => [{
        time: new Date().toLocaleTimeString(),
        level: newLevel,
        msg: `Risk level shifted to ${newLevel}`
      }, ...prev].slice(0, 10));
    }

    if (newLevel === 'CRITICAL' && riskLevel !== 'CRITICAL') {
      setShowAlert(true);
    }
    setRiskLevel(newLevel);
  }, [newsFeed]);

  // Initialize Map
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map('map', {
      center: [25, 15],
      zoom: 2,
      minZoom: 2,
      maxBounds: [[-85, -180], [85, 180]],
      preferCanvas: true,
      zoomControl: false,
      worldCopyJump: false
    });

    // Stadia Alidade Smooth Dark (Better contrast and professional look)
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 20,
      noWrap: true
    }).addTo(map);

    // Esri World Boundaries (Overlay)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      noWrap: true,
      opacity: 0.4
    }).addTo(map);

    mapRef.current = map;

    // Initialize Layer Groups
    layersRef.current = {
      news: L.markerClusterGroup({ showCoverageOnHover: false }).addTo(map),
      attacks: L.layerGroup().addTo(map),
      civil_air: L.markerClusterGroup({ showCoverageOnHover: false }).addTo(map),
      mil_air: L.layerGroup().addTo(map),
      warships: L.layerGroup().addTo(map),
      bases: L.layerGroup().addTo(map),
      oil: L.layerGroup(),
      wheat: L.layerGroup(),
      chokepoints: L.layerGroup().addTo(map),
      pipelines: L.layerGroup().addTo(map),
      routes: L.layerGroup(),
      connections: L.layerGroup(),
      resources: L.layerGroup(),
      ideology: L.layerGroup(),
      live_ships: L.layerGroup().addTo(map),
      nuclear: L.layerGroup(),
      cyber: L.layerGroup(),
      satellites: L.layerGroup(),
      cables: L.layerGroup(),
      fabs: L.layerGroup(),
      space: L.layerGroup()
    };

    // Static Layers
    renderStaticLayers();

    // Country GeoJSON
    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
      .then(res => res.json())
      .then(data => {
        L.geoJSON(data, {
          style: {
            fillColor: 'transparent',
            weight: 0.5,
            opacity: 0.2,
            color: '#e9c349',
            fillOpacity: 0
          },
          onEachFeature: (feature, layer) => {
            layer.on({
              mouseover: (e) => {
                const l = e.target;
                l.setStyle({ fillOpacity: 0.1, fillColor: '#e9c349' });
              },
              mouseout: (e) => {
                const l = e.target;
                l.setStyle({ fillOpacity: 0 });
              },
              click: (e) => {
                const countryName = feature.properties.name;
                const iso = feature.properties.iso_a2;
                
                // Try to find a match in LEADERS
                const match = Object.keys(LEADERS).find(k => 
                  k === iso || 
                  k === countryName || 
                  LEADERS[k].name === countryName
                );
                
                if (match) {
                  setSelectedCountry(match);
                } else {
                  // Fallback for countries not in LEADERS - Create a temporary entry
                  setSelectedCountry(`GENERIC_${iso || countryName}_${countryName}`);
                }
                setCountryPanelOpen(true);
                L.DomEvent.stopPropagation(e);
              }
            });
          }
        }).addTo(map);
      });

    // WebSocket Chat
    const connectWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => setWsStatus('connected');
      ws.onclose = () => {
        setWsStatus('connecting');
        setTimeout(connectWS, 5000);
      };
      ws.onerror = () => setWsStatus('error');
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'history') {
            setChatMessages(msg.data);
          } else if (msg.type === 'chat') {
            setChatMessages(prev => [...prev, msg.data].slice(-100));
          }
        } catch (e) {
          console.error('WS parse error', e);
        }
      };
      wsRef.current = ws;
    };
    connectWS();

    // Data Loops
    const newsInterval = setInterval(fetchNews, 60000);
    const airInterval = setInterval(fetchAircraft, 30000);
    const shipInterval = setInterval(updateLiveShips, 5000);
    const clockInterval = setInterval(() => setCurrentTime(new Date().toUTCString()), 1000);

    // Initial Fetch
    setTimeout(() => {
      fetchNews();
      fetchAircraft();
      updateLiveShips();
    }, 250);

    // Re-render layers when theme changes or zoom changes
    map.on('zoomend', () => {
      const zoom = map.getZoom();
      if (activeLayers.resources) {
        if (zoom >= 3) layersRef.current.resources.addTo(map);
        else layersRef.current.resources.remove();
      }
      if (activeLayers.ideology) {
        if (zoom >= 4) layersRef.current.ideology.addTo(map);
        else layersRef.current.ideology.remove();
      }
    });

    return () => {
      clearInterval(newsInterval);
      clearInterval(airInterval);
      clearInterval(shipInterval);
      clearInterval(clockInterval);
      wsRef.current?.close();
    };
  }, []);

  // Re-render layers when theme changes
  useEffect(() => {
    if (!mapRef.current) return;
    renderStaticLayers();
    fetchNews();
    fetchAircraft();
    updateLiveShips();
  }, [iconTheme]);

  const renderStaticLayers = () => {
    const layers = layersRef.current;
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
      
      // Calculate control point for quadratic bezier curve
      const midLat = (start[0] + end[0]) / 2 + (end[1] - start[1]) * 0.2;
      const midLng = (start[1] + end[1]) / 2 + (start[0] - end[0]) * 0.2;
      
      // Create a curved path using SVG path string
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
      // Offset position slightly to simulate orbit movement
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

  const fetchNews = useCallback(async () => {
    addLog('Updating global news feed...', 'info');
    try {
      const allNews = await fetchNewsService();
      if (allNews.length === 0) {
        addLog('News feed update returned empty result.', 'warn');
        return;
      }
      addLog(`News feed updated: ${allNews.length} items received.`, 'info');

      setNewsFeed(allNews);
      setStats(prev => ({ ...prev, news: allNews.length, attacks: allNews.filter(n => n.type === 'attack').length }));

      const layer = layersRef.current.news as L.MarkerClusterGroup;
      const attackLayer = layersRef.current.attacks as L.LayerGroup;
      if (!layer || !attackLayer) return;

      layer.clearLayers();
      attackLayer.clearLayers();

      const coordCounts: Record<string, number> = {};

      allNews.forEach((item) => {
        let coords = item.coords;
        if (!coords) {
          coords = findCoordsForNews(item.titulo + ' ' + item.desc);
        }

        if (coords) {
          const key = `${coords[0]},${coords[1]}`;
          const count = coordCounts[key] || 0;
          coordCounts[key] = count + 1;

          const jittered = jitter(coords, count);
          const isAttack = item.type === 'attack';
          
          const iconHtml = isAttack 
            ? `<div class="text-2xl relative"><div class="attack-pulse absolute inset-0"></div>💥</div>`
            : item.urgente ? `⚠️` : `📰`;

          const icon = L.divIcon({
            className: 'custom-div-icon',
            html: iconTheme === 'emoji'
              ? `<div class="text-2xl drop-shadow-[0_0_8px_rgba(233,195,73,0.8)]">${iconHtml}</div>`
              : iconTheme === 'tactical'
                ? `<div class="w-3 h-3 ${isAttack ? 'bg-red-500' : 'bg-intel-gold'} border border-white rounded-full"></div>`
                : `<div class="w-2 h-2 ${isAttack ? 'bg-luxury-gold' : 'bg-luxury-bone'} rounded-full shadow-[0_0_5px_rgba(212,175,55,0.5)]"></div>`,
            iconSize: [32, 32]
          });

          L.marker([jittered[1], jittered[0]], { icon })
            .bindPopup(`
              <div class="p-2 max-w-[250px]">
                <h3 class="font-bold text-intel-gold mb-1">${item.titulo}</h3>
                <p class="text-xs opacity-80 mb-2">${item.hora} | ${item.fuente}</p>
                <p class="text-sm line-clamp-3">${item.desc}</p>
              </div>
            `)
            .addTo(layer);

          if (isAttack) {
            L.circle([jittered[1], jittered[0]], {
              radius: 70000,
              color: '#ef404c',
              fillColor: '#ef404c',
              fillOpacity: 0.1,
              weight: 1
            }).addTo(attackLayer);
          }
        }
      });
    } catch (e) {
      console.error('News fetch failed', e);
    }
  }, [iconTheme, findCoordsForNews, jitter]);

  const fetchAircraft = useCallback(async () => {
    addLog('Scanning for tactical air assets...', 'info');
    try {
      const aircraft = await fetchAircraftService();
      if (aircraft.length === 0) {
        addLog('Air asset scan returned zero results.', 'warn');
        return;
      }
      addLog(`Air scan complete: ${aircraft.length} assets tracked.`, 'info');

      setMilAircraft(aircraft.filter(a => a.isMilitary));
      setStats(prev => ({ ...prev, aircraft: aircraft.length }));

      const civilLayer = layersRef.current.civil_air as L.MarkerClusterGroup;
      const milLayer = layersRef.current.mil_air as L.LayerGroup;
      if (!civilLayer || !milLayer) return;

      civilLayer.clearLayers();
      milLayer.clearLayers();

      aircraft.forEach(a => {
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: iconTheme === 'emoji'
            ? `
              <div class="relative" style="transform: rotate(${a.heading}deg)">
                <div class="text-${a.isMilitary ? 'xl' : 'lg'} drop-shadow-[0_0_5px_${a.isMilitary ? 'rgba(233,195,73,0.6)' : 'rgba(68,136,255,0.6)'}]">
                  ${a.isMilitary ? '🛩' : '✈'}
                </div>
                ${a.isMilitary ? '<div class="pulse-ring scale-75"></div>' : ''}
              </div>
            `
            : `
              <div class="relative" style="transform: rotate(${a.heading}deg)">
                <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[10px] ${a.isMilitary ? 'border-b-intel-gold' : 'border-b-blue-400'}"></div>
              </div>
            `,
          iconSize: [20, 20]
        });

        const marker = L.marker([a.coords[1], a.coords[0]], { icon })
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-intel-gold">${a.callsign}</h3>
              <p class="text-xs opacity-80 mb-1">${a.icao} | ${a.country}</p>
              <div class="grid grid-cols-2 gap-2 text-xs mt-2">
                <div>ALT: ${a.alt} ft</div>
                <div>SPD: ${a.speed} kn</div>
              </div>
            </div>
          `);

        if (a.isMilitary) marker.addTo(milLayer);
        else marker.addTo(civilLayer);
      });
    } catch (e) {
      console.error('Aircraft fetch failed', e);
    }
  }, [iconTheme]);

  const updateLiveShips = () => {
    const layer = layersRef.current.live_ships as L.LayerGroup;
    layer.clearLayers();

    LIVE_SHIPS.forEach(ship => {
      const rad = (ship.heading - 90) * (Math.PI / 180);
      const dist = (ship.speed * 0.0001);
      ship.coords[0] += dist * Math.cos(rad);
      ship.coords[1] -= dist * Math.sin(rad);

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: iconTheme === 'emoji'
          ? `<div class="relative" style="transform: rotate(${ship.heading}deg)">
              <div class="text-lg drop-shadow-[0_0_5px_rgba(0,212,255,0.5)]">🚢</div>
            </div>`
          : `<div class="w-6 h-6 text-cyan-400 drop-shadow-[0_0_5px_rgba(0,212,255,0.3)]" style="transform: rotate(${ship.heading}deg)">
              ${getShipIcon(ship.type, '#00d4ff')}
            </div>`,
        iconSize: [24, 24]
      });

      L.marker([ship.coords[1], ship.coords[0]], { icon })
        .bindPopup(`
          <div class="p-2">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xl">${ship.flag}</span>
              <h3 class="font-bold text-intel-gold">${ship.name}</h3>
            </div>
            <p class="text-xs opacity-80 mb-1">${ship.type}</p>
            <div class="grid grid-cols-2 gap-2 text-xs mt-2">
              <div>SPD: ${ship.speed} kn</div>
              <div>HDG: ${ship.heading}°</div>
            </div>
          </div>
        `)
        .addTo(layer);
    });
  };

  const toggleLayer = (key: string) => {
    const newState = !activeLayers[key];
    setActiveLayers(prev => ({ ...prev, [key]: newState }));
    const layer = layersRef.current[key];
    const map = mapRef.current!;
    const zoom = map.getZoom();

    if (newState) {
      if (key === 'resources' && zoom < 3) return;
      if (key === 'ideology' && zoom < 4) return;
      layer.addTo(map);
    } else {
      layer.remove();
    }
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !wsRef.current) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'chat',
      data: {
        user: userName,
        text: chatInput,
        color: userColor
      }
    }));
    setChatInput('');
  };

  return (
    <div className="relative h-full w-full flex flex-col text-luxury-bone bg-luxury-black font-serif overflow-hidden">
      {/* Restore UI Button (Only visible when minimized) */}
      {isUiMinimized && (
        <button 
          onClick={() => setIsUiMinimized(false)}
          className="absolute top-6 left-6 z-[2000] bg-luxury-black/80 border border-luxury-gold/50 p-3 text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-pulse"
          title="Restore Interface"
        >
          <Maximize2 size={20} />
        </button>
      )}

      {/* Topbar */}
      <div className={`h-14 bg-luxury-black/95 border-b border-luxury-gold/30 flex items-center justify-between px-6 z-[800] backdrop-blur-xl transition-all duration-700 ${isUiMinimized ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 border border-luxury-gold rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-luxury-gold rounded-full animate-ping"></div>
          </div>
          <span className="font-light tracking-[0.3em] text-xl uppercase">GeoEconOrbit</span>
          <div className="flex items-center gap-1 text-[9px] tracking-widest bg-luxury-gold/10 text-luxury-gold px-2 py-0.5 border border-luxury-gold/20">
            LIVE PROTOCOL
          </div>
          <form onSubmit={handleSearch} className="ml-4 relative hidden lg:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH ASSETS/NATIONS..."
              className="bg-luxury-gray/30 border border-luxury-gold/10 pl-10 pr-4 py-1.5 text-[10px] tracking-widest focus:outline-none focus:border-luxury-gold/50 w-64 transition-all"
            />
          </form>
          <div className="flex items-center gap-6">
            <div className="hidden xl:flex flex-col items-end">
              <div className="text-[8px] tracking-[0.2em] opacity-40 uppercase">Strategic Outlook</div>
              <div className="text-[10px] font-bold text-luxury-gold tracking-widest">MULTIPOLAR FRICTION</div>
            </div>
            
            <div className="flex flex-col gap-1 w-32">
              <div className="flex justify-between items-center text-[8px] uppercase tracking-widest">
                <span className="opacity-40">Risk Level</span>
                <span className={`font-bold ${
                  riskLevel === 'CRITICAL' ? 'text-red-500' :
                  riskLevel === 'HIGH' ? 'text-orange-500' :
                  riskLevel === 'ELEVATED' ? 'text-yellow-500' :
                  'text-green-500'
                }`}>{riskLevel}</span>
              </div>
              <div className="h-1.5 w-full bg-luxury-gold/10 border border-luxury-gold/20 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    riskLevel === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' :
                    riskLevel === 'HIGH' ? 'bg-orange-500' :
                    riskLevel === 'ELEVATED' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ 
                    width: riskLevel === 'CRITICAL' ? '100%' : 
                           riskLevel === 'HIGH' ? '75%' : 
                           riskLevel === 'ELEVATED' ? '50%' : '25%' 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[10px] tracking-widest uppercase font-light">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] opacity-30">Density</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-2 h-1 ${Object.values(activeLayers).filter(v => v).length >= i * 3 ? 'bg-luxury-gold' : 'bg-luxury-gold/10'}`}></div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-60"><Globe size={12} /> News: {stats.news}</div>
          <div className="flex items-center gap-2 text-luxury-gold font-bold"><Flame size={12} /> Kinetic: {stats.attacks}</div>
          <div className="flex items-center gap-2 opacity-60"><Plane size={12} /> Air: {stats.aircraft}</div>
          <div className="flex items-center gap-2 opacity-60"><Ship size={12} /> Sea: {LIVE_SHIPS.length}</div>
        </div>

        <div className="flex items-center gap-4 text-[10px] tracking-widest uppercase">
          <button 
            onClick={() => {
              fetchNews();
              fetchAircraft();
              addLog('Manual data refresh initiated.', 'info');
            }}
            className="flex items-center gap-2 border border-luxury-gold/30 px-3 py-1.5 hover:bg-luxury-gold hover:text-luxury-black transition-all duration-300"
            title="Refresh Data"
          >
            <RefreshCw size={12} className="animate-spin-slow" /> REFRESH
          </button>
          <button 
            onClick={() => setShowStrategicAnalysis(true)}
            className="flex items-center gap-2 border border-luxury-gold bg-luxury-gold/10 text-luxury-gold px-3 py-1.5 hover:bg-luxury-gold hover:text-luxury-black transition-all duration-300"
          >
            <TrendingUp size={12} /> STRATEGIC_ANALYSIS
          </button>
          <button 
            onClick={() => {
              setShowSystemLog(!showSystemLog);
              if (!showSystemLog) triggerMapPing();
            }}
            className={`flex items-center gap-2 border transition-all duration-300 px-3 py-1.5 ${
              showSystemLog ? 'border-luxury-gold bg-luxury-gold text-luxury-black' : 
              logFlash ? 'border-luxury-gold bg-luxury-gold/40 text-luxury-gold scale-105 shadow-[0_0_15px_rgba(212,175,55,0.5)]' :
              'border-luxury-gold/30 text-luxury-gold/60 hover:bg-luxury-gold/10'
            }`}
            title="Toggle System Log & Ping"
          >
            <Activity size={12} className={logFlash || mapPing ? 'animate-pulse text-luxury-gold' : ''} /> 
            <span className="relative">
              LOG_{showSystemLog ? 'ON' : 'OFF'}
              {(logFlash || mapPing) && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>}
            </span>
          </button>
          <div className="flex items-center gap-1 border border-luxury-gold/20 px-2 py-1.5 bg-luxury-black/40">
            <span className="opacity-30 mr-2">Focus:</span>
            <button onClick={() => mapRef.current?.flyTo([34.0, 44.0], 5)} className="hover:text-luxury-gold transition-colors">ME</button>
            <span className="opacity-20">|</span>
            <button onClick={() => mapRef.current?.flyTo([15.0, 115.0], 5)} className="hover:text-luxury-gold transition-colors">SCS</button>
            <span className="opacity-20">|</span>
            <button onClick={() => mapRef.current?.flyTo([50.0, 30.0], 5)} className="hover:text-luxury-gold transition-colors">EE</button>
          </div>
          <button 
            onClick={() => setShowCoords(!showCoords)}
            className={`flex items-center gap-2 border ${showCoords ? 'border-luxury-gold bg-luxury-gold/20 text-luxury-gold' : 'border-luxury-gold/30 opacity-60'} px-3 py-1.5 hover:bg-luxury-gold hover:text-luxury-black transition-all duration-300`}
            title="Toggle Coordinates"
          >
            <Crosshair size={12} /> {showCoords ? 'COORDS_ON' : 'COORDS_OFF'}
          </button>
          <button 
            onClick={() => setTacticalMode(!tacticalMode)}
            className={`flex items-center gap-2 border ${tacticalMode ? 'border-luxury-gold bg-luxury-gold/20 text-luxury-gold' : 'border-luxury-gold/30 opacity-60'} px-3 py-1.5 hover:bg-luxury-gold hover:text-luxury-black transition-all duration-300`}
          >
            <Shield size={12} /> TACTICAL_{tacticalMode ? 'ON' : 'OFF'}
          </button>
          <button 
            onClick={() => setIsUiMinimized(true)}
            className="flex items-center gap-2 border border-luxury-gold/30 px-3 py-1.5 hover:bg-luxury-gold hover:text-luxury-black transition-all duration-300"
            title="Minimize UI"
          >
            <Minimize2 size={12} /> ZEN_MODE
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div 
          id="map" 
          className={`absolute inset-0 z-0 transition-all duration-1000 ${tacticalMode ? 'tactical-map-filter' : ''} ${mapPing ? 'brightness-125 contrast-125' : ''}`}
        ></div>
        
        {mapPing && (
          <div className="absolute inset-0 z-[10] pointer-events-none flex items-center justify-center">
            <div className="w-[100vmax] h-[100vmax] border-[100px] border-luxury-gold/10 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
            <div className="absolute inset-0 bg-luxury-gold/5 animate-pulse"></div>
          </div>
        )}
        
        <TacticalOverlay mapRef={mapRef} showCoords={showCoords} />
        <div className="tactical-grid"></div>
        <div className="vignette"></div>
        {tacticalMode && (
          <>
            <div className="scanline"></div>
            <div className="scan-bar"></div>
          </>
        )}

        <CountryDetailPanel 
          selectedCountry={selectedCountry}
          countryPanelOpen={countryPanelOpen}
          setCountryPanelOpen={setCountryPanelOpen}
          isUiMinimized={isUiMinimized}
        />

        <StrategicAnalysis 
          isOpen={showStrategicAnalysis} 
          onClose={() => setShowStrategicAnalysis(false)} 
        />

        {/* System Log Overlay */}
        <div className={`absolute bottom-20 left-6 w-[450px] h-72 bg-luxury-black/95 border-l-2 border-luxury-gold z-[800] backdrop-blur-3xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)] transition-all duration-500 origin-bottom-left ${showSystemLog && !isUiMinimized ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 pointer-events-none'}`}>
          <div className="p-3 border-b border-luxury-gold/10 flex items-center justify-between bg-gradient-to-r from-luxury-gold/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-luxury-gold animate-pulse"></div>
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-luxury-gold animate-ping opacity-50"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-luxury-gold leading-none">System Terminal</span>
                <span className="text-[7px] opacity-40 uppercase tracking-widest mt-0.5">Secure Intelligence Stream // v1.2.0</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 mr-4">
                <div className="w-1 h-1 bg-luxury-gold/20"></div>
                <div className="w-1 h-1 bg-luxury-gold/40"></div>
                <div className="w-1 h-1 bg-luxury-gold/60"></div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSystemLog(false);
                }} 
                className="p-1.5 hover:bg-red-500/20 hover:text-red-500 transition-all rounded-sm group"
                title="Close Terminal"
              >
                <X size={14} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 font-mono text-[10px] space-y-2 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed">
            {systemLogs.map((log, i) => (
              <div key={i} className="flex gap-4 group animate-in slide-in-from-left-2 duration-300">
                <span className="opacity-20 font-bold shrink-0">[{log.time}]</span>
                <span className={`leading-relaxed ${
                  log.type === 'error' ? 'text-red-500 font-bold' : 
                  log.type === 'warn' ? 'text-orange-500' : 
                  'text-luxury-gold/90'
                }`}>
                  <span className="opacity-40 mr-2">❯</span>
                  {log.msg}
                </span>
              </div>
            ))}
            {systemLogs.length === 0 && (
              <div className="h-full flex items-center justify-center opacity-10 flex-col gap-4">
                <Activity size={48} className="animate-pulse" />
                <span className="text-[10px] tracking-[0.5em] uppercase">No Active Telemetry</span>
              </div>
            )}
            <div className="h-4"></div>
          </div>
          <div className="h-1 bg-gradient-to-r from-luxury-gold via-transparent to-transparent opacity-30"></div>
        </div>

        {/* Restore UI Button (Zen Mode) */}
        {isUiMinimized && (
          <button 
            onClick={() => setIsUiMinimized(false)}
            className="absolute top-6 left-6 z-[2000] p-4 bg-luxury-gold text-luxury-black rounded-full shadow-[0_0_30px_rgba(212,175,55,0.5)] hover:scale-110 transition-all duration-300 animate-in fade-in zoom-in group"
            title="RESTORE UI"
          >
            <Maximize2 size={24} />
            <span className="absolute left-full ml-4 px-3 py-1 bg-luxury-black border border-luxury-gold text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">RESTORE INTERFACE</span>
          </button>
        )}

        {/* Strategic Alert Modal */}
        {showAlert && (
          <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-luxury-black/90 backdrop-blur-md">
            <div className="max-w-md w-full p-8 border-2 border-red-500 bg-luxury-black shadow-[0_0_100px_rgba(239,64,76,0.5)] text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center animate-pulse">
                  <AlertTriangle size={40} className="text-red-500" />
                </div>
              </div>
              <h2 className="text-3xl font-black tracking-[0.3em] text-red-500 uppercase">Strategic Alert</h2>
              <p className="text-sm font-light leading-relaxed opacity-80">
                Global risk level has escalated to <span className="text-red-500 font-bold">CRITICAL</span>. 
                Multiple kinetic events detected in strategic sectors. 
                All tactical assets are on high alert.
              </p>
              <button 
                onClick={() => setShowAlert(false)}
                className="w-full py-4 bg-red-500 text-luxury-black font-bold tracking-widest hover:bg-white transition-colors uppercase"
              >
                Acknowledge Protocol
              </button>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div className={`absolute top-6 left-6 bottom-16 w-80 bg-luxury-black/90 border border-luxury-gold/30 z-[800] backdrop-blur-2xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-700 ${isUiMinimized ? '-translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'}`}>
          <div className="p-6 border-b border-luxury-gold/20 flex items-center justify-between shrink-0">
            <h2 className="text-[10px] font-light tracking-[0.4em] uppercase opacity-40">Intelligence Layers</h2>
            <div className="flex gap-2">
              <button onClick={() => applyPreset('CLEAR')} className="text-[8px] border border-luxury-gold/20 px-1 hover:bg-luxury-gold/10">CLR</button>
              <Settings size={14} className="opacity-40" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            <div className="mb-6 grid grid-cols-2 gap-2">
              <button onClick={() => applyPreset('MILITARY')} className="text-[9px] border border-red-500/30 bg-red-500/5 py-2 hover:bg-red-500/20 transition-all uppercase tracking-widest font-bold">Military</button>
              <button onClick={() => applyPreset('ECONOMIC')} className="text-[9px] border border-cyan-500/30 bg-cyan-500/5 py-2 hover:bg-cyan-500/20 transition-all uppercase tracking-widest font-bold">Economic</button>
            </div>

            <div className="space-y-6">
              <LayerSection title="OPERATIONS" activeLayers={activeLayers} toggle={toggleLayer} collapsed={collapsedSections['OPERATIONS']} onToggleCollapse={() => setCollapsedSections(prev => ({...prev, OPERATIONS: !prev.OPERATIONS}))} items={[
                { id: 'news', label: 'Global Intel', icon: Globe },
                { id: 'attacks', label: 'Kinetic Events', icon: Flame, color: 'text-luxury-gold' },
                { id: 'nuclear', label: 'Nuclear Deterrent', icon: Radio, color: 'text-yellow-400' }
              ]} />
              
              <LayerSection title="ASSETS" activeLayers={activeLayers} toggle={toggleLayer} collapsed={collapsedSections['ASSETS']} onToggleCollapse={() => setCollapsedSections(prev => ({...prev, ASSETS: !prev.ASSETS}))} items={[
                { id: 'civil_air', label: 'Civilian Air', icon: Plane },
                { id: 'mil_air', label: 'Strategic Air', icon: Shield, color: 'text-luxury-gold' },
                { id: 'warships', label: 'Naval Groups', icon: Ship, color: 'text-luxury-gold' },
                { id: 'live_ships', label: 'AIS Vessels', icon: Anchor },
                { id: 'bases', label: 'Command Posts', icon: Anchor },
                { id: 'satellites', label: 'Orbital Recon', icon: SatelliteIcon, color: 'text-cyan-400' },
                { id: 'space', label: 'Spaceports', icon: Rocket, color: 'text-orange-400' }
              ]} />

              <LayerSection title="RESOURCES" activeLayers={activeLayers} toggle={toggleLayer} collapsed={collapsedSections['RESOURCES']} onToggleCollapse={() => setCollapsedSections(prev => ({...prev, RESOURCES: !prev.RESOURCES}))} items={[
                { id: 'oil', label: 'Energy Reserves', icon: Droplets },
                { id: 'wheat', label: 'Agri-Belts', icon: Wheat },
                { id: 'resources', label: 'Rare Earths', icon: Cpu },
                { id: 'fabs', label: 'Semiconductor Fabs', icon: Microchip, color: 'text-cyan-400' }
              ]} />

              <LayerSection title="GEOPOLITICS" activeLayers={activeLayers} toggle={toggleLayer} collapsed={collapsedSections['GEOPOLITICS']} onToggleCollapse={() => setCollapsedSections(prev => ({...prev, GEOPOLITICS: !prev.GEOPOLITICS}))} items={[
                { id: 'connections', label: 'Strategic Arcs', icon: LinkIcon },
                { id: 'cyber', label: 'Cyber Warfare', icon: Activity, color: 'text-green-400' },
                { id: 'cables', label: 'Undersea Cables', icon: Cable, color: 'text-cyan-400' },
                { id: 'ideology', label: 'Political Map', icon: Users },
                { id: 'chokepoints', label: 'Trade Chokepoints', icon: Anchor },
                { id: 'pipelines', label: 'Energy Pipelines', icon: Droplets }
              ]} />
            </div>

            <div className="mt-8 pt-6 border-t border-luxury-gold/10">
              <h3 className="text-[10px] tracking-[0.4em] uppercase opacity-40 mb-4">System Diagnostics</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] tracking-widest">
                  <span className="opacity-40">Uptime</span>
                  <span className="text-luxury-gold">04:12:55</span>
                </div>
                <div className="flex justify-between text-[9px] tracking-widest">
                  <span className="opacity-40">Signal Strength</span>
                  <span className="text-green-400">98.2%</span>
                </div>
                <div className="flex justify-between text-[9px] tracking-widest">
                  <span className="opacity-40">Encryption</span>
                  <span className="text-luxury-gold">AES-256</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breaking News Ticker */}
        <div className={`absolute bottom-0 left-0 right-0 h-10 bg-luxury-black border-t border-luxury-gold/20 z-[800] flex items-center overflow-hidden transition-all duration-700 ${isUiMinimized ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
          <div className="bg-luxury-gold text-luxury-black px-4 h-full flex items-center text-[10px] font-black uppercase tracking-[0.2em]">
            Flash
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="whitespace-nowrap animate-marquee flex items-center gap-16 text-[11px] font-light tracking-wide opacity-90">
              {newsFeed.map((n, i) => (
                <span key={i} className="flex items-center gap-3">
                  <span className="text-luxury-gold font-mono">[{n.hora}]</span> {n.titulo}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Toggle */}
      <button 
        onClick={() => setDrawerOpen(!drawerOpen)}
        className={`absolute bottom-24 right-10 w-14 h-14 bg-luxury-gold text-luxury-black rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)] z-[900] hover:scale-110 transition-all duration-700 ${isUiMinimized ? 'translate-x-[200%] opacity-0' : 'translate-x-0 opacity-100'}`}
      >
        {drawerOpen ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
      </button>

      {/* Intelligence Drawer */}
      <div className={`absolute bottom-0 left-0 right-0 h-[60vh] bg-luxury-black border-t border-luxury-gold/30 transition-all duration-700 ease-in-out z-[850] flex overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.8)] ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-80 border-r border-luxury-gold/10 flex flex-col bg-luxury-gray/20">
          <div className="p-6 border-b border-luxury-gold/10 flex items-center justify-between font-light text-[10px] tracking-[0.3em] uppercase">
            <div className="flex items-center gap-3"><Shield size={14} className="text-luxury-gold" /> Tactical Data</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            {milAircraft.map(a => (
              <div 
                key={a.icao} 
                className="p-3 border border-luxury-gold/5 hover:bg-luxury-gold/5 cursor-pointer transition-all"
                onClick={() => mapRef.current?.flyTo([a.coords[1], a.coords[0]], 8)}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold text-luxury-gold">{a.callsign}</span>
                  <span className="text-[9px] font-mono opacity-40">{a.alt} FT</span>
                </div>
                <div className="text-[9px] opacity-30 uppercase tracking-widest">{a.country}</div>
              </div>
            ))}
            {milAircraft.length === 0 && <div className="text-[10px] opacity-20 p-4 text-center">No tactical assets detected</div>}
          </div>
        </div>

        <div className="flex-1 border-r border-luxury-gold/10 flex flex-col">
          <div className="p-6 border-b border-luxury-gold/10 flex items-center justify-between font-light text-[10px] tracking-[0.3em] uppercase">
            <div className="flex items-center gap-3"><Globe size={14} className="text-luxury-gold" /> Intelligence Feed</div>
            <div className="opacity-30">Real-time Signal</div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {newsFeed.map((n, i) => (
              <div 
                key={i} 
                className={`p-5 border border-luxury-gold/10 hover:border-luxury-gold/40 transition-all duration-300 cursor-pointer group ${n.titulo.toLowerCase().includes('attack') || n.titulo.toLowerCase().includes('missile') ? 'kinetic-attack' : ''}`}
                onClick={() => {
                  const coords = findCoordsForNews(n.titulo);
                  if (coords) mapRef.current?.flyTo([coords[1], coords[0]], 6);
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-mono text-luxury-gold">SIGNAL_{n.hora.replace(':', '')}</span>
                  <span className="text-[9px] opacity-40 uppercase tracking-widest">{n.fuente}</span>
                </div>
                <h3 className="text-sm font-medium leading-relaxed group-hover:text-luxury-gold transition-colors">{n.titulo}</h3>
                <div className="mt-3 text-[10px] opacity-30 uppercase tracking-[0.2em]">Verified Intelligence</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-80 border-r border-luxury-gold/10 flex flex-col bg-luxury-gray/10">
          <div className="p-6 border-b border-luxury-gold/10 flex items-center justify-between font-light text-[10px] tracking-[0.3em] uppercase">
            <div className="flex items-center gap-3"><Activity size={14} className="text-luxury-gold" /> Strategic Analysis</div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            <div className="space-y-4">
              <h4 className="text-[10px] tracking-widest uppercase opacity-40">Global Power Distribution</h4>
              <div className="space-y-3">
                {[
                  { label: 'USA', val: 95, color: 'bg-blue-500' },
                  { label: 'China', val: 92, color: 'bg-red-500' },
                  { label: 'EU', val: 85, color: 'bg-blue-400' },
                  { label: 'Russia', val: 78, color: 'bg-gray-500' },
                  { label: 'India', val: 75, color: 'bg-orange-500' }
                ].map(p => (
                  <div key={p.label} className="space-y-1">
                    <div className="flex justify-between text-[9px] uppercase tracking-tighter">
                      <span>{p.label}</span>
                      <span>{p.val}%</span>
                    </div>
                    <div className="h-1 bg-luxury-gold/10 w-full overflow-hidden">
                      <div className={`h-full ${p.color}`} style={{ width: `${p.val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-luxury-gold/5 border border-luxury-gold/10 space-y-2">
              <div className="text-[10px] font-bold text-luxury-gold uppercase tracking-widest">Analyst Note</div>
              <p className="text-[10px] leading-relaxed opacity-60 italic">
                "The current escalation in {newsFeed[0]?.titulo.split(' ')[0] || 'strategic sectors'} suggests a shift towards multipolar friction. 
                Energy corridors in the Middle East remain the primary volatility vector."
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] tracking-widest uppercase opacity-40">Supply Chain Integrity</h4>
              <div className="space-y-3">
                {[
                  { label: 'Semiconductors', val: 65, status: 'Critical' },
                  { label: 'Energy (LNG)', val: 82, status: 'Stable' },
                  { label: 'Rare Earths', val: 45, status: 'Vulnerable' },
                  { label: 'Food (Wheat)', val: 74, status: 'Alert' }
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between border-b border-luxury-gold/5 pb-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold">{s.label}</span>
                      <span className={`text-[8px] uppercase ${s.status === 'Critical' ? 'text-red-500' : s.status === 'Vulnerable' ? 'text-orange-500' : s.status === 'Alert' ? 'text-yellow-500' : 'text-green-500'}`}>{s.status}</span>
                    </div>
                    <div className="text-xs font-mono">{s.val}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] tracking-widest uppercase opacity-40">Alert History</h4>
              <div className="space-y-2">
                {alertHistory.map((h, i) => (
                  <div key={i} className="flex gap-3 text-[9px] border-l border-luxury-gold/20 pl-3 py-1">
                    <span className="opacity-40 font-mono">{h.time}</span>
                    <span className={`font-bold ${h.level === 'CRITICAL' ? 'text-red-500' : h.level === 'HIGH' ? 'text-orange-500' : 'text-luxury-gold'}`}>{h.level}</span>
                  </div>
                ))}
                {alertHistory.length === 0 && <div className="text-[9px] opacity-20 italic">No recent alerts</div>}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] tracking-widest uppercase opacity-40">Market Volatility</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 border border-luxury-gold/10 text-center">
                  <div className="text-[8px] opacity-40 uppercase">Brent Oil</div>
                  <div className="text-xs text-red-400">+$2.40</div>
                </div>
                <div className="p-3 border border-luxury-gold/10 text-center">
                  <div className="text-[8px] opacity-40 uppercase">Gold (Spot)</div>
                  <div className="text-xs text-green-400">+$15.20</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`w-96 flex flex-col bg-luxury-gray/30 border border-luxury-gold/30 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-700 ${isUiMinimized ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'}`}>
          <div className="p-6 border-b border-luxury-gold/10 flex items-center gap-3 font-light text-[10px] tracking-[0.3em] uppercase">
            <MessageSquare size={14} className="text-luxury-gold" /> Global Comms
            <div className={`w-1.5 h-1.5 rounded-full ml-auto ${wsStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : wsStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {chatMessages.map(m => (
              <div key={m.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: m.color }}>{m.user}</span>
                  <span className="text-[8px] opacity-30 font-mono">{new Date(m.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs font-light leading-relaxed opacity-80">{m.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={sendChatMessage} className="p-6 border-t border-luxury-gold/10 bg-luxury-black">
            <div className="relative">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="TRANSMIT SIGNAL..."
                className="w-full bg-luxury-gray/50 border border-luxury-gold/20 p-3 pr-12 text-xs focus:outline-none focus:border-luxury-gold transition-colors placeholder:opacity-20 tracking-widest"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-luxury-gold hover:scale-110 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className={`h-6 bg-luxury-black border-t border-luxury-gold/10 flex items-center justify-between px-4 text-[9px] opacity-50 z-[800] transition-all duration-700 ${isUiMinimized ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="flex items-center gap-6">
          <div>GEOECONORBIT v1.2.0 | LUXURY INTELLIGENCE PROTOCOL</div>
          <div className="flex items-center gap-2">
            <span className="opacity-40">SIGNAL:</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-1 h-2 ${i <= 4 ? 'bg-green-500' : 'bg-green-500/20'}`}></div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>LAT: 25.0000 LNG: 15.0000</span>
        </div>
      </div>

      <style>{`
        .animate-marquee {
          display: inline-block;
          animation: marquee 60s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(212, 175, 55, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.4);
        }
        .custom-div-icon {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
