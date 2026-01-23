import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, CreditCard, Banknote, Smartphone, CalendarDays } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAreaDate } from "@/hooks/use-area-date";
import type { Area } from "@shared/schema";
import { isStaticMode, mockAreas, mockPromos } from "@/lib/static-data";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const deliverySchema = z.object({
  customerName: z.string().min(1, "Nama penerima harus diisi"),
  customerPhone: z.string().min(1, "Nomor telepon harus diisi"),
  customerAddress: z.string().min(1, "Alamat harus diisi"),
  paymentMethod: z.enum(["cod", "transfer", "ewallet"], {
    required_error: "Metode pembayaran harus dipilih"
  }),
});

type DeliveryForm = z.infer<typeof deliverySchema>;

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, clearCart, getTotalPrice, getItemCount } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const { area: selectedArea } = useAreaDate();
  const [, setLocation] = useLocation();
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [orderCode] = useState(`CART${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState("");

  const form = useForm<DeliveryForm>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      paymentMethod: "cod" as const,
    },
  });

  // Group items by delivery date
  const groupedItems = useMemo(() => {
    const formatDateToYYYYMMDD = (date: Date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return items.reduce((acc, item) => {
      const dateKey = item.deliveryDate
        ? formatDateToYYYYMMDD(item.deliveryDate)
        : 'Tanpa Tanggal';

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {} as Record<string, typeof items>);
  }, [items]);

  // Timer effect
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast({
            title: "Waktu Habis",
            description: "Sesi checkout telah berakhir",
            variant: "destructive",
          });
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose, toast]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch promos from DB
  const { data: promosData } = useQuery({
    queryKey: ["/api/promos"],
    queryFn: async () => {
      if (isStaticMode) {
        return { promos: mockPromos };
      }
      return (await fetch("/api/promos")).json();
    },
  });
  const promos = Array.isArray(promosData?.promos) ? promosData.promos : [];

  // Fetch areas from DB
  const { data: areasData } = useQuery<{ areas: Area[] }>({
    queryKey: ["/api/areas"],
    queryFn: async () => {
      if (isStaticMode) {
        return { areas: mockAreas };
      }
      return (await fetch("/api/areas")).json();
    },
  });
  const areas = Array.isArray(areasData?.areas) ? areasData.areas : [];

  // Promo validation
  const handleApplyPromo = () => {
    setPromoError("");
    setAppliedPromo(null);
    if (!promoCode) return;
    const now = new Date();
    const found = promos.find((p: any) => {
      if (p.code.toLowerCase() !== promoCode.trim().toLowerCase() || !p.isActive) return false;
      let validStart = true, validEnd = true;
      if (p.startDate) validStart = new Date(p.startDate) <= now;
      if (p.endDate) {
        const end = new Date(p.endDate);
        end.setHours(23, 59, 59, 999);
        validEnd = end >= now;
      }
      return validStart && validEnd;
    });
    if (!found) {
      setPromoError("Kode promo tidak valid atau sudah tidak berlaku.");
      return;
    }
    setAppliedPromo(found);
    setPromoError("");
  };

  // Calculate totals
  const subtotal = getTotalPrice();
  const matchedArea = areas.find(a => a.slug === selectedArea);
  const deliveryFee = matchedArea ? Number(matchedArea.deliveryFee) : 0;
  const serviceFee = matchedArea ? Number(matchedArea.serviceFee) : 0;
  // Diskon dari promo
  let promoDiscount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === "percent") {
      promoDiscount = Math.round((subtotal * Number(appliedPromo.discountValue)) / 100);
    } else if (appliedPromo.discountType === "amount") {
      promoDiscount = Number(appliedPromo.discountValue);
    }
  }
  // Diskon hanya dari promo, tidak ada diskon otomatis
  const discount = appliedPromo ? promoDiscount : 0;
  const total = subtotal + deliveryFee + serviceFee - discount;

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: Omit<DeliveryForm, "deliveryDate">) => {
      const ordersForBatch = Object.entries(groupedItems).map(([date, items]) => {
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const matchedArea = areas.find(a => a.slug === selectedArea);
        const deliveryFee = matchedArea ? Number(matchedArea.deliveryFee) : 0;
        const serviceFee = matchedArea ? Number(matchedArea.serviceFee) : 0;
        let promoDiscount = 0;
        if (appliedPromo) {
          if (appliedPromo.discountType === "percent") {
            promoDiscount = Math.round((subtotal * Number(appliedPromo.discountValue)) / 100);
          } else if (appliedPromo.discountType === "amount") {
            promoDiscount = Number(appliedPromo.discountValue);
          }
        }
        const defaultDiscount = subtotal > 50000 ? 10000 : 0;
        const discount = appliedPromo ? promoDiscount : defaultDiscount;
        const total = subtotal + deliveryFee + serviceFee - discount;
        return {
          ...orderData,
          deliveryDate: date,
          subtotal: subtotal.toString(),
          deliveryFee: deliveryFee.toString(),
          serviceFee: serviceFee.toString(),
          discount: discount.toString(),
          total: total.toString(),
          promoCode: appliedPromo ? appliedPromo.code : undefined,
          items: items.map(item => ({
            productId: item.productId,
            productName: item.name,
            productImage: item.image,
            quantity: item.quantity,
            price: (item.total / item.quantity).toString(),
            customization: item.customization,
            total: item.total.toString(),
            deliveryDate: item.deliveryDate
              ? (typeof item.deliveryDate === 'string'
                ? item.deliveryDate
                : item.deliveryDate.toISOString().slice(0, 10))
              : null,
            deliveryTime: item.deliveryTime,
          })),
        };
      });

      if (isStaticMode) {
        const demoOrders = ordersForBatch.map((order, index) => ({
          ...order,
          id: Date.now() + index,
          code: `DEMO-${Date.now()}-${index + 1}`,
        }));
        return { orders: demoOrders };
      }

      const response = await fetch("/api/orders/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: ordersForBatch }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to create batch orders");
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Pesanan Berhasil Dibuat!",
        description: `Berhasil membuat ${data.orders.length} pesanan. Terima kasih!`,
      });
      clearCart();
      onClose();

      // Generate dan tampilkan invoice untuk setiap pesanan
      // for (const order of data.orders) {
      //   await generateInvoice(order);
      // }
    },
    onError: (error) => {
      toast({
        title: "Gagal Membuat Pesanan",
        description: error.message || "Terjadi kesalahan, silakan coba lagi",
        variant: "destructive",
      });
    },
  });

  // Fungsi generate invoice
  const generateInvoice = async (order: any) => {
    try {
      const orderItems = order.items || [];

      const invoiceWindow = window.open('', '_blank');
      if (!invoiceWindow) return;

      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${order.code}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #dc2626; }
            .invoice-title { font-size: 20px; margin-top: 10px; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .customer-info, .order-info { width: 45%; }
            .section-title { font-weight: bold; color: #dc2626; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #dc2626; color: white; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Catering Nusantara</div>
            <div class="invoice-title">INVOICE</div>
          </div>
          
          <div class="invoice-info">
            <div class="customer-info">
              <div class="section-title">Informasi Pelanggan</div>
              <p><strong>Nama:</strong> ${order.customerName}</p>
              <p><strong>Telepon:</strong> ${order.customerPhone}</p>
              <p><strong>Alamat:</strong> ${order.customerAddress}</p>
            </div>
            <div class="order-info">
              <div class="section-title">Informasi Pesanan</div>
              <p><strong>No. Invoice:</strong> ${order.code}</p>
              <p><strong>Tanggal Pesan:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID')}</p>
              <p><strong>Tanggal Kirim:</strong> ${new Date(order.deliveryDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Waktu Kirim:</strong> ${order.deliveryTime}</p>
              <p><strong>Status:</strong> ${order.status}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Qty</th>
                <th>Harga</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems.map((item: any) => `
                <tr>
                  <td>
                    ${item.productName}
                    ${item.customization ? `<br><small>${Object.entries(item.customization).map(([key, value]) =>
        value ? `${key}: ${Array.isArray(value) ? value.join(', ') : value}` : ''
      ).filter(Boolean).join(', ')}</small>` : ''}
                  </td>
                  <td>${item.quantity}</td>
                  <td>Rp ${parseFloat(item.price).toLocaleString()}</td>
                  <td>Rp ${parseFloat(item.total).toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">Total</td>
                <td>Rp ${parseFloat(order.total).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Terima kasih atas kepercayaan Anda!</p>
            <p>Catering Nusantara - Jl. Raya No. 123, Jakarta</p>
          </div>
        </body>
        </html>
      `;

      invoiceWindow.document.write(invoiceHTML);
      invoiceWindow.document.close();

      // Tampilkan invoice dan berikan opsi untuk print
      setTimeout(() => {
        invoiceWindow.print();
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menampilkan invoice",
        variant: "destructive"
      });
    }
  };

  const onSubmit = (data: DeliveryForm) => {
    // Validasi: semua item harus punya deliveryDate dan deliveryTime
    const hasInvalidDelivery = items.some(item => !item.deliveryDate || !item.deliveryTime);
    if (hasInvalidDelivery) {
      toast({
        title: "Error",
        description: "Semua item harus memiliki tanggal dan waktu pengiriman.",
        variant: "destructive",
      });
      return;
    }
    createOrderMutation.mutate(data);
  };

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <span>Checkout Pesanan</span>
              <p className="text-sm font-normal text-gray-600 mt-1">
                Kode Pesanan: <Badge variant="outline" className="font-mono">{orderCode}</Badge>
              </p>
            </div>
            <div className="flex items-center space-x-2 text-yellow-600">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {/* Order Details */}
          <div className="flex-1 space-y-6">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-800 mb-4">Detail Pesanan</h4>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {Object.entries(groupedItems).map(([date, groupItems]) => (
                    <div key={date}>
                      <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-t-lg">
                        <CalendarDays className="h-4 w-4 text-gray-600" />
                        <h5 className="font-semibold text-gray-800">
                          Pengiriman: {new Date(date.replace(/-/g, '/')).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </h5>
                      </div>
                      <div className="border border-t-0 rounded-b-lg p-2">
                        {groupItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                            <div className="flex items-center space-x-3">
                              <img
                                src={item.image || "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=60"}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                              <div>
                                <h5 className="font-medium text-gray-800">{item.name}</h5>
                                <p className="text-sm text-gray-600 line-clamp-1">
                                  {formatCustomization(item.customization)}
                                </p>
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                <div className="flex items-center text-xs text-gray-600 mt-1">
                                  <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                  <span>{item.deliveryTime}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-800">
                                Rp {item.total.toLocaleString("id-ID")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information Form */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-800 mb-4">Informasi Pengiriman</h4>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Nama Penerima</Label>
                      <Input
                        id="customerName"
                        placeholder="Masukkan nama penerima"
                        {...form.register("customerName")}
                      />
                      {form.formState.errors.customerName && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.customerName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">Nomor Telepon</Label>
                      <Input
                        id="customerPhone"
                        placeholder="08xx-xxxx-xxxx"
                        {...form.register("customerPhone")}
                      />
                      {form.formState.errors.customerPhone && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.customerPhone.message}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="customerAddress">Alamat Lengkap</Label>
                      <Textarea
                        id="customerAddress"
                        placeholder="Masukkan alamat lengkap untuk pengiriman"
                        {...form.register("customerAddress")}
                      />
                      {form.formState.errors.customerAddress && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.customerAddress.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Promo Code Input */}
                  <div>
                    <Label htmlFor="promoCode">Kode Promo</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="promoCode"
                        placeholder="Masukkan kode promo"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value)}
                        autoComplete="off"
                      />
                      <Button type="button" variant="outline" onClick={handleApplyPromo}>
                        Terapkan
                      </Button>
                    </div>
                    {appliedPromo && (
                      <p className="text-green-600 text-sm mt-1">Promo "{appliedPromo.title}" diterapkan!</p>
                    )}
                    {promoError && (
                      <p className="text-red-500 text-sm mt-1">{promoError}</p>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div>
                    <Label>Metode Pembayaran</Label>
                    <RadioGroup
                      value={form.watch("paymentMethod")}
                      onValueChange={(value: "cod" | "transfer" | "ewallet") =>
                        form.setValue("paymentMethod", value)
                      }
                      className="mt-2 space-y-3"
                    >
                      <div className="flex items-center space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod" className="flex items-center flex-1 cursor-pointer">
                          <Banknote className="h-5 w-5 text-green-600 mr-3" />
                          <div>
                            <div className="font-medium">Bayar di Tempat (COD)</div>
                            <div className="text-sm text-gray-600">Bayar saat pesanan tiba</div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem value="transfer" id="transfer" />
                        <Label htmlFor="transfer" className="flex items-center flex-1 cursor-pointer">
                          <CreditCard className="h-5 w-5 text-blue-600 mr-3" />
                          <div>
                            <div className="font-medium">Transfer Bank</div>
                            <div className="text-sm text-gray-600">BCA, Mandiri, BNI, BRI</div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem value="ewallet" id="ewallet" />
                        <Label htmlFor="ewallet" className="flex items-center flex-1 cursor-pointer">
                          <Smartphone className="h-5 w-5 text-purple-600 mr-3" />
                          <div>
                            <div className="font-medium">E-Wallet</div>
                            <div className="text-sm text-gray-600">GoPay, OVO, DANA, ShopeePay</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                    {form.formState.errors.paymentMethod && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.paymentMethod.message}
                      </p>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-80 space-y-4">
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-800 mb-4">Ringkasan Pesanan</h4>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({getItemCount()} item)</span>
                    <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ongkos Kirim</span>
                    <span>Rp {deliveryFee.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Biaya Layanan</span>
                    <span>Rp {serviceFee.toLocaleString("id-ID")}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Diskon Promo</span>
                      <span>-Rp {discount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Pembayaran</span>
                    <span className="text-primary">Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={createOrderMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-white mb-4"
                  size="lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {createOrderMutation.isPending ? "Memproses..." : "Buat Pesanan"}
                </Button>

                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Dengan memesan, Anda menyetujui{" "}
                    <a href="#" className="text-primary hover:underline">
                      Syarat & Ketentuan
                    </a>{" "}
                    kami
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
