import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderItem } from "@shared/schema";

interface OrderItemsListProps {
  orderId: number;
  emptyComponent?: React.ReactNode;
}

export default function OrderItemsList({ orderId, emptyComponent }: OrderItemsListProps) {
  const { data: orderItems = [], isLoading } = useQuery<OrderItem[]>({
    queryKey: ["/api/orders", orderId, "items"],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/items`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch order items");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <Skeleton className="h-4 w-[80px]" />
          </div>
        ))}
      </div>
    );
  }

  if (orderItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyComponent || <p>Tidak ada item dalam pesanan ini</p>}
      </div>
    );
  }

  const formatCustomization = (customization: any) => {
    if (!customization) return "";
    return Object.entries(customization)
      .map(([type, value]) => {
        if (Array.isArray(value)) {
          return `${type}: ${value.join(", ")}`;
        }
        return `${type}: ${value}`;
      })
      .join(" | ");
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produk</TableHead>
            <TableHead className="text-center">Qty</TableHead>
            <TableHead className="text-right">Harga</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">{item.productName}</p>
                  {formatCustomization(item.customization)}
                </div>
              </TableCell>
              <TableCell className="text-center font-medium">
                {item.quantity}
              </TableCell>
              <TableCell className="text-right">
                Rp {item.price.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-medium">
                Rp {(Number(item.price) * item.quantity).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}