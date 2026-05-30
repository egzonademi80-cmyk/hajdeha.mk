import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import Pusher from "pusher-js";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChefHat, Clock, UtensilsCrossed } from "lucide-react";

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
}

function timeAgo(ms: number): string {
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
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

export default function KDS({ slug: propSlug }: { slug?: string }) {
  const params = useParams<{ slug: string }>();
  const slug = propSlug || params.slug;

  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [, setTick] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(t);
  }, []);

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
    };
    setOrders((prev) => [order, ...prev]);
    setTimeout(() => {
      setOrders((prev) =>
        prev.map((o) => (o.uid === uid ? { ...o, isNew: false } : o)),
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
    setOrders((prev) => prev.filter((o) => o.uid !== uid));
    setDoneCount((n) => n + 1);
  };

  const restaurantLabel = slug
    ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ")
    : "Kitchen";

  return (
    <div className="min-h-screen bg-stone-950 text-white select-none overflow-x-hidden">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-stone-900/95 backdrop-blur-sm border-b border-stone-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
              <ChefHat className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg text-white capitalize leading-none">
                  {restaurantLabel}
                </h1>
                <span className="text-[10px] font-semibold text-stone-500 bg-stone-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Kitchen
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-stone-600"}`}
                />
                <span className="text-[10px] text-stone-500">
                  {connected ? "Live" : "Connecting…"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {doneCount > 0 && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-500 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {doneCount} done
              </span>
            )}
            {orders.length > 0 ? (
              <span className="bg-orange-500 text-white text-sm font-black px-3 py-1.5 rounded-full tabular-nums">
                {orders.length} pending
              </span>
            ) : (
              <span className="bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 text-xs font-semibold px-3 py-1.5 rounded-full">
                All clear ✓
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Orders ── */}
      <div className="max-w-7xl mx-auto p-3 sm:p-5">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-stone-700">
            <UtensilsCrossed className="h-20 w-20 mb-5 opacity-20" />
            <p className="text-2xl font-bold text-stone-600">No pending orders</p>
            <p className="text-sm text-stone-700 mt-2">
              New orders will appear here automatically
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            <AnimatePresence>
              {orders.map((order) => (
                <motion.div
                  key={order.uid}
                  layout
                  initial={{ scale: 0.8, opacity: 0, y: -30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.85, opacity: 0, x: 80 }}
                  transition={{ type: "spring", damping: 22, stiffness: 280 }}
                  className={`rounded-2xl border flex flex-col overflow-hidden transition-shadow duration-500 ${
                    order.isNew
                      ? "border-orange-500 shadow-[0_0_28px_rgba(249,115,22,0.35)] bg-orange-950/30"
                      : "border-stone-700/60 bg-stone-900"
                  }`}
                >
                  {/* Card header */}
                  <div
                    className={`px-4 py-3 flex items-center justify-between border-b ${
                      order.isNew
                        ? "border-orange-500/40 bg-orange-500/10"
                        : "border-stone-700/60 bg-stone-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black text-2xl tabular-nums leading-none ${
                          order.isNew ? "text-orange-400" : "text-white"
                        }`}
                      >
                        T{order.tableNumber}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                          order.source === "pos"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                        }`}
                      >
                        {order.source === "pos" ? "POS" : "QR"}
                      </span>
                      {order.isNew && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-[10px] font-black text-orange-950 bg-orange-400 px-2 py-0.5 rounded-full uppercase tracking-wider"
                        >
                          New
                        </motion.span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-stone-500 text-xs font-medium">
                      <Clock className="h-3 w-3" />
                      <span className="tabular-nums">{timeAgo(order.receivedAt)}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="flex-1 px-4 py-3 space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-start justify-between gap-3">
                        <span className="text-sm sm:text-base font-semibold text-stone-200 leading-snug">
                          {item.name}
                        </span>
                        <span
                          className={`text-base sm:text-lg font-black flex-shrink-0 tabular-nums leading-tight ${
                            item.qty >= 2 ? "text-orange-400" : "text-stone-300"
                          }`}
                        >
                          ×{item.qty}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Note */}
                  {order.customerNote && (
                    <div className="mx-4 mb-3 bg-yellow-500/10 border border-yellow-500/25 rounded-xl px-3 py-2 flex items-start gap-2">
                      <span className="text-sm flex-shrink-0">📝</span>
                      <span className="text-xs text-yellow-300 leading-snug">
                        {order.customerNote}
                      </span>
                    </div>
                  )}

                  {/* Done button */}
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => markDone(order.uid)}
                      className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 active:bg-emerald-700 transition-all font-black text-base text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      DONE
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
