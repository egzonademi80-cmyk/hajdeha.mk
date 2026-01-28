import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDarkMode } from "@/hooks/useDarkMode";
import { DarkModeToggle } from "@/components/DarkModeToggle";

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
  },
  mk: {
    orderOnWhatsapp: "Нарачај на WhatsApp",
    newOrder: "Нова порака",
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

        const DefaultIcon = leaflet.Icon.Default.prototype as any;
        delete DefaultIcon._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        });

        setL(leaflet);
      } catch (err) {
        console.error("Failed to load leaflet", err);
      }
    };
    loadLeaflet();
  }, []);

  if (!L)
    return (
      <div className="w-full h-full bg-stone-100 dark:bg-stone-800 animate-pulse rounded-2xl flex items-center justify-center text-stone-400 dark:text-stone-500">
        Loading Map...
      </div>
    );

  let position: [number, number] = [42.01, 20.97];

  if (
    latitude &&
    longitude &&
    !isNaN(parseFloat(latitude)) &&
    !isNaN(parseFloat(longitude))
  ) {
    position = [parseFloat(latitude), parseFloat(longitude)];
  } else {
    const coords: Record<string, [number, number]> = {
      "test-restaurant-tetove": [42.01, 20.97],
      "hajde-grill": [42.012, 20.975],
      "cafe-hajde": [42.008, 20.968],
    };

    const slug = name.toLowerCase().replace(/ /g, "-").replace(/ë/g, "e");
    position = coords[slug] || [42.01, 20.97];
  }

  return (
    <div className="w-full h-80 relative rounded-2xl overflow-hidden shadow-lg border border-stone-200 dark:border-stone-700">
      <style>{leafletStyles}</style>

      <div
        ref={(el) => {
          if (!el || !L || el.innerHTML) return;

          const map = L.map(el).setView(position, 15);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
          }).addTo(map);

          const restaurantMarker = L.marker(position)
            .addTo(map)
            .bindPopup(name)
            .openPopup();

          let userMarker: L.Marker | null = null;

          if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
              (pos) => {
                const userPos: [number, number] = [
                  pos.coords.latitude,
                  pos.coords.longitude,
                ];

                const userIcon = L.divIcon({
                  html: `
                    <div style="
                      width:16px;
                      height:16px;
                      background:#2563eb;
                      border:3px solid white;
                      border-radius:50%;
                      box-shadow:0 0 0 6px rgba(37,99,235,0.25);
                    "></div>
                  `,
                  className: "",
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                });

                if (!userMarker) {
                  userMarker = L.marker(userPos, { icon: userIcon })
                    .addTo(map)
                    .bindPopup("Your Location");

                  const bounds = L.latLngBounds([position, userPos]);
                  map.fitBounds(bounds, { padding: [40, 40] });
                } else {
                  userMarker.setLatLng(userPos);
                }
              },
              () => console.warn("Klienti nuk lejoi lokacionin"),
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
    const idxA = order.indexOf(a);
    const idxB = order.indexOf(b);
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

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [lang] = useState<"en" | "al" | "mk">(() => {
    const saved = localStorage.getItem("hajdeha-lang");
    return (saved as any) || "en";
  });
  const t = translations[lang];
  const { isDark, toggleDarkMode } = useDarkMode();

  const {
    data: restaurant,
    isLoading,
    error,
  } = useQuery({
    queryKey: [api.restaurants.getBySlug.path, slug],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${slug}`);
      if (!res.ok) throw new Error("Restaurant not found");
      return res.json();
    },
    enabled: !!slug,
    // ✅ FAST LOAD: Use initial data if available or high-priority fetching
    staleTime: 10 * 60 * 1000,
  });

  const [cart, setCart] = useState<Record<number, number>>({});
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const callRestaurant = () => {
    if (!restaurant?.phoneNumber) return;
    window.location.href = `tel:${restaurant.phoneNumber}`;
  };

  const updateCart = (itemId: number, delta: number) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
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
      const price = parseInt(item.price.replace(/[^0-9]/g, "")) || 0;
      return total + price * qty;
    }, 0);
  }, [cart, restaurant]);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredItems = useMemo(() => {
    if (!restaurant?.menuItems) return [];
    return restaurant.menuItems.filter((item: MenuItem) => {
      if (!item.active) return false;
      const categoryMatch =
        selectedCategory === "All" || item.category === selectedCategory;
      return categoryMatch;
    });
  }, [restaurant?.menuItems, selectedCategory]);

  const categories = useMemo(() => {
    if (!restaurant?.menuItems) return [];
    const cats = new Set(restaurant.menuItems.map((i: any) => i.category));
    return Array.from(cats);
  }, [restaurant?.menuItems]);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 dark:from-stone-900 dark:via-stone-950 dark:to-stone-900 flex flex-col items-center justify-center gap-6 text-stone-400 dark:text-stone-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 dark:bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
          <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
        </div>
        <p className="font-display text-lg animate-pulse text-stone-600 dark:text-stone-400">
          {t.loading}
        </p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 dark:from-stone-900 dark:via-stone-950 dark:to-stone-900 flex flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 flex items-center justify-center shadow-lg">
          <UtensilsCrossed className="h-10 w-10 text-stone-400 dark:text-stone-500" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-stone-800 dark:text-stone-100 mb-2">
            {t.notFound}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            {t.notFoundDesc}
          </p>
        </div>
      </div>
    );
  }

  const groupedMenu = groupItems(filteredItems);
  const isOpen = IsOpen(restaurant.openingTime, restaurant.closingTime);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-white to-[#FDFBF7] dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 pb-32 transition-colors duration-300">
      {/* Dark Mode Toggle */}
      <DarkModeToggle isDark={isDark} toggleDarkMode={toggleDarkMode} />

      {/* Close Button */}
      <Link href="/">
        <Button
          variant="ghost"
          className="fixed top-6 left-6 z-50 bg-white/90 dark:bg-stone-800/90 backdrop-blur-lg hover:bg-white dark:hover:bg-stone-800 shadow-lg rounded-full h-11 w-11 p-0 border border-white/50 dark:border-stone-700/50 transition-all hover:scale-105"
        >
          <X className="h-5 w-5 text-stone-700 dark:text-stone-300" />
        </Button>
      </Link>

      <header className="relative bg-stone-900 dark:bg-stone-950 overflow-hidden">
        {restaurant.photoUrl ? (
          <div className="absolute inset-0">
            <img
              src={restaurant.photoUrl}
              className="w-full h-full object-cover opacity-40 dark:opacity-30"
              alt={restaurant.name}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90 dark:from-black/80 dark:via-black/60 dark:to-black/95" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 dark:from-primary/20 dark:to-primary/5" />
        )}

        <div className="relative max-w-4xl mx-auto px-6 py-20 sm:py-28 text-center space-y-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="flex flex-col items-center gap-4">
              <h1 className="font-display font-bold text-5xl sm:text-7xl tracking-tight text-white drop-shadow-2xl leading-tight">
                {restaurant.name}
              </h1>
              <div
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold uppercase tracking-widest shadow-lg ${isOpen ? "bg-emerald-500/30 text-emerald-300 border-2 border-emerald-400/50" : "bg-red-500/30 text-red-300 border-2 border-red-400/50"}`}
              >
                {isOpen ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {t.openNow}
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    {t.closed}
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {restaurant.description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-stone-100 dark:text-stone-200 text-lg sm:text-xl font-medium max-w-2xl mx-auto drop-shadow-lg leading-relaxed"
            >
              {restaurant.description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-4 pt-6"
          >
            {restaurant.website && (
              <a
                href={restaurant.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-lg px-6 py-3 rounded-full border-2 border-white/30 transition-all text-sm font-bold shadow-lg hover:scale-105"
              >
                <Globe className="h-4 w-4" />
                {t.website}
              </a>
            )}
            <a
              href={`tel:${restaurant.phoneNumber || "+38944123456"}`}
              className="flex items-center gap-2.5 bg-primary hover:bg-primary/90 px-8 py-3 rounded-full shadow-xl transition-all text-sm font-bold text-white hover:scale-105"
            >
              <Phone className="h-4 w-4" />
              {t.reserve}
            </a>
          </motion.div>

          {restaurant.openingTime && restaurant.closingTime && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-2 text-stone-300 dark:text-stone-400 text-sm pt-4"
            >
              <Clock className="h-4 w-4" />
              <span className="font-medium">
                {restaurant.openingTime} - {restaurant.closingTime}
              </span>
            </motion.div>
          )}
        </div>
      </header>

      <div className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-b border-stone-100 dark:border-stone-800 py-4 shadow-sm transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between bg-white dark:bg-stone-800 rounded-xl h-12 border-stone-200 dark:border-stone-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <UtensilsCrossed className="h-4 w-4 text-primary" />
                  </div>
                  <span className="truncate font-semibold text-stone-900 dark:text-stone-100">
                    {selectedCategory === "All"
                      ? t.allCategories
                      : selectedCategory}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-stone-400 dark:text-stone-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] rounded-xl bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-2xl z-[60]">
              <DropdownMenuItem
                onClick={() => setSelectedCategory("All")}
                className="hover:bg-stone-50 dark:hover:bg-stone-700 cursor-pointer py-3 px-4 font-semibold text-stone-700 dark:text-stone-200 focus:bg-stone-50 dark:focus:bg-stone-700 focus:text-stone-900 dark:focus:text-stone-100 rounded-lg m-1"
              >
                {t.allCategories}
              </DropdownMenuItem>
              {categories.map((cat: any) => (
                <DropdownMenuItem
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="hover:bg-stone-50 dark:hover:bg-stone-700 cursor-pointer py-3 px-4 font-medium text-stone-700 dark:text-stone-200 focus:bg-stone-50 dark:focus:bg-stone-700 focus:text-stone-900 dark:focus:text-stone-100 rounded-lg m-1"
                >
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-12">
        {groupedMenu.map(
          ([category, items]: [string, MenuItem[]], idx: number) => (
            <motion.section
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-stone-200 dark:to-stone-700" />
                <h2 className="font-display font-bold text-2xl text-primary px-6 py-2 bg-primary/5 dark:bg-primary/10 rounded-full">
                  {category}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-stone-200 dark:to-stone-700" />
              </div>
              <div className="grid gap-5">
                {items.map((item: MenuItem, itemIdx: number) => (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: itemIdx * 0.05 }}
                    className="group flex gap-5 items-start bg-white dark:bg-stone-800 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 hover:shadow-lg hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-300"
                  >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          loading="lazy"
                          className="w-28 h-28 rounded-xl object-cover shadow-md flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                          alt={item.name}
                        />
                      )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-lg leading-tight">
                          {item.name}
                        </h3>
                        <span className="text-primary font-bold text-xl whitespace-nowrap">
                          {item.price}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-3 leading-relaxed">
                        {item.description}
                      </p>

                      {(item.isVegetarian ||
                        item.isVegan ||
                        item.isGlutenFree) && (
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {item.isVegetarian && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            >
                              <Leaf className="h-3 w-3 mr-1" />
                              Vegetarian
                            </Badge>
                          )}
                          {item.isVegan && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-2.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                            >
                              <Leaf className="h-3 w-3 mr-1" />
                              Vegan
                            </Badge>
                          )}
                          {item.isGlutenFree && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-2.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                            >
                              <WheatOff className="h-3 w-3 mr-1" />
                              Gluten-Free
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-700/50 w-fit p-1.5 rounded-full border border-stone-200 dark:border-stone-600 shadow-sm">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-full hover:bg-white dark:hover:bg-stone-600 shadow-sm transition-all hover:scale-110"
                          onClick={(e) => {
                            e.preventDefault();
                            updateCart(item.id, -1);
                          }}
                        >
                          <Minus className="h-4 w-4 text-stone-600 dark:text-stone-300" />
                        </Button>
                        <span className="font-bold w-8 text-center text-stone-900 dark:text-stone-100 text-lg">
                          {cart[item.id] || 0}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-full hover:bg-white dark:hover:bg-stone-600 shadow-sm transition-all hover:scale-110"
                          onClick={(e) => {
                            e.preventDefault();
                            updateCart(item.id, 1);
                          }}
                        >
                          <Plus className="h-4 w-4 text-stone-600 dark:text-stone-300" />
                        </Button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.section>
          ),
        )}

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-16 border-t border-stone-200 dark:border-stone-700"
        >
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-8 shadow-lg border border-stone-100 dark:border-stone-700 space-y-8">
            <div>
              <h2 className="font-display font-bold text-3xl text-stone-900 dark:text-stone-100 mb-4">
                {t.about} {restaurant.name}
              </h2>
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-lg">
                {restaurant.description || "No description available."}
              </p>
            </div>

            {(restaurant.location || true) && (
              <div className="pt-8 border-t border-stone-100 dark:border-stone-700 space-y-5">
                <h3 className="font-semibold text-xl text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  {t.ourLocation}
                </h3>
                <RestaurantMap
                  location={restaurant.location || "Tetovë Center, 1200"}
                  name={restaurant.name}
                  latitude={restaurant.latitude}
                  longitude={restaurant.longitude}
                />
                <div className="flex items-start gap-3 bg-stone-50 dark:bg-stone-700/50 p-4 rounded-xl border border-stone-100 dark:border-stone-600">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-stone-700 dark:text-stone-300 font-medium leading-relaxed">
                    {restaurant.location || "Tetovë Center, 1200"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      </main>

      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-t-2 border-stone-200 dark:border-stone-700 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] p-3 sm:p-5 z-50"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col gap-2 sm:hidden">
                <div className="flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-lg">
                    <ShoppingBag className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground dark:text-stone-400 font-semibold uppercase tracking-wider">
                      {t.totalBill}
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {cartTotal} DEN
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCart({})}
                    className="h-8 w-8 p-0 rounded-xl"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 h-9 text-xs font-semibold rounded-xl"
                      >
                        <UtensilsCrossed className="h-3 w-3 mr-1" />
                        {t.viewOrder}
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="bg-white dark:bg-stone-800 border-none rounded-3xl max-w-[95vw]">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold dark:text-stone-100">
                          {t.orderSummary}
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                          {t.yourName || "Your Name"} *
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder={t.enterYourName || "Enter your name"}
                          className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>

                      <ScrollArea className="max-h-[50vh] pr-4">
                        <div className="space-y-4 py-4">
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
                                    <p className="font-bold dark:text-stone-100">
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
                                    onClick={() => updateCart(item.id, -1)}
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

                          <div className="flex justify-between items-center p-4 mt-2 rounded-2xl bg-stone-100 dark:bg-stone-700 sticky bottom-0">
                            <span className="text-base font-semibold dark:text-stone-100">
                              {t.totalBill}
                            </span>
                            <p className="text-2xl font-bold text-primary">
                              {cartTotal} DEN
                            </p>
                          </div>
                        </div>
                      </ScrollArea>

                      <Button
                        className="w-full h-11 rounded-2xl text-base font-bold mt-4"
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
                          let message = `${t.newOrder}\n`;
                          message += `${t.customerName || "Name"}: ${customerName}\n\n`;

                          Object.entries(cart).forEach(([id, qty]) => {
                            const item = restaurant.menuItems.find(
                              (i) => i.id === parseInt(id),
                            );
                            if (!item) return;

                            const price = parseInt(item.price);
                            const itemTotal = price * qty;
                            total += itemTotal;

                            message += `• ${qty}x ${item.name} - ${price} den\n`;
                          });

                          message += `${t.total}: ${total} den`;

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
                        className="flex justify-start mt-2"
                      >
                        <Button className="h-9 text-xs font-semibold rounded-xl flex-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {t.callToOrder}
                        </Button>
                      </a>
                    </DialogContent>
                  </Dialog>

                  <a
                    href={`tel:${restaurant.phoneNumber || "+38944123456"}`}
                    className="flex justify-end"
                  >
                    <Button className="h-9 text-xs font-semibold rounded-xl flex-1">
                      <Phone className="h-3 w-3 mr-1" />
                      {t.callToOrder}
                    </Button>
                  </a>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground dark:text-stone-400">
                      {t.totalBill}
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {cartTotal} DEN
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setCart({})}
                    className="h-9 text-xs font-semibold rounded-xl"
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
                        className="h-9 text-xs font-semibold rounded-xl"
                      >
                        <UtensilsCrossed className="h-4 w-4 mr-1" />
                        {t.viewOrder}
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="bg-white dark:bg-stone-800 border-none rounded-3xl max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold dark:text-stone-100">
                          {t.orderSummary}
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                          {t.yourName || "Your Name"} *
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder={t.enterYourName || "Enter your name"}
                          className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>

                      <ScrollArea className="max-h-[50vh] pr-4">
                        <div className="space-y-4 py-4">
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
                                    <p className="font-bold dark:text-stone-100">
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
                                    onClick={() => updateCart(item.id, -1)}
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

                          <div className="flex justify-between items-center p-4 mt-2 rounded-2xl bg-stone-100 dark:bg-stone-700 sticky bottom-0">
                            <span className="text-base font-semibold dark:text-stone-100">
                              {t.totalBill}
                            </span>
                            <p className="text-2xl font-bold text-primary">
                              {cartTotal} DEN
                            </p>
                          </div>
                        </div>
                      </ScrollArea>

                      <Button
                        className="w-full h-11 rounded-2xl text-base font-bold mt-4"
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
                          let message = `${t.newOrder}\n`;
                          message += `${t.customerName || "Name"}: ${customerName}\n\n`;

                          Object.entries(cart).forEach(([id, qty]) => {
                            const item = restaurant.menuItems.find(
                              (i) => i.id === parseInt(id),
                            );
                            if (!item) return;

                            const price = parseInt(item.price);
                            const itemTotal = price * qty;
                            total += itemTotal;

                            message += `• ${qty}x ${item.name} - ${price} den\n`;
                          });

                          message += `${t.total}: ${total} den`;

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
                        className="w-full h-11 rounded-xl font-bold mt-4"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {t.callToOrder}
                      </Button>
                    </DialogContent>
                  </Dialog>

                  <Button
                    onClick={callRestaurant}
                    className="h-9 text-xs font-semibold rounded-xl"
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

      <footer className="py-12 text-center text-stone-400 dark:text-stone-500 text-sm space-y-3">
        {restaurant.location && (
          <div className="flex items-center justify-center gap-2 text-stone-500 dark:text-stone-400 mb-2">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">{restaurant.location}</span>
          </div>
        )}
        <p className="text-stone-400 dark:text-stone-500">{t.poweredBy}</p>
      </footer>
    </div>
  );
}
