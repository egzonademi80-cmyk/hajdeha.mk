import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useRestaurant, useUpdateRestaurant } from "@/hooks/use-restaurants";
import {
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
} from "@/hooks/use-menu-items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Globe,
  Phone,
  MapPin,
  Clock,
  Upload,
  X,
  Link as LinkIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertMenuItemSchema,
  type InsertMenuItem,
  type MenuItem,
} from "@shared/schema";

const CATEGORIES = [
  "Starters",
  "Mains",
  "Sides",
  "Desserts",
  "Drinks",
  "Hot Drinks",
];

// Image Upload Component
function ImageUpload({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  const [preview, setPreview] = useState<string>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      onChange(base64String);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreview("");
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-2.5">
      <Label className="text-sm font-semibold">{label}</Label>

      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={uploadMode === "url" ? "default" : "outline"}
          size="sm"
          onClick={() => setUploadMode("url")}
          className="flex-1"
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          URL
        </Button>
        <Button
          type="button"
          variant={uploadMode === "file" ? "default" : "outline"}
          size="sm"
          onClick={() => setUploadMode("file")}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      {uploadMode === "url" ? (
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setPreview(e.target.value);
          }}
          placeholder="https://..."
          className="h-10"
        />
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload image</p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          </label>
        </div>
      )}

      {preview && (
        <div className="relative mt-2">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border"
            onError={() => {
              if (uploadMode === "url") {
                setPreview("");
              }
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={clearImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

const translations: Record<string, any> = {
  en: {
    loading: "Loading restaurant...",
    notFound: "Restaurant not found",
    notFoundDesc: "The restaurant you're looking for doesn't exist.",
    menuManagement: "Menu Management",
    addMenuItem: "Add Menu Item",
    profile: "Restaurant Profile",
    profileDesc: "Manage your public information",
    editProfile: "Edit Profile",
    status: "Restaurant Status",
    statusOpen: "Currently accepting orders",
    statusClosed: "Temporarily closed",
    active: "Active",
    inactive: "Inactive",
    name: "Restaurant Name",
    slug: "URL Slug",
    description: "Description",
    noDesc: "No description provided",
    location: "Location",
    noLocation: "No location set",
    workingHours: "Working Hours",
    visitWebsite: "Visit Website",
    items: "items",
    item: "item",
    noItems: "No menu items yet",
    getStarted: "Get started by adding your first dish",
    addFirst: "Add First Item",
    editItem: "Edit Item",
    deleteItem: "Delete Item",
    save: "Save Changes",
    cancel: "Cancel",
    updated: "Updated successfully",
    failed: "Update failed",
  },
  al: {
    loading: "Duke ngarkuar restorantin...",
    notFound: "Restoranti nuk u gjet",
    notFoundDesc: "Restoranti që po kërkoni nuk ekziston.",
    menuManagement: "Menaxhimi i Menusë",
    addMenuItem: "Shto Artikull Menuje",
    profile: "Profili i Restorantit",
    profileDesc: "Menaxhoni informacionin tuaj publik",
    editProfile: "Ndrysho Profilin",
    status: "Statusi i Restorantit",
    statusOpen: "Aktualisht pranon porosi",
    statusClosed: "Përkohësisht i mbyllur",
    active: "Aktiv",
    inactive: "Joaktiv",
    name: "Emri i Restorantit",
    slug: "Slug i URL-së",
    description: "Përshkrimi",
    noDesc: "Nuk ka përshkrim",
    location: "Vendndodhja",
    noLocation: "Nuk është caktuar vendndodhja",
    workingHours: "Orari i Punës",
    visitWebsite: "Vizito Uebfaqen",
    items: "artikuj",
    item: "artikull",
    noItems: "Ende nuk ka artikuj në menu",
    getStarted: "Filloni duke shtuar pjatën tuaj të parë",
    addFirst: "Shto Artikullin e Parë",
    editItem: "Ndrysho Artikullin",
    deleteItem: "Fshij Artikullin",
    save: "Ruaj Ndryshimet",
    cancel: "Anulo",
    updated: "U përditësua me sukses",
    failed: "Përditësimi dështoi",
  },
  mk: {
    loading: "Се вчитува ресторанот...",
    notFound: "Ресторанот не е пронајден",
    notFoundDesc: "Ресторанот што го барате не постои.",
    menuManagement: "Управување со мени",
    addMenuItem: "Додај ставка во мени",
    profile: "Профил на ресторан",
    profileDesc: "Управувајте со вашите јавни информации",
    editProfile: "Уреди профил",
    status: "Статус на ресторан",
    statusOpen: "Моментално прима нарачки",
    statusClosed: "Привm�емено затворено",
    active: "Активен",
    inactive: "Н �активен",
    name: "Име на ресторан",
    slug: "URL слаг",
    description: "Опис",
    noDesc: "Нема опис",
    location: "Локација",
    noLocation: "Нема поставено локација",
    workingHours: "Работно време",
    visitWebsite: "Посети веб-страница",
    items: "ставки",
    item: "ставка",
    noItems: "Сè уште нема ставки во менито",
    getStarted: "Започнете со додавање на вашето прво јадење",
    addFirst: "Додај прва ставка",
    editItem: "Уреди ставка",
    deleteItem: "Избриши ставка",
    save: "Зачувај промени",
    cancel: "Откажи",
    updated: "Успешно ажурирано",
    failed: "Ажурирањето не успеа",
  },
};

export default function AdminRestaurant() {
  const [lang] = useState<"en" | "al" | "mk">(() => {
    const saved = localStorage.getItem("hajdeha-lang");
    return (saved as any) || "en";
  });
  const t = translations[lang];

  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");
  const { data: restaurant, isLoading, error } = useRestaurant(id);
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading restaurant",
        description: error.message,
      });
    }
  }, [error, toast]);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (!restaurant)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Restaurant not found</h2>
          <p className="text-muted-foreground">
            The restaurant you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-muted/10 pb-20">
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="icon" className="hover:bg-muted">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {restaurant.name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl tracking-tight">
                  {restaurant.name}
                </h1>
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            className="shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Menu Item
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section>
          <RestaurantDetailsForm restaurant={restaurant} />
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold tracking-tight">
                Menu Items
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your restaurant's offerings
              </p>
            </div>
            {restaurant.menuItems && restaurant.menuItems.length > 0 && (
              <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                {restaurant.menuItems.length}{" "}
                {restaurant.menuItems.length === 1 ? "item" : "items"}
              </div>
            )}
          </div>

          <div className="grid gap-6">
            {restaurant.menuItems?.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold text-lg mb-1">
                  No menu items yet
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Get started by adding your first dish
                </p>
                <Button onClick={() => setIsItemModalOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              CATEGORIES.map((category) => {
                const items = restaurant.menuItems?.filter(
                  (item) => item.category === category,
                );
                if (!items?.length) return null;
                return (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-border" />
                      <h3 className="font-semibold text-lg text-primary px-4 py-1 bg-primary/5 rounded-full">
                        {category}
                      </h3>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {items.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onEdit={() => {
                            setEditingItem(item);
                            setIsItemModalOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      <MenuItemDialog
        open={isItemModalOpen}
        onOpenChange={setIsItemModalOpen}
        restaurantId={restaurant.id}
        initialData={editingItem}
      />
    </div>
  );
}

function RestaurantDetailsForm({ restaurant }: { restaurant: any }) {
  const { mutate: update, isPending } = useUpdateRestaurant();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: restaurant.name,
    description: restaurant.description || "",
    slug: restaurant.slug,
    photoUrl: restaurant.photoUrl || "",
    website: restaurant.website || "",
    phoneNumber: restaurant.phoneNumber || "",
    location: restaurant.location || "",
    openingTime: restaurant.openingTime || "08:00",
    closingTime: restaurant.closingTime || "22:00",
    active: restaurant.active ?? true,
    latitude: restaurant.latitude || "",
    longitude: restaurant.longitude || "",
  });

  useEffect(() => {
    setFormData({
      name: restaurant.name,
      description: restaurant.description || "",
      slug: restaurant.slug,
      photoUrl: restaurant.photoUrl || "",
      website: restaurant.website || "",
      phoneNumber: restaurant.phoneNumber || "",
      location: restaurant.location || "",
      openingTime: restaurant.openingTime || "08:00",
      closingTime: restaurant.closingTime || "22:00",
      active: restaurant.active ?? true,
      latitude: restaurant.latitude || "",
      longitude: restaurant.longitude || "",
    });
  }, [restaurant]);

  const handleSave = () => {
    update(
      { id: restaurant.id, ...formData },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({ title: "Updated successfully" });
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Update failed",
            description: err.message,
          });
        },
      },
    );
  };

  if (!isEditing) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl p-8 border border-stone-200 dark:border-stone-700 shadow-sm transition-colors">
        <div className="space-y-6 w-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-2xl font-display tracking-tight text-foreground">
                Restaurant Profile
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your public information
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="shadow-sm"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
              <Switch
                checked={restaurant.active ?? true}
                onCheckedChange={(checked) => {
                  update(
                    { id: restaurant.id, active: checked },
                    {
                      onSuccess: () =>
                        toast({
                          title: checked
                            ? "Restaurant enabled"
                            : "Restaurant disabled",
                        }),
                    },
                  );
                }}
              />
              <div>
                <span className="font-semibold text-sm text-foreground">
                  Restaurant Status
                </span>
                <p className="text-xs text-muted-foreground">
                  {restaurant.active
                    ? "Currently accepting orders"
                    : "Temporarily closed"}
                </p>
              </div>
              <div
                className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                  restaurant.active
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300"
                }`}
              >
                {restaurant.active ? "Active" : "Inactive"}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div>
                  <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Restaurant Name
                  </span>
                  <p className="text-base font-medium text-foreground">
                    {restaurant.name}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">
                    URL Slug
                  </span>
                  <p className="text-sm font-mono bg-muted/50 dark:bg-stone-700/50 text-foreground px-3 py-1.5 rounded-md inline-block">
                    {restaurant.slug}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Description
                  </span>
                  <p className="text-sm leading-relaxed text-foreground">
                    {restaurant.description || "No description provided"}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Location
                  </span>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      {restaurant.location || "No location set"}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Working Hours
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {restaurant.openingTime} - {restaurant.closingTime}
                    </p>
                  </div>
                </div>

                <div className="pt-3 flex flex-wrap gap-3">
                  {restaurant.website && (
                    <a
                      href={restaurant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/5 dark:bg-primary/10 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      <span className="font-medium">Visit Website</span>
                    </a>
                  )}
                  {restaurant.phoneNumber && (
                    <a
                      href={`tel:${restaurant.phoneNumber}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/5 dark:bg-primary/10 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">
                        {restaurant.phoneNumber}
                      </span>
                    </a>
                  )}
                </div>
              </div>

              {restaurant.photoUrl && (
                <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 shadow-sm h-64 lg:h-full">
                  <img
                    src={restaurant.photoUrl}
                    className="w-full h-full object-cover"
                    alt="Restaurant cover"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl p-8 border border-stone-200 dark:border-stone-700 shadow-sm space-y-6 transition-colors">
      <div className="dark:text-stone-100">
        <h3 className="font-semibold text-2xl font-display tracking-tight text-foreground">
          Edit Restaurant Profile
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Update your restaurant information
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2 pt-4">
        <div className="space-y-5">
          <div className="grid gap-2.5">
            <Label className="text-sm font-semibold text-foreground">Restaurant Name</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="h-10 bg-white dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700"
            />
          </div>
          <div className="grid gap-2.5">
            <Label className="text-sm font-semibold text-foreground">URL Slug</Label>
            <Input
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
              className="h-10 font-mono bg-white dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700"
            />
          </div>
          <div className="grid gap-2.5">
            <Label className="text-sm font-semibold text-foreground">Phone Number</Label>
            <Input
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  phoneNumber: e.target.value,
                }))
              }
              placeholder="+389 XX XXX XXX"
              className="h-10 bg-white dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700"
            />
          </div>
          <div className="grid gap-2.5">
            <Label className="text-sm font-semibold text-foreground">Location Address</Label>
            <Input
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="e.g. Rruga e Marshit, Tetovë"
              className="h-10 bg-white dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2.5">
              <Label className="text-sm font-semibold text-foreground">Latitude</Label>
              <Input
                value={formData.latitude}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, latitude: e.target.value }))
                }
                placeholder="e.g. 42.01"
                className="h-10 bg-white dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700"
              />
            </div>
            <div className="grid gap-2.5">
              <Label className="text-sm font-semibold text-foreground">Longitude</Label>
              <Input
                value={formData.longitude}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    longitude: e.target.value,
                  }))
                }
                placeholder="e.g. 20.97"
                className="h-10 bg-white dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700"
              />
            </div>
          </div>
        </div>
        <div className="space-y-5">
          <div className="grid gap-2.5">
            <Label className="text-sm font-semibold text-foreground">Website URL</Label>
            <Input
              value={formData.website}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, website: e.target.value }))
              }
              placeholder="https://yourwebsite.com"
              className="h-10 bg-white dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700"
            />
          </div>
          <ImageUpload
            value={formData.photoUrl}
            onChange={(url) =>
              setFormData((prev) => ({ ...prev, photoUrl: url }))
            }
            label="Cover Photo"
          />
          <div className="grid gap-2.5">
            <Label className="text-sm font-semibold text-foreground">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="h-[120px] resize-none bg-white dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700"
              placeholder="Tell customers about your restaurant..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2.5">
              <Label className="text-sm font-semibold text-foreground">Opening Time</Label>
              <Input
                type="time"
                value={formData.openingTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    openingTime: e.target.value,
                  }))
                }
                className="h-10 bg-white dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700"
              />
            </div>
            <div className="grid gap-2.5">
              <Label className="text-sm font-semibold text-foreground">Closing Time</Label>
              <Input
                type="time"
                value={formData.closingTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    closingTime: e.target.value,
                  }))
                }
                className="h-10 bg-white dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-6 border-t dark:border-stone-700">
        <Button variant="ghost" onClick={() => setIsEditing(false)} className="dark:text-stone-100 dark:hover:bg-stone-700">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isPending} className="shadow-sm">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

function MenuItemCard({
  item,
  onEdit,
}: {
  item: MenuItem;
  onEdit: () => void;
}) {
  const { mutate: deleteItem } = useDeleteMenuItem();
  const { toast } = useToast();

  const handleDelete = () => {
    deleteItem(item.id, {
      onSuccess: () => toast({ title: "Item deleted" }),
      onError: () =>
        toast({ variant: "destructive", title: "Failed to delete" }),
    });
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-border dark:border-stone-700 shadow-sm hover:shadow-md transition-all duration-200 relative group hover:border-primary/20">
      <div className="flex gap-4">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-24 h-24 rounded-lg object-cover bg-muted dark:bg-stone-800 shadow-sm flex-shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-muted to-muted/50 dark:from-stone-800 dark:to-stone-700 flex items-center justify-center flex-shrink-0 border dark:border-stone-700">
            <ImageIcon className="h-10 w-10 text-muted-foreground/30 dark:text-stone-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h4 className="font-semibold text-base truncate leading-tight dark:text-stone-100">
              {item.name}
            </h4>
            <span className="font-bold text-primary whitespace-nowrap text-base">
              {item.price}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3 dark:text-stone-300">
            {item.description}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                item.active
                  ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300"
                  : "bg-gray-100 text-gray-700 dark:bg-stone-700 dark:text-stone-300"
              }`}
            >
              {item.active ? "Available" : "Unavailable"}
            </div>
            {item.isVegetarian && (
              <div className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300">
                Vegetarian
              </div>
            )}
            {item.isVegan && (
              <div className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300">
                Vegan
              </div>
            )}
            {item.isGlutenFree && (
              <div className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-300">
                Gluten-Free
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 dark:bg-stone-800/95 backdrop-blur-sm rounded-lg p-1 shadow-md border dark:border-stone-700">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
        >
          <Edit2 className="h-4 w-4 dark:text-stone-100" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent className="dark:bg-stone-900 dark:border-stone-700 dark:text-stone-100">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Menu Item?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove <strong>{item.name}</strong> from
                your menu. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Item
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function MenuItemDialog({
  open,
  onOpenChange,
  restaurantId,
  initialData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: number;
  initialData: MenuItem | null;
}) {
  const [lang] = useState<"en" | "al" | "mk">(() => {
    const saved = localStorage.getItem("hajdeha-lang");
    return (saved as any) || "en";
  });
  const t = translations[lang];

  const { mutate: create, isPending: isCreating } = useCreateMenuItem();
  const { mutate: update, isPending: isUpdating } = useUpdateMenuItem();
  const { toast } = useToast();
  const isEditing = !!initialData;

  const form = useForm<InsertMenuItem>({
    resolver: zodResolver(insertMenuItemSchema),
    defaultValues: {
      name: "",
      nameAl: "",
      nameMk: "",
      description: "",
      descriptionAl: "",
      descriptionMk: "",
      price: "",
      category: "Mains",
      imageUrl: "",
      active: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      restaurantId,
    },
    values: initialData ? { ...initialData, restaurantId } : undefined,
  });

  const onSubmit = (data: InsertMenuItem) => {
    const onSuccess = () => {
      toast({
        title: isEditing
          ? t.updated
          : lang === "al"
            ? "Artikulli u shtua"
            : lang === "mk"
              ? "Ставката е додадена"
              : "Item added",
      });
      onOpenChange(false);
      form.reset();
    };

    const onError = (err: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    };

    if (isEditing && initialData) {
      update({ id: initialData.id, ...data }, { onSuccess, onError });
    } else {
      create(data, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">
            {isEditing
              ? lang === "al"
                ? "Ndrysho Artikullin"
                : lang === "mk"
                  ? "Уреди ставка"
                  : "Edit Menu Item"
              : lang === "al"
                ? "Shto Artikull të Ri"
                : lang === "mk"
                  ? "Додај нова ставка"
                  : "Add New Menu Item"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? lang === "al"
                ? "Përditësoni detajet e artikullit tuaj."
                : lang === "mk"
                  ? "Ажурирајте ги деталите за вашата ставка."
                  : "Update the details of your menu item."
              : lang === "al"
                ? "Shtoni një pjatë të re në menunë tuaj."
                : lang === "mk"
                  ? "Додадете ново јадење во вашето мени."
                  : "Add a new dish to your restaurant menu."}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto px-4 sm:px-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="al">Shqip</TabsTrigger>
                <TabsTrigger value="mk">Македонски</TabsTrigger>
              </TabsList>

              <TabsContent value="en" className="space-y-4 py-4">
                <div className="grid gap-2.5">
                  <Label htmlFor="name" className="text-sm font-semibold">
                    Item Name (EN)
                  </Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="e.g. Classic Burger"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2.5">
                  <Label
                    htmlFor="description"
                    className="text-sm font-semibold"
                  >
                    Description (EN)
                  </Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="English description..."
                    className="h-24 resize-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="al" className="space-y-4 py-4">
                <div className="grid gap-2.5">
                  <Label htmlFor="nameAl" className="text-sm font-semibold">
                    Emri (AL)
                  </Label>
                  <Input
                    id="nameAl"
                    {...form.register("nameAl")}
                    placeholder="p.sh. Burger Klasik"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2.5">
                  <Label
                    htmlFor="descriptionAl"
                    className="text-sm font-semibold"
                  >
                    Përshkrimi (AL)
                  </Label>
                  <Textarea
                    id="descriptionAl"
                    {...form.register("descriptionAl")}
                    placeholder="Përshkrimi në shqip..."
                    className="h-24 resize-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="mk" className="space-y-4 py-4">
                <div className="grid gap-2.5">
                  <Label htmlFor="nameMk" className="text-sm font-semibold">
                    Име (MK)
                  </Label>
                  <Input
                    id="nameMk"
                    {...form.register("nameMk")}
                    placeholder="на пр. Класичен бургер"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2.5">
                  <Label
                    htmlFor="descriptionMk"
                    className="text-sm font-semibold"
                  >
                    Опис (MK)
                  </Label>
                  <Textarea
                    id="descriptionMk"
                    {...form.register("descriptionMk")}
                    placeholder="Опис на македонски..."
                    className="h-24 resize-none"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid gap-5 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2.5">
                  <Label htmlFor="price" className="text-sm font-semibold">
                    Price
                  </Label>
                  <Input
                    id="price"
                    {...form.register("price")}
                    placeholder="350 DEN"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2.5">
                  <Label htmlFor="category" className="text-sm font-semibold">
                    Category
                  </Label>
                  <Select
                    onValueChange={(val) => form.setValue("category", val)}
                    defaultValue={form.getValues("category") || "Mains"}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ImageUpload
                value={form.watch("imageUrl") || ""}
                onChange={(url) => form.setValue("imageUrl", url)}
                label="Item Image (Optional)"
              />

              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="active" className="text-sm font-semibold">
                      Availability
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Make this item available for ordering
                    </p>
                  </div>
                  <Switch
                    id="active"
                    checked={form.watch("active")}
                    onCheckedChange={(checked) =>
                      form.setValue("active", checked)
                    }
                  />
                </div>

                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold block mb-3">
                    Dietary Information
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="isVegetarian"
                        checked={form.watch("isVegetarian")}
                        onCheckedChange={(checked) =>
                          form.setValue("isVegetarian", checked)
                        }
                      />
                      <Label
                        htmlFor="isVegetarian"
                        className="text-sm cursor-pointer"
                      >
                        Vegetarian
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="isVegan"
                        checked={form.watch("isVegan")}
                        onCheckedChange={(checked) =>
                          form.setValue("isVegan", checked)
                        }
                      />
                      <Label
                        htmlFor="isVegan"
                        className="text-sm cursor-pointer"
                      >
                        Vegan
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="isGlutenFree"
                        checked={form.watch("isGlutenFree")}
                        onCheckedChange={(checked) =>
                          form.setValue("isGlutenFree", checked)
                        }
                      />
                      <Label
                        htmlFor="isGlutenFree"
                        className="text-sm cursor-pointer"
                      >
                        Gluten-Free
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                {lang === "al" ? "Anulo" : lang === "mk" ? "Откажи" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
                className="shadow-sm"
              >
                {(isCreating || isUpdating) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing
                  ? lang === "al"
                    ? "Ruaj Ndryshimet"
                    : lang === "mk"
                      ? "Зачувај промени"
                      : "Save Changes"
                  : lang === "al"
                    ? "Krijo Artikullin"
                    : lang === "mk"
                      ? "Креирај ставка"
                      : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
