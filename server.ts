import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const PORT = process.env.PORT || 3000;

  // WebSocket Server
  const wss = new WebSocketServer({ noServer: true });
  const messages: any[] = [];

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);
    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", (ws) => {
    ws.send(JSON.stringify({ type: "history", data: messages }));
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

  // API Proxy for GDELT
  let lastGdeltFetch = 0;
  app.get("/api/gdelt", async (req, res) => {
    try {
      const now = Date.now();
      if (lastGdeltFetch !== 0 && now - lastGdeltFetch < 5000) return res.json({ articles: [] });
      lastGdeltFetch = now;
      const query = "attack conflict missile military war sourcelang:eng";
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=50&sort=DateDesc&format=json&timespan=360min`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("GDELT fetch failed");
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.json({ articles: [] });
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
