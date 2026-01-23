import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Eye,
    Download,
    FileText,
    Box,
    Calendar,
    MapPin,
    Phone,
    User,
    Clock,
    Package
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";
import OrderItemsList from "@/components/order-items-list";
import { getMockOrderItems, isStaticMode, mockOrders } from "@/lib/static-data";

export default function OrderHistory() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    // Modal state
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

    // Fetch user's orders
    const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
        queryKey: ["/api/orders/my-orders"],
        queryFn: async () => {
            if (isStaticMode) {
                return mockOrders as Order[];
            }
            const response = await apiRequest("GET", "/api/orders/my-orders");
            const data = await response.json();
            return data.orders || [];
        },
        enabled: !!user, // Only fetch if user is logged in
    });

    // Invoice generation function
    const generateInvoice = async (order: Order) => {
        try {
            const orderItems = isStaticMode
                ? getMockOrderItems(order.id)
                : await fetch(`/api/orders/${order.id}/items`, {
                    credentials: "include",
                }).then(res => res.json());

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
              <p><strong>Tanggal:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID') : '-'}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Pengiriman:</strong> ${order.deliveryDate} ${order.deliveryTime}</p>
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
                  <td>Rp ${item.price.toLocaleString()}</td>
                  <td>Rp ${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">Total</td>
                <td>Rp ${(order.total || 0).toLocaleString()}</td>
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
            invoiceWindow.print();
        } catch (error) {
            toast({ title: "Error", description: "Gagal mencetak invoice", variant: "destructive" });
        }
    };

    // Export order details function
    const exportOrderDetails = async (order: Order) => {
        try {
            const orderItems = isStaticMode
                ? getMockOrderItems(order.id)
                : await fetch(`/api/orders/${order.id}/items`, {
                    credentials: "include",
                }).then(res => res.json());

            const csvContent = [
                ['Kode Pesanan', 'Tanggal', 'Pelanggan', 'Telepon', 'Alamat', 'Produk', 'Qty', 'Harga', 'Subtotal', 'Total', 'Status'],
                ...orderItems.map((item: any) => [
                    order.code,
                    order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID') : '-',
                    order.customerName,
                    order.customerPhone,
                    order.customerAddress,
                    item.productName + (item.customization ? ` (${Object.entries(item.customization).map(([key, value]) =>
                        value ? `${key}: ${Array.isArray(value) ? value.join(', ') : value}` : ''
                    ).filter(Boolean).join(', ')})` : ''),
                    item.quantity,
                    item.price,
                    item.price * item.quantity,
                    order.total,
                    order.status
                ])
            ].map(row => row.map((cell: any) => `"${cell}"`).join(',')).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `detail-pesanan-${order.code}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({ title: "Berhasil", description: "Detail pesanan berhasil diekspor" });
        } catch (error) {
            toast({ title: "Error", description: "Gagal mengekspor detail pesanan", variant: "destructive" });
        }
    };

    // Get status badge variant
    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'completed':
                return 'default';
            case 'processing':
                return 'secondary';
            case 'shipped':
                return 'outline';
            case 'cancelled':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    // Get status text
    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Menunggu';
            case 'processing':
                return 'Diproses';
            case 'shipped':
                return 'Dikirim';
            case 'completed':
                return 'Selesai';
            case 'cancelled':
                return 'Dibatalkan';
            default:
                return status;
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="container mx-auto p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setLocation("/")}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Kembali ke Beranda
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Riwayat Pesanan</h1>
                                <p className="text-gray-600 dark:text-gray-400">Lihat semua pesanan Anda</p>
                            </div>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="text-center py-12">
                            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-900 mb-2">Login Diperlukan</h3>
                            <p className="text-gray-600 mb-6">
                                Silakan login terlebih dahulu untuk melihat riwayat pesanan Anda
                            </p>
                            <Button onClick={() => setLocation("/")}>
                                Kembali ke Beranda
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setLocation("/")}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Beranda
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Riwayat Pesanan</h1>
                            <p className="text-gray-600 dark:text-gray-400">Lihat semua pesanan Anda</p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Daftar Pesanan
                        </CardTitle>
                        <CardDescription>
                            Kelola dan lihat detail semua pesanan Anda
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {ordersLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                                <p className="mt-2 text-gray-600">Memuat pesanan...</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-8">
                                <Box className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada pesanan</h3>
                                <p className="text-gray-600 mb-4">Anda belum memiliki riwayat pesanan</p>
                                <Button onClick={() => setLocation("/")}>
                                    Mulai Pesan
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kode Pesanan</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Pengiriman</TableHead>
                                            <TableHead>Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono font-medium">{order.code}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4 text-gray-500" />
                                                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID') : '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    Rp {(order.total || 0).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(order.status)}>
                                                        {getStatusText(order.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <div>{order.deliveryDate}</div>
                                                        <div className="text-gray-500">{order.deliveryTime}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setViewingOrder(order)}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => generateInvoice(order)}
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => exportOrderDetails(order)}
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Order Details Modal */}
                {viewingOrder && (
                    <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
                        <DialogContent className="max-w-2xl p-0 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-6 pb-2 border-b">
                                <h2 className="text-2xl font-bold">Detail Pesanan <span className="font-mono">{viewingOrder.code}</span></h2>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => generateInvoice(viewingOrder)}>
                                        <FileText className="w-4 h-4 mr-2" />
                                        Cetak Invoice
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => exportOrderDetails(viewingOrder)}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Export Detail
                                    </Button>
                                </div>
                            </div>

                            {/* Info utama */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-gray-50 rounded-lg shadow mb-6">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Kode Pesanan</div>
                                    <div className="font-mono font-bold text-lg">{viewingOrder.code}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-xs text-gray-500">Status</div>
                                    <Badge variant={getStatusBadgeVariant(viewingOrder.status)}>
                                        {getStatusText(viewingOrder.status)}
                                    </Badge>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Tanggal Pesanan</div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        {viewingOrder.createdAt ? new Date(viewingOrder.createdAt).toLocaleString('id-ID') : '-'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Tanggal Pengiriman</div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        {viewingOrder.deliveryDate} {viewingOrder.deliveryTime}
                                    </div>
                                </div>
                            </div>

                            {/* Info Pelanggan */}
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <div className="text-xs font-bold text-gray-600 uppercase mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Informasi Pelanggan
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-500">Nama</div>
                                        <div className="font-medium">{viewingOrder.customerName}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Telepon</div>
                                        <div className="font-medium flex items-center gap-1">
                                            <Phone className="w-4 h-4 text-gray-500" />
                                            {viewingOrder.customerPhone}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="text-xs text-gray-500">Alamat Pengiriman</div>
                                    <div className="flex items-start gap-1">
                                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                        <span>{viewingOrder.customerAddress}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Rincian Pesanan */}
                            <div className="bg-gray-50 rounded-lg shadow p-6 mb-6">
                                <div className="text-xs font-bold text-gray-600 uppercase mb-2 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Rincian Pesanan
                                </div>
                                <OrderItemsList orderId={viewingOrder.id} />
                            </div>

                            {/* Ringkasan Pembayaran */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="text-xs font-bold text-gray-600 uppercase mb-2">Ringkasan Pembayaran</div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Metode Pembayaran</span>
                                        <span>{viewingOrder.paymentMethod.toUpperCase()}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>Rp {(Number(viewingOrder.total || 0) * 0.9).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Ongkos Kirim</span>
                                        <span>Rp {(Number(viewingOrder.total || 0) * 0.1).toLocaleString()}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span className="text-primary">Rp {(viewingOrder.total || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
} 
