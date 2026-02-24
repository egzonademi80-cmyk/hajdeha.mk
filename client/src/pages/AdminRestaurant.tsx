import { useState, useEffect, useRef, useMemo, memo } from "react";
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

// ✅ OPTIMIZED: Memoized Image Upload Component
const ImageUpload = memo(function ImageUpload({
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
    <div className="grid gap-2">
      <Label className="text-sm font-semibold">{label}</Label>

      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={uploadMode === "url" ? "default" : "outline"}
          size="sm"
          onClick={() => setUploadMode("url")}
          className="flex-1"
        >
          <LinkIcon className="h-4 w-4 mr-1" />
          URL
        </Button>
        <Button
          type="button"
          variant={uploadMode === "file" ? "default" : "outline"}
          size="sm"
          onClick={() => setUploadMode("file")}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-1" />
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
            <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs font-medium">Click to upload</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                PNG, JPG up to 5MB
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
            className="w-full h-40 object-cover rounded-lg border"
            loading="lazy"
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
            className="absolute top-2 right-2 h-7 w-7"
            onClick={clearImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
});

const translations: Record<string, any> = {
  en: {
    loading: "Loading...",
    notFound: "Restaurant not found",
    menuManagement: "Menu Management",
    addMenuItem: "Add Item",
    profile: "Restaurant Profile",
    editProfile: "Edit",
    active: "Active",
    inactive: "Inactive",
    save: "Save",
    cancel: "Cancel",
    items: "items",
    noItems: "No menu items yet",
    addFirst: "Add First Item",
  },
  al: {
    loading: "Duke ngarkuar...",
    notFound: "Restoranti nuk u gjet",
    menuManagement: "Menaxhimi i Menusë",
    addMenuItem: "Shto",
    profile: "Profili",
    editProfile: "Ndrysho",
    active: "Aktiv",
    inactive: "Joaktiv",
    save: "Ruaj",
    cancel: "Anulo",
    items: "artikuj",
    noItems: "Ende nuk ka artikuj",
    addFirst: "Shto të Parën",
  },
  mk: {
    loading: "Се вчитува...",
    notFound: "Ресторанот не е пронајден",
    menuManagement: "Менаџирање",
    addMenuItem: "Додај",
    profile: "Профил",
    editProfile: "Уреди",
    active: "Активен",
    inactive: "Неактивен",
    save: "Зачувај",
    cancel: "Откажи",
    items: "ставки",
    noItems: "Нема ставки",
    addFirst: "Додај прва",
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
  const { data: restaurant, isLoading } = useRestaurant(id);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // ✅ OPTIMIZED: Memoized grouped items
  const groupedItems = useMemo(() => {
    if (!restaurant?.menuItems) return [];

    return CATEGORIES.map((category) => {
      const items = restaurant.menuItems.filter(
        (item) => item.category === category,
      );
      return items.length > 0 ? { category, items } : null;
    }).filter(Boolean);
  }, [restaurant?.menuItems]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-1">{t.notFound}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* ✅ RESPONSIVE: Fixed mobile header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link href="/admin/dashboard">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">
                  {restaurant.name.charAt(0)}
                </span>
              </div>
              <h1 className="font-bold text-base sm:text-lg truncate">
                {restaurant.name}
              </h1>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            size="sm"
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">{t.addMenuItem}</span>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <RestaurantDetailsForm restaurant={restaurant} />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold">{t.menuManagement}</h2>
            {restaurant.menuItems && restaurant.menuItems.length > 0 && (
              <div className="text-xs sm:text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {restaurant.menuItems.length} {t.items}
              </div>
            )}
          </div>

          {restaurant.menuItems?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground/30" />
              <h3 className="font-semibold mb-1">{t.noItems}</h3>
              <Button
                onClick={() => setIsItemModalOpen(true)}
                size="sm"
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t.addFirst}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedItems.map((group: any) => (
                <div key={group.category}>
                  <h3 className="font-semibold text-primary mb-3 px-4 py-1 bg-primary/5 rounded-full inline-block">
                    {group.category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                    {group.items.map((item: MenuItem) => (
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
              ))}
            </div>
          )}
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

// ✅ OPTIMIZED: Memoized Restaurant Form
const RestaurantDetailsForm = memo(function RestaurantDetailsForm({
  restaurant,
}: {
  restaurant: any;
}) {
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
          toast({ title: "Updated" });
        },
      },
    );
  };

  if (!isEditing) {
    return (
      <div className="bg-white rounded-xl p-4 sm:p-6 border">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg">Profile</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-4 border-b">
            <Switch
              checked={restaurant.active ?? true}
              onCheckedChange={(checked) => {
                update({ id: restaurant.id, active: checked });
              }}
            />
            <span className="text-sm font-medium">Status</span>
            <div
              className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
                restaurant.active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {restaurant.active ? "Active" : "Inactive"}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Name</p>
              <p className="font-medium">{restaurant.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Location</p>
              <p className="text-sm">{restaurant.location || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Hours</p>
              <p className="text-sm">
                {restaurant.openingTime} - {restaurant.closingTime}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              <p className="text-sm">{restaurant.phoneNumber || "—"}</p>
            </div>
          </div>

          {restaurant.photoUrl && (
            <img
              src={restaurant.photoUrl}
              className="w-full h-40 object-cover rounded-lg"
              alt="Restaurant"
              loading="lazy"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border space-y-4">
      <h3 className="font-bold text-lg">Edit Profile</h3>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Name</Label>
          <Input
            value={formData.name}
            onChange={(e) =>
              setFormData((p) => ({ ...p, name: e.target.value }))
            }
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-sm">Phone</Label>
          <Input
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData((p) => ({ ...p, phoneNumber: e.target.value }))
            }
            className="h-9"
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-sm">Location</Label>
          <Input
            value={formData.location}
            onChange={(e) =>
              setFormData((p) => ({ ...p, location: e.target.value }))
            }
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-sm">Opening</Label>
          <Input
            type="time"
            value={formData.openingTime}
            onChange={(e) =>
              setFormData((p) => ({ ...p, openingTime: e.target.value }))
            }
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-sm">Closing</Label>
          <Input
            type="time"
            value={formData.closingTime}
            onChange={(e) =>
              setFormData((p) => ({ ...p, closingTime: e.target.value }))
            }
            className="h-9"
          />
        </div>
      </div>

      <ImageUpload
        value={formData.photoUrl}
        onChange={(url) => setFormData((p) => ({ ...p, photoUrl: url }))}
        label="Cover Photo"
      />

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
});

// ✅ OPTIMIZED: Memoized Menu Item Card
const MenuItemCard = memo(function MenuItemCard({
  item,
  onEdit,
}: {
  item: MenuItem;
  onEdit: () => void;
}) {
  const { mutate: deleteItem } = useDeleteMenuItem();
  const { toast } = useToast();

  return (
    <div className="bg-white rounded-lg p-3 border group hover:border-primary/20 transition-colors">
      <div className="flex gap-3">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">
              {lang === "al" && item.nameAl ? item.nameAl : 
               lang === "mk" && item.nameMk ? item.nameMk : 
               item.name}
            </h4>
            <span className="font-bold text-primary text-sm whitespace-nowrap">
              {item.price}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {lang === "al" && item.descriptionAl ? item.descriptionAl : 
             lang === "mk" && item.descriptionMk ? item.descriptionMk : 
             item.description}
          </p>
          <div className="flex gap-1 flex-wrap">
            <div
              className={`text-xs px-2 py-0.5 rounded-full ${
                item.active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {item.active ? "Active" : "Inactive"}
            </div>
            {item.isVegetarian && (
              <div className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Veg
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1 mt-2 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 flex-1"
          onClick={onEdit}
        >
          <Edit2 className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteItem(item.id, {
                    onSuccess: () => toast({ title: "Deleted" }),
                  })
                }
                className="bg-destructive"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
});

// ✅ OPTIMIZED: Compact Menu Item Dialog
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
  const { mutate: create, isPending: isCreating } = useCreateMenuItem();
  const { mutate: update, isPending: isUpdating } = useUpdateMenuItem();
  const { toast } = useToast();

  const [lang] = useState<"en" | "al" | "mk">(() => {
    const saved = localStorage.getItem("hajdeha-lang");
    return (saved as any) || "en";
  });
  const t = translations[lang];

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
    values: initialData ? { 
      ...initialData, 
      restaurantId,
      nameAl: initialData.nameAl || "",
      nameMk: initialData.nameMk || "",
      descriptionAl: initialData.descriptionAl || "",
      descriptionMk: initialData.descriptionMk || ""
    } : undefined,
  });

  const onSubmit = (data: InsertMenuItem) => {
    const onSuccess = () => {
      toast({ title: initialData ? t.updated : "Added" });
      onOpenChange(false);
      form.reset();
    };

    if (initialData) {
      update({ id: initialData.id, ...data }, { onSuccess });
    } else {
      create(data, { onSuccess });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? t.editItem : t.addMenuItem}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm">{t.name} (EN)</Label>
                <Input {...form.register("name")} className="h-9" />
              </div>
              <div>
                <Label className="text-sm">{t.nameAl}</Label>
                <Input {...form.register("nameAl")} className="h-9" />
              </div>
              <div>
                <Label className="text-sm">{t.nameMk}</Label>
                <Input {...form.register("nameMk")} className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm">{t.price}</Label>
                  <Input
                    {...form.register("price")}
                    placeholder="350 DEN"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-sm">{t.category}</Label>
                  <Select
                    onValueChange={(val) => form.setValue("category", val)}
                    defaultValue={form.getValues("category")}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
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
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm">{t.description} (EN)</Label>
                <Textarea
                  {...form.register("description")}
                  className="h-20 resize-none"
                />
              </div>
              <div>
                <Label className="text-sm">{t.descriptionAl}</Label>
                <Textarea
                  {...form.register("descriptionAl")}
                  className="h-20 resize-none"
                />
              </div>
              <div>
                <Label className="text-sm">{t.descriptionMk}</Label>
                <Textarea
                  {...form.register("descriptionMk")}
                  className="h-20 resize-none"
                />
              </div>
            </div>
          </div>

          <ImageUpload
            value={form.watch("imageUrl") || ""}
            onChange={(url) => form.setValue("imageUrl", url)}
            label="Image"
          />

          <div className="flex items-center justify-between py-2 border-t">
            <Label className="text-sm">Available</Label>
            <Switch
              checked={form.watch("active")}
              onCheckedChange={(c) => form.setValue("active", c)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch("isVegetarian")}
                onCheckedChange={(c) => form.setValue("isVegetarian", c)}
              />
              <Label className="text-xs">Veg</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch("isVegan")}
                onCheckedChange={(c) => form.setValue("isVegan", c)}
              />
              <Label className="text-xs">Vegan</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch("isGlutenFree")}
                onCheckedChange={(c) => form.setValue("isGlutenFree", c)}
              />
              <Label className="text-xs">GF</Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t.cancel}
            </Button>
            <Button type="submit" size="sm" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              )}
              {t.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
