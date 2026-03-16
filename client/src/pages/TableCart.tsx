import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Pusher from "pusher-js";
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
  Bot,
  Sparkles,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: number;
  name: string;
  price: string;
  category: string;
  active: boolean;
  imageUrl?: string | null;
  description?: string | null;
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

type View = "menu" | "cart";
type Lang = "al" | "mk" | "en";

// ─── Translations ─────────────────────────────────────────────────────────────
const t = {
  al: {
    table: "Tavolina",
    loading: "Duke ngarkuar menunë…",
    notFound: "Restoranti nuk u gjet. Kontrolloni URL-në dhe provoni përsëri.",
    allCategories: "Të gjitha",
    emptyCategory: "Nuk ka artikuj në këtë kategori",
    viewCart: "Shiko shportën",
    cart: "Shporta",
    cartItems: (n: number) => `${n} artikuj`,
    yourOrder: (t: number) => `Porosia juaj · Tavolina ${t}`,
    emptyCart: "Shporta është bosh",
    addItems: "Shto artikuj",
    placeOrder: (total: number) => `Porosit · ${total} DEN`,
    orderSent: "Porosia u dërgua!",
    aiTitle: "Kamarierin AI",
    aiPlaceholder: "Pyetni për menunë...",
    aiGreeting: (name: string, table: number) =>
      `Përshëndetje! Jam kamarierin tuaj AI për **${name}** 👋\n\nJu ndodhet në Tavolinën ${table}. Pyetni çfarë të doni — e njoh menunë plotësisht!`,
    aiError: "Na vjen keq, pati një problem. 🙏",
    quickActions: [
      { label: "⭐ Popullore", prompt: "Çfarë rekomandoni sot?" },
      { label: "🌱 Vegane", prompt: "Keni opsione vegjetariane ose vegane?" },
      { label: "💰 Ekonomike", prompt: "Cilat janë pjatat më të lira?" },
      { label: "🍹 Pije", prompt: "Çfarë pijesh keni?" },
    ],
    aiSystemRules: `1. Përgjigju GJITHMONË në shqip.
2. Kur rekomandon pjata, përmend emrat SAKTË si janë në meni me çmimet.
3. Nëse shporta ka artikuj, suggjero diçka plotësuese (pije, ëmbëlsirë).
4. Përgjigjet duhet të jenë TË SHKURTRA — max 3-4 fjali.
5. Mos huto informacione për pjata që nuk janë në meni.
6. Përdor emoji me moderim.`,
  },
  mk: {
    table: "Маса",
    loading: "Се вчитува мениот…",
    notFound:
      "Ресторанот не е пронајден. Проверете ја URL-то и обидете се повторно.",
    allCategories: "Сите",
    emptyCategory: "Нема артикли во оваа категорија",
    viewCart: "Кошничка",
    cart: "Кошничка",
    cartItems: (n: number) => `${n} артикли`,
    yourOrder: (t: number) => `Вашата нарачка · Маса ${t}`,
    emptyCart: "Кошничката е празна",
    addItems: "Додај артикли",
    placeOrder: (total: number) => `Нарачај · ${total} ДЕН`,
    orderSent: "Нарачката е испратена!",
    aiTitle: "AI Келнер",
    aiPlaceholder: "Прашајте за менито...",
    aiGreeting: (name: string, table: number) =>
      `Добредојдовте! Јас сум вашиот AI келнер за **${name}** 👋\n\nСедите на Маса ${table}. Прашајте ме за менито — го знам целосно!`,
    aiError: "Жалиме, се случи проблем. 🙏",
    quickActions: [
      { label: "⭐ Популарно", prompt: "Што препорачувате денес?" },
      { label: "🌱 Вегетаријанско", prompt: "Имате ли вегетаријански опции?" },
      { label: "💰 Поевтино", prompt: "Кои се најевтините јадења?" },
      { label: "🍹 Пијалоци", prompt: "Какви пијалоци имате?" },
    ],
    aiSystemRules: `1. Одговарај СЕКОГАШ на македонски.
2. Кога препорачуваш јадења, наведи ги имињата ТОЧНО како во менито со цените.
3. Ако кошничката има артикли, предложи нешто комплементарно (пијалок, десерт).
4. Одговорите треба да бидат КРАТКИ — макс 3-4 реченици.
5. Не измислувај информации за јадења кои не се во менито.
6. Користи емоџи умерено.`,
  },
  en: {
    table: "Table",
    loading: "Loading menu…",
    notFound: "Restaurant not found. Check the URL and try again.",
    allCategories: "All",
    emptyCategory: "No items in this category",
    viewCart: "View Cart",
    cart: "Cart",
    cartItems: (n: number) => `${n} items`,
    yourOrder: (t: number) => `Your order · Table ${t}`,
    emptyCart: "Your cart is empty",
    addItems: "Add items",
    placeOrder: (total: number) => `Order · ${total} DEN`,
    orderSent: "Order placed!",
    aiTitle: "AI Waiter",
    aiPlaceholder: "Ask about the menu...",
    aiGreeting: (name: string, table: number) =>
      `Hello! I'm your AI waiter at **${name}** 👋\n\nYou're at Table ${table}. Ask me anything — I know the menu inside out!`,
    aiError: "Sorry, something went wrong. 🙏",
    quickActions: [
      { label: "⭐ Popular", prompt: "What do you recommend today?" },
      { label: "🌱 Vegan", prompt: "Do you have vegetarian or vegan options?" },
      { label: "💰 Budget", prompt: "What are the cheapest dishes?" },
      { label: "🍹 Drinks", prompt: "What drinks do you have?" },
    ],
    aiSystemRules: `1. ALWAYS reply in English.
2. When recommending dishes, mention names EXACTLY as in the menu with prices.
3. If the cart has items, suggest something complementary (drink, dessert).
4. Keep answers SHORT — max 3-4 sentences.
5. Don't make up dishes not on the menu.
6. Use emoji sparingly.`,
  },
} as const;

function parsePrice(price: string): number {
  return parseInt(price.replace(/[^0-9]/g, "")) || 0;
}

// ─── Language Selector ────────────────────────────────────────────────────────
function LangSelector({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <div className="bg-muted rounded-xl p-0.5 flex">
      {(["al", "mk", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
            lang === l
              ? "bg-white dark:bg-stone-700 text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ─── AI Waiter Panel ──────────────────────────────────────────────────────────
interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendedItems?: MenuItem[];
}

function AIWaiterPanel({
  open,
  onClose,
  restaurantName,
  menuItems,
  cart,
  tableNumber,
  onAddItem,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  restaurantName: string;
  menuItems: MenuItem[];
  cart: CartItem[];
  tableNumber: number;
  onAddItem: (item: MenuItem) => void;
  lang: Lang;
}) {
  const tr = t[lang];
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);
  const messagesRef = useRef<AIMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (open && !initialized.current) {
      initialized.current = true;
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: tr.aiGreeting(restaurantName, tableNumber),
        },
      ]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 350);
  }, [open]);

  // Reset greeting when language changes
  useEffect(() => {
    if (initialized.current) {
      setMessages([
        {
          id: `greeting-${lang}`,
          role: "assistant",
          content: tr.aiGreeting(restaurantName, tableNumber),
        },
      ]);
    }
  }, [lang]);

  const buildSystemPrompt = useCallback(() => {
    const menuText = menuItems
      .map(
        (i) =>
          `• ${i.name} — ${i.price}${i.description ? ` (${i.description})` : ""} [${i.category}]`,
      )
      .join("\n");
    const cartText =
      cart.length > 0
        ? cart.map((i) => `  - ${i.qty}x ${i.name} (${i.price} DEN)`).join("\n")
        : "Empty";
    const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    return `You are a friendly AI waiter for restaurant "${restaurantName}".
The customer is at Table ${tableNumber}.

## Menu
${menuText}

## Customer's current cart
${cartText}
${cart.length > 0 ? `Total: ${cartTotal} DEN` : ""}

## Rules
${tr.aiSystemRules}`;
  }, [restaurantName, tableNumber, menuItems, cart, lang]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;
      const userMsg: AIMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);
      try {
        const history = messagesRef.current
          .filter((m) => m.content.trim())
          .map((m) => ({ role: m.role, content: m.content }));
        const response = await fetch("/api/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system: buildSystemPrompt(),
            max_tokens: 400,
            messages: [...history, { role: "user", content: text.trim() }],
          }),
        });
        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`HTTP ${response.status}: ${errBody}`);
        }
        const data = await response.json();
        const rawText: string = data.text || data.content?.[0]?.text || "";
        if (!rawText)
          throw new Error(`Empty response: ${JSON.stringify(data)}`);
        const mentioned = menuItems
          .filter(
            (item) =>
              item.active &&
              rawText.toLowerCase().includes(item.name.toLowerCase()),
          )
          .slice(0, 3);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: rawText,
            recommendedItems: mentioned.length > 0 ? mentioned : undefined,
          },
        ]);
      } catch (err: any) {
        console.error("[AI Waiter] error:", err?.message || err);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `${tr.aiError}\n_(${err?.message || "unknown"})_`,
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, buildSystemPrompt, menuItems],
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white dark:bg-stone-900 rounded-t-3xl shadow-2xl overflow-hidden"
            style={{
              maxHeight: "85dvh",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-stone-200 dark:bg-stone-700" />
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">
                    {tr.aiTitle}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                    {tr.table} {tableNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center active:bg-muted/70"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex gap-1.5 px-4 py-2 overflow-x-auto flex-shrink-0 border-b border-border">
              {tr.quickActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => sendMessage(a.prompt)}
                  disabled={isTyping}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                >
                  {a.label}
                </button>
              ))}
            </div>
            <div
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 340, damping: 26 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-line">
                        {msg.content.replace(/\*\*/g, "")}
                      </p>
                      {msg.recommendedItems &&
                        msg.recommendedItems.length > 0 && (
                          <div className="mt-2.5 space-y-2">
                            {msg.recommendedItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-2.5 bg-white dark:bg-stone-800 rounded-xl p-2 border border-border"
                              >
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
                                    🍽️
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-foreground truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-xs font-bold text-primary">
                                    {item.price}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    onAddItem(item);
                                    onClose();
                                  }}
                                  className="flex-shrink-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                                >
                                  <Plus className="h-3.5 w-3.5 text-primary-foreground" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-1.5">
                      {[0, 150, 300].map((delay) => (
                        <motion.span
                          key={delay}
                          className="w-1.5 h-1.5 bg-primary rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: delay / 1000,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
            <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-white dark:bg-stone-900">
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder={tr.aiPlaceholder}
                  disabled={isTyping}
                  className="flex-1 h-10 px-4 rounded-full text-sm bg-muted border-0 outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isTyping}
                  className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-sm active:scale-95 transition-transform disabled:opacity-40 disabled:pointer-events-none flex-shrink-0"
                >
                  <Send className="h-4 w-4 text-primary-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TableCart({ restaurantSlug, tableNumber }: Props) {
  const channelName = `table-${restaurantSlug}-${tableNumber}`;

  const getDefaultLang = (): Lang => {
    const bl = navigator.language.toLowerCase();
    if (bl.startsWith("sq")) return "al";
    if (bl.startsWith("mk")) return "mk";
    return "en";
  };

  const [lang, setLang] = useState<Lang>(getDefaultLang);
  const tr = t[lang];

  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<View>("menu");
  const [activeCategory, setActiveCategory] = useState(tr.allCategories);
  const [connected, setConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [justAdded, setJustAdded] = useState<number | null>(null);
  const [ordered, setOrdered] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const isLocal = useRef(false);
  const pusherRef = useRef<Pusher | null>(null);

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
    return [tr.allCategories, ...cats];
  }, [menuItems, lang]);

  const filtered = useMemo(
    () =>
      activeCategory === tr.allCategories
        ? menuItems
        : menuItems.filter((i) => i.category === activeCategory),
    [menuItems, activeCategory, lang],
  );

  useEffect(() => {
    setActiveCategory(tr.allCategories);
  }, [lang]);

  // ── Pusher setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const pusherKey = import.meta.env.VITE_PUSHER_KEY;
    const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER;
    if (!pusherKey || !pusherCluster) {
      console.warn("Pusher env vars missing");
      return;
    }
    const pusher = new Pusher(pusherKey, { cluster: pusherCluster });
    pusherRef.current = pusher;
    const channel = pusher.subscribe(channelName);
    pusher.connection.bind("connected", () => setConnected(true));
    pusher.connection.bind("disconnected", () => setConnected(false));
    pusher.connection.bind("error", () => setConnected(false));
    channel.bind("cart-update", (data: { cart: CartItem[] }) => {
      if (isLocal.current) return;
      setCart(data.cart);
    });
    channel.bind("pusher:subscription_succeeded", () => setConnected(true));
    fetch(`/api/table/${channelName}/cart`)
      .then((r) => r.json())
      .then((d) => {
        if (d.cart) setCart(d.cart);
      })
      .catch(() => {});
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [channelName]);

  const syncCart = useCallback(
    async (newCart: CartItem[]) => {
      isLocal.current = true;
      setTimeout(() => {
        isLocal.current = false;
      }, 200);
      try {
        await fetch("/api/table/cart-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel: channelName, cart: newCart }),
        });
      } catch (e) {
        console.error("syncCart failed", e);
      }
    },
    [channelName],
  );

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

  const placeOrder = async () => {
    try {
      await fetch("/api/table/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: channelName, cart, tableNumber }),
      });
    } catch {}
    setOrdered(true);
    setTimeout(() => {
      setOrdered(false);
      setCart([]);
      syncCart([]);
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-full bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-9 w-9 text-primary" />
        </motion.div>
        <p className="text-sm font-medium">{tr.loading}</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="h-[100dvh] w-full bg-background flex flex-col items-center justify-center gap-4 p-8 text-center">
        <UtensilsCrossed className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground max-w-xs">{tr.notFound}</p>
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

      <AIWaiterPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        restaurantName={restaurant.name}
        menuItems={menuItems}
        cart={cart}
        tableNumber={tableNumber}
        onAddItem={addItem}
        lang={lang}
      />

      {/* Floating AI button */}
      <motion.button
        onClick={() => setAiOpen(true)}
        whileTap={{ scale: 0.9 }}
        className="fixed z-30 bg-gradient-to-br from-primary to-primary/80 shadow-xl flex items-center justify-center rounded-full"
        style={{
          bottom: itemCount > 0 ? 88 : 24,
          right: 16,
          height: 50,
          width: 50,
          transition: "bottom 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <Bot className="h-5 w-5 text-white" />
        <motion.span
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute -top-1 -right-1"
        >
          <Sparkles className="h-3 w-3 text-yellow-400 drop-shadow" />
        </motion.span>
      </motion.button>

      {/* Header */}
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
              {tr.table} {tableNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <LangSelector lang={lang} onChange={setLang} />
          {peerCount > 0 && (
            <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
              <Users className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {peerCount}
              </span>
            </div>
          )}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${connected ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/30 text-red-500"}`}
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

      <div className="flex-1 relative overflow-hidden min-h-0">
        <AnimatePresence mode="sync">
          {/* ══ MENU VIEW ══ */}
          {view === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 flex flex-col overflow-hidden"
            >
              <div className="flex-shrink-0 flex gap-2 px-4 py-2.5 overflow-x-auto bg-white dark:bg-stone-900 border-b border-border">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${activeCategory === cat ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                <div
                  className="p-4 space-y-3 max-w-2xl mx-auto w-full"
                  style={{ paddingBottom: 96 }}
                >
                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                      <UtensilsCrossed className="h-10 w-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">
                        {tr.emptyCategory}
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
                        className={`relative flex items-center gap-3 p-3.5 rounded-2xl border transition-colors duration-150 ${inCart ? "bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30" : "bg-white dark:bg-stone-800/60 border-border"}`}
                      >
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
                        {tr.viewCart}
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

          {/* ══ CART VIEW ══ */}
          {view === "cart" && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 flex flex-col overflow-hidden bg-background"
            >
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
                    {tr.cart}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
                    {tr.table} {tableNumber} · {tr.cartItems(itemCount)}
                  </p>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto overscroll-contain min-h-0"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div
                  className="p-4 space-y-2.5 max-w-2xl mx-auto w-full"
                  style={{ paddingBottom: 24 }}
                >
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground/25" />
                      <p className="text-sm text-muted-foreground">
                        {tr.emptyCart}
                      </p>
                      <Button
                        variant="outline"
                        className="rounded-xl border-primary/30 text-primary hover:bg-primary/5"
                        onClick={() => setView("menu")}
                      >
                        {tr.addItems}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 pb-1 font-mono">
                        {tr.yourOrder(tableNumber)}
                      </p>
                      {cart.map((item) => (
                        <motion.div
                          key={item.id}
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

              {cart.length > 0 && (
                <div
                  className="flex-shrink-0 px-4 pt-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-border space-y-3"
                  style={{
                    paddingBottom:
                      "max(16px, env(safe-area-inset-bottom, 16px))",
                  }}
                >
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm text-muted-foreground">
                      {tr.cartItems(itemCount)}
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
                          {tr.orderSent}
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
                          {tr.placeOrder(total)}
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
    </div>
  );
}
