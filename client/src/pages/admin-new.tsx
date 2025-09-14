import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Users,
  Package,
  ShoppingCart,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  FileText,
  Pencil,
  TicketPercent,
  Box
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, insertUserSchema, insertCategorySchema, insertPromoSchema, insertAreaSchema } from "@shared/schema";
import type { Product, User, Order, Category, InsertProduct, InsertUser, InsertCategory, OrderItem, Promo, InsertPromo, Area, InsertArea, SiteSettings } from "@shared/schema";
import OrderItemsList from "@/components/order-items-list";

// Helper function to generate slug from name
const generateSlug = (name: string) => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substr(2, 5);
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-') // collapse dashes
    + `-${timestamp}-${randomStr}`; // add timestamp and random string for uniqueness
};

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Edit states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Settings state
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});

  // Settings Query & Mutation
  const { data: settingsData, isLoading: settingsLoading, refetch: refetchSettings } = useQuery<{ settings: SiteSettings }>({
    queryKey: ["/api/pengaturan"],
    queryFn: async () => (await apiRequest("GET", "/api/pengaturan")).json(),
  });

  useEffect(() => {
    if (settingsData?.settings) {
      setSettings(settingsData.settings);
    }
  }, [settingsData]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<SiteSettings>) => {
      const response = await apiRequest("PUT", "/api/site-settings", data);
      return response.json();
    },
    onSuccess: () => {
      refetchSettings();
      toast({ title: "Berhasil", description: "Pengaturan berhasil disimpan" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: `Gagal menyimpan: ${error.message}`, variant: "destructive" });
    },
  });

  // Customization options state
  const [customizationOptions, setCustomizationOptions] = useState<any[]>([]);

  // State for category management
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Promo states
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);

  // Area states
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);

  // Data queries
  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => (await apiRequest("GET", "/api/products")).json(),
  });
  const products = Array.isArray(productsData?.products) ? productsData.products : [];

  const { data: usersData = { users: [] }, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => (await apiRequest("GET", "/api/users")).json(),
  });
  const users = Array.isArray(usersData.users) ? usersData.users : [];

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => (await apiRequest("GET", "/api/orders")).json().then(data => data.orders || []),
  });

  const { data: categoriesData = { categories: [] }, refetch: refetchCategories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => (await apiRequest("GET", "/api/categories")).json(),
  });
  const categories: Category[] = Array.isArray(categoriesData.categories) ? categoriesData.categories : [];

  const { data: promosData = { promos: [] }, isLoading: promosLoading } = useQuery({
    queryKey: ["/api/promos"],
    queryFn: async () => (await apiRequest("GET", "/api/promos")).json(),
  });
  const promos: Promo[] = Array.isArray(promosData.promos) ? promosData.promos : [];

  const { data: areasData = { areas: [] }, refetch: refetchAreas } = useQuery({
    queryKey: ["/api/areas"],
    queryFn: async () => (await apiRequest("GET", "/api/areas")).json(),
  });
  const areas: Area[] = Array.isArray(areasData.areas) ? areasData.areas : [];

  // Check if user is admin
  useEffect(() => {
    if (!user || user.username !== "admin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Forms
  const productForm = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: "",
      originalPrice: "",
      image: "",
      categoryId: 1,
      minOrderQty: "1",
    },
  });

  const userForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      phone: "",
    },
  });

  const categoryForm = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const promoForm = useForm<InsertPromo>({
    resolver: zodResolver(insertPromoSchema),
    defaultValues: {
      title: "",
      code: "",
      description: "",
      discountType: "percent",
      discountValue: "",
      startDate: undefined,
      endDate: undefined,
      isActive: true
    },
  });

  const areaForm = useForm<InsertArea>({
    resolver: zodResolver(insertAreaSchema),
    defaultValues: {
      name: "",
      deliveryFee: "0",
      serviceFee: "0",
    },
  });

  // Watch name field to auto-generate slug
  const productName = productForm.watch("name");
  useEffect(() => {
    if (productName) {
      productForm.setValue("slug", generateSlug(productName));
    }
  }, [productName, productForm]);

  // Product mutations
  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const productData = {
        ...data,
        customizationOptions: customizationOptions
      };
      const response = await apiRequest("POST", "/api/products", productData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Berhasil", description: "Produk berhasil ditambahkan" });
      setIsProductModalOpen(false);
      productForm.reset();
      resetCustomizationOptions();
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menambahkan produk", variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertProduct> }) => {
      const productData = {
        ...data,
        minOrderQty: data.minOrderQty ? String(data.minOrderQty) : "1",
        customizationOptions: customizationOptions
      };
      console.log('Sending product data:', productData); // Debug log
      const response = await apiRequest("PUT", `/api/products/${id}`, productData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Berhasil", description: "Produk berhasil diperbarui" });
      setIsProductModalOpen(false);
      setEditingProduct(null);
      productForm.reset();
      resetCustomizationOptions();
    },
    onError: (error) => {
      console.error('Update product error:', error); // Debug log
      toast({ title: "Error", description: "Gagal memperbarui produk", variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/products/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Berhasil", description: "Produk berhasil dihapus" });
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menghapus produk", variant: "destructive" });
    },
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("POST", "/api/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Berhasil", description: "Pengguna berhasil ditambahkan" });
      setIsUserModalOpen(false);
      userForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menambahkan pengguna", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertUser> }) => {
      const response = await apiRequest("PUT", `/api/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Berhasil", description: "Pengguna berhasil diperbarui" });
      setIsUserModalOpen(false);
      setEditingUser(null);
      userForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal memperbarui pengguna", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/users/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Berhasil", description: "Pengguna berhasil dihapus" });
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menghapus pengguna", variant: "destructive" });
    },
  });

  // Order status update mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/orders/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Berhasil", description: "Status pesanan berhasil diperbarui" });
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal memperbarui status pesanan", variant: "destructive" });
    },
  });

  // Mutations
  const { mutate: deleteProduct } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/products/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Berhasil", description: "Produk berhasil dihapus" });
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menghapus produk", variant: "destructive" });
    },
  });

  const { mutate: createOrUpdateProduct } = useMutation({
    mutationFn: async (productData: Omit<InsertProduct, "id">) => {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (!response.ok) throw new Error("Failed to save product");
      return response.json();
    },
    onSuccess: () => {
      refetchProducts();
      setIsProductModalOpen(false);
      setEditingProduct(null);
    },
  });

  const { mutate: createOrUpdateCategory } = useMutation({
    mutationFn: async (categoryData: InsertCategory) => {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });
      if (!response.ok) throw new Error("Failed to save category");
      return response.json();
    },
    onSuccess: () => {
      refetchCategories();
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    },
  });

  const { mutate: deleteCategory } = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete category");
    },
    onSuccess: () => {
      refetchCategories();
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const response = await apiRequest("POST", "/api/categories", data);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menambahkan kategori");
      return result;
    },
    onSuccess: () => {
      refetchCategories();
      toast({ title: "Berhasil", description: "Kategori berhasil ditambahkan" });
      setIsCategoryModalOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCategory> }) => {
      const response = await apiRequest("PUT", `/api/categories/${id}`, data);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal memperbarui kategori");
      return result;
    },
    onSuccess: () => {
      refetchCategories();
      toast({ title: "Berhasil", description: "Kategori berhasil diperbarui" });
      setIsCategoryModalOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/categories/${id}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menghapus kategori");
      return result;
    },
    onSuccess: () => {
      refetchCategories();
      toast({ title: "Berhasil", description: "Kategori berhasil dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Promo mutations
  const createPromoMutation = useMutation({
    mutationFn: async (data: InsertPromo) => {
      const response = await apiRequest("POST", "/api/promos", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promos"] });
      toast({ title: "Berhasil", description: "Promo berhasil ditambahkan" });
      setIsPromoModalOpen(false);
      promoForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menambahkan promo", variant: "destructive" });
    },
  });

  const updatePromoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPromo> }) => {
      const response = await apiRequest("PUT", `/api/promos/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promos"] });
      toast({ title: "Berhasil", description: "Promo berhasil diperbarui" });
      setIsPromoModalOpen(false);
      setEditingPromo(null);
      promoForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal memperbarui promo", variant: "destructive" });
    },
  });

  const deletePromoMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/promos/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promos"] });
      toast({ title: "Berhasil", description: "Promo berhasil dihapus" });
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menghapus promo", variant: "destructive" });
    },
  });

  // Area mutations
  const createAreaMutation = useMutation({
    mutationFn: async (data: InsertArea) => {
      const response = await apiRequest("POST", "/api/areas", data);
      return response.json();
    },
    onSuccess: () => {
      refetchAreas();
      setIsAreaModalOpen(false);
      areaForm.reset();
    },
  });

  const updateAreaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertArea> }) => {
      const response = await apiRequest("PUT", `/api/areas/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      refetchAreas();
      setIsAreaModalOpen(false);
      setEditingArea(null);
      areaForm.reset();
    },
  });

  const deleteAreaMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/areas/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      refetchAreas();
    },
  });

  // Helper functions
  const resetCustomizationOptions = () => {
    setCustomizationOptions([]);
  };

  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      categoryForm.reset({
        name: category.name,
        slug: category.slug,
      });
    } else {
      setEditingCategory(null);
      categoryForm.reset({ name: "", slug: "" });
    }
    setIsCategoryModalOpen(true);
  };

  const openProductModal = (product?: Product) => {
    if (product) {
      productForm.reset({
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        price: product.price || "",
        originalPrice: product.originalPrice || "",
        image: product.image || "",
        categoryId: Number(product.categoryId) || 1,
        minOrderQty: String(product.minOrderQty) || "1",
        areaId: product.areaId || undefined,
      });
      setCustomizationOptions(Array.isArray(product.customizationOptions) ? product.customizationOptions : []);
      setEditingProduct(product);
      setIsProductModalOpen(true);
    } else {
      productForm.reset();
      setCustomizationOptions([]);
      setEditingProduct(null);
      setIsProductModalOpen(true);
    }
  };

  const openUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      userForm.reset({
        username: user.username,
        password: "", // Don't pre-fill password
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    } else {
      setEditingUser(null);
      userForm.reset();
    }
    setIsUserModalOpen(true);
  };

  const openPromoModal = (promo?: Promo) => {
    if (promo) {
      setEditingPromo(promo);
      promoForm.reset({
        title: promo.title,
        code: promo.code,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        startDate: promo.startDate ? new Date(promo.startDate) : undefined,
        endDate: promo.endDate ? new Date(promo.endDate) : undefined,
        isActive: promo.isActive,
      });
    } else {
      setEditingPromo(null);
      promoForm.reset({
        title: "",
        code: "",
        description: "",
        discountType: "percent",
        discountValue: "",
        startDate: undefined,
        endDate: undefined,
        isActive: true
      });
    }
    setIsPromoModalOpen(true);
  };

  const openAreaModal = (area?: Area) => {
    if (area) {
      setEditingArea(area);
      areaForm.reset({
        name: area.name,
        deliveryFee: String(area.deliveryFee) || "0",
        serviceFee: String(area.serviceFee) || "0",
      });
    } else {
      setEditingArea(null);
      areaForm.reset({ name: "", deliveryFee: "0", serviceFee: "0" });
    }
    setIsAreaModalOpen(true);
  };

  const handleProductSubmit = (data: InsertProduct) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleUserSubmit = (data: InsertUser) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handlePromoSubmit = (data: InsertPromo) => {
    const formattedData = {
      ...data,
      startDate: data.startDate ? format(data.startDate, "yyyy-MM-dd") : "",
      endDate: data.endDate ? format(data.endDate, "yyyy-MM-dd") : "",
    };

    if (editingPromo) {
      updatePromoMutation.mutate({ id: editingPromo.id, data: formattedData });
    } else {
      createPromoMutation.mutate(formattedData);
    }
  };

  const handleAreaSubmit = (data: InsertArea) => {
    if (editingArea) {
      updateAreaMutation.mutate({ id: editingArea.id, data });
    } else {
      createAreaMutation.mutate(data);
    }
  };

  // Pagination helpers
  const getPaginatedItems = (items: any) => {
    if (!Array.isArray(items)) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems: number) => {
    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
  };

  // Customization options handlers
  const addCustomizationType = () => {
    setCustomizationOptions([...customizationOptions, { type: "", options: [{ name: "", harga: 0 }] }]);
  };
  const removeCustomizationType = (idx: number) => {
    setCustomizationOptions(customizationOptions.filter((_, i) => i !== idx));
  };
  const updateCustomizationType = (idx: number, value: string) => {
    const newOptions = [...customizationOptions];
    newOptions[idx].type = value;
    setCustomizationOptions(newOptions);
  };
  const addOption = (typeIdx: number) => {
    const newOptions = [...customizationOptions];
    newOptions[typeIdx].options.push({ name: "", harga: 0 });
    setCustomizationOptions(newOptions);
  };
  const removeOption = (typeIdx: number, optIdx: number) => {
    const newOptions = [...customizationOptions];
    newOptions[typeIdx].options = newOptions[typeIdx].options.filter((_: any, i: number) => i !== optIdx);
    setCustomizationOptions(newOptions);
  };
  const updateOption = (typeIdx: number, optIdx: number, field: string, value: any) => {
    const newOptions = [...customizationOptions];
    newOptions[typeIdx].options[optIdx][field] = field === "harga" ? Number(value) : value;
    setCustomizationOptions(newOptions);
  };

  // Invoice generation function
  const generateInvoice = async (order: Order) => {
    try {
      const orderItems = await fetch(`/api/orders/${order.id}/items`, {
        credentials: "include",
      }).then(res => res.json());

      const invoiceWindow = window.open('', '_blank');
      if (!invoiceWindow) return;

      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${order.code}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #dc2626; }
            .invoice-title { font-size: 20px; margin-top: 10px; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .customer-info, .order-info { width: 45%; }
            .section-title { font-weight: bold; color: #dc2626; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #dc2626; color: white; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; color: #666; }
            .summary-table { width: 350px; margin-left: auto; margin-top: 30px; border-collapse: collapse; }
            .summary-table td { border: none; padding: 6px 8px; }
            .summary-table .label { color: #333; }
            .summary-table .value { text-align: right; }
            .summary-table .promo { color: #16a34a; }
            .summary-table .total { font-weight: bold; font-size: 1.2em; color: #dc2626; border-top: 2px solid #dc2626; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Catering Nusantara</div>
            <div class="invoice-title">INVOICE</div>
          </div>
          
          <div class="invoice-info">
            <div class="customer-info">
              <div class="section-title">Informasi Pelanggan</div>
              <p><strong>Nama:</strong> ${order.customerName}</p>
              <p><strong>Telepon:</strong> ${order.customerPhone}</p>
              <p><strong>Alamat:</strong> ${order.customerAddress}</p>
            </div>
            <div class="order-info">
              <div class="section-title">Informasi Pesanan</div>
              <p><strong>No. Invoice:</strong> ${order.code}</p>
              <p><strong>Tanggal:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID') : '-'}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Pengiriman:</strong> ${orderItems.length > 0 ? `${orderItems[0].deliveryDate} ${orderItems[0].deliveryTime}` : '-'}</p>
              ${order.promoCode ? `<p><strong>Kode Promo:</strong> ${order.promoCode}</p>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Qty</th>
                <th>Harga</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems.map((item: any) => `
                <tr>
                  <td>
                    ${item.productName}
                    ${item.customization ? `<br><small>${Object.entries(item.customization).map(([key, value]) =>
        value ? `${key}: ${Array.isArray(value) ? value.join(', ') : value}` : ''
      ).filter(Boolean).join(', ')}</small>` : ''}
                  </td>
                  <td>${item.quantity}</td>
                  <td>Rp ${item.price.toLocaleString()}</td>
                  <td>Rp ${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td class="label">Subtotal</td>
              <td class="value">Rp ${(order.subtotal || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td class="label">Ongkos Kirim</td>
              <td class="value">Rp ${(order.deliveryFee || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td class="label">Service Fee</td>
              <td class="value">Rp ${(order.serviceFee || 0).toLocaleString()}</td>
            </tr>
            ${(order.discount && Number(order.discount) > 0) ? `
            <tr>
              <td class="label promo">Diskon Promo</td>
              <td class="value promo">- Rp ${Number(order.discount).toLocaleString()}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="label total">Total</td>
              <td class="value total">Rp ${(order.total || 0).toLocaleString()}</td>
            </tr>
          </table>

          <div class="footer">
            <p>Terima kasih atas kepercayaan Anda!</p>
            <p>Catering Nusantara - Jl. Raya No. 123, Jakarta</p>
          </div>
        </body>
        </html>
      `;

      invoiceWindow.document.write(invoiceHTML);
      invoiceWindow.document.close();
      invoiceWindow.print();
    } catch (error) {
      toast({ title: "Error", description: "Gagal mencetak invoice", variant: "destructive" });
    }
  };

  // Export order details function
  const exportOrderDetails = async (order: Order) => {
    try {
      const orderItems = await fetch(`/api/orders/${order.id}/items`, {
        credentials: "include",
      }).then(res => res.json());

      const csvContent = [
        ['Kode Pesanan', 'Tanggal', 'Pelanggan', 'Telepon', 'Alamat', 'Produk', 'Qty', 'Harga', 'Subtotal', 'Total', 'Status'],
        ...orderItems.map((item: any) => [
          order.code,
          order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID') : '-',
          order.customerName,
          order.customerPhone,
          order.customerAddress,
          item.productName + (item.customization ? ` (${Object.entries(item.customization).map(([key, value]) =>
            value ? `${key}: ${Array.isArray(value) ? value.join(', ') : value}` : ''
          ).filter(Boolean).join(', ')})` : ''),
          item.quantity,
          item.price,
          item.price * item.quantity,
          order.total,
          order.status
        ])
      ].map(row => row.map((cell: any) => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `detail-pesanan-${order.code}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Berhasil", description: "Detail pesanan berhasil diekspor" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal mengekspor detail pesanan", variant: "destructive" });
    }
  };

  // Export all transactions function
  const exportAllTransactions = async () => {
    try {
      const allOrdersWithItems = await Promise.all(
        orders.map(async (order) => {
          const orderItems = await fetch(`/api/orders/${order.id}/items`, {
            credentials: "include",
          }).then(res => res.json());
          return { order, items: orderItems };
        })
      );

      const csvContent = [
        ['Kode Pesanan', 'Tanggal', 'Pelanggan', 'Telepon', 'Alamat', 'Produk', 'Qty', 'Harga', 'Subtotal', 'Total Pesanan', 'Status', 'Tanggal Pengiriman'],
        ...allOrdersWithItems.flatMap(({ order, items }) =>
          items.map((item: any) => [
            order.code,
            order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID') : '-',
            order.customerName,
            order.customerPhone,
            order.customerAddress,
            item.productName + (item.customization ? ` (${Object.entries(item.customization).map(([key, value]) =>
              value ? `${key}: ${Array.isArray(value) ? value.join(', ') : value}` : ''
            ).filter(Boolean).join(', ')})` : ''),
            item.quantity,
            item.price,
            item.price * item.quantity,
            order.total,
            order.status,
            `${order.deliveryDate} ${order.deliveryTime}`
          ])
        )
      ].map(row => row.map((cell: any) => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `riwayat-transaksi-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Berhasil", description: "Riwayat transaksi berhasil diekspor" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal mengekspor riwayat transaksi", variant: "destructive" });
    }
  };

  // Handlers
  const handleEditProduct = (product: Product) => {
    openProductModal(product);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleAddNewCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = (data: InsertCategory) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };
  // After products is defined and before the return statement in the component:
  const totalProducts = products.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / itemsPerPage));
  const startIndex = totalProducts === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = totalProducts === 0 ? 0 : Math.min(currentPage * itemsPerPage, totalProducts);

  if (!user || user.username !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
          >
            Kembali ke Beranda
          </Button>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="w-full flex overflow-x-auto whitespace-nowrap gap-1 no-scrollbar md:grid md:grid-cols-7 md:gap-2 rounded-lg bg-gray-100 p-1">
            <TabsTrigger value="products" className="flex items-center justify-center gap-2 py-2 px-3 min-w-[110px]">
              <Package className="w-5 h-5" />
              <span>Produk</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center justify-center gap-2 py-2 px-3 min-w-[110px]">
              <FileText className="w-5 h-5" />
              <span>Kategori</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center justify-center gap-2 py-2 px-3 min-w-[110px]">
              <Users className="w-5 h-5" />
              <span>Pengguna</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center justify-center gap-2 py-2 px-3 min-w-[110px]">
              <ShoppingCart className="w-5 h-5" />
              <span>Pesanan</span>
            </TabsTrigger>
            <TabsTrigger value="promo" className="flex items-center justify-center gap-2 py-2 px-3 min-w-[110px]">
              <TicketPercent className="w-5 h-5" />
              <span>Promo</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center justify-center gap-2 py-2 px-3 min-w-[110px]">
              <Settings className="w-5 h-5" />
              <span>Pengaturan</span>
            </TabsTrigger>
            <TabsTrigger value="areas" className="flex items-center justify-center gap-2 py-2 px-3 min-w-[110px]">
              <Box className="w-5 h-5" />
              <span>Area</span>
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Manajemen Produk</h2>
              <Button onClick={() => openProductModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Produk
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Daftar Produk</CardTitle>
                <CardDescription>Kelola semua produk catering</CardDescription>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Harga</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getPaginatedItems(products).map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                              {categories.find(c => c.id === product.categoryId)?.name}
                            </TableCell>
                            <TableCell>Rp {product.price}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditProduct(product)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus produk "{product.name}"?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteProductMutation.mutate(product.id)}
                                      >
                                        Hapus
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {totalProducts === 0 ? 'Tidak ada produk' : `Menampilkan ${startIndex} - ${endIndex} dari ${totalProducts} produk`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm">
                          Halaman {currentPage} dari {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Manajemen Pengguna</h2>
              <Button onClick={() => openUserModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pengguna
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Daftar Pengguna</CardTitle>
                <CardDescription>Kelola semua pengguna sistem</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telepon</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openUserModal(user)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              {user.username !== "admin" && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus pengguna "{user.username}"?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteUserMutation.mutate(user.id)}
                                      >
                                        Hapus
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Manajemen Pesanan</h2>
              <Button onClick={exportAllTransactions} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Riwayat Transaksi
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Daftar Pesanan</CardTitle>
                <CardDescription>Kelola semua pesanan masuk</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Kode Pesanan</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono">{order.id}</TableCell>
                          <TableCell className="font-medium">{order.code}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>Rp {(order.total || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.status === 'completed' ? 'default' :
                                  order.status === 'processing' ? 'secondary' :
                                    order.status === 'shipped' ? 'outline' : 'destructive'
                              }
                            >
                              {order.status === 'pending' ? 'Menunggu' :
                                order.status === 'processing' ? 'Diproses' :
                                  order.status === 'shipped' ? 'Dikirim' : 'Dibatalkan'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID') : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingOrder(order)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Select
                                value={order.status}
                                onValueChange={(status) =>
                                  updateOrderStatusMutation.mutate({ id: order.id, status })
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Menunggu</SelectItem>
                                  <SelectItem value="processing">Diproses</SelectItem>
                                  <SelectItem value="shipped">Dikirim</SelectItem>
                                  <SelectItem value="completed">Selesai</SelectItem>
                                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Promo Tab */}
          <TabsContent value="promo" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Manajemen Promo</h2>
              <Button onClick={() => openPromoModal()}>
                <Plus className="w-4 h-4 mr-2" />Tambah Promo
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Daftar Promo</CardTitle>
                <CardDescription>Kelola semua promo dan voucher</CardDescription>
              </CardHeader>
              <CardContent>
                {promosLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Judul</TableHead>
                        <TableHead>Kode</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Berlaku Hingga</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promos.map((promo) => (
                        <TableRow key={promo.id}>
                          <TableCell>{promo.title}</TableCell>
                          <TableCell><Badge variant="outline">{promo.code}</Badge></TableCell>
                          <TableCell>{promo.description}</TableCell>
                          <TableCell>{promo.endDate}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => openPromoModal(promo)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => { if (confirm(`Hapus promo '${promo.title}'?`)) deletePromoMutation.mutate(promo.id); }} disabled={deletePromoMutation.isPending}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            <Dialog open={isPromoModalOpen} onOpenChange={setIsPromoModalOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingPromo ? "Edit Promo" : "Tambah Promo Baru"}</DialogTitle>
                </DialogHeader>
                <Form {...promoForm}>
                  <form onSubmit={promoForm.handleSubmit(handlePromoSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Judul Promo</Label>
                        <Input id="title" placeholder="Contoh: Diskon Kemerdekaan" {...promoForm.register("title")} />
                        {promoForm.formState.errors.title && <p className="text-sm font-medium text-destructive">{promoForm.formState.errors.title.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="code">Kode Promo</Label>
                        <Input id="code" placeholder="Contoh: MERDEKA20" {...promoForm.register("code")} />
                        {promoForm.formState.errors.code && <p className="text-sm font-medium text-destructive">{promoForm.formState.errors.code.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea id="description" placeholder="Jelaskan detail dan syarat promo di sini..." {...promoForm.register("description")} />
                        {promoForm.formState.errors.description && <p className="text-sm font-medium text-destructive">{promoForm.formState.errors.description.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label>Tipe Diskon</Label>
                        <Controller
                          control={promoForm.control}
                          name="discountType"
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe diskon" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percent">Persentase (%)</SelectItem>
                                <SelectItem value="amount">Nominal (Rp)</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {promoForm.formState.errors.discountType && <p className="text-sm font-medium text-destructive">{promoForm.formState.errors.discountType.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="discountValue">Nilai Diskon</Label>
                        <Input
                          id="discountValue"
                          type="number"
                          placeholder={promoForm.watch("discountType") === "percent" ? "20" : "10000"}
                          {...promoForm.register("discountValue")}
                        />
                        {promoForm.formState.errors.discountValue && <p className="text-sm font-medium text-destructive">{promoForm.formState.errors.discountValue.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label>Tanggal Mulai</Label>
                        <Controller
                          control={promoForm.control}
                          name="startDate"
                          render={({ field }) => (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: id })
                                  ) : (
                                    <span>Pilih tanggal mulai</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                        {promoForm.formState.errors.startDate && <p className="text-sm font-medium text-destructive">{promoForm.formState.errors.startDate.message}</p>}
                      </div>
                      <div>
                        <Label>Tanggal Berakhir</Label>
                        <Controller
                          control={promoForm.control}
                          name="endDate"
                          render={({ field }) => (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: id })
                                  ) : (
                                    <span>Pilih tanggal berakhir</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                        {promoForm.formState.errors.endDate && <p className="text-sm font-medium text-destructive">{promoForm.formState.errors.endDate.message}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Label htmlFor="isActive">Aktif</Label>
                      <Controller
                        control={promoForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <Switch
                            id="isActive"
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsPromoModalOpen(false)}>Batal</Button>
                      <Button type="submit" disabled={createPromoMutation.isPending || updatePromoMutation.isPending}>{editingPromo ? "Simpan Perubahan" : "Buat Promo"}</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Pengaturan Website</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* NEW: Site Identity Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Identitas Situs</CardTitle>
                  <CardDescription>Kelola nama, judul, dan ikon situs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nama Situs</Label>
                    <Input
                      value={settings.siteName || ""}
                      onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Judul Website (Title)</Label>
                    <Input
                      value={settings.title || ""}
                      onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL Logo</Label>
                    <Input
                      value={settings.logoUrl || ""}
                      onChange={(e) => setSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL Favicon</Label>
                    <Input
                      value={settings.faviconUrl || ""}
                      onChange={(e) => setSettings(prev => ({ ...prev, faviconUrl: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Banner Promo</CardTitle>
                  <CardDescription>Kelola banner promosi di halaman utama</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="banner-switch">Aktifkan Banner Promo</Label>
                    <Switch
                      id="banner-switch"
                      checked={settings.promoBannerEnabled || false}
                      onCheckedChange={(enabled) =>
                        setSettings(prev => ({ ...prev, promoBannerEnabled: enabled }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Teks Banner</Label>
                    <Textarea
                      value={settings.promoBannerText || ""}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, promoBannerText: e.target.value }))
                      }
                      placeholder="Masukkan teks promo..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Warna Background</Label>
                      <Input
                        type="color"
                        value={settings.promoBannerBackgroundColor || "#dc2626"}
                        onChange={(e) =>
                          setSettings(prev => ({ ...prev, promoBannerBackgroundColor: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Warna Teks</Label>
                      <Input
                        type="color"
                        value={settings.promoBannerTextColor || "#ffffff"}
                        onChange={(e) =>
                          setSettings(prev => ({ ...prev, promoBannerTextColor: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  {settings.promoBannerEnabled && (
                    <div className="p-4 rounded-lg" style={{
                      backgroundColor: settings.promoBannerBackgroundColor,
                      color: settings.promoBannerTextColor
                    }}>
                      {settings.promoBannerText}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informasi Perusahaan</CardTitle>
                  <CardDescription>Kelola informasi kontak perusahaan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nama Perusahaan</Label>
                    <Input
                      value={settings.companyName || ""}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, companyName: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nomor Telepon</Label>
                    <Input
                      value={settings.companyPhone || ""}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, companyPhone: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Alamat</Label>
                    <Textarea
                      value={settings.companyAddress || ""}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, companyAddress: e.target.value }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => updateSettingsMutation.mutate(settings)} disabled={updateSettingsMutation.isPending || settingsLoading}>
                {settingsLoading ? "Memuat..." : updateSettingsMutation.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
              </Button>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">Manajemen Kategori</h2>
                <p className="text-sm text-muted-foreground">
                  Kelola semua kategori untuk produk Anda.
                </p>
              </div>
              <Button onClick={() => openCategoryModal()}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Daftar Kategori</CardTitle>
                <CardDescription>
                  Tambah, edit, atau hapus kategori dari daftar di bawah ini.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(categories || []).map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.slug}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openCategoryModal(category)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini tidak bisa dibatalkan. Ini akan menghapus kategori secara permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteCategoryMutation.mutate(category.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Area Tab */}
          <TabsContent value="areas" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Manajemen Area</h2>
              <Button onClick={() => openAreaModal()}>
                <Plus className="w-4 h-4 mr-2" />Tambah Area
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Daftar Area</CardTitle>
                <CardDescription>Kelola area layanan catering</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Ongkos Kirim</TableHead>
                      <TableHead>Biaya Layanan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areas.map((area) => (
                      <TableRow key={area.id}>
                        <TableCell className="font-medium">{area.name}</TableCell>
                        <TableCell>Rp {Number(area.deliveryFee).toLocaleString()}</TableCell>
                        <TableCell>Rp {Number(area.serviceFee).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={area.isActive ? "default" : "secondary"}>
                            {area.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => openAreaModal(area)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { if (confirm(`Hapus area '${area.name}'?`)) deleteAreaMutation.mutate(area.id); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Dialog open={isAreaModalOpen} onOpenChange={setIsAreaModalOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingArea ? "Edit Area" : "Tambah Area Baru"}</DialogTitle>
                </DialogHeader>
                <Form {...areaForm}>
                  <form onSubmit={areaForm.handleSubmit((data) => {
                    if (editingArea) {
                      updateAreaMutation.mutate({ id: editingArea.id, data });
                    } else {
                      createAreaMutation.mutate(data);
                    }
                  })} className="space-y-6">
                    <div className="space-y-4">
                      <FormItem>
                        <FormLabel>Nama Area</FormLabel>
                        <FormControl>
                          <Input id="name" placeholder="Contoh: Jakarta Selatan" {...areaForm.register("name")} />
                        </FormControl>
                        {areaForm.formState.errors.name && <p className="text-sm text-red-500 mt-1">{areaForm.formState.errors.name.message}</p>}
                      </FormItem>
                      <FormItem>
                        <FormLabel>Ongkos Kirim (Rp)</FormLabel>
                        <FormControl>
                          <Input type="number" id="deliveryFee" placeholder="5000" {...areaForm.register("deliveryFee")} />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormLabel>Biaya Layanan (Rp)</FormLabel>
                        <FormControl>
                          <Input type="number" id="serviceFee" placeholder="2000" {...areaForm.register("serviceFee")} />
                        </FormControl>
                      </FormItem>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAreaModalOpen(false)}>Batal</Button>
                      <Button type="submit" disabled={createAreaMutation.isPending || updateAreaMutation.isPending}>{editingArea ? "Simpan Perubahan" : "Tambah Area"}</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>

        {/* Product Modal */}
        <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
              </DialogTitle>
              <DialogDescription>
                Lengkapi informasi produk dan opsi kustomisasi
              </DialogDescription>
            </DialogHeader>

            <Form {...productForm}>
              <form onSubmit={productForm.handleSubmit(handleProductSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={productForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Produk</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={productForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={e => field.onChange(e.target.value === "" ? "" : e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={productForm.control}
                    name="originalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga Asli (Opsional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            value={field.value || ""}
                            onChange={e => field.onChange(e.target.value === "" ? "" : e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={productForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={productForm.control}
                    name="minOrderQty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimal Pembelian (pax)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            value={field.value || ""}
                            onChange={e => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={productForm.control}
                    name="areaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area Layanan</FormLabel>
                        <Select
                          value={field.value ? String(field.value) : ""}
                          onValueChange={val => field.onChange(val ? Number(val) : undefined)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih area layanan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {areas.map(area => (
                              <SelectItem key={area.id} value={String(area.id)}>
                                {area.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={productForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={productForm.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Gambar</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Customization Options */}
                <Separator />
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Opsi Kustomisasi</h3>

                  <div className="mb-6">
                    <h3 className="font-bold text-lg mb-2">Opsi Kustomisasi</h3>
                    <button type="button" className="mb-2 px-3 py-1 bg-blue-100 rounded text-blue-700" onClick={addCustomizationType}>
                      + Tambah Opsi Kustomisasi
                    </button>
                    {customizationOptions.map((opt, idx) => (
                      <div key={idx} className="border rounded p-3 mb-3 bg-gray-50">
                        <div className="flex items-center mb-2">
                          <input
                            className="border px-2 py-1 rounded mr-2"
                            placeholder="Jenis Opsi (misal: Lauk, Topping, Level)"
                            value={opt.type}
                            onChange={e => updateCustomizationType(idx, e.target.value)}
                          />
                          <button type="button" className="ml-2 text-red-500" onClick={() => removeCustomizationType(idx)}>
                            Hapus
                          </button>
                        </div>
                        {opt.options.map((option: any, optIdx: number) => (
                          <div key={optIdx} className="flex items-center mb-1">
                            <input
                              className="border px-2 py-1 rounded mr-2"
                              placeholder="Nama Pilihan"
                              value={option.name}
                              onChange={e => updateOption(idx, optIdx, "name", e.target.value)}
                            />
                            <input
                              className="border px-2 py-1 rounded mr-2 w-24"
                              type="number"
                              placeholder="Harga"
                              value={option.harga}
                              onChange={e => updateOption(idx, optIdx, "harga", e.target.value)}
                            />
                            <button type="button" className="text-red-400" onClick={() => removeOption(idx, optIdx)}>
                              Hapus
                            </button>
                          </div>
                        ))}
                        <button type="button" className="mt-1 px-2 py-1 bg-gray-200 rounded text-sm" onClick={() => addOption(idx)}>
                          + Tambah Pilihan
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <Button type="submit" disabled={createProductMutation.isPending || updateProductMutation.isPending}>
                    {editingProduct ? "Perbarui" : "Tambah"} Produk
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsProductModalOpen(false)}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* User Modal */}
        <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
              </DialogTitle>
            </DialogHeader>

            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
                <FormField
                  control={userForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password {editingUser && "(kosongkan jika tidak ingin mengubah)"}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telepon</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2 pt-4">
                  <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                    {editingUser ? "Perbarui" : "Tambah"} Pengguna
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUserModalOpen(false)}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Order Details Modal */}
        {viewingOrder && (
          <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
            <DialogContent className="max-w-2xl p-0 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 pb-2 border-b">
                <h2 className="text-2xl font-bold">Detail Pesanan <span className="font-mono">{viewingOrder.code}</span></h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => generateInvoice(viewingOrder)}>
                    Cetak Invoice
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportOrderDetails(viewingOrder)}>
                    Export Detail
                  </Button>
                </div>
              </div>

              {/* Info utama */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-gray-50 rounded-lg shadow mb-6">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Kode Pesanan</div>
                  <div className="font-mono font-bold text-lg">{viewingOrder.code}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500">Status</div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                    {viewingOrder.status === 'completed' ? 'Selesai' :
                      viewingOrder.status === 'pending' ? 'Menunggu' :
                        viewingOrder.status === 'processing' ? 'Diproses' :
                          viewingOrder.status === 'shipped' ? 'Dikirim' : 'Dibatalkan'}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Tanggal Pesanan</div>
                  <div>{viewingOrder.createdAt ? new Date(viewingOrder.createdAt).toLocaleString('id-ID') : '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Tanggal Pengiriman</div>
                  <div>{viewingOrder.deliveryDate} {viewingOrder.deliveryTime}</div>
                </div>
              </div>

              {/* Info Pelanggan */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="text-xs font-bold text-gray-600 uppercase mb-2">Informasi Pelanggan</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Nama</div>
                    <div className="font-medium">{viewingOrder.customerName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Telepon</div>
                    <div className="font-medium">{viewingOrder.customerPhone}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500">Alamat Pengiriman</div>
                  <div>{viewingOrder.customerAddress}</div>
                </div>
              </div>

              {/* Rincian Pesanan */}
              <div className="bg-gray-50 rounded-lg shadow p-6 mb-6">
                <div className="text-xs font-bold text-gray-600 uppercase mb-2">Rincian Pesanan</div>
                <OrderItemsList orderId={viewingOrder.id} emptyComponent={
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Box className="w-10 h-10 mb-2" />
                    <span>Tidak ada item dalam pesanan ini</span>
                  </div>
                } />
              </div>

              {/* Ringkasan Pembayaran */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-xs font-bold text-gray-600 uppercase mb-2">Ringkasan Pembayaran</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Metode Pembayaran</span>
                    <span>{viewingOrder.paymentMethod?.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp {Number(viewingOrder.subtotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ongkos Kirim</span>
                    <span>Rp {Number(viewingOrder.deliveryFee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Fee</span>
                    <span>Rp {Number(viewingOrder.serviceFee || 0).toLocaleString()}</span>
                  </div>
                  {viewingOrder.discount && Number(viewingOrder.discount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Diskon</span>
                      <span>- Rp {Number(viewingOrder.discount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">Rp {Number(viewingOrder.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Category Modal */}
        <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
              <DialogDescription>
                {editingCategory ? "Ubah detail kategori." : "Buat kategori baru untuk produk Anda."}
              </DialogDescription>
            </DialogHeader>
            <Form {...categoryForm}>
              <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
                <FormField
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Kategori</FormLabel>
                      <FormControl>
                        <Input placeholder="cth. Nasi Kotak" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                  {createCategoryMutation.isPending || updateCategoryMutation.isPending
                    ? "Menyimpan..."
                    : editingCategory
                      ? "Simpan Perubahan"
                      : "Simpan Kategori"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Helper component for settings sections
function SettingsSection({ title, description, children }: { title: string, description: string, children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="pt-2">{children}</div>
    </div>
  )
}

const AREA_OPTIONS = [
  "Jakarta", "Depok", "Bogor", "Tangerang", "Bekasi"
];