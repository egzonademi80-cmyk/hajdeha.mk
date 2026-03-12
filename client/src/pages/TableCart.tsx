import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  ShoppingBag,
  Wifi,
  WifiOff,
  Users,
  CheckCircle,
  UtensilsCrossed,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MenuItem {
  id: number;
  name: string;
  price: string;
  category: string;
  active: boolean;
  imageUrl?: string | null;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

interface Props {
  restaurantSlug: string;
  tableNumber: number;
}

function parsePrice(price: string): number {
  return parseInt(price.replace(/[^0-9]/g, "")) || 0;
}

type View = "menu" | "cart";

export default function TableCart({ restaurantSlug, tableNumber }: Props) {
  const pin = String(tableNumber).padStart(4, "0");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<View>("menu");
  const [activeCategory, setActiveCategory] = useState("All");
  const [connected, setConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [justAdded, setJustAdded] = useState<number | null>(null);
  const [ordered, setOrdered] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const isLocal = useRef(false);

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["table-restaurant", restaurantSlug],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantSlug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const menuItems: MenuItem[] = useMemo(
    () => (restaurant?.menuItems || []).filter((i) => i.active),
    [restaurant],
  );

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map((i) => i.category)));
    return ["All", ...cats];
  }, [menuItems]);

  const filtered = useMemo(
    () =>
      activeCategory === "All"
        ? menuItems
        : menuItems.filter((i) => i.category === activeCategory),
    [menuItems, activeCategory],
  );

  // ─── WebSocket Setup ──────────────────────────────────────────────
  useEffect(() => {
    if (!restaurant?.id) return;

    let ws: WebSocket;
    let reconnectTimeout: number;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      // explicitly your domain
      const host = "hajdeha.com";
      ws = new WebSocket(`${protocol}//${host}/ws/table`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send(
          JSON.stringify({ type: "join", pin, restaurantId: restaurant.id }),
        );
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "cart_update" && !isLocal.current) setCart(msg.cart);
          if (msg.type === "peer_count") setPeerCount(msg.count);
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimeout = window.setTimeout(connect, 2000);
      };

      ws.onerror = (err) => {
        console.error("WS error:", err);
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [restaurant?.id, pin]);

  const syncCart = useCallback((newCart: CartItem[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      isLocal.current = true;
      wsRef.current.send(
        JSON.stringify({ type: "cart_update", cart: newCart }),
      );
      setTimeout(() => (isLocal.current = false), 100);
    }
  }, []);

  const addItem = (item: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      const next =
        idx >= 0
          ? prev.map((i, n) => (n === idx ? { ...i, qty: i.qty + 1 } : i))
          : [
              ...prev,
              {
                id: item.id,
                name: item.name,
                price: parsePrice(item.price),
                qty: 1,
              },
            ];
      syncCart(next);
      return next;
    });
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 700);
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) => {
      const next = prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0);
      syncCart(next);
      return next;
    });
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  const placeOrder = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "place_order", cart, tableNumber }),
      );
    }
    setOrdered(true);
    setTimeout(() => {
      setOrdered(false);
      setCart([]);
    }, 3000);
  };

  // ─── Loading / Error ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-9 w-9 text-primary" />
        </motion.div>
        <p className="text-sm font-medium">Duke ngarkuar menunë…</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center gap-4 p-8 text-center">
        <UtensilsCrossed className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground max-w-xs">
          Restoranti nuk u gjet. Kontrolloni URL-në dhe provoni përsëri.
        </p>
      </div>
    );
  }

  return (
    <div
      className="h-[100dvh] w-screen flex flex-col overflow-hidden bg-background"
      data-testid="table-cart-page"
    >
      {/* Keep all your menu + cart JSX here */}
    </div>
  );
}
