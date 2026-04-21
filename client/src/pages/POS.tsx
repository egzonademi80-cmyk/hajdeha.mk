import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Pusher from "pusher-js";
import {
  Plus,
  Minus,
  Coffee,
  CheckCircle,
  Clock,
  Receipt,
  ChevronLeft,
  ShoppingBag,
  UserPlus,
  X,
  User,
  Bell,
} from "lucide-react";

interface MenuItem {
  id: number;
  name: string;
  price: string;
  category: string;
  active: boolean;
}

interface OrderItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

interface TableOrder {
  items: OrderItem[];
  startedAt: Date | null;
}

interface PersonTab {
  name: string;
  items: OrderItem[];
  startedAt: Date | null;
}

const TABLE_COUNT = 6;

const emptyTable = (): TableOrder => ({ items: [], startedAt: null });

function parsePrice(price: string): number {
  return parseInt(price.replace(/[^0-9]/g, "")) || 0;
}

type ActiveSlot =
  | { kind: "table"; idx: number }
  | { kind: "person"; idx: number }
  | null;

type Screen = "tables" | "menu" | "order";

interface IncomingOrder {
  id: string;
  tableNumber: number | string;
  cart: OrderItem[];
  timestamp: number;
}

interface POSProps {
  slug: string;
}

export default function POS({ slug }: POSProps) {
  const RESTAURANT_SLUG = slug;
  const TABLES_KEY = `pos-${slug}-tables-v2`;
  const PERSONS_KEY = `pos-${slug}-persons-v1`;

  const [tables, setTables] = useState<TableOrder[]>(() => {
    try {
      const saved = localStorage.getItem(TABLES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TableOrder[];
        if (parsed.length === TABLE_COUNT) return parsed;
      }
    } catch {}
    return Array.from({ length: TABLE_COUNT }, emptyTable);
  });

  const [personTabs, setPersonTabs] = useState<PersonTab[]>(() => {
    try {
      const saved = localStorage.getItem(PERSONS_KEY);
      if (saved) return JSON.parse(saved) as PersonTab[];
    } catch {}
    return [];
  });

  const [incomingBanner, setIncomingBanner] = useState<IncomingOrder | null>(null);
  const [tableFlash, setTableFlash] = useState<number | null>(null);

  const [active, setActive] = useState<ActiveSlot>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [screen, setScreen] = useState<Screen>("tables");
  const [payConfirm, setPayConfirm] = useState(false);
  const [justPaid, setJustPaid] = useState<ActiveSlot>(null);
  const [showNewPerson, setShowNewPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [, forceUpdate] = useState(0);

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["pos-restaurant"],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants?slug=${RESTAURANT_SLUG}`);
      if (!res.ok) throw new Error("Restaurant not found");
      return res.json();
    },
    retry: false,
  });

  const menuItems: MenuItem[] = useMemo(
    () => (restaurant?.menuItems || []).filter((i: MenuItem) => i.active),
    [restaurant],
  );

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map((i) => i.category)));
    return ["All", ...cats];
  }, [menuItems]);

  const filteredItems = useMemo(
    () =>
      activeCategory === "All"
        ? menuItems
        : menuItems.filter((i) => i.category === activeCategory),
    [menuItems, activeCategory],
  );

  // Current order (either a table or a person tab)
  const currentOrder: TableOrder | PersonTab | null = useMemo(() => {
    if (!active) return null;
    if (active.kind === "table") return tables[active.idx] ?? null;
    return personTabs[active.idx] ?? null;
  }, [active, tables, personTabs]);

  const orderTotal = (o: TableOrder | PersonTab) =>
    o.items.reduce((s, i) => s + i.price * i.qty, 0);
  const orderCount = (o: TableOrder | PersonTab) =>
    o.items.reduce((s, i) => s + i.qty, 0);

  const elapsed = (o: TableOrder | PersonTab) => {
    if (!o.startedAt) return null;
    const mins = Math.floor(
      (Date.now() - new Date(o.startedAt).getTime()) / 60000,
    );
    if (mins < 1) return "< 1 min";
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h${mins % 60}m`;
  };

  // ── Shared mutations ──
  const addItem = (item: MenuItem) => {
    if (!active) return;
    const add = (order: TableOrder | PersonTab): TableOrder | PersonTab => {
      const items = [...order.items];
      const idx = items.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], qty: items[idx].qty + 1 };
      } else {
        items.push({
          id: item.id,
          name: item.name,
          price: parsePrice(item.price),
          qty: 1,
        });
      }
      return { ...order, items, startedAt: order.startedAt ?? new Date() };
    };

    if (active.kind === "table") {
      setTables((prev) => {
        const next = [...prev];
        next[active.idx] = add(next[active.idx]) as TableOrder;
        return next;
      });
    } else {
      setPersonTabs((prev) => {
        const next = [...prev];
        next[active.idx] = add(next[active.idx]) as PersonTab;
        return next;
      });
    }
  };

  const updateQty = (itemId: number, delta: number) => {
    if (!active) return;
    const upd = (order: TableOrder | PersonTab): TableOrder | PersonTab => {
      const items = order.items
        .map((i) => (i.id === itemId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0);
      return { ...order, items, startedAt: items.length ? order.startedAt : null };
    };
    if (active.kind === "table") {
      setTables((prev) => {
        const next = [...prev];
        next[active.idx] = upd(next[active.idx]) as TableOrder;
        return next;
      });
    } else {
      setPersonTabs((prev) => {
        const next = [...prev];
        next[active.idx] = upd(next[active.idx]) as PersonTab;
        return next;
      });
    }
  };

  const payOrder = () => {
    if (!active) return;
    const slot = active;
    if (slot.kind === "table") {
      setTables((prev) => {
        const next = [...prev];
        next[slot.idx] = emptyTable();
        return next;
      });
    } else {
      setPersonTabs((prev) => prev.filter((_, i) => i !== slot.idx));
    }
    setJustPaid(slot);
    setPayConfirm(false);
    setActive(null);
    setScreen("tables");
    setTimeout(() => setJustPaid(null), 2500);
  };

  const deletePersonTab = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPersonTabs((prev) => prev.filter((_, i) => i !== idx));
  };

  const openSlot = (slot: ActiveSlot) => {
    setActive(slot);
    setScreen("menu");
    setActiveCategory("All");
  };

  const handleCreatePerson = () => {
    const trimmed = newPersonName.trim();
    if (!trimmed) return;
    setPersonTabs((prev) => {
      const newIdx = prev.length;
      const newTab: PersonTab = { name: trimmed, items: [], startedAt: null };
      const next = [...prev, newTab];
      // Open it after state settles
      setTimeout(() => {
        setActive({ kind: "person", idx: newIdx });
        setScreen("menu");
        setActiveCategory("All");
      }, 50);
      return next;
    });
    setNewPersonName("");
    setShowNewPerson(false);
  };

  // PWA manifest override
  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (link) link.href = "/pos-manifest.json";
    return () => { if (link) link.href = "/manifest.json"; };
  }, []);

  // Tick every 30s so elapsed times update live
  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try { localStorage.setItem(TABLES_KEY, JSON.stringify(tables)); } catch {}
  }, [tables]);
  useEffect(() => {
    try { localStorage.setItem(PERSONS_KEY, JSON.stringify(personTabs)); } catch {}
  }, [personTabs]);

  // Focus name input when modal opens
  useEffect(() => {
    if (showNewPerson) setTimeout(() => nameInputRef.current?.focus(), 80);
  }, [showNewPerson]);

  // ── Live Pusher subscription for incoming orders from QR menu ──
  useEffect(() => {
    let pusher: Pusher | null = null;
    let cancelled = false;

    const playChime = () => {
      try {
        const ctx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(880, ctx.currentTime);
        o.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        o.start(); o.stop(ctx.currentTime + 0.55);
      } catch {}
    };

    const handleIncoming = (data: any) => {
      const cart: OrderItem[] = data.cart || [];
      const tableNumber = data.tableNumber;
      // Strip prefix letters → leave just the digits to match T1..T6
      const tableDigits = parseInt(String(tableNumber).replace(/\D/g, ""), 10);
      const tableIdx = tableDigits - 1;

      // Auto-fill matching table if within fixed range (T1..T6)
      if (tableIdx >= 0 && tableIdx < TABLE_COUNT) {
        setTables((prev) => {
          const next = [...prev];
          const merged = [...next[tableIdx].items];
          cart.forEach((it) => {
            const ex = merged.find((m) => m.id === it.id);
            if (ex) ex.qty += it.qty;
            else merged.push({ ...it });
          });
          next[tableIdx] = {
            items: merged,
            startedAt: next[tableIdx].startedAt ?? new Date(),
          };
          return next;
        });
        setTableFlash(tableIdx);
        setTimeout(() => setTableFlash(null), 4000);
      }

      // Always show the banner notification
      setIncomingBanner({
        id: `${Date.now()}-${Math.random()}`,
        tableNumber,
        cart,
        timestamp: data.timestamp || Date.now(),
      });
      playChime();
      if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
      setTimeout(
        () => setIncomingBanner((b) => (b && b.tableNumber === tableNumber ? null : b)),
        12000,
      );
    };

    (async () => {
      try {
        const res = await fetch("/api/config/pusher");
        if (!res.ok) return;
        const cfg = await res.json();
        if (cancelled || !cfg.key || !cfg.cluster) return;
        pusher = new Pusher(cfg.key, { cluster: cfg.cluster });
        const channel = pusher.subscribe(`pos-${RESTAURANT_SLUG}`);
        channel.bind("incoming-order", handleIncoming);
      } catch (e) {
        console.error("Pusher subscribe failed:", e);
      }
    })();

    return () => {
      cancelled = true;
      try {
        pusher?.unsubscribe(`pos-${RESTAURANT_SLUG}`);
        pusher?.disconnect();
      } catch {}
    };
  }, [RESTAURANT_SLUG]);

  const tableStatus = (o: TableOrder | PersonTab): "empty" | "fresh" | "mid" | "late" => {
    if (!o.startedAt || o.items.length === 0) return "empty";
    const mins = Math.floor(
      (Date.now() - new Date(o.startedAt).getTime()) / 60000,
    );
    if (mins < 15) return "fresh";
    if (mins < 30) return "mid";
    return "late";
  };

  const statusColors = {
    empty: {
      bg: "bg-white/4",
      border: "border-white/8",
      dot: "",
      text: "text-white/25",
      time: "text-white/20",
    },
    fresh: {
      bg: "bg-emerald-500/12",
      border: "border-emerald-500/35",
      dot: "bg-emerald-400",
      text: "text-white",
      time: "text-emerald-400",
    },
    mid: {
      bg: "bg-amber-500/15",
      border: "border-amber-400/45",
      dot: "bg-amber-400",
      text: "text-white",
      time: "text-amber-400",
    },
    late: {
      bg: "bg-red-500/15",
      border: "border-red-400/50",
      dot: "bg-red-400",
      text: "text-white",
      time: "text-red-400",
    },
  };

  // Label shown in header
  const activeLabel =
    active === null
      ? null
      : active.kind === "table"
        ? `T${active.idx + 1}`
        : personTabs[active.idx]?.name ?? "—";

  const allTotal =
    tables.reduce((s, t) => s + orderTotal(t), 0) +
    personTabs.reduce((s, p) => s + orderTotal(p), 0);

  const allActive =
    tables.filter((t) => t.items.length > 0).length +
    personTabs.filter((p) => p.items.length > 0).length;

  return (
    <div
      className="h-[100dvh] w-screen bg-[#0F0F0F] text-white flex flex-col overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Header ── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 lg:px-6 py-3 lg:py-4 border-b border-white/8"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top, 12px))" }}
      >
        {screen !== "tables" && (
          <button
            onClick={() => setScreen(screen === "order" ? "menu" : "tables")}
            className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-white/8 hover:bg-white/12 flex items-center justify-center flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5" />
          </button>
        )}
        <div className="h-7 w-7 lg:h-9 lg:w-9 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
          <Coffee className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm lg:text-base font-semibold leading-none truncate">
            {restaurant?.name || "POS"}
            {activeLabel && (
              <span className="text-amber-400"> · {activeLabel}</span>
            )}
          </p>
          <p
            className="text-[10px] lg:text-[11px] text-white/30 mt-0.5"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {screen === "tables"
              ? `${allActive} ACTIVE`
              : screen === "menu"
                ? "ADD ITEMS"
                : "ORDER"}
          </p>
        </div>
        {/* Cart badge — only in menu screen on phones (on desktop the order panel is always visible) */}
        {screen === "menu" && active !== null && currentOrder && currentOrder.items.length > 0 && (
          <button
            onClick={() => setScreen("order")}
            className="lg:hidden flex items-center gap-2 bg-amber-500 rounded-full pl-3 pr-3 py-1.5"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-black" />
            <span
              className="text-xs font-bold text-black"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {orderCount(currentOrder)} · {orderTotal(currentOrder)} DEN
            </span>
          </button>
        )}
      </div>

      {/* ── Incoming order banner ── */}
      <AnimatePresence>
        {incomingBanner && (
          <motion.button
            key={incomingBanner.id}
            onClick={() => {
              const td = parseInt(
                String(incomingBanner.tableNumber).replace(/\D/g, ""),
                10,
              );
              const idx = td - 1;
              if (idx >= 0 && idx < TABLE_COUNT) {
                openSlot({ kind: "table", idx });
              }
              setIncomingBanner(null);
            }}
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="absolute top-[60px] left-3 right-3 z-30 flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-2xl"
            style={{ paddingTop: "max(12px, env(safe-area-inset-top, 12px))" }}
          >
            <motion.div
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            >
              <Bell className="h-5 w-5" />
            </motion.div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold leading-tight">
                Porosi e re — Tavolina {incomingBanner.tableNumber}
              </p>
              <p
                className="text-[11px] font-semibold opacity-80 truncate"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {incomingBanner.cart.reduce((s, i) => s + i.qty, 0)} artikuj ·{" "}
                {incomingBanner.cart.reduce((s, i) => s + i.price * i.qty, 0)} DEN
              </p>
            </div>
            <span
              className="text-[10px] font-bold opacity-70"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              SHIH →
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── SCREEN: TABLES ── */}
      <AnimatePresence mode="wait">
        {screen === "tables" && (
          <motion.div
            key="tables"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8 space-y-4 lg:space-y-6 max-w-[1400px] w-full mx-auto"
          >
            {/* ── Fixed tables grid ── */}
            <div>
              <p
                className="text-[10px] lg:text-[11px] text-white/25 mb-2 lg:mb-3 px-0.5"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                TAVOLINA
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 lg:gap-4">
                {tables.map((table, idx) => {
                  const status = tableStatus(table);
                  const c = statusColors[status];
                  const wasJustPaid =
                    justPaid?.kind === "table" && justPaid.idx === idx;
                  return (
                    <motion.button
                      key={idx}
                      onClick={() => openSlot({ kind: "table", idx })}
                      whileTap={{ scale: 0.92 }}
                      animate={
                        tableFlash === idx
                          ? { scale: [1, 1.08, 1, 1.08, 1] }
                          : { scale: 1 }
                      }
                      transition={{ duration: 1.6, repeat: tableFlash === idx ? 2 : 0 }}
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 border relative transition-all duration-500 ${
                        wasJustPaid
                          ? "bg-emerald-500/20 border-emerald-500/40"
                          : tableFlash === idx
                            ? "bg-amber-500/30 border-amber-400 ring-2 ring-amber-400/60"
                            : `${c.bg} ${c.border}`
                      }`}
                    >
                      {wasJustPaid ? (
                        <CheckCircle className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <>
                          <span
                            className={`text-sm font-bold font-['DM_Mono'] ${c.text}`}
                          >
                            T{idx + 1}
                          </span>
                          {table.items.length > 0 && (
                            <>
                              <span
                                className={`text-[10px] font-bold font-['DM_Mono'] ${c.time}`}
                              >
                                {orderTotal(table)}
                              </span>
                              {table.startedAt && (
                                <span className={`text-[9px] font-['DM_Mono'] ${c.time}`}>
                                  {elapsed(table)}
                                </span>
                              )}
                              <motion.div
                                animate={
                                  status === "late" ? { scale: [1, 1.4, 1] } : {}
                                }
                                transition={{ duration: 1.2, repeat: Infinity }}
                                className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full ${c.dot}`}
                              />
                            </>
                          )}
                        </>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* ── Person tabs section ── */}
            <div>
              <div className="flex items-center justify-between mb-2 px-0.5">
                <p
                  className="text-[10px] text-white/25"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  PERSONAT
                </p>
                <button
                  onClick={() => setShowNewPerson(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold active:bg-amber-500/25"
                >
                  <UserPlus className="h-3 w-3" />
                  Krijo
                </button>
              </div>

              {personTabs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 flex items-center justify-center py-6 lg:py-10">
                  <p className="text-white/20 text-xs lg:text-sm">Nuk ka persona aktiv</p>
                </div>
              ) : (
                <div className="space-y-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 lg:space-y-0">
                  {personTabs.map((person, idx) => {
                    const status = tableStatus(person);
                    const c = statusColors[status];
                    const wasJustPaid =
                      justPaid?.kind === "person" && justPaid.idx === idx;
                    const occupied = person.items.length > 0;
                    return (
                      <motion.button
                        key={idx}
                        onClick={() => openSlot({ kind: "person", idx })}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border relative transition-all duration-500 ${
                          wasJustPaid
                            ? "bg-emerald-500/20 border-emerald-500/40"
                            : `${c.bg} ${c.border}`
                        }`}
                      >
                        {wasJustPaid ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                            <span className="text-sm text-emerald-400 font-semibold">
                              Paguar ✓
                            </span>
                          </>
                        ) : (
                          <>
                            <div
                              className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${occupied ? "bg-amber-500/20" : "bg-white/6"}`}
                            >
                              <User
                                className={`h-4 w-4 ${occupied ? "text-amber-400" : "text-white/30"}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={`text-sm font-semibold ${c.text} truncate`}>
                                {person.name}
                              </p>
                              {occupied ? (
                                <p
                                  className={`text-xs font-bold mt-0.5 ${c.time}`}
                                  style={{ fontFamily: "'DM Mono', monospace" }}
                                >
                                  {orderTotal(person)} DEN
                                  {person.startedAt && (
                                    <span className="font-normal text-white/25 ml-2">
                                      {elapsed(person)}
                                    </span>
                                  )}
                                </p>
                              ) : (
                                <p className="text-xs text-white/20 mt-0.5">
                                  Bosh
                                </p>
                              )}
                            </div>
                            {occupied && status !== "empty" && (
                              <motion.div
                                animate={
                                  status === "late" ? { scale: [1, 1.4, 1] } : {}
                                }
                                transition={{ duration: 1.2, repeat: Infinity }}
                                className={`h-2 w-2 rounded-full flex-shrink-0 ${c.dot}`}
                              />
                            )}
                            {!occupied && (
                              <button
                                onClick={(e) => deletePersonTab(idx, e)}
                                className="h-6 w-6 rounded-full bg-white/6 flex items-center justify-center flex-shrink-0 active:bg-red-500/20"
                              >
                                <X className="h-3 w-3 text-white/30" />
                              </button>
                            )}
                          </>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Status legend */}
            <div className="flex items-center gap-4 px-1">
              {[
                { dot: "bg-emerald-400", label: "< 15min" },
                { dot: "bg-amber-400", label: "15–30min" },
                { dot: "bg-red-400", label: "30min+" },
              ].map(({ dot, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${dot}`} />
                  <span
                    className="text-[10px] text-white/30"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary bar */}
            <div className="p-4 lg:p-5 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-between">
              <div>
                <p
                  className="text-[10px] text-white/30"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  TOTAL OPEN
                </p>
                <p
                  className="text-xl font-bold text-amber-400"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {allTotal}{" "}
                  <span className="text-sm text-white/30">DEN</span>
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-[10px] text-white/30"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  AKTIV
                </p>
                <p
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {allActive}
                  <span className="text-sm text-white/30">
                    /{TABLE_COUNT + personTabs.length}
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SCREEN: MENU + ORDER (combined; side-by-side on lg+) ── */}
        {(screen === "menu" || screen === "order") && active !== null && currentOrder && (
          <motion.div
            key="menu-order"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex overflow-hidden"
          >
            {/* ── MENU PANEL ── */}
            <div
              className={`flex-1 flex-col overflow-hidden ${
                screen === "order" ? "hidden lg:flex" : "flex"
              }`}
            >
              {/* Category tabs */}
              <div className="flex-shrink-0 flex gap-2 px-4 lg:px-6 py-2.5 lg:py-3 overflow-x-auto border-b border-white/5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-semibold transition-all ${
                      activeCategory === cat
                        ? "bg-amber-500 text-black"
                        : "bg-white/6 text-white/40 hover:bg-white/10 hover:text-white/60"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Items grid */}
              <div className="flex-1 overflow-y-auto p-3 lg:p-5">
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Coffee className="h-7 w-7 text-amber-500" />
                    </motion.div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3">
                    {filteredItems.map((item) => {
                      const inCart = currentOrder.items.find((i) => i.id === item.id);
                      return (
                        <motion.button
                          key={item.id}
                          onClick={() => addItem(item)}
                          whileTap={{ scale: 0.95 }}
                          className={`relative p-3 lg:p-4 rounded-xl text-left border transition-all ${
                            inCart
                              ? "bg-amber-500/15 border-amber-500/50"
                              : "bg-white/4 border-white/8 hover:bg-white/6 hover:border-white/15"
                          }`}
                        >
                          {inCart && (
                            <div className="absolute top-2 right-2 h-5 w-5 lg:h-6 lg:w-6 rounded-full bg-amber-500 flex items-center justify-center">
                              <span className="text-[10px] lg:text-xs font-bold text-black">
                                {inCart.qty}
                              </span>
                            </div>
                          )}
                          <p className="text-xs lg:text-sm font-semibold text-white/85 leading-snug pr-6 line-clamp-2">
                            {item.name}
                          </p>
                          <p
                            className="text-xs lg:text-sm font-bold text-amber-400 mt-1.5"
                            style={{ fontFamily: "'DM Mono', monospace" }}
                          >
                            {parsePrice(item.price)}{" "}
                            <span className="text-[9px] lg:text-[10px] text-white/25">DEN</span>
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── ORDER PANEL ── */}
            <div
              className={`flex-col overflow-hidden bg-[#0B0B0B] lg:border-l lg:border-white/8 lg:w-[380px] xl:w-[440px] ${
                screen === "menu" ? "hidden lg:flex" : "flex flex-1 lg:flex-none"
              }`}
            >
              {/* Order panel header (lg+ only) */}
              <div className="hidden lg:flex flex-shrink-0 items-center gap-2 px-5 py-4 border-b border-white/8">
                <ShoppingBag className="h-4 w-4 text-amber-400" />
                <p className="text-sm font-bold">
                  Porosia · <span className="text-amber-400">{activeLabel}</span>
                </p>
                <span
                  className="ml-auto text-[10px] text-white/30"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {orderCount(currentOrder)} ITEMS
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-2">
                {currentOrder.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-12">
                    <ShoppingBag className="h-8 w-8 text-white/15" />
                    <p className="text-white/20 text-sm">Asnjë artikull</p>
                    <p className="text-white/15 text-xs hidden lg:block">
                      Klikoni një artikull nga menyja për ta shtuar
                    </p>
                  </div>
                ) : (
                  currentOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/8"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/85 truncate">
                          {item.name}
                        </p>
                        <p
                          className="text-xs text-amber-400 mt-0.5"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          {item.price} × {item.qty} = {item.price * item.qty} DEN
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-white/6 rounded-xl px-2 py-1.5">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="h-6 w-6 lg:h-7 lg:w-7 rounded-lg flex items-center justify-center text-white/50 active:bg-white/10 hover:bg-white/10"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span
                          className="text-sm font-bold text-amber-400 w-5 text-center"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="h-6 w-6 lg:h-7 lg:w-7 rounded-lg flex items-center justify-center text-white/50 active:bg-white/10 hover:bg-white/10"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total + Pay */}
              {currentOrder.items.length > 0 && (
                <div
                  className="flex-shrink-0 p-4 lg:p-5 border-t border-white/8 space-y-3"
                  style={{
                    paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Clock className="h-3.5 w-3.5" />
                      {currentOrder.startedAt ? elapsed(currentOrder) : "—"}
                    </div>
                    <div className="text-right">
                      <p
                        className="text-[10px] text-white/30"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        TOTAL
                      </p>
                      <p
                        className="text-2xl lg:text-3xl font-bold text-white"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        {orderTotal(currentOrder)}{" "}
                        <span className="text-sm text-white/30">DEN</span>
                      </p>
                    </div>
                  </div>

                  {payConfirm ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPayConfirm(false)}
                        className="flex-1 h-12 rounded-2xl bg-white/8 text-sm text-white/50 font-semibold hover:bg-white/12"
                      >
                        Anulo
                      </button>
                      <button
                        onClick={payOrder}
                        className="flex-1 h-12 rounded-2xl bg-emerald-500 text-sm font-bold text-white hover:bg-emerald-400"
                      >
                        ✓ Paguar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPayConfirm(true)}
                      className="w-full h-14 rounded-2xl bg-amber-500 text-sm font-bold text-black flex items-center justify-center gap-2 active:bg-amber-400 hover:bg-amber-400"
                    >
                      <Receipt className="h-4 w-4" />
                      Paguaj {orderTotal(currentOrder)} DEN
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New Person Modal ── */}
      <AnimatePresence>
        {showNewPerson && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40"
              onClick={() => { setShowNewPerson(false); setNewPersonName(""); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.18 }}
              className="fixed left-4 right-4 bottom-1/3 z-50 bg-[#1A1A1A] rounded-3xl p-6 border border-white/10 shadow-2xl"
            >
              <p className="text-base font-bold text-white mb-1">Krijo Person</p>
              <p className="text-xs text-white/30 mb-4">Shkruaj emrin e personit</p>
              <input
                ref={nameInputRef}
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreatePerson(); }}
                placeholder="p.sh. Besart, Mirem, Person1…"
                className="w-full h-12 rounded-xl border border-white/12 px-4 text-sm outline-none focus:border-amber-500/50 mb-4"
                style={{ background: "#2A2A2A", color: "#fff" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowNewPerson(false); setNewPersonName(""); }}
                  className="flex-1 h-11 rounded-2xl bg-white/8 text-sm text-white/50 font-semibold"
                >
                  Anulo
                </button>
                <button
                  onClick={handleCreatePerson}
                  disabled={!newPersonName.trim()}
                  className="flex-1 h-11 rounded-2xl bg-amber-500 text-sm font-bold text-black disabled:opacity-40"
                >
                  Krijo
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
