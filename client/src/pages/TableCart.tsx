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

  useEffect(() => {
    if (!restaurant?.id) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/api/ws/table`,
    );
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
      } catch {}
    };
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    return () => ws.close();
  }, [pin, restaurant?.id]);

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

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-[100dvh] w-full bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground">
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
      <div className="h-[100dvh] w-full bg-background flex flex-col items-center justify-center gap-4 p-8 text-center">
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
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Shared top header ── */}
      <header
        className="flex-shrink-0 bg-white dark:bg-stone-900 border-b border-border px-4 flex items-center justify-between gap-3 shadow-sm"
        style={{
          paddingTop: "max(12px, env(safe-area-inset-top, 12px))",
          paddingBottom: 12,
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight truncate">
              {restaurant.name}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5 uppercase tracking-widest">
              Tavolina {tableNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {peerCount > 0 && (
            <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
              <Users className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {peerCount + 1}
              </span>
            </div>
          )}

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
              connected
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-900/30 text-red-500"
            }`}
          >
            {connected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {connected ? "LIVE" : "OFF"}
          </div>

          {itemCount > 0 && (
            <button
              data-testid="button-toggle-cart"
              onClick={() => setView(view === "cart" ? "menu" : "cart")}
              className="relative h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              <ShoppingBag className="h-4 w-4 text-primary-foreground" />
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center leading-none">
                {itemCount}
              </span>
            </button>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* ══════════════════ MENU VIEW ══════════════════ */}
        {view === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex flex-col overflow-hidden min-h-0"
          >
            {/* Category pill bar */}
            <div className="flex-shrink-0 flex gap-2 px-4 py-2.5 overflow-x-auto bg-white dark:bg-stone-900 border-b border-border">
              {categories.map((cat) => (
                <button
                  key={cat}
                  data-testid={`filter-category-${cat}`}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Scrollable items */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4 space-y-3 max-w-2xl mx-auto w-full pb-6">
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <UtensilsCrossed className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      Nuk ka artikuj në këtë kategori
                    </p>
                  </div>
                )}

                {filtered.map((item) => {
                  const inCart = cart.find((c) => c.id === item.id);
                  const qty = inCart?.qty ?? 0;
                  const isJust = justAdded === item.id;

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      className={`relative flex items-center gap-3 p-3.5 rounded-2xl border transition-colors duration-150 ${
                        inCart
                          ? "bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30"
                          : "bg-white dark:bg-stone-800/60 border-border"
                      }`}
                    >
                      {/* Thumbnail */}
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl">
                          🍽️
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {item.category}
                        </p>
                        <p className="text-sm font-bold text-primary mt-1">
                          {parsePrice(item.price)}{" "}
                          <span className="text-[10px] text-muted-foreground font-normal">
                            DEN
                          </span>
                        </p>
                      </div>

                      {/* +/- controls */}
                      <div className="flex-shrink-0">
                        <AnimatePresence mode="wait">
                          {qty > 0 ? (
                            <motion.div
                              key="stepper"
                              initial={{ scale: 0.85, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.85, opacity: 0 }}
                              transition={{ duration: 0.12 }}
                              className="flex items-center gap-1 bg-muted rounded-xl px-1.5 py-1"
                            >
                              <button
                                data-testid={`button-decrease-${item.id}`}
                                onClick={() => updateQty(item.id, -1)}
                                className="h-7 w-7 rounded-lg flex items-center justify-center active:bg-black/10 dark:active:bg-white/10"
                              >
                                <Minus className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <span className="text-sm font-bold text-foreground w-5 text-center">
                                {qty}
                              </span>
                              <button
                                data-testid={`button-increase-${item.id}`}
                                onClick={() => addItem(item)}
                                className="h-7 w-7 rounded-lg flex items-center justify-center active:bg-black/10 dark:active:bg-white/10"
                              >
                                <Plus className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </motion.div>
                          ) : (
                            <motion.button
                              key="add"
                              initial={{ scale: 0.85, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.85, opacity: 0 }}
                              transition={{ duration: 0.12 }}
                              data-testid={`button-add-${item.id}`}
                              onClick={() => addItem(item)}
                              className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                            >
                              <Plus className="h-4 w-4 text-primary-foreground" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Flash overlay */}
                      <AnimatePresence>
                        {isJust && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 rounded-2xl bg-primary/10 flex items-center justify-center pointer-events-none"
                          >
                            <CheckCircle className="h-6 w-6 text-primary" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Sticky "View Cart" bar — part of flex column, not absolute */}
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.div
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 80, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  className="flex-shrink-0 px-4 pt-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-border"
                  style={{
                    paddingBottom:
                      "max(16px, env(safe-area-inset-bottom, 16px))",
                  }}
                >
                  <button
                    data-testid="button-open-cart"
                    onClick={() => setView("cart")}
                    className="w-full rounded-2xl bg-primary flex items-center justify-between px-5 active:bg-primary/90 transition-colors shadow-md"
                    style={{ height: 52 }}
                  >
                    <span className="h-6 w-6 rounded-full bg-white/25 text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {itemCount}
                    </span>
                    <span className="text-sm font-bold text-primary-foreground">
                      Shiko shportën
                    </span>
                    <span className="text-sm font-bold text-primary-foreground/80 font-mono">
                      {total} DEN
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ══════════════════ CART VIEW ══════════════════ */}
        {view === "cart" && (
          <motion.div
            key="cart"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex flex-col overflow-hidden min-h-0 bg-background"
          >
            {/* Cart sub-header */}
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white dark:bg-stone-900 border-b border-border">
              <button
                data-testid="button-back-to-menu"
                onClick={() => setView("menu")}
                className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center active:bg-muted/70 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <div>
                <p className="text-sm font-bold text-foreground leading-tight">
                  Shporta
                </p>
                <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
                  Tavolina {tableNumber} · {itemCount} artikuj
                </p>
              </div>
            </div>

            {/* Scrollable cart items */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4 space-y-2.5 max-w-2xl mx-auto w-full pb-6">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground/25" />
                    <p className="text-sm text-muted-foreground">
                      Shporta është bosh
                    </p>
                    <Button
                      variant="outline"
                      className="rounded-xl border-primary/30 text-primary hover:bg-primary/5"
                      onClick={() => setView("menu")}
                    >
                      Shto artikuj
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 pb-1 font-mono">
                      Porosia juaj · Tavolina {tableNumber}
                    </p>

                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center gap-3 p-3.5 bg-white dark:bg-stone-800/60 rounded-2xl border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-primary font-mono mt-0.5">
                            {item.price} × {item.qty} ={" "}
                            <span className="font-bold">
                              {item.price * item.qty}
                            </span>{" "}
                            DEN
                          </p>
                        </div>

                        {/* Qty stepper */}
                        <div className="flex items-center gap-1 bg-muted rounded-xl px-1.5 py-1 flex-shrink-0">
                          <button
                            data-testid={`button-cart-decrease-${item.id}`}
                            onClick={() => updateQty(item.id, -1)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center active:bg-black/10 dark:active:bg-white/10"
                          >
                            <Minus className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <span className="text-sm font-bold text-foreground w-5 text-center font-mono">
                            {item.qty}
                          </span>
                          <button
                            data-testid={`button-cart-increase-${item.id}`}
                            onClick={() => updateQty(item.id, 1)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center active:bg-black/10 dark:active:bg-white/10"
                          >
                            <Plus className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Total + Place Order — part of flex column, not absolute */}
            {cart.length > 0 && (
              <div
                className="flex-shrink-0 px-4 pt-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-border space-y-3"
                style={{
                  paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
                }}
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm text-muted-foreground">
                    {itemCount} artikuj
                  </span>
                  <span className="text-xl font-bold text-foreground font-mono">
                    {total}{" "}
                    <span className="text-sm text-muted-foreground font-sans font-normal">
                      DEN
                    </span>
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  {ordered ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0.92, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full rounded-2xl bg-emerald-500 flex items-center justify-center gap-2 shadow-md"
                      style={{ height: 52 }}
                    >
                      <CheckCircle className="h-5 w-5 text-white" />
                      <span className="text-sm font-bold text-white">
                        Porosia u dërgua!
                      </span>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="place-order"
                      data-testid="button-place-order"
                      onClick={placeOrder}
                      whileTap={{ scale: 0.97 }}
                      className="w-full rounded-2xl bg-foreground dark:bg-stone-100 flex items-center justify-center active:opacity-80 transition-opacity shadow-md"
                      style={{ height: 52 }}
                    >
                      <span className="text-sm font-bold text-background dark:text-stone-900">
                        Porosit · {total} DEN
                      </span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
