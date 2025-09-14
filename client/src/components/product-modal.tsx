import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Star, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import type { Product, Area } from "@shared/schema";
import { Fragment } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Calendar } from "./ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  deliveryDate?: Date;
  selectedAreaSlug: string;
}

interface Customization {
  rice?: string;
  mainDish?: string;
  vegetable?: string;
  extras?: string[];
}

export default function ProductModal({ product, isOpen, onClose, deliveryDate, selectedAreaSlug }: ProductModalProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const { data: areasData } = useQuery<{ areas: Area[] }>({
    queryKey: ["/api/areas"],
    queryFn: async () => (await fetch("/api/areas")).json(),
  });
  const areas = areasData?.areas ?? [];
  const selectedArea = areas.find(a => a.slug === selectedAreaSlug);

  const [quantity, setQuantity] = useState(1);
  const [customization, setCustomization] = useState<{ [type: string]: any }>({});
  const [selectedDate, setSelectedDate] = useState(deliveryDate);
  const [selectedTime, setSelectedTime] = useState("12:00"); // Default time

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(product.minOrderQty || 1);
      setCustomization({});
      setSelectedDate(deliveryDate);
      setSelectedTime("12:00");
    }
  }, [isOpen, product, deliveryDate]);

  if (!product) return null;

  const customizationOptions = Array.isArray(product.customizationOptions) ? product.customizationOptions : [];

  const calculateTotalPrice = () => {
    let total = parseFloat(product.price);
    customizationOptions.forEach(opt => {
      const val = customization[opt.type];
      if (Array.isArray(val)) {
        val.forEach((v: string) => {
          const found = opt.options.find((o: any) => o.name === v);
          if (found) total += found.harga;
        });
      } else if (val) {
        const found = opt.options.find((o: any) => o.name === val);
        if (found) total += found.harga;
      }
    });
    return total * quantity;
  };

  const handleAddToCart = () => {
    // Validasi area
    if (!selectedArea) {
      toast({
        title: "Area Belum Dipilih",
        description: "Silakan pilih area layanan Anda terlebih dahulu di halaman utama.",
        variant: "destructive",
      });
      return;
    }

    // Validasi minimal pembelian
    if (quantity < (product.minOrderQty || 1)) {
      toast({
        title: "Minimal Pembelian",
        description: `Minimal pembelian produk ini adalah ${product.minOrderQty} pax`,
        variant: "destructive",
      });
      return;
    }
    // Validasi dinamis: semua opsi (kecuali yang bertipe 'Ekstra'/'Tambahan') harus dipilih
    for (const opt of customizationOptions) {
      if (!/ekstra|tambahan/i.test(opt.type) && (!customization[opt.type] || (Array.isArray(customization[opt.type]) && customization[opt.type].length === 0))) {
        toast({
          title: "Pilihan Tidak Lengkap",
          description: `Silakan pilih ${opt.type}`,
          variant: "destructive",
        });
        return;
      }
    }
    if (!selectedDate) {
      toast({
        title: "Tanggal Pengiriman Belum Dipilih",
        description: "Silakan pilih tanggal pengiriman.",
        variant: "destructive",
      });
      return;
    }
    const price = calculateTotalPrice() / quantity;
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image || "",
      price: price,
      quantity: quantity,
      customization: customization,
      deliveryDate: selectedDate,
      deliveryTime: selectedTime,
    });
    toast({
      title: "Berhasil Ditambahkan",
      description: `${product.name} telah ditambahkan ke keranjang`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{product.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Image */}
          <div className="w-full h-64 rounded-lg overflow-hidden">
            <img
              src={product.image || "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-2xl font-bold text-primary">
                  Rp {parseFloat(product.price).toLocaleString("id-ID")}
                </h4>
                <p className="text-gray-600">{product.description}</p>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-gray-600">
                  {product.rating} ({product.ratingCount} ulasan)
                </span>
              </div>
            </div>
          </div>

          {/* Opsi Kustomisasi */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <h5 className="font-semibold text-gray-800 mb-3">Area Layanan</h5>
                <Input
                  readOnly
                  value={selectedArea ? selectedArea.name : "Pilih area layanan di halaman utama"}
                  className="bg-gray-100 cursor-not-allowed"
                />
              </CardContent>
            </Card>

            {/* Customization Options */}
            {customizationOptions.map((opt, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <h5 className="font-semibold text-gray-800 mb-3">
                    {opt.type} {!/ekstra|tambahan/i.test(opt.type) && <span className="text-primary">*</span>}
                  </h5>
                  {/ekstra|tambahan/i.test(opt.type) ? (
                    <div className="space-y-2">
                      {opt.options.map((extra: any) => (
                        <div key={extra.name} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            id={extra.name}
                            checked={customization[opt.type]?.includes(extra.name) || false}
                            onCheckedChange={(checked) => {
                              setCustomization(prev => {
                                const prevArr = Array.isArray(prev[opt.type]) ? prev[opt.type] : [];
                                return {
                                  ...prev,
                                  [opt.type]: checked
                                    ? [...prevArr, extra.name]
                                    : prevArr.filter((n: string) => n !== extra.name)
                                };
                              });
                            }}
                          />
                          <Label htmlFor={extra.name} className="flex-1 cursor-pointer">
                            <div className="font-medium">{extra.name}</div>
                          </Label>
                          <div className="text-sm text-gray-600">
                            {extra.harga > 0 ? `+Rp ${extra.harga.toLocaleString("id-ID")}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <RadioGroup
                      value={customization[opt.type] || ""}
                      onValueChange={(value) => setCustomization(prev => ({ ...prev, [opt.type]: value }))}
                      className="space-y-2"
                    >
                      {opt.options.map((o: any) => (
                        <div key={o.name} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <RadioGroupItem value={o.name} id={`${opt.type}-${o.name}`} />
                          <Label htmlFor={`${opt.type}-${o.name}`} className="flex-1 cursor-pointer">
                            <div className="font-medium">{o.name}</div>
                            {o.description && <div className="text-sm text-gray-600">{o.description}</div>}
                          </Label>
                          <div className="text-sm text-gray-600">
                            {o.harga > 0 ? `+Rp ${o.harga.toLocaleString("id-ID")}` : ""}
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Delivery Date and Time */}
            <Card>
              <CardContent className="p-4">
                <h5 className="font-semibold text-gray-800 mb-3">Detail Pengiriman</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="delivery-date">Tanggal</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal mt-1"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate || undefined}
                          onSelect={(date) => setSelectedDate(date || null)}
                          initialFocus
                          disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="delivery-time">Waktu</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Pilih waktu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="08:00-10:00">Pagi (08:00 - 10:00)</SelectItem>
                        <SelectItem value="11:00-13:00">Siang (11:00 - 13:00)</SelectItem>
                        <SelectItem value="15:00-17:00">Sore (15:00 - 17:00)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quantity & Add to Cart */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-800">Jumlah:</span>
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="px-4 py-2 border-x">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Total Harga:</div>
                    <div className="text-2xl font-bold text-primary">
                      Rp {calculateTotalPrice().toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Tambah ke Keranjang - Rp {calculateTotalPrice().toLocaleString("id-ID")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
