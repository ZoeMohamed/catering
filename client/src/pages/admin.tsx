import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
  Plus,
  Edit,
  Trash2,
  Shield,
  Eye,
  Download,
  TrendingUp,
  Calendar,
  DollarSign
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, insertUserSchema, insertPromoSchema } from "@shared/schema";
import type { Product, User, Order, Category, InsertProduct, InsertUser, Promo, InsertPromo } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PromoForm } from "@/components/promo-form";

// Daftar area yang tersedia
const AREA_OPTIONS = [
  "Jakarta", "Depok", "Bogor", "Tangerang", "Bekasi"
];

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [customizationOptions, setCustomizationOptions] = useState({
    rice: [{ name: "", price: 0 }],
    mainDish: [{ name: "", description: "", price: 0 }],
    vegetable: [{ name: "", description: "", price: 0 }],
    extras: [{ name: "", price: 0 }]
  });

  // Redirect if not admin
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
              <Link href="/">
                <Button>Go to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch data
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: promos = [], isLoading: promosLoading } = useQuery<Promo[]>({
    queryKey: ["/api/promos"],
    queryFn: async () => (await apiRequest("GET", "/api/promos")).json().then(d => d.promos || []),
  });

  // Product form
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
      badge: "",
    },
  });

  // User form
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

  // Promo form
  const promoForm = useForm<InsertPromo>({
    resolver: zodResolver(insertPromoSchema),
    defaultValues: {
      title: "",
      code: "",
      description: "",
      discountType: "percent",
      discountValue: "0",
      startDate: "",
      endDate: "",
      isActive: true
    },
  });

  // Product mutations
  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const response = await apiRequest("POST", "/api/products", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Berhasil", description: "Produk berhasil ditambahkan" });
      setIsProductModalOpen(false);
      productForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menambahkan produk", variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertProduct> }) => {
      const response = await apiRequest("PUT", `/api/products/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Berhasil", description: "Produk berhasil diperbarui" });
      setIsProductModalOpen(false);
      setEditingProduct(null);
      productForm.reset();
    },
    onError: () => {
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

  // Helper functions
  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      productForm.reset({
        name: product.name,
        slug: product.slug,
        description: product.description || "",
        price: product.price,
        originalPrice: product.originalPrice || "",
        image: product.image || "",
        categoryId: product.categoryId,
        badge: product.badge || "",
      });

      // Load existing customization options
      if (product.customizationOptions) {
        setCustomizationOptions(product.customizationOptions);
      } else {
        setCustomizationOptions({
          rice: [{ name: "", price: 0 }],
          mainDish: [{ name: "", description: "", price: 0 }],
          vegetable: [{ name: "", description: "", price: 0 }],
          extras: [{ name: "", price: 0 }]
        });
      }
    } else {
      setEditingProduct(null);
      productForm.reset();
      setCustomizationOptions({
        rice: [{ name: "", price: 0 }],
        mainDish: [{ name: "", description: "", price: 0 }],
        vegetable: [{ name: "", description: "", price: 0 }],
        extras: [{ name: "", price: 0 }]
      });
    }
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = (data: InsertProduct) => {
    const productData = {
      ...data,
      customizationOptions
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Analytics calculations
  const stats = {
    totalProducts: products.length,
    totalUsers: users.filter(u => u.role === "customer").length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.total || "0"), 0),
    completedOrders: orders.filter(o => o.status === "completed").length,
    pendingOrders: orders.filter(o => o.status === "pending").length,
    monthlyRevenue: orders
      .filter(o => new Date(o.createdAt!).getMonth() === new Date().getMonth())
      .reduce((sum, order) => sum + parseFloat(order.total || "0"), 0),
    topProducts: products
      .sort((a, b) => parseInt(b.ratingCount?.toString() || "0") - parseInt(a.ratingCount?.toString() || "0"))
      .slice(0, 5),
  };

  const openPromoModal = (promo?: Promo) => {
    setEditingPromo(promo || null);
    setIsPromoModalOpen(true);
  };

  const handlePromoSubmit = (data: InsertPromo) => {
    if (editingPromo) {
      updatePromoMutation.mutate({ id: editingPromo.id, data });
    } else {
      createPromoMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 className="text-xl font-bold text-primary">CateringKu</h1>
              </Link>
              <Badge variant="secondary">Admin Dashboard</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-medium">{user.name || user.username}</span>
              </div>
              <Link href="/">
                <Button variant="outline" size="sm">
                  Back to Store
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Produk aktif</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Pelanggan terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders} pending, {stats.completedOrders} selesai
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {stats.totalRevenue.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground">
                Bulan ini: Rp {stats.monthlyRevenue.toLocaleString("id-ID")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Produk Terpopuler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.ratingCount} pesanan
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        Rp {parseFloat(product.price).toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ⭐ {product.rating}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Ringkasan Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pesanan Baru</span>
                  <Badge variant="outline">{stats.pendingOrders}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pesanan Selesai</span>
                  <Badge variant="default">{stats.completedOrders}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Produk Aktif</span>
                  <Badge variant="secondary">{stats.totalProducts}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rating Rata-rata</span>
                  <Badge variant="outline">
                    ⭐ {(products.reduce((sum, p) => sum + parseFloat(p.rating || "0"), 0) / products.length || 0).toFixed(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="w-full flex overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <TabsTrigger value="products" className="min-w-[120px]">Products</TabsTrigger>
            <TabsTrigger value="orders" className="min-w-[120px]">Orders</TabsTrigger>
            <TabsTrigger value="users" className="min-w-[120px]">Users</TabsTrigger>
            <TabsTrigger value="promos" className="min-w-[120px]">Promos</TabsTrigger>
            <TabsTrigger value="settings" className="min-w-[120px]">Settings</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Manajemen Produk</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => exportToCSV(products.map(p => ({
                        id: p.id,
                        nama: p.name,
                        kategori: categories.find(c => c.id === p.categoryId)?.name || '',
                        harga: p.price,
                        rating: p.rating,
                        jumlah_ulasan: p.ratingCount,
                        status: p.isActive ? 'Aktif' : 'Nonaktif'
                      })), 'produk-catering.csv')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button onClick={() => openProductModal()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Produk
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="text-center py-4">Memuat produk...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gambar</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <img
                              src={product.image || "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=80"}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.badge && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {product.badge}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {categories.find(c => c.id === product.categoryId)?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">Rp {parseFloat(product.price).toLocaleString("id-ID")}</p>
                              {product.originalPrice && (
                                <p className="text-xs text-gray-500 line-through">
                                  Rp {parseFloat(product.originalPrice).toLocaleString("id-ID")}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <span>⭐</span>
                              <span>{product.rating}</span>
                              <span className="text-gray-500">({product.ratingCount})</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.isActive ? "default" : "secondary"}>
                              {product.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openProductModal(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin menghapus produk "${product.name}"?`)) {
                                    deleteProductMutation.mutate(product.id);
                                  }
                                }}
                                disabled={deleteProductMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
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
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Manajemen Pesanan</CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => exportToCSV(orders.map(o => ({
                      kode_pesanan: o.code,
                      pelanggan: o.customerName,
                      telepon: o.customerPhone,
                      alamat: o.customerAddress,
                      tanggal_kirim: o.deliveryDate,
                      waktu_kirim: o.deliveryTime,
                      total: o.total,
                      status: o.status,
                      metode_bayar: o.paymentMethod,
                      tanggal_pesan: new Date(o.createdAt!).toLocaleDateString("id-ID")
                    })), 'pesanan-catering.csv')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-4">Memuat pesanan...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Belum ada pesanan
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode Pesanan</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pengiriman</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono">{order.code}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-sm text-gray-500">{order.customerPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">Rp {parseFloat(order.total).toLocaleString("id-ID")}</p>
                              <p className="text-xs text-gray-500">{order.paymentMethod.toUpperCase()}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(newStatus) =>
                                updateOrderStatusMutation.mutate({ id: order.id, status: newStatus })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                                <SelectItem value="preparing">Diproses</SelectItem>
                                <SelectItem value="delivering">Dikirim</SelectItem>
                                <SelectItem value="completed">Selesai</SelectItem>
                                <SelectItem value="cancelled">Dibatalkan</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{order.deliveryDate}</p>
                              <p className="text-xs text-gray-500">{order.deliveryTime}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(order.createdAt!).toLocaleDateString("id-ID")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingOrder(order)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Users Management</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-4">Loading users...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.name || "-"}</TableCell>
                          <TableCell>{user.email || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt!).toLocaleDateString("id-ID")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Promos Tab */}
          <TabsContent value="promos" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Manajemen Promo</CardTitle>
                  <Button onClick={() => openPromoModal()}>
                    <Plus className="h-4 w-4 mr-2" />Tambah Promo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {promosLoading ? (
                  <div className="text-center py-4">Memuat promo...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Judul</TableHead>
                        <TableHead>Kode</TableHead>
                        <TableHead>Diskon</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promos.map((promo) => (
                        <TableRow key={promo.id}>
                          <TableCell>{promo.title}</TableCell>
                          <TableCell><Badge variant="outline">{promo.code}</Badge></TableCell>
                          <TableCell>
                            {promo.discountType === "percent"
                              ? `${promo.discountValue}%`
                              : `Rp ${parseFloat(promo.discountValue.toString()).toLocaleString("id-ID")}`
                            }
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{new Date(promo.startDate).toLocaleDateString("id-ID")}</div>
                              <div className="text-gray-500">s/d</div>
                              <div>{new Date(promo.endDate).toLocaleDateString("id-ID")}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={promo.isActive ? "default" : "secondary"}>
                              {promo.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" onClick={() => openPromoModal(promo)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => { if (confirm(`Hapus promo '${promo.title}'?`)) deletePromoMutation.mutate(promo.id); }} disabled={deletePromoMutation.isPending}>
                                <Trash2 className="h-4 w-4" />
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
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Application Settings</h3>
                    <p className="text-gray-600">Manage your catering application settings here.</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      General Settings
                    </Button>
                    <Button variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      Delivery Areas
                    </Button>
                    <Button variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={productForm.handleSubmit(handleProductSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nama Produk</Label>
                <Input
                  id="name"
                  placeholder="Masukkan nama produk"
                  {...productForm.register("name")}
                />
                {productForm.formState.errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {productForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="nama-produk"
                  {...productForm.register("slug")}
                />
                {productForm.formState.errors.slug && (
                  <p className="text-sm text-red-500 mt-1">
                    {productForm.formState.errors.slug.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi produk"
                {...productForm.register("description")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Harga</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="25000"
                  {...productForm.register("price")}
                />
                {productForm.formState.errors.price && (
                  <p className="text-sm text-red-500 mt-1">
                    {productForm.formState.errors.price.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="originalPrice">Harga Asli (Opsional)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  placeholder="35000"
                  {...productForm.register("originalPrice")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoryId">Kategori</Label>
                <Select
                  value={productForm.watch("categoryId")?.toString()}
                  onValueChange={(value) => productForm.setValue("categoryId", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="badge">Badge (Opsional)</Label>
                <Input
                  id="badge"
                  placeholder="POPULER, PROMO, BARU"
                  {...productForm.register("badge")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="image">URL Gambar</Label>
              <Input
                id="image"
                placeholder="https://example.com/image.jpg"
                {...productForm.register("image")}
              />
            </div>

            <FormField
              control={productForm.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area Layanan</FormLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih area" />
                    </SelectTrigger>
                    <SelectContent>
                      {AREA_OPTIONS.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Customization Options Editor */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Opsi Kustomisasi</h3>

              {/* Rice Options */}
              <div>
                <Label>Opsi Nasi</Label>
                <div className="space-y-2 mt-2">
                  {customizationOptions.rice.map((rice, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Nama nasi"
                        value={rice.name}
                        onChange={(e) => {
                          const newRice = [...customizationOptions.rice];
                          newRice[index].name = e.target.value;
                          setCustomizationOptions({ ...customizationOptions, rice: newRice });
                        }}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Harga"
                        value={rice.price}
                        onChange={(e) => {
                          const newRice = [...customizationOptions.rice];
                          newRice[index].price = parseInt(e.target.value) || 0;
                          setCustomizationOptions({ ...customizationOptions, rice: newRice });
                        }}
                        className="w-24"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRice = customizationOptions.rice.filter((_, i) => i !== index);
                          setCustomizationOptions({ ...customizationOptions, rice: newRice });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomizationOptions({
                        ...customizationOptions,
                        rice: [...customizationOptions.rice, { name: "", price: 0 }]
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah Opsi Nasi
                  </Button>
                </div>
              </div>

              {/* Main Dish Options */}
              <div>
                <Label>Opsi Lauk Utama</Label>
                <div className="space-y-2 mt-2">
                  {customizationOptions.mainDish.map((dish, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Nama lauk"
                          value={dish.name}
                          onChange={(e) => {
                            const newDish = [...customizationOptions.mainDish];
                            newDish[index].name = e.target.value;
                            setCustomizationOptions({ ...customizationOptions, mainDish: newDish });
                          }}
                        />
                        <Input
                          placeholder="Deskripsi"
                          value={dish.description}
                          onChange={(e) => {
                            const newDish = [...customizationOptions.mainDish];
                            newDish[index].description = e.target.value;
                            setCustomizationOptions({ ...customizationOptions, mainDish: newDish });
                          }}
                        />
                      </div>
                      <Input
                        type="number"
                        placeholder="Harga"
                        value={dish.price}
                        onChange={(e) => {
                          const newDish = [...customizationOptions.mainDish];
                          newDish[index].price = parseInt(e.target.value) || 0;
                          setCustomizationOptions({ ...customizationOptions, mainDish: newDish });
                        }}
                        className="w-24"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newDish = customizationOptions.mainDish.filter((_, i) => i !== index);
                          setCustomizationOptions({ ...customizationOptions, mainDish: newDish });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomizationOptions({
                        ...customizationOptions,
                        mainDish: [...customizationOptions.mainDish, { name: "", description: "", price: 0 }]
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah Opsi Lauk
                  </Button>
                </div>
              </div>

              {/* Vegetable Options */}
              <div>
                <Label>Opsi Sayuran</Label>
                <div className="space-y-2 mt-2">
                  {customizationOptions.vegetable.map((veg, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Nama sayuran"
                          value={veg.name}
                          onChange={(e) => {
                            const newVeg = [...customizationOptions.vegetable];
                            newVeg[index].name = e.target.value;
                            setCustomizationOptions({ ...customizationOptions, vegetable: newVeg });
                          }}
                        />
                        <Input
                          placeholder="Deskripsi"
                          value={veg.description}
                          onChange={(e) => {
                            const newVeg = [...customizationOptions.vegetable];
                            newVeg[index].description = e.target.value;
                            setCustomizationOptions({ ...customizationOptions, vegetable: newVeg });
                          }}
                        />
                      </div>
                      <Input
                        type="number"
                        placeholder="Harga"
                        value={veg.price}
                        onChange={(e) => {
                          const newVeg = [...customizationOptions.vegetable];
                          newVeg[index].price = parseInt(e.target.value) || 0;
                          setCustomizationOptions({ ...customizationOptions, vegetable: newVeg });
                        }}
                        className="w-24"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newVeg = customizationOptions.vegetable.filter((_, i) => i !== index);
                          setCustomizationOptions({ ...customizationOptions, vegetable: newVeg });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomizationOptions({
                        ...customizationOptions,
                        vegetable: [...customizationOptions.vegetable, { name: "", description: "", price: 0 }]
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah Opsi Sayuran
                  </Button>
                </div>
              </div>

              {/* Extras Options */}
              <div>
                <Label>Opsi Tambahan</Label>
                <div className="space-y-2 mt-2">
                  {customizationOptions.extras.map((extra, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Nama tambahan"
                        value={extra.name}
                        onChange={(e) => {
                          const newExtras = [...customizationOptions.extras];
                          newExtras[index].name = e.target.value;
                          setCustomizationOptions({ ...customizationOptions, extras: newExtras });
                        }}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Harga"
                        value={extra.price}
                        onChange={(e) => {
                          const newExtras = [...customizationOptions.extras];
                          newExtras[index].price = parseInt(e.target.value) || 0;
                          setCustomizationOptions({ ...customizationOptions, extras: newExtras });
                        }}
                        className="w-24"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newExtras = customizationOptions.extras.filter((_, i) => i !== index);
                          setCustomizationOptions({ ...customizationOptions, extras: newExtras });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomizationOptions({
                        ...customizationOptions,
                        extras: [...customizationOptions.extras, { name: "", price: 0 }]
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah Opsi Tambahan
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProductModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
              >
                {createProductMutation.isPending || updateProductMutation.isPending
                  ? "Menyimpan..."
                  : editingProduct
                    ? "Perbarui Produk"
                    : "Tambah Produk"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Details Modal */}
      <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detail Pesanan {viewingOrder?.code}</DialogTitle>
          </DialogHeader>

          {viewingOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Informasi Pelanggan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label>Nama</Label>
                      <p className="font-medium">{viewingOrder.customerName}</p>
                    </div>
                    <div>
                      <Label>Telepon</Label>
                      <p className="font-medium">{viewingOrder.customerPhone}</p>
                    </div>
                    <div>
                      <Label>Alamat</Label>
                      <p className="font-medium">{viewingOrder.customerAddress}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Informasi Pengiriman</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label>Tanggal Kirim</Label>
                      <p className="font-medium">{viewingOrder.deliveryDate}</p>
                    </div>
                    <div>
                      <Label>Waktu Kirim</Label>
                      <p className="font-medium">{viewingOrder.deliveryTime}</p>
                    </div>
                    <div>
                      <Label>Metode Pembayaran</Label>
                      <Badge variant="outline" className="mt-1">
                        {viewingOrder.paymentMethod.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Ringkasan Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>Rp {parseFloat(viewingOrder.subtotal).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ongkos Kirim</span>
                      <span>Rp {parseFloat(viewingOrder.deliveryFee).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Biaya Layanan</span>
                      <span>Rp {parseFloat(viewingOrder.serviceFee).toLocaleString("id-ID")}</span>
                    </div>
                    {parseFloat(viewingOrder.discount || "0") > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Diskon</span>
                        <span>-Rp {parseFloat(viewingOrder.discount || "0").toLocaleString("id-ID")}</span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">Rp {parseFloat(viewingOrder.total).toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Metode Pembayaran</span>
                      <span>{viewingOrder.paymentMethod.toUpperCase()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between items-center">
                <div>
                  <Label>Status Pesanan</Label>
                  <Select
                    value={viewingOrder.status}
                    onValueChange={(newStatus) => {
                      updateOrderStatusMutation.mutate({ id: viewingOrder.id, status: newStatus });
                      setViewingOrder({ ...viewingOrder, status: newStatus });
                    }}
                  >
                    <SelectTrigger className="w-48 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                      <SelectItem value="preparing">Diproses</SelectItem>
                      <SelectItem value="delivering">Dikirim</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                      <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => setViewingOrder(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Promo Modal */}
      <Dialog open={isPromoModalOpen} onOpenChange={setIsPromoModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPromo ? "Edit Promo" : "Tambah Promo Baru"}</DialogTitle>
          </DialogHeader>
          <PromoForm
            promo={editingPromo}
            onSubmit={handlePromoSubmit}
            onCancel={() => setIsPromoModalOpen(false)}
            isPending={createPromoMutation.isPending || updatePromoMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
