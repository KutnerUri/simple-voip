import { serve, type ServerWebSocket } from "bun";
import index from "./webapp/index.html";

const clients = new Set<ServerWebSocket>();

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async (req) => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
    "/ws": async (req, server) => {
      if (server.upgrade(req)) return;
      return new Response("WebSocket signaling server");
    },
  },
  websocket: {
    open(ws) {
      clients.add(ws);
    },
    message(ws, msg) {
      // Forward message to everyone except sender
      for (const client of clients) {
        if (client !== ws) client.send(msg);
      }
    },
    close(ws) {
      clients.delete(ws);
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
  tls: {
    cert: Bun.file("./certs/local_network.pem"), 
    key:  Bun.file("./certs/local_network-key.pem")
  }
});

console.log(`🚀 Server running at ${server.url}`);
