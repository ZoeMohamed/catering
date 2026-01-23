import type {
  Area,
  Category,
  Order,
  OrderItem,
  Product,
  Promo,
  SiteSettings,
  User,
} from "@shared/schema";

export const isStaticMode = import.meta.env.VITE_STATIC_MODE === "true";

export const mockCategories: Category[] = [
  { id: 1, name: "Catering Box", slug: "catering-box", isActive: true },
  { id: 2, name: "Nasi Kotak", slug: "nasi-kotak", isActive: true },
  { id: 3, name: "Paket Keluarga", slug: "paket-keluarga", isActive: true },
  { id: 4, name: "Menu Spesial", slug: "menu-spesial", isActive: true },
];

export const mockAreas: Area[] = [
  {
    id: 1,
    name: "Jakarta",
    slug: "jakarta",
    isActive: true,
    createdAt: new Date(),
    deliveryFee: "5000.00",
    serviceFee: "2000.00",
  },
  {
    id: 2,
    name: "Depok",
    slug: "depok",
    isActive: true,
    createdAt: new Date(),
    deliveryFee: "7000.00",
    serviceFee: "2000.00",
  },
  {
    id: 3,
    name: "Bogor",
    slug: "bogor",
    isActive: true,
    createdAt: new Date(),
    deliveryFee: "8000.00",
    serviceFee: "2000.00",
  },
  {
    id: 4,
    name: "Tangerang",
    slug: "tangerang",
    isActive: true,
    createdAt: new Date(),
    deliveryFee: "6000.00",
    serviceFee: "2000.00",
  },
  {
    id: 5,
    name: "Bekasi",
    slug: "bekasi",
    isActive: true,
    createdAt: new Date(),
    deliveryFee: "6500.00",
    serviceFee: "2000.00",
  },
];

export const mockProducts: Product[] = [
  {
    id: 1,
    name: "Catering Gen-Z",
    slug: "catering-gen-z",
    description: "Paket catering modern untuk generasi Z.",
    price: "25000.00",
    originalPrice: "30000.00",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500",
    categoryId: 1,
    areaId: 1,
    rating: "4.8",
    ratingCount: 128,
    isActive: true,
    isFeatured: true,
    badge: "PROMO",
    customizationOptions: [
      {
        type: "Nasi",
        options: [
          { name: "Nasi Putih", harga: 0 },
          { name: "Nasi Merah", harga: 2000 },
        ],
      },
      {
        type: "Lauk Utama",
        options: [
          { name: "Ayam Bakar", harga: 0 },
          { name: "Ayam Goreng", harga: 0 },
          { name: "Ikan Fillet", harga: 4000 },
        ],
      },
      {
        type: "Ekstra",
        options: [
          { name: "Sambal", harga: 0 },
          { name: "Kerupuk", harga: 1000 },
        ],
      },
    ],
    minOrderQty: 1,
    createdAt: new Date(),
  },
  {
    id: 2,
    name: "Nasi Box Ekonomis",
    slug: "nasi-box-ekonomis",
    description: "Nasi kotak lengkap dengan lauk pauk pilihan.",
    price: "15000.00",
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500",
    categoryId: 2,
    areaId: 5,
    rating: "4.5",
    ratingCount: 86,
    isActive: true,
    isFeatured: false,
    badge: "POPULER",
    customizationOptions: [],
    minOrderQty: 20,
    createdAt: new Date(),
  },
  {
    id: 3,
    name: "Paket Keluarga Besar",
    slug: "paket-keluarga-besar",
    description: "Porsi besar untuk dinikmati bersama keluarga.",
    price: "180000.00",
    originalPrice: "200000.00",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500",
    categoryId: 3,
    areaId: 3,
    rating: "4.7",
    ratingCount: 54,
    isActive: true,
    isFeatured: true,
    badge: "BARU",
    customizationOptions: [],
    minOrderQty: 1,
    createdAt: new Date(),
  },
  {
    id: 4,
    name: "Menu Spesial Tradisional",
    slug: "menu-spesial-tradisional",
    description: "Cita rasa tradisional yang autentik.",
    price: "35000.00",
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500",
    categoryId: 4,
    areaId: 2,
    rating: "4.6",
    ratingCount: 41,
    isActive: true,
    isFeatured: false,
    badge: "HALAL",
    customizationOptions: [],
    minOrderQty: 1,
    createdAt: new Date(),
  },
  {
    id: 5,
    name: "Catering Sehat Harian",
    slug: "catering-sehat-harian",
    description: "Paket makan sehat dengan porsi seimbang.",
    price: "28000.00",
    originalPrice: "32000.00",
    image: "https://images.unsplash.com/photo-1546069901-eacef0df6022?w=500",
    categoryId: 1,
    areaId: 4,
    rating: "4.4",
    ratingCount: 63,
    isActive: true,
    isFeatured: false,
    badge: "PROMO",
    customizationOptions: [],
    minOrderQty: 5,
    createdAt: new Date(),
  },
  {
    id: 6,
    name: "Nasi Kotak Spesial",
    slug: "nasi-kotak-spesial",
    description: "Nasi kotak premium untuk acara formal.",
    price: "32000.00",
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500",
    categoryId: 2,
    areaId: 1,
    rating: "4.9",
    ratingCount: 102,
    isActive: true,
    isFeatured: true,
    badge: "POPULER",
    customizationOptions: [],
    minOrderQty: 10,
    createdAt: new Date(),
  },
  {
    id: 7,
    name: "Paket Arisan",
    slug: "paket-arisan",
    description: "Paket hemat untuk kumpul keluarga.",
    price: "120000.00",
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500",
    categoryId: 3,
    areaId: 2,
    rating: "4.3",
    ratingCount: 33,
    isActive: true,
    isFeatured: false,
    badge: null,
    customizationOptions: [],
    minOrderQty: 1,
    createdAt: new Date(),
  },
  {
    id: 8,
    name: "Menu Spesial Pedas",
    slug: "menu-spesial-pedas",
    description: "Menu pedas favorit pecinta sambal.",
    price: "30000.00",
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500",
    categoryId: 4,
    areaId: 5,
    rating: "4.5",
    ratingCount: 47,
    isActive: true,
    isFeatured: false,
    badge: "PEDAS",
    customizationOptions: [],
    minOrderQty: 1,
    createdAt: new Date(),
  },
];

export const mockPromos: Promo[] = [
  {
    id: 1,
    title: "Diskon Kilat Hari Ini!",
    description: "Diskon 15% untuk semua produk.",
    code: "FLASH15",
    discountType: "percent",
    discountValue: "15.00",
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    id: 2,
    title: "Promo Gajian",
    description: "Potongan Rp 25.000 untuk min belanja Rp 150.000.",
    code: "GAJIAN25K",
    discountType: "amount",
    discountValue: "25000.00",
    startDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
];

export const mockSettings: SiteSettings = {
  id: 1,
  siteName: "Catering Aja",
  title: "Catering Aja - Demo View",
  logoUrl: null,
  faviconUrl: null,
  promoBannerEnabled: true,
  promoBannerText: "Promo demo! Gratis ongkir min. Rp 100.000",
  promoBannerBackgroundColor: "#dc2626",
  promoBannerTextColor: "#ffffff",
  companyName: "PT Catering Aja",
  companyPhone: "0812-3456-7890",
  companyAddress: "Jakarta, Indonesia",
};

export const mockUsers: User[] = [
  {
    id: 1,
    username: "admin",
    password: "admin",
    role: "admin",
    name: "Admin Demo",
    email: "admin@demo.local",
    phone: "08123456789",
    createdAt: new Date(),
  },
  {
    id: 2,
    username: "user",
    password: "user",
    role: "customer",
    name: "User Demo",
    email: "user@demo.local",
    phone: "08129876543",
    createdAt: new Date(),
  },
];

type MockOrder = Order & {
  deliveryDate?: string;
  deliveryTime?: string;
};

export const mockOrders: MockOrder[] = [
  {
    id: 101,
    code: "DEMO-ORDER-001",
    userId: 1,
    customerName: "Demo User",
    customerPhone: "081234567890",
    customerAddress: "Jl. Demo No. 1, Jakarta",
    subtotal: "150000.00",
    deliveryFee: "5000.00",
    serviceFee: "2000.00",
    discount: "10000.00",
    total: "147000.00",
    paymentMethod: "cod",
    status: "confirmed",
    createdAt: new Date(),
    deliveryDate: new Date().toISOString().slice(0, 10),
    deliveryTime: "12:00-14:00",
  },
  {
    id: 102,
    code: "DEMO-ORDER-002",
    userId: 1,
    customerName: "Demo User",
    customerPhone: "081234567890",
    customerAddress: "Jl. Demo No. 1, Jakarta",
    subtotal: "90000.00",
    deliveryFee: "5000.00",
    serviceFee: "2000.00",
    discount: "0.00",
    total: "97000.00",
    paymentMethod: "transfer",
    status: "completed",
    createdAt: new Date(),
    deliveryDate: new Date().toISOString().slice(0, 10),
    deliveryTime: "18:00-20:00",
  },
];

const mockOrderItemsByOrderId: Record<number, OrderItem[]> = {
  101: [
    {
      id: 1,
      orderId: 101,
      productId: 1,
      productName: "Catering Gen-Z",
      productImage: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500",
      deliveryDate: new Date(),
      deliveryTime: "12:00-14:00",
      quantity: 5,
      price: 25000 as unknown as string,
      customization: { Nasi: "Nasi Putih", "Lauk Utama": "Ayam Bakar" },
      total: 125000 as unknown as string,
    },
  ],
  102: [
    {
      id: 2,
      orderId: 102,
      productId: 2,
      productName: "Nasi Box Ekonomis",
      productImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500",
      deliveryDate: new Date(),
      deliveryTime: "18:00-20:00",
      quantity: 6,
      price: 15000 as unknown as string,
      customization: null,
      total: 90000 as unknown as string,
    },
  ],
};

export const getMockOrderItems = (orderId: number): OrderItem[] => {
  return mockOrderItemsByOrderId[orderId] ?? [];
};

export const getMockResponse = (url: string) => {
  if (url.startsWith("/api/orders/") && url.endsWith("/items")) {
    const match = url.match(/^\/api\/orders\/(\d+)\/items/);
    if (match) {
      return getMockOrderItems(Number(match[1]));
    }
  }

  if (url.startsWith("/api/orders/my-orders")) {
    return { orders: mockOrders };
  }

  if (url.startsWith("/api/orders")) {
    return { orders: mockOrders };
  }

  if (url.startsWith("/api/products")) {
    return { products: mockProducts };
  }

  if (url.startsWith("/api/categories")) {
    return { categories: mockCategories };
  }

  if (url.startsWith("/api/areas")) {
    return { areas: mockAreas };
  }

  if (url.startsWith("/api/users")) {
    return { users: mockUsers };
  }

  if (url.startsWith("/api/promos")) {
    return { promos: mockPromos };
  }

  if (url.startsWith("/api/pengaturan")) {
    return { settings: mockSettings };
  }

  return undefined;
};
