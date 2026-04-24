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
  Sun,
  Moon,
  ArrowRightLeft,
  Merge,
  LayoutGrid,
  Divide,
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
  section?: string;
}

interface PersonTab {
  name: string;
  items: OrderItem[];
  startedAt: Date | null;
}

interface Restaurant {
  name: string;
  menuItems: MenuItem[];
  tableCount?: number;
  sections?: string[];
}

interface TableSection {
  name: string;
  tables: number[];
}

// ─── Split Bill Types ──────────────────────────────────────────────────────────
interface SplitPerson {
  name: string;
  colorIdx: number;
  paid: boolean;
  payMethod: "cash" | "card" | null;
}

const SPLIT_COLORS = [
  {
    bg: "bg-blue-500/20",
    border: "border-blue-500/50",
    text: "text-blue-400",
    dot: "bg-blue-500",
  },
  {
    bg: "bg-rose-500/20",
    border: "border-rose-500/50",
    text: "text-rose-400",
    dot: "bg-rose-500",
  },
  {
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/50",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
  },
  {
    bg: "bg-purple-500/20",
    border: "border-purple-500/50",
    text: "text-purple-400",
    dot: "bg-purple-500",
  },
  {
    bg: "bg-amber-500/20",
    border: "border-amber-500/50",
    text: "text-amber-400",
    dot: "bg-amber-500",
  },
  {
    bg: "bg-pink-500/20",
    border: "border-pink-500/50",
    text: "text-pink-400",
    dot: "bg-pink-500",
  },
];

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

const defaultSections: TableSection[] = [
  { name: "Indoor", tables: [] },
  { name: "Outdoor", tables: [] },
  { name: "Bar", tables: [] },
];

export default function POS({ slug }: POSProps) {
  const RESTAURANT_SLUG = slug;
  const TABLES_KEY = `pos-${slug}-tables-v3`;
  const PERSONS_KEY = `pos-${slug}-persons-v1`;
  const SECTIONS_KEY = `pos-${slug}-sections-v1`;

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["pos-restaurant"],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants?slug=${RESTAURANT_SLUG}`);
      if (!res.ok) throw new Error("Restaurant not found");
      return res.json() as Promise<Restaurant>;
    },
    retry: false,
  });

  const TABLE_COUNT = restaurant?.tableCount || 6;

  const [sections, setSections] = useState<TableSection[]>(() => {
    try {
      const saved = localStorage.getItem(SECTIONS_KEY);
      if (saved) return JSON.parse(saved) as TableSection[];
    } catch {}
    return defaultSections;
  });

  const [draftSections, setDraftSections] = useState<TableSection[]>([]);
  const [activeDraftSection, setActiveDraftSection] =
    useState<string>("Indoor");

  const [tables, setTables] = useState<TableOrder[]>(() => {
    try {
      const saved = localStorage.getItem(TABLES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TableOrder[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return Array.from({ length: TABLE_COUNT }, emptyTable);
  });

  useEffect(() => {
    setTables((prev) => {
      if (prev.length === TABLE_COUNT) return prev;
      if (prev.length < TABLE_COUNT) {
        return [
          ...prev,
          ...Array.from({ length: TABLE_COUNT - prev.length }, emptyTable),
        ];
      }
      return prev.slice(0, TABLE_COUNT);
    });
  }, [TABLE_COUNT]);

  const [personTabs, setPersonTabs] = useState<PersonTab[]>(() => {
    try {
      const saved = localStorage.getItem(PERSONS_KEY);
      if (saved) return JSON.parse(saved) as PersonTab[];
    } catch {}
    return [];
  });

  const [incomingBanner, setIncomingBanner] = useState<IncomingOrder | null>(
    null,
  );
  const [tableFlash, setTableFlash] = useState<number | null>(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [transferSource, setTransferSource] = useState<number | null>(null);
  const [mergeSource, setMergeSource] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("all");

  // ─── Split Bill State ────────────────────────────────────────────────────────
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitTableIdx, setSplitTableIdx] = useState<number | null>(null);
  const [splitPersons, setSplitPersons] = useState<SplitPerson[]>([]);
  // itemAssignments[i] = person index (or null = unassigned)
  const [itemAssignments, setItemAssignments] = useState<(number | null)[]>([]);

  const openSplitBill = (tableIdx: number) => {
    const order = tables[tableIdx];
    setSplitTableIdx(tableIdx);
    setSplitPersons([
      { name: "Person 1", colorIdx: 0, paid: false, payMethod: null },
      { name: "Person 2", colorIdx: 1, paid: false, payMethod: null },
    ]);
    setItemAssignments(order.items.map(() => null));
    setShowSplitModal(true);
  };

  const addSplitPerson = () => {
    setSplitPersons((prev) => [
      ...prev,
      {
        name: `Person ${prev.length + 1}`,
        colorIdx: prev.length % SPLIT_COLORS.length,
        paid: false,
        payMethod: null,
      },
    ]);
  };

  const assignItem = (itemIdx: number, personIdx: number | null) => {
    setItemAssignments((prev) => {
      const next = [...prev];
      next[itemIdx] = personIdx;
      return next;
    });
  };

  const personTotal = (personIdx: number): number => {
    if (splitTableIdx === null) return 0;
    const order = tables[splitTableIdx];
    return order.items.reduce((sum, item, i) => {
      if (itemAssignments[i] === personIdx) return sum + item.price * item.qty;
      return sum;
    }, 0);
  };

  const unassignedItems = (): { item: OrderItem; idx: number }[] => {
    if (splitTableIdx === null) return [];
    return tables[splitTableIdx].items
      .map((item, idx) => ({ item, idx }))
      .filter(({ idx }) => itemAssignments[idx] === null);
  };

  const unassignedTotal = (): number =>
    unassignedItems().reduce((s, { item }) => s + item.price * item.qty, 0);

  const markPaid = (personIdx: number, method: "cash" | "card") => {
    setSplitPersons((prev) => {
      const next = prev.map((p, i) =>
        i === personIdx ? { ...p, paid: true, payMethod: method } : p,
      );
      const allPaid = next.every((p) => p.paid);
      if (allPaid && splitTableIdx !== null) {
        setTables((t) => {
          const updated = [...t];
          updated[splitTableIdx] = emptyTable();
          return updated;
        });
        // ADD THIS:
        fetch("/api/table/cart-cleared", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: `table-${RESTAURANT_SLUG}-${splitTableIdx + 1}`,
          }),
        }).catch(() => {});
        setJustPaid({ kind: "table", idx: splitTableIdx });
        setTimeout(() => setJustPaid(null), 2500);
        setShowSplitModal(false);
        setActive(null);
        setScreen("tables");
      }
      return next;
    });
  };
  // ───────────────────────────────────────────er�─────────────────────────────────

  const THEME_KEY = `pos-${slug}-theme`;
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch {}
    return "dark";
  });
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);
  const isLight = theme === "light";

  const t = isLight
    ? {
        appBg: "bg-[#FAFAF9]",
        panelBg: "bg-white",
        text: "text-[#1A1A1A]",
        textSoft: "text-[#3A3A3A]",
        textMuted: "text-[#7A7A7A]",
        textFaint: "text-[#A8A8A8]",
        textDim: "text-[#BFBDB9]",
        border: "border-[#E8E6E3]",
        borderSoft: "border-[#EFEDEA]",
        borderDashed: "border-[#D8D4CF]",
        surface: "bg-[#F4F2EF]",
        surfaceSoft: "bg-[#EDEAE5]",
        surfaceHover: "hover:bg-[#ECE9E5]",
        chipInactive:
          "bg-[#EDEAE5] text-[#5A5A5A] hover:bg-[#E2DED9] hover:text-[#1A1A1A]",
        cartItemActive: "bg-amber-100 border-amber-400",
        cartItemInactive:
          "bg-[#F4F2EF] border-[#E8E6E3] hover:bg-[#EDEAE5] hover:border-[#D8D4CF]",
        backBtn: "bg-[#EDEAE5] hover:bg-[#E2DED9] text-[#1A1A1A]",
        modalBg: "bg-white",
        modalOverlay: "bg-black/50",
        inputBgStyle: "#F4F2EF",
        inputTextStyle: "#1A1A1A",
        inputBorder: "border-[#E0DDD8]",
        cancelBtn: "bg-[#EDEAE5] text-[#7A7A7A] hover:bg-[#E2DED9]",
        deletePersonBtn: "bg-[#EDEAE5] hover:bg-red-100 text-[#7A7A7A]",
        personIconEmpty: "bg-[#EDEAE5] text-[#A8A8A8]",
        qtyControlBg: "bg-[#EDEAE5]",
        qtyBtnText: "text-[#5A5A5A] hover:bg-[#D8D4CF]",
        actionBtn: "bg-blue-50 text-blue-600 hover:bg-blue-100",
        actionBtnAlt: "bg-purple-50 text-purple-600 hover:bg-purple-100",
      }
    : {
        appBg: "bg-[#0F0F0F]",
        panelBg: "bg-[#0B0B0B]",
        text: "text-white",
        textSoft: "text-white/85",
        textMuted: "text-white/40",
        textFaint: "text-white/25",
        textDim: "text-white/30",
        border: "border-white/10",
        borderSoft: "border-white/5",
        borderDashed: "border-white/10",
        surface: "bg-white/[0.04]",
        surfaceSoft: "bg-white/[0.08]",
        surfaceHover: "hover:bg-white/[0.06]",
        chipInactive:
          "bg-white/[0.06] text-white/40 hover:bg-white/[0.10] hover:text-white/60",
        cartItemActive: "bg-amber-500/15 border-amber-500/50",
        cartItemInactive:
          "bg-white/[0.04] border-white/10 hover:bg-white/[0.06] hover:border-white/15",
        backBtn: "bg-white/[0.08] hover:bg-white/[0.12] text-white",
        modalBg: "bg-[#1A1A1A]",
        modalOverlay: "bg-black/70",
        inputBgStyle: "#2A2A2A",
        inputTextStyle: "#FFFFFF",
        inputBorder: "border-white/12",
        cancelBtn: "bg-white/[0.08] text-white/50 hover:bg-white/[0.12]",
        deletePersonBtn: "bg-white/[0.06] hover:bg-red-500/20 text-white/30",
        personIconEmpty: "bg-white/[0.06] text-white/30",
        qtyControlBg: "bg-white/[0.06]",
        qtyBtnText:
          "text-white/50 hover:bg-white/[0.10] active:bg-white/[0.10]",
        actionBtn: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
        actionBtnAlt: "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30",
      };

  const statusColorsLight = {
    empty: {
      bg: "bg-[#F4F2EF]",
      border: "border-[#E8E6E3]",
      dot: "",
      text: "text-[#A8A8A8]",
      time: "text-[#A8A8A8]",
    },
    fresh: {
      bg: "bg-emerald-50",
      border: "border-emerald-300",
      dot: "bg-emerald-500",
      text: "text-[#1A1A1A]",
      time: "text-emerald-600",
    },
    mid: {
      bg: "bg-amber-50",
      border: "border-amber-300",
      dot: "bg-amber-500",
      text: "text-[#1A1A1A]",
      time: "text-amber-600",
    },
    late: {
      bg: "bg-red-50",
      border: "border-red-300",
      dot: "bg-red-500",
      text: "text-[#1A1A1A]",
      time: "text-red-600",
    },
  };
  const statusColorsDark = {
    empty: {
      bg: "bg-white/[0.04]",
      border: "border-white/10",
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
  const dotColors = isLight
    ? { fresh: "bg-emerald-500", mid: "bg-amber-500", late: "bg-red-500" }
    : { fresh: "bg-emerald-400", mid: "bg-amber-400", late: "bg-red-400" };

  const [active, setActive] = useState<ActiveSlot>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [screen, setScreen] = useState<Screen>("tables");
  const [payConfirm, setPayConfirm] = useState(false);
  const [justPaid, setJustPaid] = useState<ActiveSlot>(null);
  const [showNewPerson, setShowNewPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [, forceUpdate] = useState(0);

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

  const handleTransfer = (sourceIdx: number, targetIdx: number) => {
    if (sourceIdx === targetIdx) return;
    setTables((prev) => {
      const next = [...prev];
      const source = next[sourceIdx];
      const target = next[targetIdx];
      next[targetIdx] = {
        ...target,
        items: [...target.items, ...source.items],
        startedAt: target.startedAt || source.startedAt,
      };
      next[sourceIdx] = emptyTable();
      return next;
    });
    setShowTransferModal(false);
    setTransferSource(null);
    setTableFlash(targetIdx);
    setTimeout(() => setTableFlash(null), 2000);
  };

  const handleMerge = (sourceIdx: number, targetIdx: number) => {
    if (sourceIdx === targetIdx) return;
    setTables((prev) => {
      const next = [...prev];
      const source = next[sourceIdx];
      const target = next[targetIdx];
      const merged = [...target.items];
      source.items.forEach((sourceItem) => {
        const existing = merged.find((i) => i.id === sourceItem.id);
        if (existing) {
          existing.qty += sourceItem.qty;
        } else {
          merged.push({ ...sourceItem });
        }
      });
      next[targetIdx] = {
        ...target,
        items: merged,
        startedAt: target.startedAt || source.startedAt,
      };
      next[sourceIdx] = emptyTable();
      return next;
    });
    setShowMergeModal(false);
    setMergeSource(null);
    setTableFlash(targetIdx);
    setTimeout(() => setTableFlash(null), 2000);
  };

  const getTableSection = (tableIdx: number): string => {
    const section = sections.find((s) => s.tables.includes(tableIdx));
    return section?.name || "Other";
  };

  const visibleTables = useMemo(() => {
    if (selectedSection === "all") {
      return tables.map((_, idx) => idx);
    }
    const section = sections.find((s) => s.name === selectedSection);
    return section?.tables || [];
  }, [selectedSection, sections, tables]);

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
      return {
        ...order,
        items,
        startedAt: items.length ? order.startedAt : null,
      };
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
      // ADD THIS:
      fetch("/api/table/cart-cleared", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: `table-${RESTAURANT_SLUG}-${slot.idx + 1}`,
        }),
      }).catch(() => {});
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

  useEffect(() => {
    const link = document.querySelector(
      'link[rel="manifest"]',
    ) as HTMLLinkElement;
    if (link) link.href = "/pos-manifest.json";
    return () => {
      if (link) link.href = "/manifest.json";
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
    } catch {}
  }, [tables, TABLES_KEY]);
  useEffect(() => {
    try {
      localStorage.setItem(PERSONS_KEY, JSON.stringify(personTabs));
    } catch {}
  }, [personTabs, PERSONS_KEY]);
  useEffect(() => {
    try {
      localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
    } catch {}
  }, [sections, SECTIONS_KEY]);

  useEffect(() => {
    if (showNewPerson) setTimeout(() => nameInputRef.current?.focus(), 80);
  }, [showNewPerson]);

  useEffect(() => {
    let pusher: Pusher | null = null;
    let cancelled = false;

    const playChime = () => {
      try {
        const ctx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.setValueAtTime(880, ctx.currentTime);
        o.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        o.start();
        o.stop(ctx.currentTime + 0.55);
      } catch {}
    };

    const handleIncoming = (data: any) => {
      const cart: OrderItem[] = data.cart || [];
      const tableNumber = data.tableNumber;
      const tableDigits = parseInt(String(tableNumber).replace(/\D/g, ""), 10);
      const tableIdx = tableDigits - 1;

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

      setIncomingBanner({
        id: `${Date.now()}-${Math.random()}`,
        tableNumber,
        cart,
        timestamp: data.timestamp || Date.now(),
      });
      playChime();
      if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
      setTimeout(
        () =>
          setIncomingBanner((b) =>
            b && b.tableNumber === tableNumber ? null : b,
          ),
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
  }, [RESTAURANT_SLUG, TABLE_COUNT]);

  const tableStatus = (
    o: TableOrder | PersonTab,
  ): "empty" | "fresh" | "mid" | "late" => {
    if (!o.startedAt || o.items.length === 0) return "empty";
    const mins = Math.floor(
      (Date.now() - new Date(o.startedAt).getTime()) / 60000,
    );
    if (mins < 15) return "fresh";
    if (mins < 30) return "mid";
    return "late";
  };

  const statusColors = isLight ? statusColorsLight : statusColorsDark;

  const activeLabel =
    active === null
      ? null
      : active.kind === "table"
        ? `T${active.idx + 1}`
        : (personTabs[active.idx]?.name ?? "—");

  const allTotal =
    tables.reduce((s, t) => s + orderTotal(t), 0) +
    personTabs.reduce((s, p) => s + orderTotal(p), 0);

  const allActive =
    tables.filter((t) => t.items.length > 0).length +
    personTabs.filter((p) => p.items.length > 0).length;

  return (
    <div
      className={`h-[100dvh] w-screen ${t.appBg} ${t.text} flex flex-col overflow-hidden transition-colors`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div
        className={`flex-shrink-0 flex items-center gap-3 px-4 lg:px-6 py-3 lg:py-4 border-b ${t.border}`}
        style={{ paddingTop: "max(12px, env(safe-area-inset-top, 12px))" }}
      >
        {screen !== "tables" && (
          <button
            onClick={() => setScreen(screen === "order" ? "menu" : "tables")}
            className={`h-8 w-8 lg:h-10 lg:w-10 rounded-full ${t.backBtn} flex items-center justify-center flex-shrink-0 transition-colors`}
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
            className={`text-[10px] lg:text-[11px] ${t.textDim} mt-0.5`}
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {screen === "tables"
              ? `${allActive} ACTIVE`
              : screen === "menu"
                ? "ADD ITEMS"
                : "ORDER"}
          </p>
        </div>
        <button
          onClick={() => setTheme(isLight ? "dark" : "light")}
          className={`h-8 w-8 lg:h-10 lg:w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${t.backBtn}`}
        >
          {isLight ? (
            <Moon className="h-4 w-4 lg:h-5 lg:w-5" />
          ) : (
            <Sun className="h-4 w-4 lg:h-5 lg:w-5 text-amber-400" />
          )}
        </button>
        {screen === "menu" &&
          active !== null &&
          currentOrder &&
          currentOrder.items.length > 0 && (
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

      {/* Incoming order banner */}
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
                {incomingBanner.cart.reduce((s, i) => s + i.price * i.qty, 0)}{" "}
                DEN
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

      {/* SCREEN: TABLES */}
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
            {/* Table Management Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowTransferModal(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${t.actionBtn} transition-colors`}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Transfer Table
              </button>
              <button
                onClick={() => setShowMergeModal(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${t.actionBtn} transition-colors`}
              >
                <Merge className="h-3.5 w-3.5" />
                Merge Tables
              </button>
              <button
                onClick={() => {
                  setDraftSections(JSON.parse(JSON.stringify(sections)));
                  setActiveDraftSection(sections[0]?.name || "Indoor");
                  setShowSectionsModal(true);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${t.actionBtnAlt} transition-colors`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Sections
              </button>
            </div>

            {/* Section Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedSection("all")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedSection === "all"
                    ? "bg-amber-500 text-black"
                    : t.chipInactive
                }`}
              >
                All Sections
              </button>
              {sections.map((section) => (
                <button
                  key={section.name}
                  onClick={() => setSelectedSection(section.name)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedSection === section.name
                      ? "bg-amber-500 text-black"
                      : t.chipInactive
                  }`}
                >
                  {section.name} ({section.tables.length})
                </button>
              ))}
            </div>

            {/* Tables Grid */}
            <div>
              <p
                className={`text-[10px] lg:text-[11px] ${t.textFaint} mb-2 lg:mb-3 px-0.5`}
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {selectedSection === "all"
                  ? `ALL TABLES (${TABLE_COUNT})`
                  : selectedSection.toUpperCase()}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 lg:gap-4">
                {visibleTables.map((idx) => {
                  const table = tables[idx];
                  const status = tableStatus(table);
                  const c = statusColors[status];
                  const wasJustPaid =
                    justPaid?.kind === "table" && justPaid.idx === idx;
                  const sectionName = getTableSection(idx);
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
                      transition={{
                        duration: 1.6,
                        repeat: tableFlash === idx ? 2 : 0,
                      }}
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
                          {selectedSection === "all" && (
                            <span
                              className={`text-[9px] font-['DM_Mono'] ${t.textFaint}`}
                            >
                              {sectionName}
                            </span>
                          )}
                          {table.items.length > 0 && (
                            <>
                              <span
                                className={`text-[10px] font-bold font-['DM_Mono'] ${c.time}`}
                              >
                                {orderTotal(table)}
                              </span>
                              {table.startedAt && (
                                <span
                                  className={`text-[9px] font-['DM_Mono'] ${c.time}`}
                                >
                                  {elapsed(table)}
                                </span>
                              )}
                              <motion.div
                                animate={
                                  status === "late"
                                    ? { scale: [1, 1.4, 1] }
                                    : {}
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

            {/* Person tabs */}
            <div>
              <div className="flex items-center justify-between mb-2 px-0.5">
                <p
                  className={`text-[10px] ${t.textFaint}`}
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
                <div
                  className={`rounded-2xl border border-dashed ${t.borderDashed} flex items-center justify-center py-6 lg:py-10`}
                >
                  <p className={`${t.textFaint} text-xs lg:text-sm`}>
                    Nuk ka persona aktiv
                  </p>
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
                              className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                occupied ? "bg-amber-500/20" : t.surfaceSoft
                              }`}
                            >
                              <User
                                className={`h-4 w-4 ${
                                  occupied ? "text-amber-400" : t.textDim
                                }`}
                              />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p
                                className={`text-sm font-semibold ${c.text} truncate`}
                              >
                                {person.name}
                              </p>
                              {occupied ? (
                                <p
                                  className={`text-xs font-bold mt-0.5 ${c.time}`}
                                  style={{ fontFamily: "'DM Mono', monospace" }}
                                >
                                  {orderTotal(person)} DEN
                                  {person.startedAt && (
                                    <span
                                      className={`font-normal ${t.textFaint} ml-2`}
                                    >
                                      {elapsed(person)}
                                    </span>
                                  )}
                                </p>
                              ) : (
                                <p className={`text-xs ${t.textFaint} mt-0.5`}>
                                  Bosh
                                </p>
                              )}
                            </div>
                            {occupied && status !== "empty" && (
                              <motion.div
                                animate={
                                  status === "late"
                                    ? { scale: [1, 1.4, 1] }
                                    : {}
                                }
                                transition={{ duration: 1.2, repeat: Infinity }}
                                className={`h-2 w-2 rounded-full flex-shrink-0 ${c.dot}`}
                              />
                            )}
                            {!occupied && (
                              <button
                                onClick={(e) => deletePersonTab(idx, e)}
                                className={`h-6 w-6 rounded-full ${t.surfaceSoft} flex items-center justify-center flex-shrink-0 active:bg-red-500/20`}
                              >
                                <X className={`h-3 w-3 ${t.textDim}`} />
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
                { dot: dotColors.fresh, label: "< 15min" },
                { dot: dotColors.mid, label: "15–30min" },
                { dot: dotColors.late, label: "30min+" },
              ].map(({ dot, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${dot}`} />
                  <span
                    className={`text-[10px] ${t.textDim}`}
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary bar */}
            <div
              className={`p-4 lg:p-5 rounded-2xl ${t.surface} border ${t.border} flex items-center justify-between`}
            >
              <div>
                <p
                  className={`text-[10px] ${t.textDim}`}
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  TOTAL OPEN
                </p>
                <p
                  className="text-xl font-bold text-amber-400"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {allTotal} <span className={`text-sm ${t.textDim}`}>DEN</span>
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-[10px] ${t.textDim}`}
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  AKTIV
                </p>
                <p
                  className={`text-xl font-bold ${t.text}`}
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {allActive}
                  <span className={`text-sm ${t.textDim}`}>
                    /{TABLE_COUNT + personTabs.length}
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SCREEN: MENU + ORDER */}
        {(screen === "menu" || screen === "order") &&
          active !== null &&
          currentOrder && (
            <motion.div
              key="menu-order"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.18 }}
              className="flex-1 flex overflow-hidden"
            >
              {/* MENU PANEL */}
              <div
                className={`flex-1 flex-col overflow-hidden ${
                  screen === "order" ? "hidden lg:flex" : "flex"
                }`}
              >
                <div
                  className={`flex-shrink-0 flex gap-2 px-4 lg:px-6 py-2.5 lg:py-3 overflow-x-auto border-b ${t.borderSoft}`}
                >
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex-shrink-0 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-semibold transition-all ${
                        activeCategory === cat
                          ? "bg-amber-500 text-black"
                          : t.chipInactive
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-3 lg:p-5">
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3">
                      {filteredItems.map((item) => {
                        const inCart = currentOrder.items.find(
                          (i) => i.id === item.id,
                        );
                        return (
                          <motion.button
                            key={item.id}
                            onClick={() => addItem(item)}
                            whileTap={{ scale: 0.95 }}
                            className={`relative p-3 lg:p-4 rounded-xl text-left border transition-all ${
                              inCart
                                ? "bg-amber-500/15 border-amber-500/50"
                                : t.cartItemInactive
                            }`}
                          >
                            {inCart && (
                              <div className="absolute top-2 right-2 h-5 w-5 lg:h-6 lg:w-6 rounded-full bg-amber-500 flex items-center justify-center">
                                <span className="text-[10px] lg:text-xs font-bold text-black">
                                  {inCart.qty}
                                </span>
                              </div>
                            )}
                            <p
                              className={`text-xs lg:text-sm font-semibold ${t.textSoft} leading-snug pr-6 line-clamp-2`}
                            >
                              {item.name}
                            </p>
                            <p
                              className="text-xs lg:text-sm font-bold text-amber-400 mt-1.5"
                              style={{ fontFamily: "'DM Mono', monospace" }}
                            >
                              {parsePrice(item.price)}{" "}
                              <span
                                className={`text-[9px] lg:text-[10px] ${t.textFaint}`}
                              >
                                DEN
                              </span>
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ORDER PANEL */}
              <div
                className={`flex-col overflow-hidden ${t.panelBg} lg:border-l lg:${t.border} lg:w-[380px] xl:w-[440px] ${
                  screen === "menu"
                    ? "hidden lg:flex"
                    : "flex flex-1 lg:flex-none"
                }`}
              >
                <div
                  className={`hidden lg:flex flex-shrink-0 items-center gap-2 px-5 py-4 border-b ${t.border}`}
                >
                  <ShoppingBag className="h-4 w-4 text-amber-400" />
                  <p className="text-sm font-bold">
                    Porosia ·{" "}
                    <span className="text-amber-400">{activeLabel}</span>
                  </p>
                  <span
                    className={`ml-auto text-[10px] ${t.textDim}`}
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {orderCount(currentOrder)} ITEMS
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-2">
                  {currentOrder.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-12">
                      <ShoppingBag className={`h-8 w-8 ${t.textFaint}`} />
                      <p className={`${t.textFaint} text-sm`}>Asnjë artikull</p>
                      <p className={`${t.textFaint} text-xs hidden lg:block`}>
                        Klikoni një artikull nga menyja për ta shtuar
                      </p>
                    </div>
                  ) : (
                    currentOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-xl ${t.surface} border ${t.border}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold ${t.textSoft} truncate`}
                          >
                            {item.name}
                          </p>
                          <p
                            className="text-xs text-amber-400 mt-0.5"
                            style={{ fontFamily: "'DM Mono', monospace" }}
                          >
                            {item.price} × {item.qty} = {item.price * item.qty}{" "}
                            DEN
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-2 ${t.surfaceSoft} rounded-xl px-2 py-1.5`}
                        >
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className={`h-6 w-6 lg:h-7 lg:w-7 rounded-lg flex items-center justify-center ${t.textMuted} active:bg-white/10 hover:bg-white/10`}
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
                            className={`h-6 w-6 lg:h-7 lg:w-7 rounded-lg flex items-center justify-center ${t.textMuted} active:bg-white/10 hover:bg-white/10`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {currentOrder.items.length > 0 && (
                  <div
                    className={`flex-shrink-0 p-4 lg:p-5 border-t ${t.border} space-y-3`}
                    style={{
                      paddingBottom:
                        "max(16px, env(safe-area-inset-bottom, 16px))",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex items-center gap-2 ${t.textMuted} text-xs`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {currentOrder.startedAt ? elapsed(currentOrder) : "—"}
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-[10px] ${t.textDim}`}
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          TOTAL
                        </p>
                        <p
                          className={`text-2xl lg:text-3xl font-bold ${t.text}`}
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          {orderTotal(currentOrder)}{" "}
                          <span className={`text-sm ${t.textDim}`}>DEN</span>
                        </p>
                      </div>
                    </div>

                    {payConfirm ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPayConfirm(false)}
                          className={`flex-1 h-12 rounded-2xl ${t.surfaceSoft} text-sm ${t.textMuted} font-semibold hover:bg-white/12`}
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
                      <div className="flex flex-col gap-2">
                        {/* Split Bill button — only for tables */}
                        {active?.kind === "table" && (
                          <button
                            onClick={() => openSplitBill(active.idx)}
                            className={`w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold border ${t.border} ${t.surfaceSoft} ${t.textSoft} hover:border-amber-500/40 transition-colors`}
                          >
                            <Divide className="h-4 w-4" />
                            Split Bill
                          </button>
                        )}
                        <button
                          onClick={() => setPayConfirm(true)}
                          className="w-full h-14 rounded-2xl bg-amber-500 text-sm font-bold text-black flex items-center justify-center gap-2 active:bg-amber-400 hover:bg-amber-400"
                        >
                          <Receipt className="h-4 w-4" />
                          Paguaj {orderTotal(currentOrder)} DEN
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── Split Bill Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSplitModal &&
          splitTableIdx !== null &&
          (() => {
            const order = tables[splitTableIdx];
            const allPersonsPaid =
              splitPersons.length > 0 && splitPersons.every((p) => p.paid);
            const unassigned = unassignedItems();
            const totalUnassigned = unassignedTotal();

            return (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`fixed inset-0 ${t.modalOverlay} z-40`}
                  onClick={() => setShowSplitModal(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 24 }}
                  transition={{ duration: 0.2 }}
                  className={`fixed left-3 right-3 top-14 bottom-4 z-50 ${t.modalBg} rounded-3xl border ${t.border} shadow-2xl flex flex-col overflow-hidden`}
                >
                  {/* Header */}
                  <div
                    className={`flex-shrink-0 flex items-center justify-between px-5 py-4 border-b ${t.border}`}
                  >
                    <div>
                      <p className="text-base font-bold flex items-center gap-2">
                        <Divide className="h-4 w-4 text-amber-400" />
                        Split Bill · T{splitTableIdx + 1}
                      </p>
                      <p
                        className={`text-[10px] ${t.textDim} mt-0.5`}
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        {order.items.reduce((s, i) => s + i.qty, 0)} ITEMS ·{" "}
                        {orderTotal(order)} DEN TOTAL
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={addSplitPerson}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${t.actionBtn} transition-colors`}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Add Person
                      </button>
                      <button
                        onClick={() => setShowSplitModal(false)}
                        className={`h-8 w-8 rounded-full ${t.backBtn} flex items-center justify-center`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body: two columns */}
                  <div className="flex-1 flex overflow-hidden min-h-0">
                    {/* LEFT — item list with person assignment */}
                    <div
                      className={`flex-1 overflow-y-auto p-4 space-y-2 border-r ${t.border}`}
                    >
                      <p
                        className={`text-[10px] ${t.textFaint} mb-3`}
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        ASSIGN EACH ITEM TO A PERSON
                      </p>
                      {order.items.map((item, itemIdx) => {
                        const assignedPerson = itemAssignments[itemIdx];
                        const pc =
                          assignedPerson !== null
                            ? SPLIT_COLORS[
                                splitPersons[assignedPerson]?.colorIdx %
                                  SPLIT_COLORS.length
                              ]
                            : null;
                        return (
                          <div
                            key={`${item.id}-${itemIdx}`}
                            className={`rounded-xl border p-3 transition-all ${
                              pc
                                ? `${pc.bg} ${pc.border}`
                                : `${t.surface} ${t.border}`
                            }`}
                          >
                            {/* Item info row */}
                            <div className="flex items-center justify-between mb-2.5">
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-sm font-semibold ${t.textSoft} truncate`}
                                >
                                  {item.name}
                                </p>
                                <p
                                  className={`text-xs mt-0.5 ${pc ? pc.text : t.textFaint}`}
                                  style={{ fontFamily: "'DM Mono', monospace" }}
                                >
                                  {item.price} × {item.qty} ={" "}
                                  <span className="font-bold">
                                    {item.price * item.qty}
                                  </span>{" "}
                                  DEN
                                </p>
                              </div>
                              {assignedPerson !== null && pc && (
                                <div
                                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ml-2 ${pc.dot}`}
                                >
                                  {assignedPerson + 1}
                                </div>
                              )}
                            </div>

                            {/* Person chip row */}
                            <div className="flex flex-wrap gap-1.5">
                              {/* Unassign chip */}
                              <button
                                onClick={() => assignItem(itemIdx, null)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                  assignedPerson === null
                                    ? "bg-amber-500 text-black"
                                    : `${t.surfaceSoft} ${t.textMuted} hover:${t.surfaceHover}`
                                }`}
                              >
                                —
                              </button>
                              {splitPersons.map((person, pIdx) => {
                                const pColor =
                                  SPLIT_COLORS[
                                    person.colorIdx % SPLIT_COLORS.length
                                  ];
                                const isSelected = assignedPerson === pIdx;
                                return (
                                  <button
                                    key={pIdx}
                                    onClick={() => assignItem(itemIdx, pIdx)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                                      isSelected
                                        ? `${pColor.bg} ${pColor.border} ${pColor.text}`
                                        : `${t.surfaceSoft} ${t.border} ${t.textMuted}`
                                    }`}
                                  >
                                    {person.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Unassigned total warning */}
                      {totalUnassigned > 0 && (
                        <div
                          className={`rounded-xl border border-dashed ${t.borderDashed} p-3 text-center`}
                        >
                          <p className={`text-xs ${t.textFaint}`}>
                            Unassigned:{" "}
                            <span className="text-amber-400 font-bold">
                              {totalUnassigned} DEN
                            </span>{" "}
                            ({unassigned.length} item
                            {unassigned.length !== 1 ? "s" : ""})
                          </p>
                        </div>
                      )}
                    </div>

                    {/* RIGHT — persons + pay */}
                    <div className="w-48 lg:w-56 flex-shrink-0 overflow-y-auto p-3 space-y-2">
                      <p
                        className={`text-[10px] ${t.textFaint} mb-3`}
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        CHECKOUT
                      </p>

                      {splitPersons.map((person, pIdx) => {
                        const pc =
                          SPLIT_COLORS[person.colorIdx % SPLIT_COLORS.length];
                        const total = personTotal(pIdx);
                        return (
                          <div
                            key={pIdx}
                            className={`rounded-xl border p-3 transition-all ${
                              person.paid
                                ? "bg-emerald-500/15 border-emerald-500/40"
                                : `${pc.bg} ${pc.border}`
                            }`}
                          >
                            {/* Person label */}
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${pc.dot}`}
                              >
                                {pIdx + 1}
                              </div>
                              <p
                                className={`text-xs font-semibold ${t.textSoft} flex-1 truncate`}
                              >
                                {person.name}
                              </p>
                            </div>

                            {/* Amount */}
                            <p
                              className={`text-lg font-bold mb-2 ${
                                person.paid ? "text-emerald-400" : t.text
                              }`}
                              style={{ fontFamily: "'DM Mono', monospace" }}
                            >
                              {total}{" "}
                              <span
                                className={`text-xs ${t.textDim} font-normal`}
                              >
                                DEN
                              </span>
                            </p>

                            {/* Pay buttons or paid state */}
                            {person.paid ? (
                              <div className="flex items-center gap-1.5 text-emerald-400">
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">
                                  {person.payMethod === "cash"
                                    ? "Cash ✓"
                                    : "Card ✓"}
                                </span>
                              </div>
                            ) : total > 0 ? (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => markPaid(pIdx, "cash")}
                                  className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/30 transition-colors"
                                >
                                  CASH
                                </button>
                                <button
                                  onClick={() => markPaid(pIdx, "card")}
                                  className="flex-1 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] font-bold hover:bg-blue-500/30 transition-colors"
                                >
                                  CARD
                                </button>
                              </div>
                            ) : (
                              <p className={`text-[10px] ${t.textFaint}`}>
                                Nothing assigned
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {/* All paid banner */}
                      {allPersonsPaid && (
                        <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-3 text-center">
                          <CheckCircle className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                          <p className="text-xs font-bold text-emerald-400">
                            All Paid!
                          </p>
                          <p className={`text-[10px] ${t.textFaint} mt-0.5`}>
                            Table cleared
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            );
          })()}
      </AnimatePresence>

      {/* ── Transfer Modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showTransferModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 ${t.modalOverlay} z-40`}
              onClick={() => {
                setShowTransferModal(false);
                setTransferSource(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.18 }}
              className={`fixed left-4 right-4 top-1/4 z-50 ${t.modalBg} rounded-3xl p-6 border ${t.border} shadow-2xl max-h-[60vh] overflow-y-auto`}
            >
              <div className="flex items-center gap-2 mb-4">
                <ArrowRightLeft className="h-5 w-5 text-blue-400" />
                <p className="text-base font-bold">Transfer Table</p>
              </div>
              <p className={`text-xs ${t.textDim} mb-4`}>
                {transferSource === null
                  ? "Select source table (table to move FROM)"
                  : `Select destination table (move T${transferSource + 1} TO...)`}
              </p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {tables.map((table, idx) => {
                  const hasItems = table.items.length > 0;
                  const isSource = transferSource === idx;
                  const canSelect =
                    transferSource === null ? hasItems : transferSource !== idx;
                  return (
                    <button
                      key={idx}
                      disabled={!canSelect}
                      onClick={() => {
                        if (transferSource === null) {
                          setTransferSource(idx);
                        } else {
                          handleTransfer(transferSource, idx);
                        }
                      }}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${
                        isSource
                          ? "bg-blue-500/20 border-blue-500/50"
                          : !canSelect
                            ? `${t.surface} ${t.border} opacity-30`
                            : `${t.surface} ${t.border} hover:bg-blue-500/10`
                      }`}
                    >
                      <span className="text-sm font-bold">T{idx + 1}</span>
                      {hasItems && (
                        <span className="text-[10px] text-amber-400">
                          {orderTotal(table)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferSource(null);
                }}
                className={`w-full h-11 rounded-2xl ${t.cancelBtn} text-sm font-semibold`}
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Merge Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMergeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 ${t.modalOverlay} z-40`}
              onClick={() => {
                setShowMergeModal(false);
                setMergeSource(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.18 }}
              className={`fixed left-4 right-4 top-1/4 z-50 ${t.modalBg} rounded-3xl p-6 border ${t.border} shadow-2xl max-h-[60vh] overflow-y-auto`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Merge className="h-5 w-5 text-blue-400" />
                <p className="text-base font-bold">Merge Tables</p>
              </div>
              <p className={`text-xs ${t.textDim} mb-4`}>
                {mergeSource === null
                  ? "Select first table to merge"
                  : `Select second table to merge T${mergeSource + 1} with...`}
              </p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {tables.map((table, idx) => {
                  const hasItems = table.items.length > 0;
                  const isSource = mergeSource === idx;
                  const canSelect =
                    mergeSource === null ? hasItems : mergeSource !== idx;
                  return (
                    <button
                      key={idx}
                      disabled={!canSelect}
                      onClick={() => {
                        if (mergeSource === null) {
                          setMergeSource(idx);
                        } else {
                          handleMerge(mergeSource, idx);
                        }
                      }}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${
                        isSource
                          ? "bg-purple-500/20 border-purple-500/50"
                          : !canSelect
                            ? `${t.surface} ${t.border} opacity-30`
                            : `${t.surface} ${t.border} hover:bg-purple-500/10`
                      }`}
                    >
                      <span className="text-sm font-bold">T{idx + 1}</span>
                      {hasItems && (
                        <span className="text-[10px] text-amber-400">
                          {orderTotal(table)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => {
                  setShowMergeModal(false);
                  setMergeSource(null);
                }}
                className={`w-full h-11 rounded-2xl ${t.cancelBtn} text-sm font-semibold`}
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Sections Manager Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showSectionsModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 ${t.modalOverlay} z-40`}
              onClick={() => setShowSectionsModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.18 }}
              className={`fixed left-4 right-4 top-16 z-50 ${t.modalBg} rounded-3xl p-6 border ${t.border} shadow-2xl max-h-[75vh] overflow-y-auto`}
            >
              <div className="flex items-center gap-2 mb-1">
                <LayoutGrid className="h-5 w-5 text-purple-400" />
                <p className="text-base font-bold">Table Sections</p>
              </div>
              <p className={`text-xs ${t.textDim} mb-4`}>
                Select a section, then tap tables to assign them
              </p>

              {/* Section tabs */}
              <div className="flex gap-2 mb-4">
                {draftSections.map((section) => (
                  <button
                    key={section.name}
                    onClick={() => setActiveDraftSection(section.name)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      activeDraftSection === section.name
                        ? section.name === "Indoor"
                          ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                          : section.name === "Outdoor"
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                            : "bg-purple-500/20 border-purple-500/50 text-purple-400"
                        : `${t.surface} ${t.border} ${t.textMuted}`
                    }`}
                  >
                    {section.name}
                    <span className="ml-1 opacity-60">
                      ({section.tables.length})
                    </span>
                  </button>
                ))}
              </div>

              {/* Table grid */}
              <div className="grid grid-cols-5 gap-2 mb-5">
                {Array.from({ length: TABLE_COUNT }, (_, idx) => {
                  const ownerSection = draftSections.find((s) =>
                    s.tables.includes(idx),
                  );
                  const isAssignedHere =
                    ownerSection?.name === activeDraftSection;
                  const isAssignedElsewhere =
                    ownerSection && ownerSection.name !== activeDraftSection;

                  const sectionColor =
                    activeDraftSection === "Indoor"
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                      : activeDraftSection === "Outdoor"
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "bg-purple-500/20 border-purple-500/50 text-purple-400";

                  const elseColor =
                    ownerSection?.name === "Indoor"
                      ? "border-blue-500/30 text-blue-400/50"
                      : ownerSection?.name === "Outdoor"
                        ? "border-emerald-500/30 text-emerald-400/50"
                        : "border-purple-500/30 text-purple-400/50";

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setDraftSections((prev) =>
                          prev.map((s) => {
                            if (s.name === activeDraftSection) {
                              return isAssignedHere
                                ? {
                                    ...s,
                                    tables: s.tables.filter(
                                      (tableId) => tableId !== idx,
                                    ),
                                  }
                                : {
                                    ...s,
                                    tables: [...s.tables, idx].sort(
                                      (a, b) => a - b,
                                    ),
                                  };
                            }
                            return {
                              ...s,
                              tables: s.tables.filter(
                                (tableId) => tableId !== idx,
                              ),
                            };
                          }),
                        );
                      }}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center border transition-all text-xs font-bold ${
                        isAssignedHere
                          ? sectionColor
                          : isAssignedElsewhere
                            ? `${t.surface} ${elseColor} opacity-50`
                            : `${t.surface} ${t.border} ${t.textMuted}`
                      }`}
                    >
                      T{idx + 1}
                      {isAssignedElsewhere && (
                        <span className="text-[9px] font-normal mt-0.5 opacity-70">
                          {ownerSection.name.slice(0, 3)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-3 mb-5 flex-wrap">
                {draftSections.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        s.name === "Indoor"
                          ? "bg-blue-400"
                          : s.name === "Outdoor"
                            ? "bg-emerald-400"
                            : "bg-purple-400"
                      }`}
                    />
                    <span
                      className={`text-[10px] ${t.textDim}`}
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {s.name.toUpperCase()} · {s.tables.length}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 ml-auto">
                  <div
                    className={`h-2 w-2 rounded-full ${t.surfaceSoft} border ${t.border}`}
                  />
                  <span
                    className={`text-[10px] ${t.textDim}`}
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    UNASSIGNED ·{" "}
                    {TABLE_COUNT -
                      draftSections.reduce(
                        (sum, s) => sum + s.tables.length,
                        0,
                      )}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSectionsModal(false)}
                  className={`flex-1 h-11 rounded-2xl ${t.cancelBtn} text-sm font-semibold`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSections(draftSections);
                    setShowSectionsModal(false);
                  }}
                  className="flex-1 h-11 rounded-2xl bg-amber-500 text-sm font-bold text-black"
                >
                  Save sections
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── New Person Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewPerson && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 ${t.modalOverlay} z-40`}
              onClick={() => {
                setShowNewPerson(false);
                setNewPersonName("");
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.18 }}
              className={`fixed left-4 right-4 bottom-1/3 z-50 ${t.modalBg} rounded-3xl p-6 border ${t.borderDashed} shadow-2xl`}
            >
              <p className={`text-base font-bold ${t.text} mb-1`}>
                Krijo Person
              </p>
              <p className={`text-xs ${t.textDim} mb-4`}>
                Shkruaj emrin e personit
              </p>
              <input
                ref={nameInputRef}
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreatePerson();
                }}
                placeholder="p.sh. Besart, Mirem, Person1…"
                className={`w-full h-12 rounded-xl border ${t.inputBorder} px-4 text-sm outline-none focus:border-amber-500/50 mb-4`}
                style={{ background: t.inputBgStyle, color: t.inputTextStyle }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowNewPerson(false);
                    setNewPersonName("");
                  }}
                  className={`flex-1 h-11 rounded-2xl ${t.surfaceSoft} text-sm ${t.textMuted} font-semibold`}
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
