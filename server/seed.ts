import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, categories, products, promos, orders, orderItems, areas, siteSettings } from "@shared/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}
const db = drizzle(postgres(connectionString), { schema: { users, categories, products, promos, orders, orderItems, areas, siteSettings } });

async function seed() {
  console.log("Seeding database...");

  // Clear existing data and reset IDs
  console.log("Resetting database...");
  await db.execute(`TRUNCATE TABLE "order_items", "orders", "promos", "products", "categories", "users", "areas", "site_settings" RESTART IDENTITY CASCADE;`);

  // Seed site settings
  console.log("Seeding site settings...");
  await db.insert(siteSettings).values({
    id: 1,
    siteName: "CateringAja",
    title: "CateringAja - Pesan Katering Online",
    logoUrl: "https://drive.google.com/thumbnail?id=1WARPJJesOC6iKmJtGABEQFBzF0nl1HDn",
    faviconUrl: "https://drive.google.com/thumbnail?id=1WARPJJesOC6iKmJtGABEQFBzF0nl1HDn",
    promoBannerEnabled: true,
    promoBannerText: "Promo spesial hari ini! Gratis ongkir untuk pemesanan di atas Rp 100.000",
    companyName: "PT Katering Nusantara",
    companyPhone: "0812-3456-7890",
    companyAddress: "Jl. Jenderal Sudirman No. 123, Jakarta",
  });

  // Seed users
  console.log("Seeding users...");
  await db.insert(users).values([
    {
      id: 1,
      username: "admin",
      password: "admin", // In a real app, hash this!
      name: "Admin User",
      role: "admin",
    },
  ]);

  // Seed categories
  console.log("Seeding categories...");
  await db.insert(categories).values([
    { id: 1, name: "Catering Box", slug: "catering-box" },
    { id: 2, name: "Nasi Kotak", slug: "nasi-kotak" },
    { id: 3, name: "Paket Keluarga", slug: "paket-keluarga" },
    { id: 4, name: "Menu Spesial", slug: "menu-spesial" },
  ]);

  // Seed areas
  console.log("Seeding areas...");
  const areaData = [
    { name: "Jakarta", slug: "jakarta" },
    { name: "Depok", slug: "depok" },
    { name: "Bogor", slug: "bogor" },
    { name: "Tangerang", slug: "tangerang" },
    { name: "Bekasi", slug: "bekasi" },
  ];
  const insertedAreas = await db.insert(areas).values(areaData).returning();

  // Helper to get areaId by name
  const getAreaId = (name: string) => insertedAreas.find(a => a.name === name)?.id;

  // Seed products
  console.log("Seeding products...");
  await db.insert(products).values([
    {
      name: "Catering Gen-Z",
      slug: "catering-gen-z",
      description: "Paket catering modern untuk generasi Z.",
      price: "25000.00",
      originalPrice: "30000.00",
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500",
      categoryId: 1,
      minOrderQty: 1,
      areaId: getAreaId("Jakarta"),
    },
    {
      name: "Nasi Box Ekonomis",
      slug: "nasi-box-ekonomis",
      description: "Nasi kotak lengkap dengan lauk pauk pilihan, harga terjangkau.",
      price: "15000.00",
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500",
      categoryId: 2,
      minOrderQty: 22,
      areaId: getAreaId("Bekasi"),
    },
    {
      name: "Paket Keluarga Besar",
      slug: "paket-keluarga-besar",
      description: "Porsi besar untuk dinikmati bersama keluarga di rumah.",
      price: "180000.00",
      originalPrice: "200000.00",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500",
      categoryId: 3,
      minOrderQty: 1,
      areaId: getAreaId("Bogor"),
    },
    {
      name: "Menu Spesial Tradisional",
      slug: "menu-spesial-tradisional",
      description: "Cita rasa masakan tradisional yang otentik dan menggugah selera.",
      price: "35000.00",
      image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500",
      categoryId: 4,
      minOrderQty: 1,
      areaId: getAreaId("Depok"),
    },
  ]);

  // Seed promos
  console.log("Seeding promos...");

  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const promosToSeed = [
    {
      title: "Diskon Kilat Hari Ini!",
      description: "Dapatkan diskon 15% untuk semua produk, hanya berlaku hari ini.",
      code: "FLASH15",
      discountType: "percent",
      discountValue: "15.00",
      startDate: formatDate(today),
      endDate: formatDate(today),
      isActive: true,
    },
    {
      title: "Promo Gajian (Aktif)",
      description: "Nikmati potongan Rp 25.000 untuk minimal belanja Rp 150.000. Berlaku seminggu!",
      code: "GAJIAN25K",
      discountType: "amount",
      discountValue: "25000.00",
      startDate: formatDate(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)), // 3 hari lalu
      endDate: formatDate(new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)), // 4 hari lagi
      isActive: true,
    },
    {
      title: "Promo Akhir Bulan (Akan Datang)",
      description: "Promo spesial akhir bulan akan segera hadir!",
      code: "AKHIRBULAN",
      discountType: "percent",
      discountValue: "10.00",
      startDate: formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)), // lusa
      endDate: formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)), // minggu depan
      isActive: true,
    },
    {
      title: "Promo Minggu Lalu (Expired)",
      description: "Promo ini sudah berakhir.",
      code: "EXPIRED123",
      discountType: "amount",
      discountValue: "10000.00",
      startDate: formatDate(new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000)), // 10 hari lalu
      endDate: formatDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)), // 2 hari lalu
      isActive: true,
    },
    {
      title: "Promo Non-Aktif",
      description: "Promo ini sengaja dinonaktifkan untuk testing.",
      code: "NONAKTIF",
      discountType: "percent",
      discountValue: "5.00",
      startDate: formatDate(today),
      endDate: formatDate(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)),
      isActive: false,
    }
  ];

  await db.insert(promos).values(promosToSeed);

  console.log("Database seeded successfully!");
}

seed().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});