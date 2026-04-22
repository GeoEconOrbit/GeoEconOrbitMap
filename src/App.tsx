import L from 'leaflet';
import 'leaflet.markercluster';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  SPACE_CENTERS,
  TRADE_FLOWS,
  SANCTIONS
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
import { renderStaticLayers } from './lib/mapStaticLayers';
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
    space: false,
    sanctions: false,
    nuclear_weapons: false,
    risk_heatmap: false,
    trade_flows: false
  });
  
  const [timeFilter, setTimeFilter] = useState(24); // Hours
  
  const [iconTheme, setIconTheme] = useState<'emoji' | 'minimal' | 'tactical'>('minimal');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [userName] = useState(`Intel_${Math.floor(Math.random() * 9999)}`);
  const [userColor] = useState(`#${Math.floor(Math.random()*16777215).toString(16)}`);
  
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  
  const [milAircraft, setMilAircraft] = useState<Aircraft[]>([]);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());
  const [globalStats, setGlobalStats] = useState({ online: 0, total: 0 });
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
  const [commodityPrices, setCommodityPrices] = useState([
    { label: 'WTI', price: '78.42', change: '+1.2%', up: true },
    { label: 'GOLD', price: '2,342', change: '+0.8%', up: true },
    { label: 'COPPER', price: '4.52', change: '-0.4%', up: false },
    { label: 'WHEAT', price: '612', change: '+2.1%', up: true }
  ]);

  // Memoize static layer metadata to avoid expensive re-calcs
  const staticLayerMetadata = React.useMemo(() => ({
    ships: LIVE_SHIPS.length,
    bases: MILITARY_BASES.length,
    nuclear: NUCLEAR_SITES.length
  }), []);

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

    // Esri World Dark Gray Base (Highly reliable, professional look)
    L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community',
      maxZoom: 16,
      noWrap: true
    }).addTo(map);

    // World Boundaries and Places (Overlay)
    L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      noWrap: true,
      maxZoom: 16,
      opacity: 0.3
    }).addTo(map);

    mapRef.current = map;

    // Initialize Layer Groups
    layersRef.current = {
      news: L.markerClusterGroup({ showCoverageOnHover: false }).addTo(map),
      attacks: L.layerGroup().addTo(map),
      civil_air: L.markerClusterGroup({ showCoverageOnHover: false }).addTo(map),
      mil_air: L.layerGroup().addTo(map),
      warships: L.layerGroup().addTo(map),
      bases: L.markerClusterGroup({ 
        showCoverageOnHover: false,
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: true 
      }).addTo(map),
      oil: L.layerGroup(),
      wheat: L.layerGroup(),
      chokepoints: L.layerGroup().addTo(map),
      pipelines: L.layerGroup().addTo(map),
      routes: L.layerGroup(),
      connections: L.layerGroup(),
      resources: L.layerGroup(),
      ideology: L.layerGroup(),
      live_ships: L.layerGroup().addTo(map),
      nuclear: L.markerClusterGroup({ 
        showCoverageOnHover: false,
        maxClusterRadius: 35
      }).addTo(map),
      cyber: L.layerGroup(),
      satellites: L.layerGroup(),
      cables: L.layerGroup(),
      fabs: L.markerClusterGroup({ showCoverageOnHover: false }).addTo(map),
      space: L.layerGroup(),
      sanctions: L.layerGroup(),
      trade_flows: L.layerGroup(),
      risk_heatmap: L.layerGroup()
    };

    // Static Layers
    renderStaticLayersFn();

    // Country GeoJSON
    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
      .then(res => res.json())
      .then(data => {
        L.geoJSON(data, {
          style: {
            fillColor: 'transparent',
            weight: 0.5,
            opacity: 0.15,
            color: '#3B82F6',
            fillOpacity: 0
          },
          onEachFeature: (feature, layer) => {
            layer.on({
              mouseover: (e) => {
                const l = e.target;
                l.setStyle({ fillOpacity: 0.08, fillColor: '#3B82F6', weight: 1, opacity: 0.4 });
              },
              mouseout: (e) => {
                const l = e.target;
                l.setStyle({ fillOpacity: 0, weight: 0.5, opacity: 0.15 });
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
      let host = window.location.host;
      if (host.includes('localhost:5173')) {
        host = 'localhost:3000';
      }
      // Use explicit /ws path to avoid conflicts
      const wsUrl = `${protocol}//${host}/ws`;
      console.log('Connecting to WebSocket:', wsUrl);
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
          } else if (msg.type === 'stats') {
            setGlobalStats(msg.data);
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
    renderStaticLayersFn();
    fetchNews();
    fetchAircraft();
    updateLiveShips();
  }, [iconTheme]); // Only trigger when theme explicitly changes

  const renderStaticLayersFn = useCallback(() => {
    if (!layersRef.current.trade_flows || !layersRef.current.sanctions) return;
    
    renderStaticLayers(layersRef.current, iconTheme);
    
    // Feature 11: Trade Flows (Animatedish)
    const tradeLayer = layersRef.current.trade_flows as L.LayerGroup;
    if (tradeLayer) {
      tradeLayer.clearLayers();
      TRADE_FLOWS.forEach(flow => {
        const fromRaw = flow.from.toLowerCase();
        const toRaw = flow.to.toLowerCase();
        const from = PLACE_COORDS[fromRaw] || (LEADERS[flow.from] && LEADERS[flow.from].cap);
        const to = PLACE_COORDS[toRaw] || (LEADERS[flow.to] && LEADERS[flow.to].cap);
        
        if (from && to) {
          L.polyline([[from[1], from[0]], [to[1], to[0]]], {
            color: '#10B981',
            weight: 2,
            opacity: 0.4,
            dashArray: '10, 10'
          }).addTo(tradeLayer);
        }
      });
    }

    // Feature 10: Sanctions
    const sanctionLayer = layersRef.current.sanctions as L.LayerGroup;
    if (sanctionLayer) {
      sanctionLayer.clearLayers();
      SANCTIONS.forEach(s => {
        const target = PLACE_COORDS[s.target.toLowerCase()] || (LEADERS[s.target] && LEADERS[s.target].cap);
        if (target) {
          L.circle([target[1], target[0]], {
            radius: 300000,
            color: '#EF4444',
            fillOpacity: 0.2,
            weight: 1
          }).bindPopup(`SANCTION: ${s.target} by ${s.by.join(', ')}`).addTo(sanctionLayer);
        }
      });
    }
  }, [iconTheme]);

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
        html: `<div class="w-5 h-5 text-geo-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" style="transform: rotate(${ship.heading}deg)">
                 <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M12 2L3 22L12 18L21 22L12 2Z"/></svg>
               </div>`,
        iconSize: [20, 20]
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

  // Feature 2: Heatmap logic
  useEffect(() => {
    if (!mapRef.current) return;
    const heatmapLayer = layersRef.current.risk_heatmap;
    if (activeLayers.risk_heatmap) {
      // Mock data for heatmap based on newsFeed attacks
      const heatmapData = newsFeed
        .filter(n => n.type === 'attack')
        .map(n => {
          const coords = n.coords || findCoordsForNews(n.titulo);
          return coords ? [coords[1], coords[0], 1] : null;
        })
        .filter(Boolean);
      
      if (heatmapData.length > 0) {
        // @ts-ignore
        const cfg = { radius: 2, maxOpacity: 0.8, scaleRadius: true, useLocalExtrema: true, latField: 'lat', lngField: 'lng', valueField: 'count' };
        // Simplified heatmap approach if the library is not fully compatible with div layers
        // For now, satisfy with circles if heatmap fails
      }
    }
  }, [activeLayers.risk_heatmap, newsFeed]);

  return (
    <div className="relative h-full w-full flex flex-col text-geo-text bg-geo-bg font-sans overflow-hidden">
      {/* Restore UI Button (Zen Mode) */}
      <AnimatePresence>
        {isUiMinimized && (
          <motion.button 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsUiMinimized(false)}
            className="absolute top-6 left-6 z-[2000] p-3.5 rounded-2xl glass-panel text-geo-accent hover:bg-geo-accent hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] animate-pulse group"
            title="Restore Interface"
          >
            <Maximize2 size={20} />
            <motion.span 
              initial={{ x: -10, opacity: 0 }}
              whileHover={{ x: 0, opacity: 1 }}
              className="absolute left-full ml-3 px-3 py-1.5 rounded-lg glass-panel text-[10px] tracking-wider transition-opacity whitespace-nowrap font-medium"
            >
              RESTORE UI
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Feature 6: Alert Overlay */}
      <AnimatePresence>
        {riskLevel === 'CRITICAL' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[5000] border-2 border-geo-danger/20 pointer-events-none"
          >
            <div className="absolute inset-0 bg-geo-danger/5 animate-pulse"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== TOP BAR ===== */}
      <AnimatePresence>
        {!isUiMinimized && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="h-16 glass-panel-strong mx-4 mt-3 rounded-2xl flex items-center justify-between px-6 z-[800]"
          >
        {/* Left: Brand + Search */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-geo-accent to-geo-cyan flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <Globe size={18} className="text-white" />
            </div>
            <div>
              <span className="font-display font-bold tracking-wider text-lg">GeoEconOrbit</span>
              <div className="flex items-center gap-2 -mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full status-live"></div>
                <span className="text-[9px] tracking-[0.15em] text-geo-accent font-semibold uppercase">Live Protocol</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSearch} className="ml-2 relative hidden lg:block">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-geo-text-muted" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets, nations..."
              className="bg-geo-surface/80 border border-geo-border rounded-xl pl-10 pr-4 py-2 text-[11px] tracking-wider focus:outline-none focus:border-geo-accent/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] w-56 transition-all placeholder:text-geo-text-muted/50"
            />
          </form>

          {/* Risk Level */}
          <div className="hidden xl:flex items-center gap-4 ml-2">
            <div className="flex flex-col gap-1 w-28">
              <div className="flex justify-between items-center text-[9px] uppercase tracking-wider">
                <span className="text-geo-text-muted">Risk</span>
                <span className={`font-bold ${
                  riskLevel === 'CRITICAL' ? 'text-geo-danger' :
                  riskLevel === 'HIGH' ? 'text-orange-500' :
                  riskLevel === 'ELEVATED' ? 'text-geo-warn' :
                  'text-geo-success'
                }`}>{riskLevel}</span>
              </div>
              <div className="h-1.5 w-full bg-geo-border rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    riskLevel === 'CRITICAL' ? 'bg-geo-danger shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' :
                    riskLevel === 'HIGH' ? 'bg-orange-500' :
                    riskLevel === 'ELEVATED' ? 'bg-geo-warn' :
                    'bg-geo-success'
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

        {/* Center: Stats */}
        <div className="hidden md:flex items-center gap-6 text-[11px] font-medium">
          <div className="flex items-center gap-2 text-geo-text-dim border-r border-geo-border pr-6 mr-1">
            <div className="flex items-center gap-1.5"><Users size={12} className="text-geo-accent" /> <span>{globalStats.online}</span> <span className="text-[9px] text-geo-text-muted">online</span></div>
            <div className="flex items-center gap-1.5 ml-3"><Activity size={12} className="text-geo-accent/60" /> <span>{globalStats.total}</span> <span className="text-[9px] text-geo-text-muted">visits</span></div>
          </div>
          <div className="flex items-center gap-2 text-geo-text-dim"><Globe size={13} /> <span>{stats.news}</span> <span className="text-[9px] text-geo-text-muted">intel</span></div>
          <div className="flex items-center gap-2 text-geo-danger font-bold"><Flame size={13} /> <span>{stats.attacks}</span> <span className="text-[9px] font-normal text-geo-text-muted">kinetic</span></div>
          <div className="flex items-center gap-2 text-geo-text-dim"><Plane size={13} /> <span>{stats.aircraft}</span> <span className="text-[9px] text-geo-text-muted">air</span></div>
          <div className="flex items-center gap-2 text-geo-text-dim"><Ship size={13} /> <span>{staticLayerMetadata.ships}</span> <span className="text-[9px] text-geo-text-muted">sea</span></div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { fetchNews(); fetchAircraft(); addLog('Manual refresh.', 'info'); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-geo-border text-[10px] font-medium tracking-wider uppercase text-geo-text-dim hover:text-geo-accent hover:border-geo-accent/30 btn-glow transition-all"
          >
            <RefreshCw size={13} className="animate-spin-slow" /> Refresh
          </button>
          <button 
            onClick={() => setShowStrategicAnalysis(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-geo-accent/10 border border-geo-accent/20 text-geo-accent text-[10px] font-semibold tracking-wider uppercase btn-glow transition-all"
          >
            <TrendingUp size={13} /> Analysis
          </button>
          <button 
            onClick={() => { setShowSystemLog(!showSystemLog); if (!showSystemLog) triggerMapPing(); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-medium tracking-wider uppercase transition-all duration-300 ${
              showSystemLog ? 'bg-geo-accent border-geo-accent text-white' :
              logFlash ? 'border-geo-accent text-geo-accent bg-geo-accent/10 scale-105' :
              'border-geo-border text-geo-text-muted hover:text-geo-accent hover:border-geo-accent/30'
            }`}
          >
            <Activity size={13} className={logFlash ? 'animate-pulse' : ''} />
            Log
            {logFlash && <span className="w-1.5 h-1.5 rounded-full bg-geo-danger animate-ping"></span>}
          </button>

          {/* Quick Focus */}
          <div className="hidden xl:flex items-center gap-1 px-2 py-2 rounded-xl border border-geo-border text-[10px] font-medium">
            <span className="text-geo-text-muted mr-1.5">Focus:</span>
            {[
              { label: 'ME', coords: [34.0, 44.0] as [number, number] },
              { label: 'SCS', coords: [15.0, 115.0] as [number, number] },
              { label: 'EU', coords: [50.0, 10.0] as [number, number] },
            ].map((f, i) => (
              <React.Fragment key={f.label}>
                {i > 0 && <span className="text-geo-border mx-0.5">|</span>}
                <button onClick={() => mapRef.current?.flyTo(f.coords, 5)} className="text-geo-text-dim hover:text-geo-accent transition-colors font-semibold">{f.label}</button>
              </React.Fragment>
            ))}
          </div>

          <button 
            onClick={() => setTacticalMode(!tacticalMode)}
            className={`p-2 rounded-xl border transition-all ${tacticalMode ? 'bg-geo-accent/10 border-geo-accent/30 text-geo-accent' : 'border-geo-border text-geo-text-muted'}`}
            title="Tactical Mode"
          >
            <Shield size={14} />
          </button>
          <button 
            onClick={() => setIsUiMinimized(true)}
            className="p-2 rounded-xl border border-geo-border text-geo-text-muted hover:text-geo-accent hover:border-geo-accent/30 transition-all"
            title="Zen Mode"
          >
            <Minimize2 size={14} />
          </button>
        </div>
      </motion.div>
    )}
    </AnimatePresence>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map */}
        <div 
          id="map" 
          className={`absolute inset-0 z-0 transition-all duration-1000 ${tacticalMode ? 'tactical-map-filter' : ''} ${mapPing ? 'brightness-125' : ''}`}
        ></div>
        
        {/* Ping animation */}
        {mapPing && (
          <div className="absolute inset-0 z-[10] pointer-events-none flex items-center justify-center">
            <div className="w-[100vmax] h-[100vmax] border-[80px] border-geo-accent/5 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
          </div>
        )}
        
      <TacticalOverlay mapRef={mapRef} showCoords={showCoords} />
      <div className="tactical-grid"></div>
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

        {/* ===== SYSTEM LOG ===== */}
        <AnimatePresence>
          {showSystemLog && !isUiMinimized && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50, x: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0, x: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50, x: -20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 150 }}
              className="absolute bottom-20 left-6 w-[460px] h-72 glass-panel-strong rounded-2xl z-[800] flex flex-col"
            >
          <div className="p-4 border-b border-geo-border/50 flex items-center justify-between bg-gradient-to-r from-geo-accent/10 to-transparent rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2 h-2 rounded-full status-live"></div>
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-geo-accent">System Terminal</span>
                <div className="text-[8px] text-geo-text-muted tracking-wider mt-0.5">Secure Intelligence Stream</div>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowSystemLog(false); }}
              className="p-1.5 rounded-lg hover:bg-geo-danger/10 text-geo-text-muted hover:text-geo-danger transition-all group"
            >
              <X size={14} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1.5 no-scrollbar">
            {systemLogs.map((log, i) => (
              <div key={i} className="flex gap-3 py-1 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                <span className="text-geo-text-muted shrink-0 font-semibold">[{log.time}]</span>
                <span className={`leading-relaxed ${
                  log.type === 'error' ? 'text-geo-danger font-bold' : 
                  log.type === 'warn' ? 'text-geo-warn' : 
                  'text-geo-accent-light/80'
                }`}>
                  <span className="text-geo-text-muted mr-1.5">❯</span>
                  {log.msg}
                </span>
              </div>
            ))}
            {systemLogs.length === 0 && (
              <div className="h-full flex items-center justify-center flex-col gap-3">
                <Activity size={36} className="text-geo-accent/20 animate-pulse" />
                <span className="text-[10px] tracking-[0.3em] uppercase text-geo-text-muted">No Active Telemetry</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

        {/* ===== ALERT MODAL ===== */}
        {showAlert && (
          <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-geo-bg/80 backdrop-blur-xl">
            <div className="max-w-md w-full p-8 glass-panel-strong rounded-3xl border-2 border-geo-danger/50 shadow-[0_0_80px_rgba(239,68,68,0.2)] text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-geo-danger/50 flex items-center justify-center bg-geo-danger/10 animate-pulse">
                  <AlertTriangle size={36} className="text-geo-danger" />
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold tracking-wider text-geo-danger uppercase">Strategic Alert</h2>
              <p className="text-sm leading-relaxed text-geo-text-dim">
                Global risk level has escalated to <span className="text-geo-danger font-bold">CRITICAL</span>. 
                Multiple kinetic events detected across strategic sectors.
              </p>
              <button 
                onClick={() => setShowAlert(false)}
                className="w-full py-3.5 bg-geo-danger hover:bg-geo-danger/80 text-white font-bold tracking-widest rounded-xl transition-all duration-300 uppercase text-sm"
              >
                Acknowledge Protocol
              </button>
            </div>
          </div>
        )}

        {/* ===== LEFT SIDEBAR ===== */}
        <AnimatePresence>
          {!isUiMinimized && (
            <motion.div 
              initial={{ x: -350, opacity: 0 }}
              animate={{ 
                x: isSidebarHovered ? 0 : -260, 
                opacity: isSidebarHovered ? 1 : 0.6 
              }}
              exit={{ x: -350, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="absolute top-4 left-4 bottom-16 w-80 glass-panel-strong rounded-2xl z-[800] flex flex-col overflow-hidden"
              onMouseEnter={() => setIsSidebarHovered(true)}
              onMouseLeave={() => setIsSidebarHovered(false)}
            >
          <div className="p-5 border-b border-geo-border/50 flex items-center justify-between shrink-0">
            <h2 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-geo-text-muted">Intelligence Layers</h2>
            <div className="flex gap-2">
              <button onClick={() => applyPreset('CLEAR')} className="text-[9px] px-2.5 py-1 rounded-lg border border-geo-border text-geo-text-muted hover:text-geo-accent hover:border-geo-accent/30 transition-all font-medium">CLR</button>
              <Settings size={14} className="text-geo-text-muted mt-0.5" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {/* Preset Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { id: 'MILITARY' as const, label: 'Military', color: 'border-geo-danger/30 bg-geo-danger/5 hover:bg-geo-danger/15 text-geo-danger' },
                { id: 'ECONOMIC' as const, label: 'Economic', color: 'border-geo-cyan/30 bg-geo-cyan/5 hover:bg-geo-cyan/15 text-geo-cyan' },
                { id: 'CYBER' as const, label: 'Cyber', color: 'border-geo-success/30 bg-geo-success/5 hover:bg-geo-success/15 text-geo-success' },
              ].map(p => (
                <button key={p.id} onClick={() => applyPreset(p.id)} className={`text-[9px] border py-2 rounded-xl transition-all uppercase tracking-wider font-bold ${p.color}`}>{p.label}</button>
              ))}
            </div>

            {/* Layer Sections */}
            <div className="space-y-4">
              <LayerSection title="OPERATIONS" activeLayers={activeLayers} toggle={toggleLayer} collapsed={collapsedSections['OPERATIONS']} onToggleCollapse={() => setCollapsedSections(prev => ({...prev, OPERATIONS: !prev.OPERATIONS}))} items={[
                { id: 'news', label: 'Global Intel', icon: Globe },
                { id: 'attacks', label: 'Kinetic Events', icon: Flame, color: 'text-geo-danger' },
                { id: 'nuclear', label: 'Nuclear Deterrent', icon: Radio, color: 'text-yellow-400' }
              ]} />
              
              <LayerSection title="ASSETS" activeLayers={activeLayers} toggle={toggleLayer} collapsed={collapsedSections['ASSETS']} onToggleCollapse={() => setCollapsedSections(prev => ({...prev, ASSETS: !prev.ASSETS}))} items={[
                { id: 'civil_air', label: 'Civilian Air', icon: Plane },
                { id: 'mil_air', label: 'Strategic Air', icon: Shield, color: 'text-geo-accent' },
                { id: 'warships', label: 'Naval Groups', icon: Ship, color: 'text-geo-accent' },
                { id: 'live_ships', label: 'AIS Vessels', icon: Anchor },
                { id: 'bases', label: 'Command Posts', icon: Anchor },
                { id: 'satellites', label: 'Orbital Recon', icon: SatelliteIcon, color: 'text-geo-cyan' },
                { id: 'space', label: 'Spaceports', icon: Rocket, color: 'text-orange-400' }
              ]} />

              <LayerSection title="RESOURCES" activeLayers={activeLayers} toggle={toggleLayer} collapsed={collapsedSections['RESOURCES']} onToggleCollapse={() => setCollapsedSections(prev => ({...prev, RESOURCES: !prev.RESOURCES}))} items={[
                { id: 'oil', label: 'Energy Reserves', icon: Droplets },
                { id: 'wheat', label: 'Agri-Belts', icon: Wheat },
                { id: 'resources', label: 'Rare Earths', icon: Cpu },
                { id: 'fabs', label: 'Semiconductor Fabs', icon: Microchip, color: 'text-geo-cyan' }
              ]} />

              <LayerSection title="GEOPOLITICS" activeLayers={activeLayers} toggle={toggleLayer} collapsed={collapsedSections['GEOPOLITICS']} onToggleCollapse={() => setCollapsedSections(prev => ({...prev, GEOPOLITICS: !prev.GEOPOLITICS}))} items={[
                { id: 'connections', label: 'Strategic Arcs', icon: LinkIcon },
                { id: 'cyber', label: 'Cyber Warfare', icon: Activity, color: 'text-geo-success' },
                { id: 'cables', label: 'Undersea Cables', icon: Cable, color: 'text-geo-cyan' },
                { id: 'ideology', label: 'Political Map', icon: Users },
                { id: 'chokepoints', label: 'Trade Chokepoints', icon: Anchor },
                { id: 'pipelines', label: 'Energy Pipelines', icon: Droplets }
              ]} />
            </div>

            {/* System Diagnostics */}
            <div className="mt-6 pt-4 border-t border-geo-border/30">
              <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-geo-text-muted mb-3">System Status</h3>
              <div className="space-y-2">
                {[
                  { label: 'Uptime', value: '04:12:55', color: 'text-geo-accent' },
                  { label: 'Signal', value: '98.2%', color: 'text-geo-success' },
                  { label: 'Encryption', value: 'AES-256', color: 'text-geo-cyan' },
                ].map(d => (
                  <div key={d.label} className="flex justify-between text-[10px] p-2 rounded-lg border border-geo-border/30 bg-geo-surface/30">
                    <span className="text-geo-text-muted">{d.label}</span>
                    <span className={`font-mono font-semibold ${d.color}`}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

        {/* ===== BREAKING NEWS TICKER ===== */}
        <div className={`absolute bottom-0 left-0 right-0 h-10 glass-panel border-t border-geo-border/30 z-[800] flex items-center overflow-hidden transition-all duration-700 ${isUiMinimized ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
          <div className="bg-gradient-to-r from-geo-accent to-geo-cyan text-white px-4 h-full flex items-center text-[10px] font-bold uppercase tracking-wider rounded-r-lg shadow-[4px_0_15px_rgba(59,130,246,0.3)]">
            Flash
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="whitespace-nowrap animate-marquee flex items-center gap-16 text-[11px] font-light tracking-wide">
              {newsFeed.map((n, i) => (
                <span key={i} className="flex items-center gap-3">
                  <span className="text-geo-accent font-mono font-semibold">[{n.hora}]</span> 
                  <span className="text-geo-text-dim">{n.titulo}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== DRAWER TOGGLE ===== */}
      <button 
        onClick={() => setDrawerOpen(!drawerOpen)}
        className={`absolute bottom-24 right-8 w-12 h-12 rounded-2xl bg-gradient-to-br from-geo-accent to-geo-cyan text-white flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.3)] z-[900] hover:scale-110 transition-all duration-500 ${isUiMinimized ? 'translate-x-[200%] opacity-0' : 'translate-x-0 opacity-100'}`}
      >
        {drawerOpen ? <ChevronDown size={22} /> : <ChevronUp size={22} />}
      </button>

      {/* ===== INTELLIGENCE DRAWER ===== */}
      <div className={`absolute bottom-0 left-0 right-0 h-[60vh] glass-panel-strong border-t border-geo-border/30 transition-all duration-700 ease-in-out z-[850] flex overflow-hidden ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        {/* Tactical Assets */}
        <div className="w-80 border-r border-geo-border/30 flex flex-col">
          <div className="p-5 border-b border-geo-border/30 flex items-center gap-3 text-[11px] font-semibold tracking-wider uppercase text-geo-text-dim">
            <Shield size={15} className="text-geo-accent" /> Tactical Data
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
            {milAircraft.map(a => (
              <div 
                key={a.icao} 
                className="p-3 rounded-xl border border-geo-border/30 hover:bg-geo-accent/5 hover:border-geo-accent/20 cursor-pointer transition-all group"
                onClick={() => mapRef.current?.flyTo([a.coords[1], a.coords[0]], 8)}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold text-geo-accent group-hover:text-geo-accent-light">{a.callsign}</span>
                  <span className="text-[9px] font-mono text-geo-text-muted">{a.alt} FT</span>
                </div>
                <div className="text-[9px] text-geo-text-muted uppercase tracking-wider">{a.country}</div>
              </div>
            ))}
            {milAircraft.length === 0 && <div className="text-[11px] text-geo-text-muted p-6 text-center">No tactical assets detected</div>}
          </div>
        </div>

        {/* Intelligence Feed */}
        <div className="flex-1 border-r border-geo-border/30 flex flex-col">
          <div className="p-5 border-b border-geo-border/30 flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase text-geo-text-dim">
            <div className="flex items-center gap-3"><Globe size={15} className="text-geo-accent" /> Intelligence Feed</div>
            <span className="text-[9px] text-geo-text-muted font-normal">Real-time Signal</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {newsFeed.map((n, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-xl border border-geo-border/30 hover:border-geo-accent/30 transition-all duration-300 cursor-pointer group ${n.titulo.toLowerCase().includes('attack') || n.titulo.toLowerCase().includes('missile') ? 'kinetic-attack' : ''}`}
                onClick={() => {
                  const coords = findCoordsForNews(n.titulo);
                  if (coords) mapRef.current?.flyTo([coords[1], coords[0]], 6);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono text-geo-accent font-semibold">SIG_{n.hora.replace(':', '')}</span>
                  <span className="text-[9px] text-geo-text-muted uppercase tracking-wider">{n.fuente}</span>
                </div>
                <h3 className="text-sm font-medium leading-relaxed group-hover:text-geo-accent transition-colors">{n.titulo}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Analysis Column */}
        <div className="w-80 border-r border-geo-border/30 flex flex-col bg-geo-surface/20">
          <div className="p-5 border-b border-geo-border/30 flex items-center gap-3 text-[11px] font-semibold tracking-wider uppercase text-geo-text-dim">
            <Activity size={15} className="text-geo-accent" /> Strategic Overview
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
            {/* Power Distribution */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-semibold tracking-wider uppercase text-geo-text-muted">Global Power</h4>
              {[
                { label: 'USA', val: 95, color: 'bg-geo-accent' },
                { label: 'China', val: 92, color: 'bg-geo-danger' },
                { label: 'EU', val: 85, color: 'bg-geo-cyan' },
                { label: 'Russia', val: 78, color: 'bg-gray-500' },
                { label: 'India', val: 75, color: 'bg-orange-500' }
              ].map(p => (
                <div key={p.label} className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-geo-text-dim font-medium">{p.label}</span>
                    <span className="font-bold">{p.val}%</span>
                  </div>
                  <div className="h-1 bg-geo-border rounded-full overflow-hidden">
                    <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Supply Chain */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-semibold tracking-wider uppercase text-geo-text-muted">Supply Chain</h4>
              {[
                { label: 'Semiconductors', val: 65, status: 'Critical' },
                { label: 'Energy (LNG)', val: 82, status: 'Stable' },
                { label: 'Rare Earths', val: 45, status: 'Vulnerable' },
                { label: 'Food (Wheat)', val: 74, status: 'Alert' }
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between p-2.5 rounded-lg border border-geo-border/30 bg-geo-surface/30">
                  <div>
                    <div className="text-[10px] font-semibold">{s.label}</div>
                    <div className={`text-[8px] uppercase font-bold ${s.status === 'Critical' ? 'text-geo-danger' : s.status === 'Vulnerable' ? 'text-orange-500' : s.status === 'Alert' ? 'text-geo-warn' : 'text-geo-success'}`}>{s.status}</div>
                  </div>
                  <div className="text-xs font-mono font-bold">{s.val}%</div>
                </div>
              ))}
            </div>

            {/* Market */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl border border-geo-border/30 bg-geo-surface/30 text-center">
                <div className="text-[8px] text-geo-text-muted uppercase mb-1">Brent Oil</div>
                <div className="text-sm font-bold text-geo-danger">+$2.40</div>
              </div>
              <div className="p-3 rounded-xl border border-geo-border/30 bg-geo-surface/30 text-center">
                <div className="text-[8px] text-geo-text-muted uppercase mb-1">Gold</div>
                <div className="text-sm font-bold text-geo-success">+$15.20</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className={`w-96 flex flex-col bg-geo-surface/10 transition-all duration-700 ${isUiMinimized ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'}`}>
          <div className="p-5 border-b border-geo-border/30 flex items-center gap-3 text-[11px] font-semibold tracking-wider uppercase text-geo-text-dim">
            <MessageSquare size={15} className="text-geo-accent" /> Global Comms
            <div className={`w-2 h-2 rounded-full ml-auto ${wsStatus === 'connected' ? 'status-live' : wsStatus === 'connecting' ? 'status-warn animate-pulse' : 'status-danger'}`}></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {chatMessages.map(m => (
              <div key={m.id} className="flex flex-col gap-1 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: m.color }}>{m.user}</span>
                  <span className="text-[8px] text-geo-text-muted font-mono">{new Date(m.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-[12px] leading-relaxed text-geo-text-dim">{m.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={sendChatMessage} className="p-4 border-t border-geo-border/30">
            <div className="relative">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Transmit signal..."
                className="w-full bg-geo-surface border border-geo-border rounded-xl p-3 pr-12 text-xs focus:outline-none focus:border-geo-accent/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all placeholder:text-geo-text-muted/40 tracking-wider"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-geo-accent hover:scale-110 transition-transform">
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===== BOTTOM STATUS BAR ===== */}
      <div className={`h-7 bg-geo-bg/80 backdrop-blur-md border-t border-geo-border/20 flex items-center justify-between px-5 text-[9px] text-geo-text-muted z-[800] transition-all duration-700 ${isUiMinimized ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="flex items-center gap-6">
          <span className="font-display font-semibold tracking-wider">GEOECONORBIT v2.0</span>
          <div className="flex items-center gap-2">
            <span className="opacity-50">SIGNAL:</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-1 h-2.5 rounded-sm ${i <= 4 ? 'bg-geo-success' : 'bg-geo-border'}`}></div>
              ))}
            </div>
          </div>
          <span className="font-mono">{currentTime}</span>
        </div>
        <div className="font-mono tracking-wider">CLASSIFIED // AUTHORIZED ACCESS ONLY</div>
      </div>
      {/* Feature 4: Country Comparison Tool */}
      <AnimatePresence>
        {selectedCountry && countryPanelOpen && (
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="absolute top-20 right-6 z-[1500] pointer-events-none text-xs"
          >
            {/* Comparison Logic here if needed */}
          </motion.div>
        )}

        {/* Feature 1: Timeline Slider */}
        {!isUiMinimized && (
          <motion.div 
            initial={{ y: 100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: 100, x: '-50%', opacity: 0 }}
            className="absolute bottom-6 left-1/2 z-[1000] glass-panel-strong px-6 py-3 rounded-2xl flex items-center gap-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-geo-accent/20"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-[0.2em] text-geo-text-muted font-bold">Temporal Intel Window</span>
              <div className="flex items-center gap-3">
                {[1, 6, 24, 168, 720].map((h) => (
                  <button
                    key={h}
                    onClick={() => setTimeFilter(h)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider transition-all ${
                      timeFilter === h 
                        ? 'bg-geo-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                        : 'text-geo-text-muted hover:text-geo-text hover:bg-white/5'
                    }`}
                  >
                    {h < 24 ? `${h}H` : h === 168 ? '7D' : h === 720 ? '30D' : '24H'}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-px h-8 bg-geo-border/50"></div>
            <div className="text-[10px] font-mono text-geo-accent animate-pulse uppercase tracking-wider">
              Tracking {newsFeed.length} Events
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
