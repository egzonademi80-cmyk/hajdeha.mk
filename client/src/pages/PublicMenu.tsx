import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { TrendingUp } from "lucide-react";
import { Search } from "lucide-react"; // <-- IMPORT
import {
  Loader2,
  UtensilsCrossed,
  Globe,
  Phone,
  MapPin,
  Plus,
  Minus,
  ShoppingBag,
  X,
  ChevronDown,
  Filter,
  Leaf,
  Beef,
  WheatOff,
  Clock,
  CheckCircle2,
  Mic,
  MicOff,
  Share2,
  Facebook,
  Twitter,
  Link as LinkIcon,
  Copy,
  Check,
  Sparkles,
  Bot,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type MenuItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDarkMode } from "@/hooks/useDarkMode";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const translations: Record<string, any> = {
  en: {
    orderOnWhatsapp: "Order on WhatsApp",
    newOrder: "New Order",
    total: "Total",
    loading: "Loading Menu...",
    notFound: "Restaurant Not Found",
    notFoundDesc:
      "We couldn't find the menu you're looking for. Please check the URL and try again.",
    openNow: "Open Now",
    closed: "Closed",
    reserve: "Reserve Table",
    website: "Website",
    viewOrder: "View Order",
    orderSummary: "Order Summary",
    quantity: "Qty",
    item: "Item",
    price: "Price",
    totalBill: "Total Bill",
    clear: "Clear",
    callToOrder: "Call to Order",
    about: "About",
    ourLocation: "Our Location",
    poweredBy: "Powered by HAJDE HA",
    allCategories: "All Categories",
    allDietary: "All Dietary",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    glutenFree: "Gluten-Free",
    yourName: "Your Name",
    enterYourName: "Enter your name",
    pleaseEnterName: "Please enter your name",
    customerName: "Name",
    orderType: "Order Type",
    dineIn: "Dine In",
    takeaway: "Takeaway",
    deliveryTime: "Delivery Time",
    asap: "ASAP",
    customTime: "Custom Time",
    voiceSearch: "Voice Search",
    listening: "Listening...",
    tapToSpeak: "Tap to speak",
    voiceNotSupported: "Voice search not supported",
    aiSearching: "Finding best matches...",
    foundMatches: "Found {count} matches for",
    noVoiceMatches: "No items match your search. Try different words.",
    shareItem: "Share Item",
    shareOn: "Share on",
    copyLink: "Copy Link",
    linkCopied: "Link copied!",
    searchPlaceholder: "  Search menu items...",
  },
  al: {
    orderOnWhatsapp: "Porosit në WhatsApp",
    newOrder: "Porosi e re",
    total: "Totali",
    loading: "Duke ngarkuar menunë...",
    notFound: "Restoranti nuk u gjet",
    notFoundDesc:
      "Nuk mundëm ta gjenim menunë që kërkoni. Ju lutemi kontrolloni URL-në dhe provoni përsëri.",
    openNow: "Hapur tani",
    closed: "Mbyllur",
    reserve: "Rezervoni tavolinë",
    website: "Uebfaqja",
    viewOrder: "Shiko porosinë",
    orderSummary: "Përmbledhja e porosisë",
    quantity: "Sasia",
    item: "Artikulli",
    price: "Çmimi",
    totalBill: "Fatura totale",
    clear: "Pastro",
    callToOrder: "Telefono për porosi",
    about: "Rreth",
    ourLocation: "Lokacioni ynë",
    poweredBy: "Mundësuar nga HAJDE HA",
    allCategories: "Të gjitha kategoritë",
    allDietary: "Të gjitha dietat",
    vegetarian: "Vegjetariane",
    vegan: "Vegane",
    glutenFree: "Pa gluten",
    yourName: "Emri juaj",
    enterYourName: "Shkruani emrin tuaj",
    pleaseEnterName: "Ju lutemi shkruani emrin tuaj",
    customerName: "Emri",
    orderType: "Lloji i porosisë",
    dineIn: "Hani këtu",
    takeaway: "Për me vete",
    deliveryTime: "Koha e dorëzimit",
    asap: "Sa më shpejt",
    customTime: "Kohë custom",
    voiceSearch: "Kërkim me zë",
    listening: "Duke dëgjuar...",
    tapToSpeak: "Kliko për të folur",
    voiceNotSupported: "Kërkimi me zë nuk mbështetet",
    aiSearching: "Duke gjetur përputhjet më të mira...",
    foundMatches: "U gjetën {count} përputhje për",
    noVoiceMatches: "Nuk ka artikuj që përputhen. Provo fjalë të tjera.",
    shareItem: "Ndaj artikullin",
    shareOn: "Ndaj në",
    copyLink: "Kopjo lidhjen",
    linkCopied: "Lidhja u kopjua!",
    searchPlaceholder: "  Kërko në menu...",
  },
  mk: {
    orderOnWhatsapp: "Нарачај на WhatsApp",
    newOrder: "Нова нарачка",
    total: "Вкупно",
    loading: "Се вчитува менито...",
    notFound: "Ресторанот не е пронајден",
    notFoundDesc:
      "Не можевме да го најдеме менито што го барате. Ве молиме проверете ја URL-адресата и обидете се повторно.",
    openNow: "Отворено сега",
    closed: "Затворено",
    reserve: "Резервирај маса",
    website: "Веб-страница",
    viewOrder: "Види нарачка",
    orderSummary: "Преглед на нарачката",
    quantity: "Количина",
    item: "Производ",
    price: "Цена",
    totalBill: "Вкупна сметка",
    clear: "Исчисти",
    callToOrder: "Повикај за нарачка",
    about: "За",
    ourLocation: "Нашата локација",
    poweredBy: "Овозможено од HAJDE HA",
    allCategories: "Сите категории",
    allDietary: "Сите диети",
    vegetarian: "Вегетаријанско",
    vegan: "Веганско",
    glutenFree: "Без глутен",
    yourName: "Вашето име",
    enterYourName: "Внесете го вашето име",
    pleaseEnterName: "Ве молиме внесете го вашето име",
    customerName: "Име",
    orderType: "Тип на нарачка",
    dineIn: "Јадење тука",
    takeaway: "За понесување",
    deliveryTime: "Време на достава",
    asap: "Што побрзо",
    customTime: "Прилагодено време",
    voiceSearch: "Гласовно пребарување",
    listening: "Слушам...",
    tapToSpeak: "Допрете за да зборувате",
    voiceNotSupported: "Гласовното пребарување не е поддржано",
    aiSearching: "Се бара најдобри совпаѓања...",
    foundMatches: "Пронајдени {count} совпаѓања за",
    noVoiceMatches: "Нема ставки што одговараат. Обидете се со други зборови.",
    shareItem: "Сподели производ",
    shareOn: "Сподели на",
    copyLink: "Копирај линк",
    linkCopied: "Линкот е копиран!",
    searchPlaceholder: "  Пребарај во менито...",
  },
};

const leafletStyles = `
  .leaflet-container {
    width: 100%;
    height: 100%;
    border-radius: 1rem;
    z-index: 10;
  }
`;

// AI-Powered Fuzzy Matching Utility
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  let wordMatches = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) {
        wordMatches++;
        break;
      }
    }
  }
  const wordScore = wordMatches / Math.max(words1.length, words2.length);
  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  const distanceScore = 1 - distance / maxLen;
  return Math.max(wordScore, distanceScore);
}

function findBestMatches(
  query: string,
  items: MenuItem[],
  lang: "en" | "al" | "mk",
  threshold: number = 0.3,
): MenuItem[] {
  const scoredItems = items.map((item) => {
    const name =
      lang === "al" && item.nameAl
        ? item.nameAl
        : lang === "mk" && item.nameMk
          ? item.nameMk
          : item.name;
    const description =
      lang === "al" && item.descriptionAl
        ? item.descriptionAl
        : lang === "mk" && item.descriptionMk
          ? item.descriptionMk
          : item.description;
    const nameScore = calculateSimilarity(query, name);
    const descScore = description
      ? calculateSimilarity(query, description) * 0.7
      : 0;
    const categoryScore = calculateSimilarity(query, item.category) * 0.5;
    return { item, score: Math.max(nameScore, descScore, categoryScore) };
  });
  return scoredItems
    .filter((s) => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);
}

// Voice Search Hook
function useVoiceSearch(
  onResult: (text: string, matches: MenuItem[]) => void,
  allItems: MenuItem[],
  lang: "en" | "al" | "mk",
) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang =
          { en: "en-US", al: "sq-AL", mk: "mk-MK" }[lang] || "en-US";
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          onResult(transcript, findBestMatches(transcript, allItems, lang));
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef[0] = recognition;
      }
    }
  }, [onResult, allItems, lang]);

  return {
    isListening,
    isSupported,
    startListening: () => {
      if (recognitionRef[0] && !isListening) {
        recognitionRef[0].start();
        setIsListening(true);
      }
    },
    stopListening: () => {
      if (recognitionRef[0] && isListening) {
        recognitionRef[0].stop();
        setIsListening(false);
      }
    },
  };
}

// Share Dialog
function ShareDialog({
  item,
  restaurantSlug,
}: {
  item: MenuItem;
  restaurantSlug: string;
}) {
  const [lang] = useState<"en" | "al" | "mk">(
    () => (localStorage.getItem("hajdeha-lang") as any) || "en",
  );
  const t = translations[lang];
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const itemUrl = `${window.location.origin}/restaurant/${restaurantSlug}#item-${item.id}`;
  const shareText = `Check out ${item.name} at ${item.price}!`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(itemUrl);
      setCopied(true);
      toast({ title: t.linkCopied });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-primary/10 flex-shrink-0"
        >
          <Share2 className="h-3.5 w-3.5 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white dark:bg-stone-800 mx-4 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="dark:text-stone-100">
            {t.shareItem}
          </DialogTitle>
          <DialogDescription className="dark:text-stone-400">
            {item.name} - {item.price}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2 text-sm"
              onClick={() =>
                window.open(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(itemUrl)}`,
                  "_blank",
                )
              }
            >
              <Facebook className="h-4 w-4 text-blue-600" />
              Facebook
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 text-sm"
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(itemUrl)}`,
                  "_blank",
                )
              }
            >
              <Twitter className="h-4 w-4 text-sky-500" />
              Twitter
            </Button>
          </div>
          {"share" in navigator && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={async () => {
                try {
                  await navigator.share({
                    title: item.name,
                    text: shareText,
                    url: itemUrl,
                  });
                } catch {}
              }}
            >
              <Share2 className="h-4 w-4" />
              {t.shareOn}...
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={itemUrl}
              className="flex-1 bg-stone-50 dark:bg-stone-700 dark:text-stone-100 text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyLink}
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// People Also Ordered
function PeopleAlsoOrdered({
  currentItemId,
  allItems,
  onAddToCart,
}: {
  currentItemId: number;
  allItems: MenuItem[];
  onAddToCart: (itemId: number) => void;
}) {
  const [lang] = useState<"en" | "al" | "mk">(
    () => (localStorage.getItem("hajdeha-lang") as any) || "en",
  );
  const t = translations[lang];
  const currentItem = allItems.find((item) => item.id === currentItemId);
  const suggestions = useMemo(() => {
    if (!currentItem) return [];
    return allItems
      .filter(
        (i) =>
          i.id !== currentItemId &&
          i.category === currentItem.category &&
          i.active,
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  }, [currentItemId, allItems, currentItem]);

  if (suggestions.length === 0) return null;
  return (
    <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
          {t.peopleAlsoOrdered}
        </h4>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {suggestions.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-700/50 border border-stone-100 dark:border-stone-600"
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-stone-900 dark:text-stone-100 truncate">
                {item.name}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {item.description}
              </p>
              <p className="text-sm font-bold text-primary mt-0.5">
                {item.price}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full flex-shrink-0 hover:bg-primary/10"
              onClick={() => onAddToCart(item.id)}
            >
              <Plus className="h-4 w-4 text-primary" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Inline Map for AI Assistant - lightweight embedded map
function InlineMap({
  latitude,
  longitude,
  name,
  location,
}: {
  latitude?: string | null;
  longitude?: string | null;
  name: string;
  location?: string;
}) {
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const leaflet = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        });
        setL(leaflet);
      } catch {}
    };
    load();
  }, []);

  const position: [number, number] =
    latitude &&
    longitude &&
    !isNaN(parseFloat(latitude)) &&
    !isNaN(parseFloat(longitude))
      ? [parseFloat(latitude), parseFloat(longitude)]
      : [42.01, 20.97];

  if (!L)
    return (
      <div className="w-full h-36 bg-stone-100 dark:bg-stone-700 animate-pulse rounded-xl flex items-center justify-center text-stone-400 text-xs">
        Loading map...
      </div>
    );

  return (
    <div className="w-full h-40 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-600 mt-2">
      <style>{leafletStyles}</style>
      <div
        ref={(el) => {
          if (!el || !L || mapRef.current) return;
          mapRef.current = L.map(el).setView(position, 15);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap",
          }).addTo(mapRef.current);
          L.marker(position).addTo(mapRef.current).bindPopup(name).openPopup();
        }}
        className="w-full h-full"
      />
    </div>
  );
}

// Restaurant Map (full page section)
function RestaurantMap({
  location,
  name,
  latitude,
  longitude,
}: {
  location: string;
  name: string;
  latitude?: string | null;
  longitude?: string | null;
}) {
  const { slug } = useParams<{ slug: string }>();
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [slug]);

  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        const leaflet = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        });
        setL(leaflet);
      } catch (err) {}
    };
    loadLeaflet();
  }, []);

  let position: [number, number] = [42.01, 20.97];
  if (
    latitude &&
    longitude &&
    !isNaN(parseFloat(latitude)) &&
    !isNaN(parseFloat(longitude))
  ) {
    position = [parseFloat(latitude), parseFloat(longitude)];
  }

  if (!L)
    return (
      <div className="w-full h-full bg-stone-100 dark:bg-stone-800 animate-pulse rounded-2xl flex items-center justify-center text-stone-400 dark:text-stone-500">
        Loading Map...
      </div>
    );

  return (
    <div className="w-full h-64 sm:h-80 relative rounded-2xl overflow-hidden shadow-lg border border-stone-200 dark:border-stone-700">
      <style>{leafletStyles}</style>
      <div
        ref={(el) => {
          if (!el || !L || el.innerHTML) return;
          const map = L.map(el).setView(position, 15);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
          }).addTo(map);
          L.marker(position).addTo(map).bindPopup(name).openPopup();
          let userMarker: any = null;
          if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
              (pos) => {
                const userPos: [number, number] = [
                  pos.coords.latitude,
                  pos.coords.longitude,
                ];
                const userIcon = L.divIcon({
                  html: `<div style="width:16px;height:16px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 0 6px rgba(37,99,235,0.25);"></div>`,
                  className: "",
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                });
                if (!userMarker) {
                  userMarker = L.marker(userPos, { icon: userIcon })
                    .addTo(map)
                    .bindPopup("Your Location");
                  map.fitBounds(L.latLngBounds([position, userPos]), {
                    padding: [40, 40],
                  });
                } else {
                  userMarker.setLatLng(userPos);
                }
              },
              () => {},
              { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 },
            );
          }
        }}
        className="w-full h-full"
      />
    </div>
  );
}

const groupItems = (items: MenuItem[]) => {
  const groups: Record<string, MenuItem[]> = {};
  const order = ["Starters", "Mains", "Sides", "Desserts", "Drinks"];
  items.forEach((item) => {
    if (!item.active) return;
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });
  return Object.entries(groups).sort(([a], [b]) => {
    const idxA = order.indexOf(a),
      idxB = order.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
};

function IsOpen(openingTime?: string, closingTime?: string) {
  if (!openingTime || !closingTime) return true;
  const d = new Date();
  const currentTime = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  return currentTime >= openingTime && currentTime <= closingTime;
}

// ========== AI ASSISTANT ==========
interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  recommendedItems?: MenuItem[];
  showMap?: boolean;
  mapData?: {
    latitude?: string | null;
    longitude?: string | null;
    name: string;
    location?: string;
  };
}

function AIRestaurantAssistant({
  restaurantName,
  restaurantPhone,
  restaurantLocation,
  openingTime,
  closingTime,
  menuItems,
  onAddToCart,
  lang,
  onScrollToMap,
  restaurantLatitude,
  restaurantLongitude,
}: {
  restaurantName: string;
  restaurantPhone?: string;
  restaurantLocation?: string;
  openingTime?: string;
  closingTime?: string;
  menuItems: MenuItem[];
  onAddToCart: (itemId: number, quantity: number) => void;
  lang: "en" | "al" | "mk";
  onScrollToMap: () => void;
  restaurantLatitude?: string | null;
  restaurantLongitude?: string | null;
}) {
  const aiT: Record<string, any> = {
    en: {
      aiAssistant: "AI Assistant",
      typing: "Thinking...",
      placeholder: "Ask me anything...",
      send: "Send",
      addToCart: "Add",
      added: "Added!",
      greeting: `Hello! I'm your AI assistant for ${restaurantName}! 👋`,
      canHelp:
        "I can help you find dishes, show location, hours, or book a table!",
    },
    al: {
      aiAssistant: "Asistenti AI",
      typing: "Po mendon...",
      placeholder: "Më pyet çfarë të duash...",
      send: "Dërgo",
      addToCart: "Shto",
      added: "U shtua!",
      greeting: `Përshëndetje! Unë jam asistenti juaj AI për ${restaurantName}! 👋`,
      canHelp:
        "Mund t'ju ndihmoj të gjeni pjata, të shihni vendndodhjen, orarin, ose të rezervoni tavolinë!",
    },
    mk: {
      aiAssistant: "AI Асистент",
      typing: "Размислува...",
      placeholder: "Прашај ме што сакаш...",
      send: "Испрати",
      addToCart: "Додај",
      added: "Додадено!",
      greeting: `Здраво! Јас сум вашиот AI асистент за ${restaurantName}! 👋`,
      canHelp:
        "Можам да ви помогнам да најдете јадења, да ви покажам локација, работно време, или да резервирате маса!",
    },
  };

  const t = aiT[lang];
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const actionButtons = {
    en: {
      menu: [
        { label: "Popular Dishes", action: "popular" },
        { label: "Dietary Options", action: "dietary" },
        { label: "Drinks & Desserts", action: "drinks" },
      ],
      restaurant: [
        { label: "📍 Location", action: "location" },
        { label: "Opening Hours", action: "hours" },
        { label: "Book Table", action: "book" },
      ],
    },
    al: {
      menu: [
        { label: "Pjatat Popullore", action: "popular" },
        { label: "Opsionet Dietike", action: "dietary" },
        { label: "Pije & Ëmbëlsira", action: "drinks" },
      ],
      restaurant: [
        { label: "📍 Vendndodhja", action: "location" },
        { label: "Orari i Punës", action: "hours" },
        { label: "Rezervo Tavolinë", action: "book" },
      ],
    },
    mk: {
      menu: [
        { label: "Популарни Јадења", action: "popular" },
        { label: "Диететски Опции", action: "dietary" },
        { label: "Пијалоци & Десерти", action: "drinks" },
      ],
      restaurant: [
        { label: "📍 Локација", action: "location" },
        { label: "Работно Време", action: "hours" },
        { label: "Резервирај Маса", action: "book" },
      ],
    },
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `${t.greeting}\n\n${t.canHelp}`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  const addMessage = useCallback((msg: AIMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const executeAction = useCallback(
    (action: string) => {
      switch (action) {
        case "popular": {
          const popular = menuItems
            .filter((i) => i.active && i.category === "Mains")
            .sort(() => Math.random() - 0.5)
            .slice(0, 6);
          addMessage({
            id: Date.now().toString(),
            role: "assistant",
            timestamp: new Date(),
            content:
              lang === "en"
                ? "⭐ Here are our most popular main dishes:"
                : lang === "al"
                  ? "⭐ Këtu janë pjatat tona kryesore më popullore:"
                  : "⭐ Еве ги нашите најпопуларни главни јадења:",
            recommendedItems: popular,
          });
          break;
        }
        case "dietary": {
          const veg = menuItems
            .filter((i) => i.isVegetarian || i.isVegan)
            .slice(0, 3);
          addMessage({
            id: Date.now().toString(),
            role: "assistant",
            timestamp: new Date(),
            content:
              lang === "en"
                ? "🌱 Our vegetarian & vegan options:"
                : lang === "al"
                  ? "🌱 Opsionet tona vegjetariane & vegane:"
                  : "🌱 Нашите вегетаријански и вегански опции:",
            recommendedItems:
              veg.length > 0
                ? veg
                : menuItems.filter((i) => i.active).slice(0, 3),
          });
          break;
        }
        case "drinks": {
          const drinks = menuItems
            .filter((i) => i.category.toLowerCase().includes("drink"))
            .slice(0, 3);
          addMessage({
            id: Date.now().toString(),
            role: "assistant",
            timestamp: new Date(),
            content:
              lang === "en"
                ? "🥤 Our drinks & desserts:"
                : lang === "al"
                  ? "🥤 Pijet & ëmbëlsirat tona:"
                  : "🥤 Нашите пијалоци и десерти:",
            recommendedItems:
              drinks.length > 0
                ? drinks
                : menuItems.filter((i) => i.active).slice(0, 3),
          });
          break;
        }
        case "prices": {
          const cheap = [...menuItems]
            .filter((i) => i.active)
            .sort(
              (a, b) =>
                (parseInt(a.price.replace(/[^0-9]/g, "")) || 0) -
                (parseInt(b.price.replace(/[^0-9]/g, "")) || 0),
            )
            .slice(0, 3);
          addMessage({
            id: Date.now().toString(),
            role: "assistant",
            timestamp: new Date(),
            content:
              lang === "en"
                ? "💰 Best value options:"
                : lang === "al"
                  ? "💰 Opsionet më të përballueshme:"
                  : "💰 Најдобри вредности:",
            recommendedItems: cheap,
          });
          break;
        }
        case "location": {
          const loc =
            restaurantLocation ||
            (lang === "en"
              ? "Location not available"
              : lang === "al"
                ? "Vendndodhja nuk është e disponueshme"
                : "Локацијата не е достапна");
          // Add message with inline map
          addMessage({
            id: Date.now().toString(),
            role: "assistant",
            timestamp: new Date(),
            content:
              lang === "en"
                ? `📍 Our location: ${loc}${restaurantPhone ? `\n📞 ${restaurantPhone}` : ""}`
                : lang === "al"
                  ? `📍 Lokacioni ynë: ${loc}${restaurantPhone ? `\n📞 ${restaurantPhone}` : ""}`
                  : `📍 Наша локација: ${loc}${restaurantPhone ? `\n📞 ${restaurantPhone}` : ""}`,
            showMap: true,
            mapData: {
              latitude: restaurantLatitude,
              longitude: restaurantLongitude,
              name: restaurantName,
              location: restaurantLocation,
            },
          });
          // Also scroll the main page map into view
          setTimeout(() => onScrollToMap(), 600);
          break;
        }
        case "hours": {
          addMessage({
            id: Date.now().toString(),
            role: "assistant",
            timestamp: new Date(),
            content:
              lang === "en"
                ? `⏰ Opening hours: ${openingTime || "N/A"} - ${closingTime || "N/A"}`
                : lang === "al"
                  ? `⏰ Orari: ${openingTime || "N/A"} - ${closingTime || "N/A"}`
                  : `⏰ Работно време: ${openingTime || "N/A"} - ${closingTime || "N/A"}`,
          });
          break;
        }
        case "book": {
          if (restaurantPhone) {
            const bookingMessage =
              lang === "en"
                ? `Hello! I would like to book a table at ${restaurantName}.\n\nMy details:\n• Date & Time: \n• Number of guests: \n• Name: \n\nThank you!`
                : lang === "al"
                  ? `Përshëndetje! Dëshiroj të rezervoj tavolinë në ${restaurantName}.\n\nDetajet:\n• Data & Ora: \n• Numri i mysafirëve: \n• Emri: \n\nFaleminderit!`
                  : `Здраво! Сакам да резервирам маса во ${restaurantName}.\n\nМои детали:\n• Датум и време: \n• Број на гости: \n• Име: \n\nБлагодарам!`;
            window.open(
              `https://wa.me/${restaurantPhone.replace(/\D/g, "")}?text=${encodeURIComponent(bookingMessage)}`,
              "_blank",
            );
          }
          addMessage({
            id: Date.now().toString(),
            role: "assistant",
            timestamp: new Date(),
            content:
              lang === "en"
                ? "📱 Opening WhatsApp to book your table..."
                : lang === "al"
                  ? "📱 Duke hapur WhatsApp për të rezervuar tavolinë..."
                  : "📱 Се отвора WhatsApp за резервација...",
          });
          break;
        }
        default:
          addMessage({
            id: Date.now().toString(),
            role: "assistant",
            timestamp: new Date(),
            content:
              lang === "en"
                ? "How can I help you?"
                : lang === "al"
                  ? "Si mund t'ju ndihmoj?"
                  : "Како можам да помогнам?",
          });
      }
    },
    [
      menuItems,
      lang,
      restaurantLocation,
      restaurantPhone,
      restaurantLatitude,
      restaurantLongitude,
      restaurantName,
      openingTime,
      closingTime,
      onScrollToMap,
      addMessage,
    ],
  );

  const detectIntent = (query: string): string => {
    // Popular / recommendations
    if (
      /popular|best|recommend|speciali|pjat.{0,10}(mir|popul)|popullar|специјал|препорач|најдобр/i.test(
        query,
      )
    )
      return "popular";
    // Dietary
    if (
      /vegetarian|vegan|diet|vegjetarian|vegan|vegane|без\s*мес|вегет/i.test(
        query,
      )
    )
      return "dietary";
    // Drinks & desserts
    if (
      /drink|beverage|desert|embëlsir|ëmbëlsir|pij[eë]|dezert|пијал|десерт/i.test(
        query,
      )
    )
      return "drinks";
    // Prices
    if (/cheap|price|afford|çmim|lir[eë]|çmim|цена|евтин|цени/i.test(query))
      return "prices";
    // Location / map
    if (
      /location|where|address|map|vendndodhj|adres[eë]|ku ndodh|hart[eë]|локац|адрес|каде/i.test(
        query,
      )
    )
      return "location";
    // Hours
    if (
      /hours|open|close|time|orar|hap|mbyll|kur|работн|отвор|затвор|час/i.test(
        query,
      )
    )
      return "hours";
    // Booking — EN + AL (rezerv*, tavolinë, book) + MK (резерв*, маса)
    if (/book|reserv|tavolinë|tavolina|rezerv|masa\b|маса|резерв/i.test(query))
      return "book";
    return "unknown";
  };
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      const scrollPercent = (scrollTop / docHeight) * 100;

      setShowButton(scrollPercent > 1);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    addMessage({
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    });
    const query = inputValue.toLowerCase();
    setInputValue("");
    setIsTyping(true);
    setTimeout(() => {
      const intent = detectIntent(query);
      if (intent !== "unknown") {
        executeAction(intent);
      } else {
        addMessage({
          id: Date.now().toString(),
          role: "assistant",
          timestamp: new Date(),
          content:
            lang === "en"
              ? "I can help you with:\n• 🍽️ Popular dishes\n• 🌱 Dietary options\n• 🥤 Drinks & desserts\n• 📍 Location\n• ⏰ Opening hours\n• 📅 Book a table\n\nWhat would you like?"
              : lang === "al"
                ? "Mund t'ju ndihmoj me:\n• 🍽️ Pjata popullore\n• 🌱 Opsione dietike\n• 🥤 Pije & ëmbëlsira\n• 📍 Vendndodhja\n• ⏰ Orari\n• 📅 Rezervo tavolinë\n\nÇfarë dëshironi?"
                : "Можам да помогнам со:\n• 🍽️ Популарни јадења\n• 🌱 Диетски опции\n• 🥤 Пијалоци & десерти\n• 📍 Локација\n• ⏰ Работно време\n• 📅 Резервација\n\nШто сакате?",
        });
      }
      setIsTyping(false);
    }, 800);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className={`fixed bottom-[120px] right-4 sm:right-6 
          h-12 w-12 sm:h-14 sm:w-14 
          rounded-full shadow-2xl 
          transition-all duration-300 
          hover:scale-110
          z-40 
          bg-gradient-to-r from-primary to-primary/80
          ${
            showButton
              ? "opacity-100 scale-100"
              : "opacity-0 scale-75 pointer-events-none"
          }
          `}
        >
          <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
          <Sparkles className="h-2.5 w-2.5 absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="
        w-[calc(100vw-16px)] max-w-md
        h-[85dvh] sm:h-[80vh]
        mx-auto
        flex flex-col p-0 gap-0
        bg-gradient-to-b from-white to-stone-50 dark:from-stone-900 dark:to-stone-950
        rounded-2xl
      "
      >
        {/* Header with action buttons */}
        <DialogHeader className="p-4 pb-3 border-b dark:border-stone-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-base sm:text-lg dark:text-stone-100">
              {t.aiAssistant}
            </DialogTitle>
          </div>
          {/* Quick action buttons */}
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              {actionButtons[lang].menu.map((btn, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-[10px] sm:text-xs h-7 px-1.5 justify-center"
                  onClick={() => executeAction(btn.action)}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {actionButtons[lang].restaurant.map((btn, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-[10px] sm:text-xs h-7 px-1.5 justify-center"
                  onClick={() => executeAction(btn.action)}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Messages - scrollable area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-white dark:bg-stone-800 border dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">
                    {message.content}
                  </p>

                  {/* Inline Map for location */}
                  {message.showMap && message.mapData && (
                    <InlineMap
                      latitude={message.mapData.latitude}
                      longitude={message.mapData.longitude}
                      name={message.mapData.name}
                      location={message.mapData.location}
                    />
                  )}

                  {/* Recommended Items */}
                  {message.recommendedItems &&
                    message.recommendedItems.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.recommendedItems.map((item) => (
                          <div
                            key={item.id}
                            className="bg-stone-50 dark:bg-stone-700/50 rounded-xl p-2.5 border dark:border-stone-600"
                          >
                            <div className="flex items-center gap-2.5">
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                                  {item.description}
                                </p>
                                <p className="text-xs font-bold text-primary mt-0.5">
                                  {item.price}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  onAddToCart(item.id, 1);
                                  toast({ title: `${item.name} ${t.added}` });
                                }}
                                className="flex-shrink-0 h-7 text-xs px-2"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {t.addToCart}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white dark:bg-stone-800 border dark:border-stone-700 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span
                      className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    {t.typing}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t dark:border-stone-700 bg-white dark:bg-stone-900 flex-shrink-0 rounded-b-2xl">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={t.placeholder}
              className="flex-1 rounded-full text-sm dark:bg-stone-800 dark:text-stone-100 h-9"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              size="icon"
              className="rounded-full h-9 w-9 flex-shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// ========== END AI ASSISTANT ==========

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [lang] = useState<"en" | "al" | "mk">(
    () => (localStorage.getItem("hajdeha-lang") as any) || "en",
  );
  const t = translations[lang];
  const { isDark, toggleDarkMode } = useDarkMode();
  const { toast } = useToast();

  const {
    data: restaurant,
    isLoading,
    error,
  } = useQuery({
    queryKey: [api.restaurants.getBySlug.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.restaurants.getBySlug.path, { slug: slug! });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Restaurant not found");
      return api.restaurants.getBySlug.responses[200].parse(await res.json());
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });

  const [cart, setCart] = useState<Record<number, number>>({});
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState<"dineIn" | "takeaway">("dineIn");
  const [deliveryTime, setDeliveryTime] = useState<
    "asap" | "15min" | "30min" | "45min" | "custom"
  >("asap");
  const [customDateTime, setCustomDateTime] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [voiceSearchMatches, setVoiceSearchMatches] = useState<MenuItem[]>([]);
  const [showVoiceResults, setShowVoiceResults] = useState(false);

  const handleVoiceResult = (text: string, matches: MenuItem[]) => {
    setSearchTerm(text);
    setVoiceSearchMatches(matches);
    setShowVoiceResults(true);
    if (matches.length > 0) {
      toast({
        title: `${t.foundMatches.replace("{count}", matches.length.toString())} "${text}"`,
      });
      setTimeout(() => {
        document
          .getElementById(`item-${matches[0].id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    } else {
      toast({ title: t.noVoiceMatches, variant: "destructive" });
    }
  };

  const { isListening, isSupported, startListening, stopListening } =
    useVoiceSearch(handleVoiceResult, restaurant?.menuItems || [], lang);

  const updateCart = (itemId: number, delta: number) => {
    setCart((prev) => {
      const next = Math.max(0, (prev[itemId] || 0) + delta);
      if (next === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const cartTotal = useMemo(() => {
    if (!restaurant?.menuItems) return 0;
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const item = restaurant.menuItems.find((i: any) => i.id === parseInt(id));
      if (!item) return total;
      return total + (parseInt(item.price.replace(/[^0-9]/g, "")) || 0) * qty;
    }, 0);
  }, [cart, restaurant]);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredItems = useMemo(() => {
    if (!restaurant?.menuItems) return [];
    if (showVoiceResults && voiceSearchMatches.length > 0)
      return voiceSearchMatches;
    return restaurant.menuItems.filter((item: MenuItem) => {
      if (!item.active) return false;
      const categoryMatch =
        selectedCategory === "All" || item.category === selectedCategory;
      if (searchTerm !== "") {
        return (
          categoryMatch &&
          findBestMatches(searchTerm, [item], lang, 0.3).length > 0
        );
      }
      return categoryMatch;
    });
  }, [
    restaurant?.menuItems,
    selectedCategory,
    searchTerm,
    showVoiceResults,
    voiceSearchMatches,
    lang,
  ]);

  const categories = useMemo(() => {
    if (!restaurant?.menuItems) return [];
    return Array.from(
      new Set(restaurant.menuItems.map((i: any) => i.category)),
    );
  }, [restaurant?.menuItems]);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const scrollToMap = () => {
    document
      .getElementById("map-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const callRestaurant = () => {
    if (restaurant?.phoneNumber)
      window.location.href = `tel:${restaurant.phoneNumber}`;
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-full bg-gradient-to-br from-stone-50 via-white to-stone-50 dark:from-stone-900 dark:via-stone-950 dark:to-stone-900 flex flex-col items-center justify-center gap-4 text-stone-400">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-display text-base animate-pulse">{t.loading}</p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 dark:from-stone-900 dark:via-stone-950 dark:to-stone-900 flex flex-col items-center justify-center gap-6 p-6 text-center">
        <UtensilsCrossed className="h-12 w-12 text-stone-400" />
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">
            {t.notFound}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            {t.notFoundDesc}
          </p>
        </div>
      </div>
    );
  }

  const groupedMenu = groupItems(filteredItems);
  const isOpen = IsOpen(
    restaurant.openingTime || undefined,
    restaurant.closingTime || undefined,
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-white to-[#FDFBF7] dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 pb-36 transition-colors duration-300">
      <DarkModeToggle isDark={isDark} toggleDarkMode={toggleDarkMode} />

      <Link href="/">
        <Button
          variant="ghost"
          className="fixed top-4 left-4 z-50 bg-white/90 dark:bg-stone-800/90 backdrop-blur-lg hover:bg-white dark:hover:bg-stone-800 shadow-lg rounded-full h-10 w-10 p-0 border border-white/50 dark:border-stone-700/50"
        >
          <X className="h-4 w-4 text-stone-700 dark:text-stone-300" />
        </Button>
      </Link>

      {/* AI Assistant - now with latitude/longitude passed */}
      <AIRestaurantAssistant
        restaurantName={restaurant.name}
        restaurantPhone={restaurant.phoneNumber ?? undefined}
        restaurantLocation={restaurant.location || undefined}
        openingTime={restaurant.openingTime || undefined}
        closingTime={restaurant.closingTime || undefined}
        menuItems={restaurant.menuItems || []}
        onAddToCart={(itemId, quantity) => updateCart(itemId, quantity)}
        lang={lang}
        onScrollToMap={scrollToMap}
        restaurantLatitude={
          restaurant.latitude ? String(restaurant.latitude) : null
        }
        restaurantLongitude={
          restaurant.longitude ? String(restaurant.longitude) : null
        }
      />

      {/* Hero Header */}
      <header className="relative bg-stone-900 dark:bg-stone-950 overflow-hidden">
        {restaurant.photoUrl ? (
          <div className="absolute inset-0">
            <img
              src={restaurant.photoUrl}
              className="w-full h-full object-cover opacity-40 dark:opacity-30"
              alt={restaurant.name}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10" />
        )}

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center space-y-5 sm:space-y-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display font-bold text-4xl sm:text-6xl tracking-tight text-white drop-shadow-2xl leading-tight">
              {restaurant.name}
            </h1>
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg mt-4 ${
                isOpen
                  ? "bg-emerald-500/30 text-emerald-300 border-2 border-emerald-400/50"
                  : "bg-red-500/30 text-red-300 border-2 border-red-400/50"
              }`}
            >
              {isOpen ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t.openNow}
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  {t.closed}
                </>
              )}
            </div>
          </motion.div>

          {restaurant.description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-stone-100 text-base sm:text-lg font-medium max-w-xl mx-auto drop-shadow leading-relaxed"
            >
              {lang === "al" && restaurant.descriptionAl ? restaurant.descriptionAl : 
               lang === "mk" && restaurant.descriptionMk ? restaurant.descriptionMk : 
               restaurant.description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-3 pt-2"
          >
            {restaurant.website && (
              <a
                href={restaurant.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-lg px-5 py-2.5 rounded-full border-2 border-white/30 transition-all text-xs font-bold hover:scale-105"
              >
                <Globe className="h-3.5 w-3.5" />
                {t.website}
              </a>
            )}
            <a
              href={`tel:${restaurant.phoneNumber || "+38944123456"}`}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-6 py-2.5 rounded-full shadow-xl transition-all text-xs font-bold text-white hover:scale-105"
            >
              <Phone className="h-3.5 w-3.5" />
              {t.reserve}
            </a>
          </motion.div>

          {restaurant.openingTime && restaurant.closingTime && (
            <div className="flex items-center justify-center gap-2 text-stone-300 text-xs pt-2">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {restaurant.openingTime} - {restaurant.closingTime}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Sticky Search + Filter Bar */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-b border-stone-100 dark:border-stone-800 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 space-y-2.5">
          {/* Search */}
          <div className="relative">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowVoiceResults(false);
                }}
                placeholder={t.searchPlaceholder}
                className="h-11 pl-12 pr-4 rounded-xl bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-sm w-full"
              />
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setSearchTerm("");
                    setShowVoiceResults(false);
                    setVoiceSearchMatches([]);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
              {isSupported && (
                <Button
                  variant={isListening ? "default" : "ghost"}
                  size="icon"
                  className={`h-7 w-7 ${isListening ? "animate-pulse" : ""}`}
                  onClick={isListening ? stopListening : startListening}
                >
                  <Mic className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between bg-white dark:bg-stone-800 rounded-xl h-11 border-stone-200 dark:border-stone-700 text-sm"
              >
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    {selectedCategory === "All"
                      ? t.allCategories
                      : selectedCategory}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-stone-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] rounded-xl bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-2xl z-[60]">
              <DropdownMenuItem
                onClick={() => setSelectedCategory("All")}
                className="cursor-pointer py-2.5 px-4 font-semibold rounded-lg m-1"
              >
                {t.allCategories}
              </DropdownMenuItem>
              {categories.map((cat: any) => (
                <DropdownMenuItem
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="cursor-pointer py-2.5 px-4 rounded-lg m-1"
                >
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Menu */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-8 space-y-10">
        {groupedMenu.map(
          ([category, items]: [string, MenuItem[]], idx: number) => (
            <motion.section
              key={category}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-stone-200 dark:to-stone-700" />
                <h2 className="font-display font-bold text-xl text-primary px-4 py-1.5 bg-primary/5 dark:bg-primary/10 rounded-full">
                  {category}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-stone-200 dark:to-stone-700" />
              </div>
              <div className="grid gap-4">
                {items.map((item: MenuItem, itemIdx: number) => (
                  <motion.article
                    key={item.id}
                    id={`item-${item.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: itemIdx * 0.04 }}
                    className="group flex gap-3 sm:gap-5 items-start bg-white dark:bg-stone-800 p-3 sm:p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 hover:shadow-md hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-200"
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        loading="lazy"
                        className="w-20 h-20 sm:w-24 sm:h-28 rounded-xl object-cover shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                        alt={item.name}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-base sm:text-lg leading-tight flex-1">
                          {lang === "al" && item.nameAl
                            ? item.nameAl
                            : lang === "mk" && item.nameMk
                              ? item.nameMk
                              : item.name}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-primary font-bold text-lg sm:text-xl whitespace-nowrap">
                            {item.price}
                          </span>
                          <ShareDialog item={item} restaurantSlug={slug!} />
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-2.5 leading-relaxed">
                        {lang === "al" && item.descriptionAl
                          ? item.descriptionAl
                          : lang === "mk" && item.descriptionMk
                            ? item.descriptionMk
                            : item.description}
                      </p>

                      {(item.isVegetarian ||
                        item.isVegan ||
                        item.isGlutenFree) && (
                        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                          {item.isVegetarian && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            >
                              <Leaf className="h-2.5 w-2.5 mr-1" />
                              Vegetarian
                            </Badge>
                          )}
                          {item.isVegan && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            >
                              <Leaf className="h-2.5 w-2.5 mr-1" />
                              Vegan
                            </Badge>
                          )}
                          {item.isGlutenFree && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                            >
                              <WheatOff className="h-2.5 w-2.5 mr-1" />
                              GF
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Cart Controls */}
                      <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-700/50 w-fit p-1 rounded-full border border-stone-200 dark:border-stone-600">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-white dark:hover:bg-stone-600"
                          onClick={(e) => {
                            e.preventDefault();
                            updateCart(item.id, -1);
                          }}
                        >
                          <Minus className="h-3.5 w-3.5 text-stone-600 dark:text-stone-300" />
                        </Button>
                        <span className="font-bold w-6 text-center text-stone-900 dark:text-stone-100 text-base">
                          {cart[item.id] || 0}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-white dark:hover:bg-stone-600"
                          onClick={(e) => {
                            e.preventDefault();
                            updateCart(item.id, 1);
                          }}
                        >
                          <Plus className="h-3.5 w-3.5 text-stone-600 dark:text-stone-300" />
                        </Button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.section>
          ),
        )}

        {/* Map Section */}
        <motion.section
          id="map-section"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-12 border-t border-stone-200 dark:border-stone-700"
        >
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-5 sm:p-8 shadow-lg border border-stone-100 dark:border-stone-700 space-y-6">
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 mb-3">
                {t.about} {restaurant.name}
              </h2>
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                {restaurant.description || "No description available."}
              </p>
            </div>

            <div className="pt-4 border-t border-stone-100 dark:border-stone-700 space-y-4">
              <h3 className="font-semibold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                {t.ourLocation}
              </h3>
              <RestaurantMap
                location={restaurant.location || "Tetovë Center, 1200"}
                name={restaurant.name}
                latitude={
                  restaurant.latitude ? String(restaurant.latitude) : null
                }
                longitude={
                  restaurant.longitude ? String(restaurant.longitude) : null
                }
              />
              <div className="flex items-start gap-3 bg-stone-50 dark:bg-stone-700/50 p-3.5 rounded-xl border border-stone-100 dark:border-stone-600">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-stone-700 dark:text-stone-300 font-medium text-sm">
                  {restaurant.location || "Tetovë Center, 1200"}
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Cart Bar */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-t-2 border-stone-200 dark:border-stone-700 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-3 py-3 sm:px-5 sm:py-4 z-50"
          >
            <div className="max-w-4xl mx-auto">
              {/* Mobile */}
              <div className="flex flex-col gap-2 sm:hidden">
                <div className="flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-lg">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      {t.totalBill}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {cartTotal} DEN
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCart({})}
                    className="h-8 w-8 p-0 rounded-xl"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 h-auto px-3 py-1 text-xs font-semibold rounded-xl flex items-center justify-center"
                      >
                        🟢 {t.orderOnWhatsapp}
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="bg-white dark:bg-stone-800 border-none rounded-3xl max-w-[100vw] max-h-[110vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-primary">
                          {t.orderSummary}
                        </DialogTitle>
                      </DialogHeader>

                      <ScrollArea className="flex-1">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                              {t.yourName || "Your Name"} *
                            </label>
                            <input
                              type="text"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder={t.enterYourName || "Enter your name"}
                              className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                              {t.orderType || "Order Type"} *
                            </label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={
                                  orderType === "dineIn" ? "default" : "outline"
                                }
                                className="flex-1 h-10 rounded-xl text-xs"
                                onClick={() => setOrderType("dineIn")}
                              >
                                {t.dineIn || "Dine In"}
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  orderType === "takeaway"
                                    ? "default"
                                    : "outline"
                                }
                                className="flex-1 h-10 rounded-xl text-xs"
                                onClick={() => setOrderType("takeaway")}
                              >
                                {t.takeaway || "Takeaway"}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                              {t.deliveryTime || "Delivery Time"}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                type="button"
                                variant={
                                  deliveryTime === "asap"
                                    ? "default"
                                    : "outline"
                                }
                                className="h-10 rounded-xl text-xs"
                                onClick={() => setDeliveryTime("asap")}
                              >
                                {t.asap}
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  deliveryTime === "custom"
                                    ? "default"
                                    : "outline"
                                }
                                className="h-10 rounded-xl text-xs col-span-2"
                                onClick={() => setDeliveryTime("custom")}
                              >
                                {t.customTime}
                              </Button>
                            </div>
                            {deliveryTime === "custom" && (
                              <input
                                type="datetime-local"
                                value={customDateTime}
                                onChange={(e) =>
                                  setCustomDateTime(e.target.value)
                                }
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                              />
                            )}
                          </div>

                          <div className="pt-2 border-stone-200 dark:border-stone-700">
                            <ScrollArea className="h-[140px] pr-1">
                              <div className="space-y-1">
                                {Object.entries(cart).map(([id, qty]) => {
                                  const item = restaurant.menuItems.find(
                                    (i) => i.id === parseInt(id),
                                  );
                                  if (!item) return null;

                                  return (
                                    <div
                                      key={id}
                                      className="flex justify-between items-center p-3 rounded-2xl bg-stone-50 dark:bg-stone-700"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-stone-600 flex items-center justify-center font-bold text-primary">
                                          {qty}x
                                        </div>
                                        <div>
                                          <p className="font-bold dark:text-stone-100 text-sm">
                                            {item.name}
                                          </p>
                                          <p className="text-xs text-stone-500 dark:text-stone-400">
                                            {item.price}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex gap-1">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8"
                                          onClick={() =>
                                            updateCart(item.id, -1)
                                          }
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8"
                                          onClick={() => updateCart(item.id, 1)}
                                        >
                                          <Plus className="h-3 w-3 text-primary" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </ScrollArea>

                            <div className="flex justify-between items-center p-2 pt-4 pb-1 rounded-2xl">
                              <span className="text-base font-semibold dark:text-stone-100">
                                {t.totalBill}
                              </span>
                              <p className="text-xl font-bold text-primary">
                                {cartTotal} DEN
                              </p>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>

                      <div className="pt-4 border-stone-200 dark:border-stone-700">
                        <div className="flex gap-1">
                          <Button
                            className="flex-1 h-auto px-3 py-1 text-xs font-semibold rounded-xl flex items-center justify-center"
                            onClick={() => {
                              if (!restaurant?.phoneNumber) return;

                              if (!customerName.trim()) {
                                alert(
                                  t.pleaseEnterName || "Please enter your name",
                                );
                                return;
                              }

                              const phone = restaurant.phoneNumber.replace(
                                /\D/g,
                                "",
                              );
                              let total = 0;
                              let message = `🧾 *${t.newOrder || "New Order"}*\n`;
                              message += `${t.customerName || "Name"}\n`;
                              message += `*${customerName}*\n`;
                              message += `${t.orderType || "Order Type"}\n`;
                              message += `*${orderType === "dineIn" ? t.dineIn : t.takeaway}*\n`;

                              const timeMap: Record<string, string> = {
                                asap: t.asap,
                                custom: customDateTime
                                  ? new Date(customDateTime).toLocaleString()
                                  : t.customTime,
                              };

                              message += `${t.deliveryTime || "Delivery Time"}\n`;
                              message += `*${timeMap[deliveryTime]}*\n\n`;
                              message += `🛒 *${t.orderSummary || "Order Details"}*\n`;

                              Object.entries(cart).forEach(([id, qty]) => {
                                const item = restaurant.menuItems.find(
                                  (i) => i.id === parseInt(id),
                                );
                                if (!item) return;

                                const price = parseInt(item.price);
                                const itemTotal = price * qty;
                                total += itemTotal;

                                message += `• ${qty} × ${item.name} — ${itemTotal} den\n`;
                              });

                              message += `\n💰 *${t.total || "Total"}*: ${total} den`;

                              window.open(
                                `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
                                "_blank",
                              );
                            }}
                          >
                            🟢 {t.orderOnWhatsapp}
                          </Button>

                          <a
                            href={`tel:${restaurant.phoneNumber || "+38944123456"}`}
                            className="flex-1"
                          >
                            <Button className="w-full h-auto px-3 py-1 text-xs font-semibold rounded-xl flex items-center justify-center gap-1">
                              <Phone className="h-3 w-3" />
                              {t.callToOrder || "Call to Order"}
                            </Button>
                          </a>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <a href={`tel:${restaurant.phoneNumber || "+38944123456"}`}>
                    <Button className="h-10 text-xs font-semibold rounded-xl px-3">
                      <Phone className="h-3 w-3 mr-1" />
                      {t.callToOrder}
                    </Button>
                  </a>
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden sm:flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      {t.totalBill}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {cartTotal} DEN
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setCart({})}
                    className="h-9 text-xs rounded-xl"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t.clear}
                  </Button>
                  <Dialog
                    open={openOrderDialog}
                    onOpenChange={setOpenOrderDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-9 text-xs rounded-xl"
                      >
                        <UtensilsCrossed className="h-4 w-4 mr-1" />
                        {t.viewOrder}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-stone-800 rounded-3xl max-w-lg max-h-[90vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold dark:text-stone-100">
                          {t.orderSummary}
                        </DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                              {t.yourName} *
                            </label>
                            <input
                              type="text"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder={t.enterYourName}
                              className="w-full mt-1.5 px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                              {t.orderType} *
                            </label>
                            <div className="flex gap-2 mt-1.5">
                              <Button
                                type="button"
                                variant={
                                  orderType === "dineIn" ? "default" : "outline"
                                }
                                className="flex-1 h-10 rounded-xl"
                                onClick={() => setOrderType("dineIn")}
                              >
                                {t.dineIn}
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  orderType === "takeaway"
                                    ? "default"
                                    : "outline"
                                }
                                className="flex-1 h-10 rounded-xl"
                                onClick={() => setOrderType("takeaway")}
                              >
                                {t.takeaway}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                              {t.deliveryTime}
                            </label>
                            <div className="flex gap-2 mt-1.5">
                              <Button
                                type="button"
                                variant={
                                  deliveryTime === "asap"
                                    ? "default"
                                    : "outline"
                                }
                                className="flex-1 h-10 rounded-xl"
                                onClick={() => setDeliveryTime("asap")}
                              >
                                {t.asap}
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  deliveryTime === "custom"
                                    ? "default"
                                    : "outline"
                                }
                                className="flex-1 h-10 rounded-xl"
                                onClick={() => setDeliveryTime("custom")}
                              >
                                {t.customTime}
                              </Button>
                            </div>
                            {deliveryTime === "custom" && (
                              <input
                                type="datetime-local"
                                value={customDateTime}
                                onChange={(e) =>
                                  setCustomDateTime(e.target.value)
                                }
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full mt-2 px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            )}
                          </div>
                          <div className="pt-3 border-t border-stone-200 dark:border-stone-700">
                            <ScrollArea className="h-52 pr-2">
                              <div className="space-y-2.5">
                                {Object.entries(cart).map(([id, qty]) => {
                                  const item = restaurant.menuItems.find(
                                    (i) => i.id === parseInt(id),
                                  );
                                  if (!item) return null;
                                  return (
                                    <div
                                      key={id}
                                      className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-700"
                                    >
                                      <div className="h-9 w-9 rounded-xl bg-white dark:bg-stone-600 flex items-center justify-center font-bold text-primary">
                                        {qty}x
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-bold dark:text-stone-100 text-sm">
                                          {item.name}
                                        </p>
                                        <p className="text-xs text-stone-500">
                                          {item.price}
                                        </p>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() =>
                                            updateCart(item.id, -1)
                                          }
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => updateCart(item.id, 1)}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </ScrollArea>
                            <div className="flex justify-between items-center p-3 mt-3 rounded-2xl bg-stone-100 dark:bg-stone-700">
                              <span className="font-semibold dark:text-stone-100">
                                {t.totalBill}
                              </span>
                              <p className="text-2xl font-bold text-primary">
                                {cartTotal} DEN
                              </p>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                      <div className="pt-4 space-y-2.5 border-t border-stone-200 dark:border-stone-700">
                        <Button
                          className="w-full h-11 rounded-2xl font-bold"
                          onClick={() => {
                            if (
                              !restaurant?.phoneNumber ||
                              !customerName.trim()
                            ) {
                              alert(t.pleaseEnterName);
                              return;
                            }
                            const phone = restaurant.phoneNumber.replace(
                              /\D/g,
                              "",
                            );
                            let total = 0;
                            let message = `🧾 *${t.newOrder}*\n\n👤 *${t.customerName}*\n${customerName}\n\n🍽️ *${t.orderType}*\n${orderType === "dineIn" ? t.dineIn : t.takeaway}\n\n⏰ *${t.deliveryTime}*\n${deliveryTime === "asap" ? t.asap : customDateTime ? new Date(customDateTime).toLocaleString() : t.customTime}\n\n🛒 *${t.orderSummary}*\n`;
                            Object.entries(cart).forEach(([id, qty]) => {
                              const item = restaurant.menuItems.find(
                                (i) => i.id === parseInt(id),
                              );
                              if (!item) return;
                              const price = parseInt(item.price);
                              total += price * qty;
                              message += `• ${qty} × ${item.name} — ${price * qty} den\n`;
                            });
                            message += `\n💰 *${t.total}*: ${total} den`;
                            window.open(
                              `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
                              "_blank",
                            );
                          }}
                        >
                          🟢 {t.orderOnWhatsapp}
                        </Button>
                        <Button
                          onClick={callRestaurant}
                          className="w-full h-11 rounded-xl font-bold"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          {t.callToOrder}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    onClick={callRestaurant}
                    className="h-9 text-xs rounded-xl"
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    {t.callToOrder}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-10 text-center text-stone-400 dark:text-stone-500 text-sm space-y-2">
        {restaurant.location && (
          <div className="flex items-center justify-center gap-2 text-stone-500 dark:text-stone-400">
            <MapPin className="h-3.5 w-3.5" />
            <span className="font-medium">{restaurant.location}</span>
          </div>
        )}
        <p>{t.poweredBy}</p>
      </footer>
    </div>
  );
}
