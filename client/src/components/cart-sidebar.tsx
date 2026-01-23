import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, CalendarDays, Clock } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Product, CartItem } from "@shared/schema";
import { isStaticMode, mockProducts } from "@/lib/static-data";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartSidebar({ isOpen, onClose, onCheckout }: CartSidebarProps) {
  const { items, updateQuantity, removeItem, getTotalPrice, getItemCount } = useCart();

  // Fetch all products to get customization details
  const { data: productsData } = useQuery<{ products: Product[] }>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      if (isStaticMode) {
        return { products: mockProducts };
      }
      return (await apiRequest("GET", "/api/products")).json();
    },
  });

  const productsMap = productsData?.products.reduce((map, product) => {
    map[product.id] = product;
    return map;
  }, {} as { [key: number]: Product });

  const subtotal = getTotalPrice();
  const deliveryFee = 5000;
  const serviceFee = 0;
  const discount = 0;
  const total = subtotal + deliveryFee + serviceFee - discount;

  const formatCustomization = (item: CartItem) => {
    if (!item.customization || !productsMap || !productsMap[item.productId]) return [];

    const product = productsMap[item.productId];
    if (!product || !Array.isArray(product.customizationOptions)) return [];

    return Object.entries(item.customization).flatMap(([type, value]) => {
      const optionGroup = product.customizationOptions.find(opt => opt.type === type);
      if (!optionGroup) return [];

      const values = Array.isArray(value) ? value : [value];
      return values.map(v => {
        const optionDetails = optionGroup.options.find(opt => opt.name === v);
        if (optionDetails && optionDetails.harga > 0) {
          return `${v} (+Rp ${optionDetails.harga.toLocaleString("id-ID")})`;
        }
        return v;
      });
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-96 sm:max-w-96 flex flex-col h-full">
        {/* Header */}
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>
              Keranjang Belanja
              <Badge variant="secondary" className="ml-2">
                {getItemCount()} item
              </Badge>
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">Keranjang kosong</div>
              <p className="text-gray-400">Tambahkan menu catering untuk melanjutkan</p>
            </div>
          ) : (
            items.map((item) => {
              const formattedCustomizations = formatCustomization(item);
              return (
                <div key={item.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=80"}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 truncate">{item.name}</h4>
                    <div className="mt-1 text-xs text-gray-600 flex items-center">
                      <CalendarDays className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      <span>
                        {item.deliveryDate.toLocaleDateString("id-ID", {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-600 flex items-center">
                      <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      <span>{item.deliveryTime}</span>
                    </div>
                    {formattedCustomizations.length > 0 && (
                      <div className="text-xs text-gray-700 space-y-1 mt-2">
                        {formattedCustomizations.map((custom, index) => (
                          <p key={index} className="text-gray-600 line-clamp-2">
                            - {custom}
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-medium text-primary">
                        Rp {item.total.toLocaleString("id-ID")}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Order Summary & Checkout */}
        {items.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ongkos Kirim</span>
                <span>Rp {deliveryFee.toLocaleString("id-ID")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Diskon</span>
                  <span>-Rp {discount.toLocaleString("id-ID")}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <Button
              onClick={onCheckout}
              className="w-full bg-primary hover:bg-primary/90 text-white"
              size="lg"
            >
              Lanjut ke Checkout
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
