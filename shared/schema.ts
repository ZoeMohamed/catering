import { pgTable, text, serial, integer, boolean, decimal, timestamp, json, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"), // 'admin' or 'customer'
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isActive: boolean("is_active").default(true),
});

// Areas table
export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull().default("0"),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  image: text("image"),
  categoryId: integer("category_id").notNull(),
  areaId: integer("area_id"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  ratingCount: integer("rating_count").default(0),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  badge: text("badge"), // 'POPULER', 'PROMO', 'BARU', etc.
  customizationOptions: json("customization_options").$type<any>().default([]),
  minOrderQty: integer("min_order_qty").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  userId: integer("user_id"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // 'cod', 'transfer', 'ewallet'
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  productImage: text("product_image"),
  deliveryDate: date("delivery_date").notNull(),
  deliveryTime: text("delivery_time").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  customization: json("customization").$type<{
    rice?: string;
    mainDish?: string;
    vegetable?: string;
    extras?: string[];
  }>(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

// Promos table
export const promos = pgTable("promos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(), // 'percent' | 'amount'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").default(true),
});

// Site settings table (singleton)
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(), // Should only have one row with id=1
  siteName: text("site_name").notNull().default("Catering Aja"),
  title: text("title").notNull().default("Catering Aja - Solusi Katering Anda"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  promoBannerEnabled: boolean("promo_banner_enabled").default(false),
  promoBannerText: text("promo_banner_text"),
  promoBannerBackgroundColor: text("promo_banner_bg_color").default("#dc2626"),
  promoBannerTextColor: text("promo_banner_text_color").default("#ffffff"),
  companyName: text("company_name"),
  companyPhone: text("company_phone"),
  companyAddress: text("company_address"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  phone: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
});

export const insertAreaSchema = createInsertSchema(areas).pick({
  name: true,
}).extend({
  slug: z.string().optional(),
  deliveryFee: z.string().optional(),
  serviceFee: z.string().optional(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  slug: true,
  description: true,
  price: true,
  originalPrice: true,
  image: true,
  categoryId: true,
  badge: true,
  customizationOptions: true,
  minOrderQty: true,
  areaId: true,
}).extend({
  slug: z.string().optional(),
  areaId: z.number().optional(),
  price: z.string().min(1, "Harga harus diisi").transform((val) => val === "" ? undefined : val),
  originalPrice: z.string().optional().transform((val) => val === "" ? undefined : val),
  minOrderQty: z.string().optional().transform((val) => val === "" ? undefined : val),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  code: true,
  userId: true,
  customerName: true,
  customerPhone: true,
  customerAddress: true,
  subtotal: true,
  deliveryFee: true,
  serviceFee: true,
  discount: true,
  total: true,
  paymentMethod: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  productName: true,
  productImage: true,
  deliveryDate: true,
  deliveryTime: true,
  quantity: true,
  price: true,
  customization: true,
  total: true,
});

export const insertPromoSchema = createInsertSchema(promos).pick({
  title: true,
  description: true,
  code: true,
  discountType: true,
  startDate: true,
  endDate: true,
  isActive: true,
}).extend({
  discountValue: z.string().min(1, "Nilai diskon harus diisi"),
  startDate: z.coerce.date({
    required_error: "Tanggal mulai harus diisi",
    invalid_type_error: "Format tanggal mulai tidak valid",
  }),
  endDate: z.coerce.date({
    required_error: "Tanggal berakhir harus diisi",
    invalid_type_error: "Format tanggal berakhir tidak valid",
  }),
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username required"),
  password: z.string().min(1, "Password required"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Area = typeof areas.$inferSelect;
export type InsertArea = z.infer<typeof insertAreaSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type Promo = typeof promos.$inferSelect;
export type InsertPromo = z.infer<typeof insertPromoSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;

// Cart item type for frontend
export type CartItem = {
  id: number;
  productId: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  customization: {
    rice?: string;
    mainDish?: string;
    vegetable?: string;
    extras?: string[];
  };
  total: number;
  deliveryDate: Date;
  deliveryTime: string;
};
