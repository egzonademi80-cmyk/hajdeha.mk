import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  ShoppingBag,
  Coffee,
  Wifi,
  WifiOff,
  Users,
  CheckCircle,
} from "lucide-react";

interface MenuItem {
  id: number;
  name: string;
  price: string;
  category: string;
  active: boolean;
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

  // Fetch menu
  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["table-restaurant", restaurantSlug],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantSlug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const menuItems: MenuItem[] = useMemo(
    () => (restaurant?.menuItems || []).filter((i: MenuItem) => i.active),
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

  // WebSocket connection — wait for restaurant to load so we have restaurantId
  useEffect(() => {
    if (!restaurant?.id) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/table`);
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
        if (msg.type === "cart_update" && !isLocal.current) {
          setCart(msg.cart);
        }
        if (msg.type === "peer_count") setPeerCount(msg.count);
      } catch {}
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => ws.close();
  }, [pin, restaurant?.id]);

  // Sync cart to WebSocket
  const syncCart = useCallback((newCart: CartItem[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      isLocal.current = true;
      wsRef.current.send(
        JSON.stringify({ type: "cart_update", cart: newCart }),
      );
      setTimeout(() => {
        isLocal.current = false;
      }, 100);
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
    setTimeout(() => setJustAdded(null), 800);
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
    setOrdered(true);
    setTimeout(() => setOrdered(false), 3000);
  };

  return (
    <div
      className="h-[100dvh] w-screen flex flex-col overflow-hidden bg-[#FAFAF8]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div
        className="flex-shrink-0 bg-white border-b border-black/6 px-4 py-3 flex items-center justify-between"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top, 12px))" }}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-amber-500 flex items-center justify-center">
            <Coffee className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-black leading-none">
              {restaurant?.name || "Menu"}
            </p>
            <p
              className="text-[11px] text-black/40 mt-0.5"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              TABLE {tableNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Peer count */}
          {peerCount > 0 && (
            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
              <Users className="h-3 w-3 text-emerald-600" />
              <span className="text-[11px] font-semibold text-emerald-600">
                {peerCount + 1}
              </span>
            </div>
          )}
          {/* Connection status */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${connected ? "bg-emerald-50" : "bg-red-50"}`}
          >
            {connected ? (
              <Wifi className="h-3 w-3 text-emerald-600" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-500" />
            )}
            <span
              className={`text-[10px] font-semibold ${connected ? "text-emerald-600" : "text-red-500"}`}
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {connected ? "LIVE" : "OFF"}
            </span>
          </div>
          {/* Cart button */}
          {itemCount > 0 && (
            <button
              onClick={() => setView(view === "cart" ? "menu" : "cart")}
              className="relative h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center"
            >
              <ShoppingBag className="h-4 w-4 text-white" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                {itemCount}
              </span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── MENU VIEW ── */}
        {view === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Category tabs */}
            <div className="flex-shrink-0 flex gap-2 px-4 py-2.5 overflow-x-auto bg-white border-b border-black/5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeCategory === cat
                      ? "bg-amber-500 text-white"
                      : "bg-black/5 text-black/50 hover:bg-black/8"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Coffee className="h-7 w-7 text-amber-500" />
                  </motion.div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map((item) => {
                    const inCart = cart.find((i) => i.id === item.id);
                    const isJust = justAdded === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => addItem(item)}
                        whileTap={{ scale: 0.95 }}
                        className={`relative p-3.5 rounded-2xl text-left border transition-all ${
                          inCart
                            ? "bg-amber-50 border-amber-200"
                            : "bg-white border-black/8 active:bg-black/3"
                        }`}
                      >
                        {inCart && (
                          <div className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">
                              {inCart.qty}
                            </span>
                          </div>
                        )}
                        <AnimatePresence>
                          {isJust && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute inset-0 rounded-2xl bg-amber-500/10 flex items-center justify-center"
                            >
                              <CheckCircle className="h-6 w-6 text-amber-500" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <p className="text-xs font-semibold text-black/80 leading-snug pr-6 line-clamp-2">
                          {item.name}
                        </p>
                        <p
                          className="text-sm font-bold text-amber-600 mt-1.5"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          {parsePrice(item.price)}{" "}
                          <span className="text-[10px] text-black/25 font-normal">
                            DEN
                          </span>
                        </p>
                        <p className="text-[10px] text-black/30 mt-0.5">
                          {item.category}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sticky cart bar */}
            {itemCount > 0 && (
              <motion.div
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                className="flex-shrink-0 p-4 bg-white border-t border-black/6"
                style={{
                  paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
                }}
              >
                <button
                  onClick={() => setView("cart")}
                  className="w-full h-13 rounded-2xl bg-amber-500 flex items-center justify-between px-5 active:bg-amber-600"
                  style={{ height: 52 }}
                >
                  <span className="h-6 w-6 rounded-full bg-white/25 text-white text-xs font-bold flex items-center justify-center">
                    {itemCount}
                  </span>
                  <span className="text-sm font-bold text-white">
                    View Cart
                  </span>
                  <span
                    className="text-sm font-bold text-white/80"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {total} DEN
                  </span>
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── CART VIEW ── */}
        {view === "cart" && (
          <motion.div
            key="cart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 flex flex-col overflow-hidden bg-[#FAFAF8]"
          >
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <ShoppingBag className="h-10 w-10 text-black/15" />
                  <p className="text-sm text-black/30">Shporta është bosh</p>
                  <button
                    onClick={() => setView("menu")}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold"
                  >
                    Shto artikuj
                  </button>
                </div>
              ) : (
                <>
                  <p
                    className="text-[11px] font-semibold text-black/30 uppercase tracking-wider px-1 pb-1"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    Porosia juaj · Tavolina {tableNumber}
                  </p>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-black/6"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-black/85 truncate">
                          {item.name}
                        </p>
                        <p
                          className="text-xs text-amber-600 mt-0.5"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          {item.price} × {item.qty} = {item.price * item.qty}{" "}
                          DEN
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-black/4 rounded-xl px-2 py-1.5">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="h-6 w-6 rounded-lg flex items-center justify-center active:bg-black/10"
                        >
                          <Minus className="h-3 w-3 text-black/50" />
                        </button>
                        <span
                          className="text-sm font-bold text-black w-5 text-center"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="h-6 w-6 rounded-lg flex items-center justify-center active:bg-black/10"
                        >
                          <Plus className="h-3 w-3 text-black/50" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Total + Order */}
            {cart.length > 0 && (
              <div
                className="flex-shrink-0 p-4 bg-white border-t border-black/6 space-y-3"
                style={{
                  paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
                }}
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm text-black/40">
                    {itemCount} artikuj
                  </span>
                  <span
                    className="text-xl font-bold text-black"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {total} <span className="text-sm text-black/30">DEN</span>
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  {ordered ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full h-14 rounded-2xl bg-emerald-500 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-5 w-5 text-white" />
                      <span className="text-sm font-bold text-white">
                        Porosia u dërgua!
                      </span>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="order"
                      onClick={placeOrder}
                      className="w-full h-14 rounded-2xl bg-black flex items-center justify-center active:bg-black/80"
                      style={{ height: 52 }}
                    >
                      <span className="text-sm font-bold text-white">
                        Porosit · {total} DEN
                      </span>
                    </motion.button>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => setView("menu")}
                  className="w-full h-10 rounded-xl text-sm text-black/40 font-medium"
                >
                  ← Kthehu tek menuja
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
