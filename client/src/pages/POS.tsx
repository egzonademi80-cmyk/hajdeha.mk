import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  X,
  Coffee,
  CheckCircle,
  Clock,
  Trash2,
  ChevronRight,
  Receipt,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
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
  paid: boolean;
}

const RESTAURANT_SLUG = "embeltoresport"; // <-- update to your actual slug for ID 26
const TABLE_COUNT = 16;

const emptyTable = (): TableOrder => ({
  items: [],
  startedAt: null,
  paid: false,
});

function parsePrice(price: string): number {
  return parseInt(price.replace(/[^0-9]/g, "")) || 0;
}

// ── Main POS ──────────────────────────────────────────────────────────────────
export default function POS() {
  const [tables, setTables] = useState<TableOrder[]>(
    Array.from({ length: TABLE_COUNT }, emptyTable),
  );
  const [activeTable, setActiveTable] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [payConfirm, setPayConfirm] = useState<number | null>(null);
  const [justPaid, setJustPaid] = useState<number | null>(null);

  // Fetch menu for restaurant (via slug)
  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["pos-restaurant"],
    queryFn: async () => {
      // Try to find slug by fetching all restaurants and filtering by ID
      const res = await fetch(`/api/restaurants/${RESTAURANT_SLUG}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    retry: false,
  });

  // Also try by ID directly
  const { data: restaurantById } = useQuery({
    queryKey: ["pos-restaurant-by-id"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/restaurants/26`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    retry: false,
  });

  const restaurantData = restaurant || restaurantById;
  const menuItems: MenuItem[] = useMemo(
    () => (restaurantData?.menuItems || []).filter((i: MenuItem) => i.active),
    [restaurantData],
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

  const activeTableOrder = activeTable !== null ? tables[activeTable] : null;

  const addItem = (item: MenuItem) => {
    if (activeTable === null) return;
    setTables((prev) => {
      const next = [...prev];
      const table = { ...next[activeTable] };
      const existing = table.items.findIndex((i) => i.id === item.id);
      if (existing >= 0) {
        table.items = table.items.map((i, idx) =>
          idx === existing ? { ...i, qty: i.qty + 1 } : i,
        );
      } else {
        table.items = [
          ...table.items,
          {
            id: item.id,
            name: item.name,
            price: parsePrice(item.price),
            qty: 1,
          },
        ];
      }
      if (!table.startedAt) table.startedAt = new Date();
      next[activeTable] = table;
      return next;
    });
  };

  const updateQty = (tableIdx: number, itemId: number, delta: number) => {
    setTables((prev) => {
      const next = [...prev];
      const table = { ...next[tableIdx] };
      table.items = table.items
        .map((i) => (i.id === itemId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0);
      if (table.items.length === 0) table.startedAt = null;
      next[tableIdx] = table;
      return next;
    });
  };

  const payTable = (tableIdx: number) => {
    setTables((prev) => {
      const next = [...prev];
      next[tableIdx] = emptyTable();
      return next;
    });
    setJustPaid(tableIdx);
    setPayConfirm(null);
    if (activeTable === tableIdx) setActiveTable(null);
    setTimeout(() => setJustPaid(null), 2000);
  };

  const tableTotal = (t: TableOrder) =>
    t.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const tableItemCount = (t: TableOrder) =>
    t.items.reduce((sum, i) => sum + i.qty, 0);

  const elapsed = (t: TableOrder) => {
    if (!t.startedAt) return null;
    const mins = Math.floor(
      (Date.now() - new Date(t.startedAt).getTime()) / 60000,
    );
    if (mins < 1) return "< 1 min";
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="h-screen w-screen bg-[#0F0F0F] text-white overflow-hidden flex flex-col font-['DM_Sans',sans-serif]">
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-white/5 flex items-center justify-between bg-[#0F0F0F]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Coffee className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="font-semibold text-sm text-white leading-none">
              {restaurantData?.name || "POS System"}
            </p>
            <p className="text-[10px] text-white/30 mt-0.5 font-['DM_Mono']">
              POINT OF SALE
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-white/30 font-['DM_Mono']">
              ACTIVE TABLES
            </p>
            <p className="text-lg font-bold text-amber-400 font-['DM_Mono']">
              {tables.filter((t) => t.items.length > 0).length}/{TABLE_COUNT}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/30 font-['DM_Mono']">
              TOTAL OPEN
            </p>
            <p className="text-lg font-bold text-white font-['DM_Mono']">
              {tables.reduce((s, t) => s + tableTotal(t), 0)}{" "}
              <span className="text-xs text-white/40">DEN</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Table Grid */}
        <div className="w-[280px] flex-shrink-0 border-r border-white/5 flex flex-col bg-[#0A0A0A]">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-[10px] font-semibold text-white/30 tracking-widest font-['DM_Mono']">
              TABLES
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-4 gap-2 content-start">
            {tables.map((table, idx) => {
              const occupied = table.items.length > 0;
              const isActive = activeTable === idx;
              const wasJustPaid = justPaid === idx;
              return (
                <motion.button
                  key={idx}
                  onClick={() => setActiveTable(isActive ? null : idx)}
                  whileTap={{ scale: 0.93 }}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 border ${
                    wasJustPaid
                      ? "bg-emerald-500/20 border-emerald-500/50"
                      : isActive
                        ? "bg-amber-500 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                        : occupied
                          ? "bg-white/8 border-white/15 hover:border-amber-500/50"
                          : "bg-white/3 border-white/5 hover:bg-white/6"
                  }`}
                >
                  {wasJustPaid && (
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  )}
                  {!wasJustPaid && (
                    <>
                      <span
                        className={`text-xs font-bold font-['DM_Mono'] ${isActive ? "text-black" : occupied ? "text-white" : "text-white/30"}`}
                      >
                        T{idx + 1}
                      </span>
                      {occupied && !isActive && (
                        <span className="text-[9px] text-amber-400 font-['DM_Mono'] font-medium">
                          {tableTotal(table)}
                        </span>
                      )}
                    </>
                  )}
                  {occupied && !isActive && !wasJustPaid && (
                    <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Selected table summary */}
          <AnimatePresence>
            {activeTable !== null && activeTableOrder && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="border-t border-white/5 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white/50">
                    Table {activeTable + 1}
                  </p>
                  {activeTableOrder.startedAt && (
                    <div className="flex items-center gap-1 text-[10px] text-white/30 font-['DM_Mono']">
                      <Clock className="h-3 w-3" />
                      {elapsed(activeTableOrder)}
                    </div>
                  )}
                </div>

                <div className="space-y-1 max-h-[160px] overflow-y-auto">
                  {activeTableOrder.items.length === 0 ? (
                    <p className="text-[11px] text-white/20 text-center py-2">
                      Empty — add items →
                    </p>
                  ) : (
                    activeTableOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white/5 rounded-lg px-1.5 py-1">
                          <button
                            onClick={() => updateQty(activeTable, item.id, -1)}
                            className="h-4 w-4 rounded flex items-center justify-center hover:bg-white/10 text-white/50"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <span className="text-xs font-bold font-['DM_Mono'] text-amber-400 w-4 text-center">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(activeTable, item.id, 1)}
                            className="h-4 w-4 rounded flex items-center justify-center hover:bg-white/10 text-white/50"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>
                        <span className="flex-1 text-[11px] text-white/70 truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-white/40 font-['DM_Mono']">
                          {item.price * item.qty}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {activeTableOrder.items.length > 0 && (
                  <>
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <span className="text-[11px] text-white/40">
                        {tableItemCount(activeTableOrder)} items
                      </span>
                      <span className="text-sm font-bold text-white font-['DM_Mono']">
                        {tableTotal(activeTableOrder)} DEN
                      </span>
                    </div>
                    {payConfirm === activeTable ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setPayConfirm(null)}
                          className="flex-1 h-8 rounded-lg bg-white/5 text-xs text-white/50 hover:bg-white/10"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => payTable(activeTable)}
                          className="flex-1 h-8 rounded-lg bg-emerald-500 text-xs font-bold text-white hover:bg-emerald-400"
                        >
                          ✓ Confirm Cash
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPayConfirm(activeTable)}
                        className="w-full h-8 rounded-lg bg-amber-500 text-xs font-bold text-black hover:bg-amber-400 flex items-center justify-center gap-1.5"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        Pay — {tableTotal(activeTableOrder)} DEN
                      </button>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — Menu */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category tabs */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-3 border-b border-white/5 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? "bg-amber-500 text-black"
                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Items */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Coffee className="h-8 w-8 text-amber-500 mx-auto" />
                </motion.div>
                <p className="text-white/30 text-sm">Loading menu...</p>
              </div>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-white/20 text-sm">No menu items found</p>
                <p className="text-white/10 text-xs font-['DM_Mono']">
                  Check RESTAURANT_SLUG in POS.tsx
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              {activeTable === null ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="text-4xl mb-4">👆</div>
                    <p className="text-white/30 text-sm">
                      Select a table to start an order
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {filteredItems.map((item) => {
                    const inCart = activeTableOrder?.items.find(
                      (i) => i.id === item.id,
                    );
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => addItem(item)}
                        whileTap={{ scale: 0.95 }}
                        className={`relative p-3 rounded-xl text-left border transition-all duration-150 ${
                          inCart
                            ? "bg-amber-500/15 border-amber-500/40"
                            : "bg-white/3 border-white/8 hover:bg-white/8 hover:border-white/15"
                        }`}
                      >
                        {inCart && (
                          <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-black font-['DM_Mono']">
                              {inCart.qty}
                            </span>
                          </div>
                        )}
                        <p className="text-xs font-semibold text-white/80 leading-snug pr-5 line-clamp-2">
                          {item.name}
                        </p>
                        <p className="text-xs font-bold text-amber-400 mt-1.5 font-['DM_Mono']">
                          {parsePrice(item.price)}{" "}
                          <span className="text-[9px] text-white/30">DEN</span>
                        </p>
                        <p className="text-[9px] text-white/20 mt-0.5">
                          {item.category}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
