import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import fs from "fs";
import Parser from "rss-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const PORT = process.env.PORT || 3000;

  // WebSocket Server
  const wss = new WebSocketServer({ noServer: true });
  const messages: any[] = [];
  
  // Persistent Statistics
  let totalVisits = 0;
  const statsFile = path.join(process.cwd(), "visits.json");
  
  try {
    if (fs.existsSync(statsFile)) {
      const data = JSON.parse(fs.readFileSync(statsFile, "utf-8"));
      totalVisits = data.total || 0;
    }
  } catch (e) {
    console.error("Error reading visits.json", e);
  }

  const saveStats = () => {
    try {
      fs.writeFileSync(statsFile, JSON.stringify({ total: totalVisits }));
    } catch (e) {}
  };

  const broadcastStats = () => {
    const data = JSON.stringify({ 
      type: "stats", 
      data: { 
        online: wss.clients.size,
        total: totalVisits
      } 
    });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    });
  };

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);
    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", (ws) => {
    totalVisits++;
    saveStats();
    
    ws.send(JSON.stringify({ type: "history", data: messages }));
    broadcastStats();

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "chat") {
          const newMsg = { ...msg.data, timestamp: new Date().toISOString(), id: Math.random().toString(36).substring(2, 9) };
          messages.push(newMsg);
          if (messages.length > 100) messages.shift();
          const broadcastData = JSON.stringify({ type: "chat", data: newMsg });
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) client.send(broadcastData);
          });
        }
      } catch (e) {}
    });

    ws.on("close", () => {
      broadcastStats();
    });
  });

  // API Proxy for OpenSky (CORS bypass)
  app.get("/api/aircraft", async (req, res) => {
    const fetchWithRetry = async (retries = 3): Promise<any> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const response = await fetch("https://opensky-network.org/api/states/all", {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          }
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        return await response.json();
      } catch (err: any) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 2000));
          return fetchWithRetry(retries - 1);
        }
        throw err;
      }
    };

    try {
      const data = await fetchWithRetry();
      res.json(data);
    } catch (error: any) {
      const now = Math.floor(Date.now() / 1000);
      const simulatedStates = [
        ["ae0123", "FORTE10 ", "United States", now, now, 34.5, 48.2, 15000, false, 220, 180, 0, null, 15000, "1234", false, 0],
        ["ae4567", "RCH882  ", "United States", now, now, 15.2, 24.5, 32000, false, 450, 90, 0, null, 32000, "5678", false, 0],
        ["ae8901", "LAGR22  ", "United Kingdom", now, now, -2.5, 51.2, 28000, false, 410, 270, 0, null, 28000, "9012", false, 0]
      ];
      res.json({ states: simulatedStates });
    }
  });

  // Autonomous News Engine
  const parser = new Parser({
    customFields: {
      item: ['media:content', 'description'],
    }
  });

  const NEWS_SOURCES = [
    { name: 'Reuters World', url: 'https://www.reutersagency.com/en/rss/' },
    { name: 'BBC World News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    { name: 'Associated Press', url: 'https://feeds.apnews.com/rss/apf-topnews' },
    { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
    { name: 'NPR World', url: 'https://feeds.npr.org/1004/rss.xml' },
    { name: 'UN News', url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml' },
    { name: 'Defense News', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/' },
    { name: 'El País Int', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/internacional/portada' }
  ];

  // Capital/Region Coordinates for Geolocation fallback
  const REGION_COORDS: Record<string, [number, number]> = {
    'Ukraine': [31.2, 48.4], 'Russia': [105.3, 61.5], 'Iran': [53.7, 32.4], 'Israel': [34.9, 31.0], 
    'Lebanon': [35.9, 33.9], 'Syria': [39.0, 34.8], 'Taiwan': [121.0, 23.7], 'China': [104.2, 35.9], 
    'USA': [-95.7, 37.1], 'Korea': [127.8, 35.9], 'Yemen': [48.5, 15.6], 'Gaza': [34.4, 31.5],
    'Madrid': [-3.7, 40.4], 'London': [-0.1, 51.5], 'Washington': [-77, 38.9], 'Beijing': [116.4, 39.9],
    'Brussels': [4.3, 50.8], 'Paris': [2.3, 48.8], 'Berlin': [13.4, 52.5]
  };

  app.get("/api/news", async (req, res) => {
    try {
      const now = Date.now();
      const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours ago
      let results: any[] = [];

      // 1. Fetch GDELT GeoJSON (Increased volume and broader query)
      try {
        const query = "(conflict OR attack OR military OR war OR economy OR sanction OR unrest OR geopolitics)";
        const gdeltGeoUrl = `https://api.gdeltproject.org/api/v2/geo/geo?query=${encodeURIComponent(query)}&format=geojson&maxrecords=250&timespan=1440`;
        const gdeltRes = await fetch(gdeltGeoUrl);
        if (gdeltRes.ok) {
          const data = await gdeltRes.json();
          if (data.features) {
            const gdeltItems = data.features.map((f: any) => ({
              id: `gdelt-${f.properties.url}`,
              titulo: f.properties.name || "Geopolitical Incident",
              desc: `Reported events in this area. Impact level: ${f.properties.count}`,
              fuente: 'GDELT GEO',
              hora: new Date(now).toLocaleTimeString(),
              coords: f.geometry.coordinates,
              type: 'intel',
              timestamp: now
            }));
            results = [...results, ...gdeltItems];
          }
        }
      } catch (e) { console.error("GDELT Geo error", e); }

      // 2. Fetch RSS Feeds
      for (const source of NEWS_SOURCES) {
        try {
          const feed = await parser.parseURL(source.url);
          const items = feed.items.slice(0, 40).map(item => {
            // Basic Geolocation fallback based on title/content keywords
            let coords = null;
            const fullText = (item.title + " " + item.contentSnippet).toLowerCase();
            for (const [region, coord] of Object.entries(REGION_COORDS)) {
              if (fullText.includes(region.toLowerCase())) {
                coords = coord;
                break;
              }
            }
            // Default to Brussels (NATO/EU hub) if no match found
            if (!coords) coords = REGION_COORDS["Brussels"];

            return {
              id: item.guid || item.link,
              titulo: item.title,
              desc: item.contentSnippet || item.description,
              fuente: source.name,
              hora: new Date(item.pubDate || now).toLocaleTimeString(),
              coords: coords,
              type: 'news',
              link: item.link,
              timestamp: new Date(item.pubDate || now).getTime()
            };
          });
          results = [...results, ...items];
        } catch (e) { console.error(`RSS Error ${source.name}`, e); }
      }

      // Filter by 24h and remove duplicates
      const uniqueResults = results
        .filter(item => item.timestamp > cutoff)
        .filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

      res.json({ news: uniqueResults });
  app.get("/api/flights", async (req, res) => {
    try {
      // Global bounding box for high-level saturation
      const url = "https://opensky-network.org/api/states/all";
      const flightRes = await fetch(url);
      if (flightRes.ok) {
        const data = await flightRes.json();
        // Limit to 400 flights for performance
        const flights = (data.states || []).slice(0, 400).map((s: any) => ({
          icao: s[0],
          callsign: s[1]?.trim() || 'UNK',
          country: s[2],
          lon: s[5],
          lat: s[6],
          alt: s[7],
          heading: s[10],
          velocity: s[9]
        }));
        res.json({ flights });
      } else {
        res.status(500).json({ flights: [] });
      }
    } catch (e) {
      res.status(500).json({ flights: [] });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Health check for Railway/hosting providers
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
