import { relations } from "drizzle-orm";
import { products, categories, orders, orderItems, users } from "./schema";

// Product belongs to Category
export const productRelations = relations(products, ({ one }) => ({
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
}));

// OrderItem belongs to Order and Product
export const orderItemRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
}));

// Order has many OrderItems
export const orderRelations = relations(orders, ({ many }) => ({
    items: many(orderItems, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
}));

// User has many Orders
export const userRelations = relations(users, ({ many }) => ({
    orders: many(orders, {
        fields: [orders.userId],
        references: [users.id],
    }),
})); 