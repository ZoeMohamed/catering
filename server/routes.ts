import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  products,
  categories,
  orders,
  orderItems,
  loginSchema,
  insertUserSchema,
  insertProductSchema,
  insertCategorySchema,
  insertOrderSchema,
  insertOrderItemSchema,
  promos,
  insertPromoSchema,
  areas,
  insertAreaSchema,
  siteSettings,
} from "@shared/schema";

// Extend Express Request interface to include session
declare module 'express-serve-static-core' {
  interface Request {
    session?: {
      userId?: number;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Save userId to session
      req.session!.userId = user.id;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, userData.username),
      });

      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const [user] = await db.insert(users).values(userData).returning();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Check current user session
  app.get("/api/auth/me", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    if (req.session) {
      req.session.userId = undefined;
    }
    res.json({ message: "Logged out successfully" });
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    const allCategories = await db.select().from(categories);
    res.json({ categories: allCategories });
  });

  app.get("/api/categories/:id", async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid category id" });
    }
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, Number(id)),
    });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ category });
  });

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  app.post("/api/categories", async (req, res) => {
    try {
      let newCategoryData = insertCategorySchema.parse(req.body);
      if (!newCategoryData.slug || newCategoryData.slug.trim() === "") {
        newCategoryData = { ...newCategoryData, slug: generateSlug(newCategoryData.name) };
      }
      const [newCategory] = await db.insert(categories).values(newCategoryData).returning();
      res.status(201).json({ category: newCategory });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      if (error.code === '23505') return res.status(409).json({ message: "Slug must be unique." });
      res.status(500).json({ message: "Failed to create category", error });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ message: "Invalid category id" });
      }
      let updatedCategoryData = insertCategorySchema.partial().parse(req.body);
      if (updatedCategoryData.name && (!updatedCategoryData.slug || updatedCategoryData.slug.trim() === "")) {
        updatedCategoryData = { ...updatedCategoryData, slug: generateSlug(updatedCategoryData.name) };
      }
      if (Object.keys(updatedCategoryData).length === 0) return res.status(400).json({ message: "No fields to update." });
      const [updatedCategory] = await db.update(categories).set(updatedCategoryData).where(eq(categories.id, Number(id))).returning();
      if (!updatedCategory) return res.status(404).json({ message: "Category not found" });
      res.json({ category: updatedCategory });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      if (error.code === '23505') return res.status(409).json({ message: "Slug must be unique." });
      res.status(500).json({ message: "Failed to update category", error });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ message: "Invalid category id" });
      }
      const [deletedCategory] = await db.delete(categories).where(eq(categories.id, Number(id))).returning();
      if (!deletedCategory) return res.status(404).json({ message: "Category not found" });
      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete category", error });
    }
  });

  // Endpoint untuk mengambil daftar area unik dari produk
  app.get("/api/products/areas", async (req, res) => {
    try {
      console.log("[DEBUG] Fetching all products for area list...");
      const allProducts = await db.select().from(products);
      console.log("[DEBUG] Products fetched:", allProducts.length);
      const areaSet = new Set<string>();
      for (const p of allProducts) {
        if (p.area && p.area.trim() !== "") {
          areaSet.add(p.area);
        }
      }
      const areas = Array.from(areaSet).sort();
      console.log("[DEBUG] Unique areas:", areas);
      res.json({ areas });
    } catch (error) {
      console.error("[ERROR] /api/products/areas:", error);
      res.status(500).json({ message: "Failed to fetch areas", error: error.message });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    const { category, areaId } = req.query;
    let query = db.select().from(products);
    if (category && !isNaN(Number(category))) {
      query = query.where(eq(products.categoryId, Number(category)));
    }
    if (areaId && !isNaN(Number(areaId))) {
      query = query.where(eq(products.areaId, Number(areaId)));
    }
    const allProducts = await query;
    res.json({ products: allProducts });
  });

  app.get("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    const product = await db.query.products.findFirst({
      where: eq(products.id, Number(id))
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ product });
  });

  app.post("/api/products", async (req, res) => {
    try {
      let newProductData = insertProductSchema.parse(req.body);

      // Handle empty strings for numeric fields
      if (newProductData.price === "") delete newProductData.price;
      if (newProductData.originalPrice === "") delete newProductData.originalPrice;
      if (newProductData.minOrderQty === "") delete newProductData.minOrderQty;

      // If slug is empty or not provided, generate from name
      if (!newProductData.slug || newProductData.slug.trim() === "") {
        newProductData = { ...newProductData, slug: generateSlug(newProductData.name) };
      }

      // Check if slug already exists and add timestamp if needed
      const existingProduct = await db.query.products.findFirst({
        where: eq(products.slug, newProductData.slug),
      });

      if (existingProduct) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substr(2, 5);
        newProductData.slug = `${newProductData.slug}-${timestamp}-${randomStr}`;
      }

      const [newProduct] = await db.insert(products).values(newProductData).returning();
      res.status(201).json({ product: newProduct });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      if (error.code === '23505') return res.status(409).json({ message: "Slug must be unique." });
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ message: "Invalid product id" });
      }
      console.log('Received product update data:', req.body); // Debug log
      let productData = insertProductSchema.partial().parse(req.body);
      console.log('Parsed product data:', productData); // Debug log

      // Handle empty strings for numeric fields
      if (productData.price === "") delete productData.price;
      if (productData.originalPrice === "") delete productData.originalPrice;
      if (productData.minOrderQty === "") delete productData.minOrderQty;

      // If slug is being updated, check for conflicts
      if (productData.slug) {
        const existingProduct = await db.query.products.findFirst({
          where: eq(products.slug, productData.slug),
        });

        if (existingProduct && existingProduct.id !== Number(id)) {
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substr(2, 5);
          productData.slug = `${productData.slug}-${timestamp}-${randomStr}`;
        }
      }

      if (Object.keys(productData).length === 0) return res.status(400).json({ message: "No fields to update." });

      const [updatedProduct] = await db.update(products).set(productData).where(eq(products.id, Number(id))).returning();
      if (!updatedProduct) return res.status(404).json({ message: "Product not found" });
      res.json({ product: updatedProduct });
    } catch (error: any) {
      console.error('Product update error:', error); // Debug log
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      if (error.code === '23505') return res.status(409).json({ message: "Slug must be unique." });
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ message: "Invalid product id" });
      }
      const [deletedProduct] = await db.delete(products).where(eq(products.id, Number(id))).returning();
      if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    const allOrders = await db.query.orders.findMany({
      with: {
        items: true
      }
    });
    res.json({ orders: allOrders });
  });

  // New: Orders for current user
  app.get("/api/orders/my-orders", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      with: {
        items: true
      }
    });
    res.json({ orders: userOrders });
  });

  app.get("/api/orders/:id", async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid order id" });
    }
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, Number(id)),
      with: {
        items: true
      }
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ order });
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { order: orderData, items: itemsData } = req.body;

      const orderCode = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const validatedOrder = insertOrderSchema.parse({ ...orderData, code: orderCode, userId: null });

      const newOrder = await db.transaction(async (tx) => {
        const [order] = await tx.insert(orders).values(validatedOrder).returning();

        const validatedItems = itemsData.map((item: any) => insertOrderItemSchema.parse({ ...item, orderId: order.id }));
        const createdItems = await tx.insert(orderItems).values(validatedItems).returning();

        return { ...order, items: createdItems };
      });

      res.status(201).json({ order: newOrder });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to create order", error });
    }
  });

  app.post("/api/orders/batch", async (req, res) => {
    try {
      // Get userId from session (optional - can be null if not logged in)
      const userId = req.session?.userId || null;
      console.log('Session userId:', req.session?.userId); // Debug log
      console.log('Using userId:', userId); // Debug log
      const { orders: batchOrders } = req.body;
      if (!Array.isArray(batchOrders) || batchOrders.length === 0) {
        return res.status(400).json({ message: "Invalid batch order data" });
      }

      const createdOrders = await db.transaction(async (tx) => {
        const allNewOrders = [];

        for (const orderData of batchOrders) {
          const { items: itemsData, ...restOfOrderData } = orderData;
          // Ambil deliveryDate dari item pertama
          const deliveryDate = itemsData && itemsData.length > 0 ? itemsData[0].deliveryDate : null;
          if (!deliveryDate) throw new Error('Order must have at least one item with deliveryDate');
          const orderCode = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          const orderWithUserId = { ...restOfOrderData, code: orderCode, userId, deliveryDate };
          console.log('Order data with userId:', orderWithUserId); // Debug log
          const validatedOrder = insertOrderSchema.parse(orderWithUserId);

          const [order] = await tx.insert(orders).values(validatedOrder).returning();

          const validatedItems = itemsData.map((item: any) => insertOrderItemSchema.parse({ ...item, orderId: order.id }));
          const createdItems = await tx.insert(orderItems).values(validatedItems).returning();

          allNewOrders.push({ ...order, items: createdItems });
        }

        return allNewOrders;
      });

      res.status(201).json({ orders: createdOrders });

    } catch (error: any) {
      console.error('Batch orders error:', error); // Debug log
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to create batch orders", error: error.message });
    }
  });

  app.get("/api/users", async (req, res) => {
    const allUsers = await db.select().from(users);
    res.json({ users: allUsers });
  });

  // Promo CRUD endpoints
  app.get("/api/promos", async (req, res) => {
    const allPromos = await db.select().from(promos);
    res.json({ promos: allPromos });
  });

  app.post("/api/promos", async (req, res) => {
    try {
      const promoData = insertPromoSchema.parse(req.body);
      // Convert discountValue to proper decimal format
      const processedData = {
        ...promoData,
        discountValue: promoData.discountValue.toString(),
      };
      const [promo] = await db.insert(promos).values(processedData).returning();
      res.status(201).json({ promo });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error.code === '23505') {
        return res.status(409).json({ message: "Promo code must be unique." });
      }
      console.error('Promo creation error:', error);
      res.status(500).json({ message: "Failed to create promo", error: error.message });
    }
  });

  app.put("/api/promos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const promoData = insertPromoSchema.partial().parse(req.body);
      // Convert discountValue to proper decimal format if provided
      const processedData = promoData.discountValue
        ? { ...promoData, discountValue: promoData.discountValue.toString() }
        : promoData;
      const [promo] = await db.update(promos).set(processedData).where(eq(promos.id, parseInt(id))).returning();
      if (!promo) return res.status(404).json({ message: "Promo not found" });
      res.json({ promo });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error.code === '23505') {
        return res.status(409).json({ message: "Promo code must be unique." });
      }
      console.error('Promo update error:', error);
      res.status(500).json({ message: "Failed to update promo", error: error.message });
    }
  });

  app.delete("/api/promos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [promo] = await db.delete(promos).where(eq(promos.id, parseInt(id))).returning();
      if (!promo) return res.status(404).json({ message: "Promo not found" });
      res.json({ message: "Promo deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete promo", error });
    }
  });

  // Endpoint untuk mengambil order items berdasarkan orderId
  app.get("/api/orders/:id/items", async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid order id" });
    }
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, Number(id)));
    res.json(items);
  });

  // Endpoint untuk update status order
  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ message: "Invalid order id" });
      }
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const [updatedOrder] = await db.update(orders)
        .set({ status })
        .where(eq(orders.id, Number(id)))
        .returning();
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json({ order: updatedOrder });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update order status", error: error.message });
    }
  });

  // Settings Endpoints
  app.get("/api/pengaturan", async (req, res) => {
    try {
      const settings = await db.query.siteSettings.findFirst({
        where: eq(siteSettings.id, 1),
      });
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }
      res.json({ settings });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings", error });
    }
  });

  app.put("/api/site-settings", async (req, res) => {
    try {
      // Pastikan hanya admin yang bisa update
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!user || user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });

      const settingsData = req.body;

      try {
        const [updatedSettings] = await db.update(siteSettings)
          .set(settingsData)
          .where(eq(siteSettings.id, 1))
          .returning();

        res.json({ settings: updatedSettings });
      } catch (updateError: any) {
        console.error("Failed to update settings:", updateError);
        // Try to insert if update fails
        const [newSettings] = await db.insert(siteSettings)
          .values({ ...settingsData, id: 1 })
          .returning();
        res.json({ settings: newSettings });
      }
    } catch (error: any) {
      console.error("Error in settings endpoint:", error);
      res.status(500).json({
        message: "Failed to update settings",
        error: error.message
      });
    }
  });

  // Area CRUD endpoints
  app.get("/api/areas", async (req, res) => {
    const allAreas = await db.select().from(areas);
    res.json({ areas: allAreas });
  });

  app.post("/api/areas", async (req, res) => {
    try {
      const areaData = insertAreaSchema.parse(req.body);
      // Generate slug dari nama
      const slug = areaData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const [area] = await db.insert(areas).values({ ...areaData, slug }).returning();
      res.status(201).json({ area });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error.code === '23505') {
        return res.status(409).json({ message: "Slug must be unique." });
      }
      res.status(500).json({ message: "Failed to create area", error: error.message });
    }
  });

  app.put("/api/areas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const areaData = insertAreaSchema.partial().parse(req.body);
      if (areaData.name) {
        areaData.slug = areaData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      }
      const [area] = await db.update(areas).set(areaData).where(eq(areas.id, parseInt(id))).returning();
      if (!area) return res.status(404).json({ message: "Area not found" });
      res.json({ area });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error.code === '23505') {
        return res.status(409).json({ message: "Slug must be unique." });
      }
      res.status(500).json({ message: "Failed to update area", error: error.message });
    }
  });

  app.delete("/api/areas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [area] = await db.delete(areas).where(eq(areas.id, parseInt(id))).returning();
      if (!area) return res.status(404).json({ message: "Area not found" });
      res.json({ message: "Area deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete area", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

