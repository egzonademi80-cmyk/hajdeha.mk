import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  Coffee,
  CheckCircle,
  Clock,
  Receipt,
  ChevronLeft,
  ShoppingBag,
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

const RESTAURANT_SLUG = "embeltoresport";
const TABLE_COUNT = 16;

const emptyTable = (): TableOrder => ({ items: [], startedAt: null });

function parsePrice(price: string): number {
  return parseInt(price.replace(/[^0-9]/g, "")) || 0;
}

type Screen = "tables" | "menu" | "order";

export default function POS() {
  const [tables, setTables] = useState<TableOrder[]>(
    Array.from({ length: TABLE_COUNT }, emptyTable),
  );
  const [activeTable, setActiveTable] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [screen, setScreen] = useState<Screen>("tables");
  const [payConfirm, setPayConfirm] = useState(false);
  const [justPaid, setJustPaid] = useState<number | null>(null);

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["pos-restaurant"],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${RESTAURANT_SLUG}`);
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

  const currentTable = activeTable !== null ? tables[activeTable] : null;

  const tableTotal = (t: TableOrder) =>
    t.items.reduce((s, i) => s + i.price * i.qty, 0);
  const tableCount = (t: TableOrder) => t.items.reduce((s, i) => s + i.qty, 0);

  const elapsed = (t: TableOrder) => {
    if (!t.startedAt) return null;
    const mins = Math.floor(
      (Date.now() - new Date(t.startedAt).getTime()) / 60000,
    );
    if (mins < 1) return "< 1 min";
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h${mins % 60}m`;
  };

  const addItem = (item: MenuItem) => {
    if (activeTable === null) return;
    setTables((prev) => {
      const next = [...prev];
      const table = {
        ...next[activeTable],
        items: [...next[activeTable].items],
      };
      const idx = table.items.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        table.items[idx] = {
          ...table.items[idx],
          qty: table.items[idx].qty + 1,
        };
      } else {
        table.items.push({
          id: item.id,
          name: item.name,
          price: parsePrice(item.price),
          qty: 1,
        });
      }
      if (!table.startedAt) table.startedAt = new Date();
      next[activeTable] = table;
      return next;
    });
  };

  const updateQty = (itemId: number, delta: number) => {
    if (activeTable === null) return;
    setTables((prev) => {
      const next = [...prev];
      const table = {
        ...next[activeTable],
        items: [...next[activeTable].items],
      };
      table.items = table.items
        .map((i) => (i.id === itemId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0);
      if (table.items.length === 0) table.startedAt = null;
      next[activeTable] = table;
      return next;
    });
  };

  const payTable = () => {
    if (activeTable === null) return;
    const idx = activeTable;
    setTables((prev) => {
      const next = [...prev];
      next[idx] = emptyTable();
      return next;
    });
    setJustPaid(idx);
    setPayConfirm(false);
    setActiveTable(null);
    setScreen("tables");
    setTimeout(() => setJustPaid(null), 2500);
  };

  const [, forceUpdate] = useState(0);

  // Tick every 30s so elapsed times update live
  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const tableStatus = (t: TableOrder): "empty" | "fresh" | "mid" | "late" => {
    if (!t.startedAt || t.items.length === 0) return "empty";
    const mins = Math.floor(
      (Date.now() - new Date(t.startedAt).getTime()) / 60000,
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

  const openTable = (idx: number) => {
    setActiveTable(idx);
    setScreen("menu");
    setActiveCategory("All");
  };

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
        className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/8"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top, 12px))" }}
      >
        {screen !== "tables" && (
          <button
            onClick={() => setScreen(screen === "order" ? "menu" : "tables")}
            className="h-8 w-8 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
          <Coffee className="h-3.5 w-3.5 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-none truncate">
            {restaurant?.name || "POS"}
            {activeTable !== null && (
              <span className="text-amber-400"> · T{activeTable + 1}</span>
            )}
          </p>
          <p
            className="text-[10px] text-white/30 mt-0.5"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {screen === "tables"
              ? `${tables.filter((t) => t.items.length > 0).length}/${TABLE_COUNT} ACTIVE`
              : screen === "menu"
                ? "ADD ITEMS"
                : "ORDER"}
          </p>
        </div>
        {/* Cart badge — only in menu screen */}
        {screen === "menu" &&
          activeTable !== null &&
          currentTable &&
          currentTable.items.length > 0 && (
            <button
              onClick={() => setScreen("order")}
              className="flex items-center gap-2 bg-amber-500 rounded-full pl-3 pr-3 py-1.5"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-black" />
              <span
                className="text-xs font-bold text-black"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {tableCount(currentTable)} · {tableTotal(currentTable)} DEN
              </span>
            </button>
          )}
      </div>

      {/* ── SCREEN: TABLES ── */}
      <AnimatePresence mode="wait">
        {screen === "tables" && (
          <motion.div
            key="tables"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="flex-1 overflow-y-auto p-4"
          >
            <div className="grid grid-cols-4 gap-3">
              {tables.map((table, idx) => {
                const occupied = table.items.length > 0;
                const wasJustPaid = justPaid === idx;
                return (
                  <motion.button
                    key={idx}
                    onClick={() => openTable(idx)}
                    whileTap={{ scale: 0.9 }}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 border relative transition-all duration-500 ${
                      wasJustPaid
                        ? "bg-emerald-500/20 border-emerald-500/40"
                        : `${statusColors[tableStatus(table)].bg} ${statusColors[tableStatus(table)].border}`
                    }`}
                  >
                    {wasJustPaid ? (
                      <CheckCircle className="h-6 w-6 text-emerald-400" />
                    ) : (
                      <>
                        <span
                          className={`text-sm font-bold font-['DM_Mono'] ${statusColors[tableStatus(table)].text}`}
                        >
                          T{idx + 1}
                        </span>
                        {occupied && (
                          <>
                            <span
                              className={`text-[10px] font-bold font-['DM_Mono'] ${statusColors[tableStatus(table)].time}`}
                            >
                              {tableTotal(table)}
                            </span>
                            {table.startedAt && (
                              <span
                                className={`text-[9px] font-['DM_Mono'] ${statusColors[tableStatus(table)].time}`}
                              >
                                {elapsed(table)}
                              </span>
                            )}
                            <motion.div
                              animate={
                                tableStatus(table) === "late"
                                  ? { scale: [1, 1.4, 1] }
                                  : {}
                              }
                              transition={{ duration: 1.2, repeat: Infinity }}
                              className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full ${statusColors[tableStatus(table)].dot}`}
                            />
                          </>
                        )}
                      </>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Status legend */}
            <div className="mt-4 flex items-center gap-4 px-1">
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
            <div className="mt-3 p-4 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-between">
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
                  {tables.reduce((s, t) => s + tableTotal(t), 0)}{" "}
                  <span className="text-sm text-white/30">DEN</span>
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-[10px] text-white/30"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  TABLES IN USE
                </p>
                <p
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {tables.filter((t) => t.items.length > 0).length}
                  <span className="text-sm text-white/30">/{TABLE_COUNT}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SCREEN: MENU ── */}
        {screen === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Category tabs */}
            <div className="flex-shrink-0 flex gap-2 px-4 py-2.5 overflow-x-auto border-b border-white/5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeCategory === cat
                      ? "bg-amber-500 text-black"
                      : "bg-white/6 text-white/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="flex-1 overflow-y-auto p-3">
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
                <div className="grid grid-cols-2 gap-2">
                  {filteredItems.map((item) => {
                    const inCart = currentTable?.items.find(
                      (i) => i.id === item.id,
                    );
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => addItem(item)}
                        whileTap={{ scale: 0.95 }}
                        className={`relative p-3 rounded-xl text-left border transition-all ${
                          inCart
                            ? "bg-amber-500/15 border-amber-500/50"
                            : "bg-white/4 border-white/8"
                        }`}
                      >
                        {inCart && (
                          <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-black">
                              {inCart.qty}
                            </span>
                          </div>
                        )}
                        <p className="text-xs font-semibold text-white/85 leading-snug pr-6 line-clamp-2">
                          {item.name}
                        </p>
                        <p
                          className="text-xs font-bold text-amber-400 mt-1.5"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          {parsePrice(item.price)}{" "}
                          <span className="text-[9px] text-white/25">DEN</span>
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── SCREEN: ORDER ── */}
        {screen === "order" && activeTable !== null && currentTable && (
          <motion.div
            key="order"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {currentTable.items.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-white/20 text-sm">Empty table</p>
                </div>
              ) : (
                currentTable.items.map((item) => (
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
                        className="h-6 w-6 rounded-lg flex items-center justify-center text-white/50 active:bg-white/10"
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
                        className="h-6 w-6 rounded-lg flex items-center justify-center text-white/50 active:bg-white/10"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total + Pay */}
            {currentTable.items.length > 0 && (
              <div
                className="flex-shrink-0 p-4 border-t border-white/8 space-y-3"
                style={{
                  paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/40 text-xs">
                    <Clock className="h-3.5 w-3.5" />
                    {currentTable.startedAt ? elapsed(currentTable) : "—"}
                  </div>
                  <div className="text-right">
                    <p
                      className="text-[10px] text-white/30"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      TOTAL
                    </p>
                    <p
                      className="text-2xl font-bold text-white"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {tableTotal(currentTable)}{" "}
                      <span className="text-sm text-white/30">DEN</span>
                    </p>
                  </div>
                </div>

                {payConfirm ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPayConfirm(false)}
                      className="flex-1 h-12 rounded-2xl bg-white/8 text-sm text-white/50 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={payTable}
                      className="flex-1 h-12 rounded-2xl bg-emerald-500 text-sm font-bold text-white"
                    >
                      ✓ Paid — Cash
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setPayConfirm(true)}
                    className="w-full h-14 rounded-2xl bg-amber-500 text-sm font-bold text-black flex items-center justify-center gap-2 active:bg-amber-400"
                  >
                    <Receipt className="h-4 w-4" />
                    Pay {tableTotal(currentTable)} DEN — Cash
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
