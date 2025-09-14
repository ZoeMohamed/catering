import React, { createContext, useContext, useState, useEffect } from "react";
import type { CartItem } from "@shared/schema";

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  addItem: (item: Omit<CartItem, "id" | "total">) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on init
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("cateringku_cart");
      if (storedCart) {
        // Adjust to handle dates stored as strings
        const cartData = JSON.parse(storedCart).map((item: any) => ({
          ...item,
          deliveryDate: item.deliveryDate ? new Date(item.deliveryDate) : new Date(),
          deliveryTime: item.deliveryTime || "12:00-14:00",
        }));
        setItems(cartData);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      localStorage.removeItem("cateringku_cart");
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("cateringku_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (newItemData: Omit<CartItem, "id" | "total">) => {
    setItems(prevItems => {
      // Check if item with same product, customization, AND date already exists
      const existingItemIndex = prevItems.findIndex(item =>
        item.productId === newItemData.productId &&
        JSON.stringify(item.customization) === JSON.stringify(newItemData.customization) &&
        item.deliveryDate?.getTime() === newItemData.deliveryDate?.getTime() &&
        item.deliveryTime === newItemData.deliveryTime
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity and total
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        existingItem.quantity += newItemData.quantity;
        existingItem.total = existingItem.price * existingItem.quantity;
        return updatedItems;
      } else {
        // Add new item
        const newItem: CartItem = {
          ...newItemData,
          id: Date.now() + Math.random(), // Unique ID
          total: newItemData.price * newItemData.quantity,
        };
        return [...prevItems, newItem];
      }
    });
  };

  const removeItem = (itemId: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, quantity, total: item.price * quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.total, 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    items,
    isCartOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getItemCount,
    setIsCartOpen,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
}
