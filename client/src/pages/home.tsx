import { useState } from "react";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import ProductGrid from "@/components/product-grid";
import ProductModal from "@/components/product-modal";
import CartSidebar from "@/components/cart-sidebar";
import CheckoutModal from "@/components/checkout-modal";
import LoginModal from "@/components/login-modal";
import ProfileModal from "@/components/profile-modal";
import PromoBanner from "@/components/promo-banner";
import AreaDateSelector from "@/components/area-date-selector";
import { useCart } from "@/hooks/use-cart";
import { useAreaDate } from "@/hooks/use-area-date";
import type { Product, Category } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

type CategoriesResponse = {
  categories: Category[];
}

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { isCartOpen, setIsCartOpen } = useCart();
  const { selectedArea, selectedDate, onAreaChange, onDateChange } = useAreaDate();

  // Ambil data kategori
  const { data: categoriesData } = useQuery<CategoriesResponse>({ queryKey: ["/api/categories"] });
  const categories = categoriesData?.categories ?? [];
  // Cari nama kategori yang dipilih
  const selectedCategoryName = selectedCategory === null ? undefined : categories.find((cat) => cat.id === selectedCategory)?.name;

  // Pastikan selectedArea default-nya adalah '' (string kosong)
  const areaValue = selectedArea || "";

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PromoBanner />
      <Header
        onLoginClick={() => setIsLoginModalOpen(true)}
        onCartClick={() => setIsCartOpen(!isCartOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onProfileClick={() => setIsProfileModalOpen(true)}
      />
      <div className="flex">
        {/* Sidebar hanya tampil di desktop */}
        <Sidebar
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          onPriceChange={(range: [number, number]) => setSelectedPrice(range)}
        />
        <main className="flex-1 min-w-0">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-2">
              <div className="gradient-red rounded-xl p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-2 text-shadow">MENU BARU!</h2>
                      <p className="text-red-100 mb-4">Hemat sampai 15 ribu! Buruan pesan sekarang</p>
                      <button className="bg-white text-primary px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                        Pesan Sekarang
                      </button>
                    </div>
                    <div className="hidden md:block">
                      <img
                        src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
                        alt="Indonesian catering spread"
                        className="rounded-lg shadow-lg"
                      />
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -ml-12 -mb-12"></div>
              </div>
            </div>
            <AreaDateSelector
              selectedArea={areaValue}
              onAreaChange={onAreaChange}
              selectedDate={selectedDate}
              onDateChange={onDateChange}
            />
            {/* Dropdown kategori untuk mobile */}
            <div className="block md:hidden mb-4">
              <Select value={selectedCategory !== null ? String(selectedCategory) : "all"} onValueChange={val => setSelectedCategory(val === "all" ? null : Number(val))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Menu</SelectItem>
                  {categories.map((cat: Category) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ProductGrid
              categoryId={selectedCategory}
              categoryName={selectedCategoryName}
              searchQuery={searchQuery}
              onProductSelect={handleProductSelect}
              priceRange={selectedPrice ?? undefined}
              onPriceRangeChange={(range: [number, number]) => setSelectedPrice(range)}
              areaFilter={areaValue}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      {isProductModalOpen && (
        <ProductModal
          product={selectedProduct!}
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          deliveryDate={selectedDate}
          selectedAreaSlug={areaValue}
        />
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
