import { useState, useEffect, useRef, useMemo, memo, useCallback } from "react";
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
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Upload,
  X,
  Link as LinkIcon,
  GripVertical,
  QrCode,
  Download,
  Table2,
  Wifi,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertMenuItemSchema,
  type InsertMenuItem,
  type MenuItem,
} from "@shared/schema";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

// ── dnd-kit ───────────────────────────────────────────────────────────────────
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const CATEGORIES = [
  "Starters",
  "Mains",
  "Sides",
  "Desserts",
  "Drinks",
  "Hot Drinks",
];

// ── Image Upload ──────────────────────────────────────────────────────────────
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
      const b = reader.result as string;
      setPreview(b);
      onChange(b);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreview("");
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="grid gap-2">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
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
          className="h-10 bg-background text-foreground border-border"
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
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs font-medium text-foreground">
                Click to upload
              </p>
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
            className="w-full h-40 object-cover rounded-lg border border-border"
            loading="lazy"
            onError={() => {
              if (uploadMode === "url") setPreview("");
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

// ── Translations ──────────────────────────────────────────────────────────────
const translations: Record<string, any> = {
  en: {
    loading: "Loading...",
    notFound: "Restaurant not found",
    menuManagement: "Menu Management",
    addMenuItem: "Add Item",
    profile: "Restaurant Profile",
    active: "Active",
    inactive: "Inactive",
    save: "Save",
    cancel: "Cancel",
    items: "items",
    noItems: "No menu items yet",
    addFirst: "Add First Item",
    dragHint: "Drag to reorder",
  },
  al: {
    loading: "Duke ngarkuar...",
    notFound: "Restoranti nuk u gjet",
    menuManagement: "Menaxhimi i Menusë",
    addMenuItem: "Shto",
    profile: "Profili",
    active: "Aktiv",
    inactive: "Joaktiv",
    save: "Ruaj",
    cancel: "Anulo",
    items: "artikuj",
    noItems: "Ende nuk ka artikuj",
    addFirst: "Shto të Parën",
    dragHint: "Zvarrit për të rirenditur",
  },
  mk: {
    loading: "Се вчитува...",
    notFound: "Ресторанот не е пронајден",
    menuManagement: "Менаџирање",
    addMenuItem: "Додај",
    profile: "Профил",
    active: "Активен",
    inactive: "Неактивен",
    save: "Зачувај",
    cancel: "Откажи",
    items: "ставки",
    noItems: "Нема ставки",
    addFirst: "Додај прва",
    dragHint: "Повлечи за прередување",
  },
};

// ── Sortable Card ─────────────────────────────────────────────────────────────
function SortableMenuItemCard({
  item,
  onEdit,
}: {
  item: MenuItem;
  onEdit: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const { mutate: deleteItem } = useDeleteMenuItem();
  const { toast } = useToast();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-background rounded-lg p-3 border border-border group hover:border-primary/30 transition-colors relative"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="flex gap-3 pr-6">
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
            <h4 className="font-semibold text-sm truncate text-foreground">
              {item.name}
            </h4>
            <span className="font-bold text-primary text-sm whitespace-nowrap">
              {item.price}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {item.description}
          </p>
          <div className="flex gap-1 flex-wrap">
            <div
              className={`text-xs px-2 py-0.5 rounded-full ${item.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}
            >
              {item.active ? "Active" : "Inactive"}
            </div>
            {item.isVegetarian && (
              <div className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Veg
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1 mt-2 pt-2 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
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
          <AlertDialogContent className="bg-background border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                Delete {item.name}?
              </AlertDialogTitle>
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
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminRestaurant() {
  const [lang] = useState<"en" | "al" | "mk">(
    () => (localStorage.getItem("hajdeha-lang") as any) || "en",
  );
  const t = translations[lang];
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");
  const { data: restaurant, isLoading } = useRestaurant(id);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const queryClient = useQueryClient();

  // ── Drag & drop state ──
  const [orderedItems, setOrderedItems] = useState<MenuItem[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    if (restaurant?.menuItems) {
      const sorted = [...restaurant.menuItems].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      );
      setOrderedItems(sorted);
    }
  }, [restaurant?.menuItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  // Save order to backend after drag
  const saveOrder = useCallback(async () => {
    setIsSavingOrder(true);
    try {
      await apiRequest("POST", api.menuItems.reorder.path, {
        items: orderedItems.map((item, index) => ({
          id: item.id,
          sortOrder: index,
        })),
      });
      queryClient.invalidateQueries({ queryKey: [api.restaurants.get.path] });
    } catch (err) {
      console.error("Failed to save order", err);
    } finally {
      setIsSavingOrder(false);
    }
  }, [orderedItems, queryClient]);

  const groupedItems = useMemo(() => {
    return CATEGORIES.map((category) => {
      const items = orderedItems.filter((item) => item.category === category);
      return items.length > 0 ? { category, items } : null;
    }).filter(Boolean);
  }, [orderedItems]);

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (!restaurant)
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <h2 className="text-xl font-semibold text-foreground">{t.notFound}</h2>
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/20 dark:bg-stone-950 pb-20">
      <header className="bg-background border-b border-border sticky top-0 z-10">
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
              <h1 className="font-bold text-base sm:text-lg truncate text-foreground">
                {restaurant.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSavingOrder && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Button
              onClick={() => {
                setEditingItem(null);
                setIsItemModalOpen(true);
              }}
              size="sm"
            >
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t.addMenuItem}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <RestaurantDetailsForm restaurant={restaurant} />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              {t.menuManagement}
            </h2>
            <div className="flex items-center gap-2">
              {orderedItems.length > 0 && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {t.dragHint}
                </span>
              )}
              {restaurant.menuItems && restaurant.menuItems.length > 0 && (
                <div className="text-xs sm:text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {restaurant.menuItems.length} {t.items}
                </div>
              )}
            </div>
          </div>

          {orderedItems.length === 0 ? (
            <div className="text-center py-12 bg-background rounded-xl border-2 border-dashed border-border">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground/30" />
              <h3 className="font-semibold mb-1 text-foreground">
                {t.noItems}
              </h3>
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-6">
                {groupedItems.map((group: any) => (
                  <div key={group.category}>
                    <h3 className="font-semibold text-primary mb-3 px-4 py-1 bg-primary/5 dark:bg-primary/10 rounded-full inline-block">
                      {group.category}
                    </h3>
                    <SortableContext
                      items={group.items.map((i: MenuItem) => i.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                        {group.items.map((item: MenuItem) => (
                          <SortableMenuItemCard
                            key={item.id}
                            item={item}
                            onEdit={() => {
                              setEditingItem(item);
                              setIsItemModalOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                ))}
              </div>
              {/* Save order button — appears after drag */}
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveOrder}
                  disabled={isSavingOrder}
                >
                  {isSavingOrder ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Order"
                  )}
                </Button>
              </div>
            </DndContext>
          )}
        </section>

        {/* ── QR Codes Section ── */}
        <TableQRSection restaurant={restaurant} />
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

// ── Restaurant Details Form ───────────────────────────────────────────────────
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
    descriptionAl: restaurant.descriptionAl || "",
    descriptionMk: restaurant.descriptionMk || "",
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
    tableCount: restaurant.tableCount || 0,
    wifiPassword: restaurant.wifiPassword || "",
  });

  useEffect(() => {
    setFormData({
      name: restaurant.name,
      description: restaurant.description || "",
      descriptionAl: restaurant.descriptionAl || "",
      descriptionMk: restaurant.descriptionMk || "",
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
      tableCount: restaurant.tableCount || 0,
      wifiPassword: restaurant.wifiPassword || "",
    });
  }, [restaurant]);

  const handleSave = () => {
    // Dërgoni vetëm fushat që kanë vlera
    const updatePayload = Object.fromEntries(
      Object.entries(formData).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined
      )
    );

    update(
      { id: restaurant.id, ...updatePayload },
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
      <div className="bg-background rounded-xl p-4 sm:p-6 border border-border">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-foreground">Profile</h3>
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
          <div className="flex items-center gap-2 pb-4 border-b border-border">
            <Switch
              checked={restaurant.active ?? true}
              onCheckedChange={(checked) =>
                update({ id: restaurant.id, active: checked })
              }
            />
            <span className="text-sm font-medium text-foreground">Status</span>
            <div
              className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${restaurant.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}
            >
              {restaurant.active ? "Active" : "Inactive"}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Name</p>
              <p className="font-medium text-foreground">{restaurant.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Location</p>
              <p className="text-sm text-foreground">
                {restaurant.location || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Hours</p>
              <p className="text-sm text-foreground">
                {restaurant.openingTime} - {restaurant.closingTime}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              <p className="text-sm text-foreground">
                {restaurant.phoneNumber || "—"}
              </p>
            </div>
          </div>
          {restaurant.photoUrl && (
            <img
              src={restaurant.photoUrl}
              className="w-full h-40 object-cover rounded-lg border border-border"
              alt="Restaurant"
              loading="lazy"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-xl p-4 sm:p-6 border border-border space-y-4">
      <h3 className="font-bold text-lg text-foreground">Edit Profile</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-sm text-foreground">Name</Label>
          <Input
            value={formData.name}
            onChange={(e) =>
              setFormData((p) => ({ ...p, name: e.target.value }))
            }
            className="h-9 bg-background text-foreground border-border"
          />
        </div>
        <div>
          <Label className="text-sm text-foreground">Phone</Label>
          <Input
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData((p) => ({ ...p, phoneNumber: e.target.value }))
            }
            className="h-9 bg-background text-foreground border-border"
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-sm text-foreground">Location</Label>
          <Input
            value={formData.location}
            onChange={(e) =>
              setFormData((p) => ({ ...p, location: e.target.value }))
            }
            className="h-9 bg-background text-foreground border-border"
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-sm text-foreground">WiFi Password</Label>
          <Input
            value={formData.wifiPassword}
            placeholder="e.g. pass1234"
            onChange={(e) =>
              setFormData((p) => ({ ...p, wifiPassword: e.target.value }))
            }
            className="h-9 bg-background text-foreground border-border"
          />
        </div>
        <div>
          <Label className="text-sm text-foreground">Opening</Label>
          <Input
            type="time"
            value={formData.openingTime}
            onChange={(e) =>
              setFormData((p) => ({ ...p, openingTime: e.target.value }))
            }
            className="h-9 bg-background text-foreground border-border"
            style={{ colorScheme: "auto" }}
          />
        </div>
        <div>
          <Label className="text-sm text-foreground">Closing</Label>
          <Input
            type="time"
            value={formData.closingTime}
            onChange={(e) =>
              setFormData((p) => ({ ...p, closingTime: e.target.value }))
            }
            className="h-9 bg-background text-foreground border-border"
            style={{ colorScheme: "auto" }}
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
          {isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}Save
        </Button>
      </div>
    </div>
  );
});

// ── Menu Item Dialog ──────────────────────────────────────────────────────────
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

  const form = useForm<InsertMenuItem>({
    resolver: zodResolver(insertMenuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "Mains",
      imageUrl: "",
      active: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isSpicy: false,
      containsNuts: false,
      restaurantId,
    },
    values: initialData ? { ...initialData, restaurantId } : undefined,
  });

  const onSubmit = (data: InsertMenuItem) => {
    const onSuccess = () => {
      toast({ title: initialData ? "Updated" : "Added" });
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {initialData ? "Edit Item" : "Add Item"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label className="text-sm text-foreground">Name</Label>
            <Input
              {...form.register("name")}
              className="h-9 bg-background text-foreground border-border"
            />
          </div>
          <div>
            <Label className="text-sm text-foreground">Description</Label>
            <Textarea
              {...form.register("description")}
              className="h-20 resize-none bg-background text-foreground border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm text-foreground">Price</Label>
              <Input
                {...form.register("price")}
                placeholder="350 DEN"
                className="h-9 bg-background text-foreground border-border"
              />
            </div>
            <div>
              <Label className="text-sm text-foreground">Category</Label>
              <Select
                onValueChange={(val) => form.setValue("category", val)}
                defaultValue={form.getValues("category")}
              >
                <SelectTrigger className="h-9 bg-background text-foreground border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {CATEGORIES.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="text-foreground"
                    >
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
            label="Image"
          />
          <div className="flex items-center justify-between py-2 border-t border-border">
            <Label className="text-sm text-foreground">Available</Label>
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
              <Label className="text-xs text-foreground">Veg</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch("isVegan")}
                onCheckedChange={(c) => form.setValue("isVegan", c)}
              />
              <Label className="text-xs text-foreground">Vegan</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch("isGlutenFree")}
                onCheckedChange={(c) => form.setValue("isGlutenFree", c)}
              />
              <Label className="text-xs text-foreground">GF</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              )}
              {initialData ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Table QR Section ─────────────────────────────────────────────────────────
function TableQRSection({ restaurant }: { restaurant: any }) {
  const { mutate: update } = useUpdateRestaurant();
  const { toast } = useToast();
  const [tableCount, setTableCount] = useState<number>(
    restaurant.tableCount || 0,
  );
  const [inputVal, setInputVal] = useState(String(restaurant.tableCount || 0));
  const [saving, setSaving] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  // Load qrcode library dynamically
  useEffect(() => {
    if (!(window as any).QRCode) {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      document.head.appendChild(script);
    }
  }, []);

  // Draw QR for each table using canvas
  useEffect(() => {
    if (tableCount === 0) return;
    const timer = setTimeout(() => {
      for (let i = 0; i < tableCount; i++) {
        const canvas = canvasRefs.current[i];
        if (!canvas) continue;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        const url = `${baseUrl}/table/${restaurant.slug}/${i + 1}`;
        // Draw QR using qrcode-svg approach via data URL
        drawQR(canvas, url, i + 1);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [tableCount, restaurant.slug, baseUrl]);

  const drawQR = (canvas: HTMLCanvasElement, url: string, tableNum: number) => {
    // Use a simple QR via Google Charts API rendered to canvas
    const size = 200;
    canvas.width = size;
    canvas.height = size + 40;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size + 40);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}&bgcolor=FFFFFF&color=000000&margin=10`;
    img.onload = () => {
      ctx.drawImage(img, 10, 10, 180, 180);
      // Table label
      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px DM Sans, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Table ${tableNum}`, size / 2, size + 20);
      ctx.font = "10px DM Sans, sans-serif";
      ctx.fillStyle = "#888888";
      ctx.fillText(restaurant.name, size / 2, size + 35);
    };
  };

  const saveTableCount = () => {
    const count = parseInt(inputVal);
    if (isNaN(count) || count < 0 || count > 100) {
      toast({
        title: "Numër i gabuar",
        description: "Ndërmjet 0 dhe 100",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    update(
      { id: restaurant.id, tableCount: count },
      {
        onSuccess: () => {
          setTableCount(count);
          setSaving(false);
          toast({ title: "✓ Ruajtur", description: `${count} tavolina` });
        },
        onError: () => setSaving(false),
      },
    );
  };

  const downloadQR = (tableNum: number) => {
    const canvas = canvasRefs.current[tableNum - 1];
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${restaurant.slug}-table-${tableNum}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadAll = () => {
    for (let i = 1; i <= tableCount; i++) {
      setTimeout(() => downloadQR(i), i * 300);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-bold text-foreground">
            QR Codes · Tavolinat
          </h2>
        </div>
        {tableCount > 0 && (
          <button
            onClick={downloadAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
          >
            <Download className="h-3.5 w-3.5" />
            Shkarko të gjitha
          </button>
        )}
      </div>

      {/* Table count input */}
      <div className="bg-background rounded-xl border border-border p-4 flex items-center gap-3">
        <Table2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            Numri i tavolinave
          </p>
          <p className="text-xs text-muted-foreground">
            Gjeneron QR kod unik për çdo tavolinë
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-16 h-9 rounded-lg border border-border bg-muted text-center text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={saveTableCount}
            disabled={saving}
            className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Ruaj"}
          </button>
        </div>
      </div>

      {/* QR Grid */}
      {tableCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: tableCount }, (_, i) => i + 1).map(
            (tableNum) => (
              <div
                key={tableNum}
                className="bg-background rounded-xl border border-border p-3 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors"
              >
                <canvas
                  ref={(el) => {
                    canvasRefs.current[tableNum - 1] = el;
                  }}
                  className="w-full max-w-[160px] rounded-lg"
                  style={{ imageRendering: "pixelated" }}
                />
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    T{tableNum}
                  </span>
                  <button
                    onClick={() => downloadQR(tableNum)}
                    className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                  >
                    <Download className="h-3 w-3" />
                    PNG
                  </button>
                </div>
                {restaurant.wifiPassword && (
                  <div className="flex items-center gap-1 w-full bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2 py-1">
                    <Wifi className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    <span className="text-[10px] font-mono font-semibold text-blue-700 dark:text-blue-300 truncate">
                      {restaurant.wifiPassword}
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground text-center truncate w-full">
                  /table/{restaurant.slug}/{tableNum}
                </p>
              </div>
            ),
          )}
        </div>
      )}

      {tableCount === 0 && (
        <div className="bg-muted/40 rounded-xl border border-dashed border-border p-8 flex flex-col items-center gap-2">
          <QrCode className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Shkruani numrin e tavolinave dhe klikoni Ruaj
          </p>
        </div>
      )}
    </section>
  );
}