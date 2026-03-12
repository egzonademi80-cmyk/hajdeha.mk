import { WebSocketServer } from "ws";

export const config = { api: { bodyParser: false } };

let wss: WebSocketServer;
const connections = new Map<string, Set<any>>();

export default function handler(req: any, res: any) {
  if (!res.socket.server.wss) {
    wss = new WebSocketServer({ server: res.socket.server });

    wss.on("connection", (ws: any) => {
      let tablePin = "";

      ws.on("message", (msg: string) => {
        try {
          const data = JSON.parse(msg);

          if (data.type === "join") {
            tablePin = data.pin;
            if (!connections.has(tablePin))
              connections.set(tablePin, new Set());
            connections.get(tablePin)?.add(ws);
            broadcastPeerCount(tablePin);
          }

          if (data.type === "cart_update") {
            broadcastCart(tablePin, data.cart, ws);
          }

          if (data.type === "place_order") {
            broadcastCart(tablePin, [], ws); // clear cart for everyone
          }
        } catch {}
      });

      ws.on("close", () => {
        if (tablePin && connections.has(tablePin)) {
          connections.get(tablePin)?.delete(ws);
          broadcastPeerCount(tablePin);
        }
      });
    });

    res.socket.server.wss = wss;
  }
  res.end();
}

// helpers
function broadcastCart(pin: string, cart: any, sender: any) {
  connections.get(pin)?.forEach((ws: any) => {
    if (ws !== sender && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "cart_update", cart }));
    }
  });
}

function broadcastPeerCount(pin: string) {
  const count = connections.get(pin)?.size || 0;
  connections.get(pin)?.forEach((ws: any) => {
    if (ws.readyState === ws.OPEN)
      ws.send(JSON.stringify({ type: "peer_count", count }));
  });
}
