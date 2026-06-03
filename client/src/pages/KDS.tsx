import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import Pusher from "pusher-js";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChefHat, Clock, UtensilsCrossed, Wifi, WifiOff, Check, Flame } from "lucide-react";

interface KDSItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

interface KDSOrder {
  uid: string;
  tableNumber: number;
  items: KDSItem[];
  customerNote: string | null;
  receivedAt: number;
  isNew: boolean;
  source: "qr" | "pos";
  doneItems: Set<number>;
}

function useElapsed(ms: number) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 10_000);
    return () => clearInterval(t);
  }, []);
  const secs = Math.floor((Date.now() - ms) / 1000);
  const mins = Math.floor(secs / 60);
  if (secs < 60) return { label: `${secs}s`, mins: 0 };
  if (mins < 60) return { label: `${mins}m`, mins };
  return { label: `${Math.floor(mins / 60)}h ${mins % 60}m`, mins };
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

function OrderCard({
  order,
  onDone,
  onToggleItem,
}: {
  order: KDSOrder;
  onDone: () => void;
  onToggleItem: (index: number) => void;
}) {
  const { label, mins } = useElapsed(order.receivedAt);
  const allDone = order.doneItems.size === order.items.length;

  const urgency =
    mins >= 15 ? "red" :
    mins >= 8  ? "yellow" :
                 "normal";

  const accentColor =
    allDone              ? "#22c55e" :
    urgency === "red"    ? "#ef4444" :
    urgency === "yellow" ? "#f59e0b" :
    order.isNew          ? "hsl(15 75% 55%)" :
                           "hsl(20 10% 30%)";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.93 }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: "hsl(20 10% 12%)",
        border: `1.5px solid ${accentColor}40`,
        boxShadow: order.isNew && !allDone
          ? `0 0 0 1px ${accentColor}30, 0 8px 32px ${accentColor}20`
          : allDone
          ? "0 0 0 1.5px #22c55e40, 0 8px 24px #22c55e15"
          : urgency === "red"
          ? "0 0 0 1px #ef444430, 0 8px 24px #ef444420"
          : "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      {/* Top accent stripe */}
      <div
        className="h-1.5 w-full transition-colors duration-700 flex-shrink-0"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <div
        className="px-4 pt-3 pb-3 flex items-center justify-between gap-2"
        style={{ borderBottom: "1px solid hsl(20 10% 18%)" }}
      >
        <div className="flex items-center gap-3">
          {/* Table number */}
          <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl flex-shrink-0"
            style={{
              background: allDone ? "#22c55e18" : `${accentColor}18`,
              border: `1.5px solid ${accentColor}35`,
            }}
          >
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: `${accentColor}99` }}>TABLE</span>
            <span className="font-black text-2xl tabular-nums leading-tight" style={{ color: accentColor }}>
              {order.tableNumber}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest"
                style={
                  order.source === "pos"
                    ? { background: "#0ea5e918", color: "#38bdf8", border: "1px solid #0ea5e930" }
                    : { background: "hsl(15 75% 55% / 0.15)", color: "hsl(15 75% 65%)", border: "1px solid hsl(15 75% 55% / 0.3)" }
                }
              >
                {order.source === "pos" ? "POS" : "QR"}
              </span>
              {order.isNew && !allDone && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                  className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest"
                  style={{ background: "hsl(15 75% 55%)", color: "white" }}
                >
                  NEW
                </motion.span>
              )}
              {urgency === "red" && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1"
                  style={{ background: "#ef444418", color: "#f87171", border: "1px solid #ef444430" }}>
                  <Flame className="h-2.5 w-2.5" />
                  URGENT
                </span>
              )}
            </div>
            <div
              className="flex items-center gap-1.5 text-xs font-semibold tabular-nums"
              style={{ color: urgency === "red" ? "#f87171" : urgency === "yellow" ? "#fbbf24" : "hsl(20 10% 50%)" }}
            >
              <Clock className="h-3 w-3" />
              {label}
            </div>
          </div>
        </div>

        {/* Progress */}
        {order.doneItems.size > 0 && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-black tabular-nums" style={{ color: "#4ade80" }}>
              {order.doneItems.size}/{order.items.length}
            </span>
            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(20 10% 20%)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "#22c55e" }}
                initial={{ width: 0 }}
                animate={{ width: `${(order.doneItems.size / order.items.length) * 100}%` }}
                transition={{ type: "spring", damping: 20 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 px-3 py-3 space-y-2">
        {order.items.map((item, i) => {
          const isDone = order.doneItems.has(i);
          return (
            <motion.button
              key={i}
              layout
              onClick={() => onToggleItem(i)}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
              style={{
                background: isDone ? "#22c55e0d" : "hsl(20 10% 16%)",
                border: isDone ? "1px solid #22c55e25" : "1px solid hsl(20 10% 20%)",
                opacity: isDone ? 0.65 : 1,
              }}
            >
              <span
                className="text-sm font-semibold leading-snug flex-1"
                style={{
                  textDecoration: isDone ? "line-through" : "none",
                  color: isDone ? "hsl(20 10% 45%)" : "hsl(30 20% 92%)",
                }}
              >
                {item.name}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="text-sm font-black tabular-nums h-7 w-7 rounded-lg flex items-center justify-center"
                  style={
                    isDone
                      ? { background: "#22c55e20", color: "#4ade80" }
                      : item.qty >= 3
                      ? { background: "hsl(15 75% 55%)", color: "white" }
                      : item.qty === 2
                      ? { background: "hsl(15 75% 55% / 0.2)", color: "hsl(15 75% 65%)" }
                      : { background: "hsl(20 10% 22%)", color: "hsl(20 10% 55%)" }
                  }
                >
                  {item.qty}
                </span>
                <div
                  className="h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all"
                  style={
                    isDone
                      ? { borderColor: "#22c55e", background: "#22c55e" }
                      : { borderColor: "hsl(20 10% 35%)", background: "transparent" }
                  }
                >
                  {isDone && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Customer note */}
      {order.customerNote && (
        <div className="mx-3 mb-3 rounded-xl px-3 py-2 flex items-start gap-2"
          style={{ background: "#f59e0b0d", border: "1px solid #f59e0b25" }}>
          <span className="text-sm flex-shrink-0">📝</span>
          <span className="text-xs leading-snug" style={{ color: "#fcd34d" }}>{order.customerNote}</span>
        </div>
      )}

      {/* Done button */}
      <div className="px-3 pb-3">
        <motion.button
          onClick={onDone}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
          style={
            allDone
              ? { background: "hsl(150 60% 30%)", color: "white", boxShadow: "0 4px 16px hsl(150 60% 30% / 0.4)" }
              : { background: "hsl(150 50% 25%)", color: "hsl(150 60% 75%)", border: "1px solid hsl(150 50% 30%)" }
          }
        >
          <CheckCircle2 className="h-4 w-4" />
          {allDone ? "Clear Order" : "Mark Done"}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function KDS({ slug: propSlug }: { slug?: string }) {
  const params = useParams<{ slug: string }>();
  const slug = propSlug || params.slug;

  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [connected, setConnected] = useState(false);

  const addOrder = useCallback((data: any, source: "qr" | "pos") => {
    beep();
    const uid = `${Date.now()}-${Math.random()}`;
    const order: KDSOrder = {
      uid,
      tableNumber: data.tableNumber,
      items: data.cart || [],
      customerNote: data.customerNote || null,
      receivedAt: data.timestamp || Date.now(),
      isNew: true,
      source,
      doneItems: new Set(),
    };
    setOrders((prev) => [order, ...prev]);
    setTimeout(() => {
      setOrders((prev) =>
        prev.map((o) => (o.uid === uid ? { ...o, isNew: false } : o))
      );
    }, 5000);
  }, []);

  useEffect(() => {
    if (!slug) return;
    const key = import.meta.env.VITE_PUSHER_KEY;
    const cluster = import.meta.env.VITE_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    const pusher = new Pusher(key, { cluster });
    pusher.connection.bind("connected", () => setConnected(true));
    pusher.connection.bind("disconnected", () => setConnected(false));
    const channel = pusher.subscribe(`pos-${slug}`);
    channel.bind("incoming-order", (data: any) => addOrder(data, "qr"));
    channel.bind("kitchen-order", (data: any) => addOrder(data, "pos"));

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`pos-${slug}`);
      pusher.disconnect();
    };
  }, [slug, addOrder]);

  const markDone = (uid: string) => {
    const order = orders.find((o) => o.uid === uid);
    if (order) {
      fetch("/api/kitchen/order-ready", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, tableNumber: order.tableNumber }),
      }).catch(() => {});
    }
    setOrders((prev) => prev.filter((o) => o.uid !== uid));
    setDoneCount((n) => n + 1);
  };

  const toggleItem = (uid: string, index: number) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.uid !== uid) return o;
        const next = new Set(o.doneItems);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return { ...o, doneItems: next };
      })
    );
  };

  const restaurantLabel = slug
    ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ")
    : "Kitchen";

  return (
    <div
      className="min-h-screen select-none overflow-x-hidden"
      style={{ background: "hsl(20 10% 8%)", color: "hsl(30 20% 92%)" }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-20 backdrop-blur-md px-4 sm:px-6 py-3"
        style={{
          background: "hsl(20 10% 10% / 0.95)",
          borderBottom: "1px solid hsl(20 10% 16%)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Left: brand */}
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "hsl(15 75% 55% / 0.15)",
                border: "1.5px solid hsl(15 75% 55% / 0.35)",
              }}
            >
              <ChefHat className="h-5 w-5" style={{ color: "hsl(15 75% 60%)" }} />
            </div>
            <div>
              <div className="flex items-center gap-2 leading-none">
                <span className="font-black text-base capitalize" style={{ color: "hsl(30 20% 94%)" }}>
                  {restaurantLabel}
                </span>
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{
                    background: "hsl(15 75% 55% / 0.15)",
                    color: "hsl(15 75% 65%)",
                    border: "1px solid hsl(15 75% 55% / 0.3)",
                  }}
                >
                  Kitchen
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {connected
                  ? <Wifi className="h-3 w-3" style={{ color: "#4ade80" }} />
                  : <WifiOff className="h-3 w-3" style={{ color: "hsl(20 10% 45%)" }} />
                }
                <span
                  className="text-[10px] font-medium"
                  style={{ color: connected ? "#4ade80" : "hsl(20 10% 45%)" }}
                >
                  {connected ? "Live" : "Connecting…"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: stats */}
          <div className="flex items-center gap-2">
            {doneCount > 0 && (
              <div
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{
                  background: "#22c55e12",
                  color: "#4ade80",
                  border: "1px solid #22c55e25",
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {doneCount} done today
              </div>
            )}
            {orders.length > 0 ? (
              <motion.div
                key={orders.length}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                className="text-sm font-black px-4 py-1.5 rounded-full tabular-nums"
                style={{
                  background: "hsl(15 75% 55%)",
                  color: "white",
                  boxShadow: "0 4px 16px hsl(15 75% 55% / 0.4)",
                }}
              >
                {orders.length} pending
              </motion.div>
            ) : (
              <span
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{
                  border: "1px solid hsl(20 10% 20%)",
                  color: "hsl(20 10% 50%)",
                }}
              >
                All clear ✓
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Board ── */}
      <main className="max-w-7xl mx-auto p-3 sm:p-5">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5">
            <div
              className="h-24 w-24 rounded-full flex items-center justify-center"
              style={{ background: "hsl(20 10% 12%)", border: "1.5px solid hsl(20 10% 18%)" }}
            >
              <UtensilsCrossed className="h-10 w-10" style={{ color: "hsl(20 10% 30%)" }} />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold" style={{ color: "hsl(30 20% 85%)" }}>No pending orders</p>
              <p className="text-sm mt-1" style={{ color: "hsl(20 10% 40%)" }}>
                New orders will appear here automatically
              </p>
            </div>
            {doneCount > 0 && (
              <div
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mt-2"
                style={{ background: "#22c55e10", color: "#4ade80", border: "1px solid #22c55e20" }}
              >
                <CheckCircle2 className="h-4 w-4" />
                {doneCount} orders completed this session
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            <AnimatePresence>
              {orders.map((order) => (
                <OrderCard
                  key={order.uid}
                  order={order}
                  onDone={() => markDone(order.uid)}
                  onToggleItem={(i) => toggleItem(order.uid, i)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
