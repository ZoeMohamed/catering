import { useCartContext } from "@/lib/cart";

export function useCart() {
  return useCartContext();
}
