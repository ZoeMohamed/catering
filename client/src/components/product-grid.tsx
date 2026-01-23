import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Plus, ChevronLeft, ChevronRight, SlidersHorizontal, X, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product, Area } from "@shared/schema";
import { isStaticMode, mockAreas, mockProducts } from "@/lib/static-data";

interface ProductGridProps {
  categoryId: number | null;
  categoryName?: string;
  searchQuery: string;
  onProductSelect: (product: Product) => void;
  priceRange?: [number, number];
  onPriceRangeChange?: (range: [number, number]) => void;
  areaFilter?: string;
}

const PRODUCTS_PER_PAGE = 6;

export default function ProductGrid({ categoryId, categoryName, searchQuery, onProductSelect, priceRange, onPriceRangeChange, areaFilter }: ProductGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 1000000]);
  const [sortBy, setSortBy] = useState("popular");
  const [localPriceRange, setLocalPriceRange] = useState<[number, number] | undefined>(priceRange);

  const { data: areasData } = useQuery<{ areas: Area[] }>({
    queryKey: ["/api/areas"],
    queryFn: async () => {
      if (isStaticMode) {
        return { areas: mockAreas };
      }
      return (await fetch("/api/areas")).json();
    },
  });
  const areas = areasData?.areas ?? [];
  const selectedAreaId = areas.find(a => a.slug === areaFilter)?.id;

  const queryParams = new URLSearchParams();
  if (categoryId) queryParams.set("category", categoryId.toString());
  if (selectedAreaId) queryParams.set("areaId", selectedAreaId.toString());

  const { data, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ["/api/products", categoryId, selectedAreaId],
    queryFn: async () => {
      if (isStaticMode) {
        let filtered = mockProducts;
        if (categoryId) {
          filtered = filtered.filter((product) => product.categoryId === categoryId);
        }
        if (selectedAreaId) {
          filtered = filtered.filter((product) => product.areaId === selectedAreaId);
        }
        return { products: filtered };
      }
      const response = await fetch(`/api/products?${queryParams.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });
  const products: Product[] = data?.products ?? [];

  // Get price range from all products for slider
  const minPrice = Math.min(...products.map((p: Product) => Number(p.price)));
  const maxPrice = Math.max(...products.map((p: Product) => Number(p.price)));

  // Filter products based on search query, price range, and area
  const filteredProducts = products.filter((product: Product) => {
    // Check if product matches search query
    const matchesSearch = searchQuery === "" || product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    // Check if product matches price range
    const matchesPriceRange = priceRange === undefined || (Number(product.price) >= priceRange[0] && Number(product.price) <= priceRange[1]);
    const localMatchesPriceRange = localPriceRange === undefined || (Number(product.price) >= localPriceRange[0] && Number(product.price) <= localPriceRange[1]);
    // Check if product matches area filter
    const matchesArea = !selectedAreaId || product.areaId === selectedAreaId;
    // Product must match all criteria
    return matchesSearch && matchesPriceRange && localMatchesPriceRange && matchesArea;
  });

  // Update tempPriceRange based on priceRange (outside of filter to avoid repeated calls)
  useEffect(() => {
    if (priceRange) {
      setTempPriceRange([priceRange[0], priceRange[1]]);
    } else if (products.length > 0) {
      setTempPriceRange([minPrice, maxPrice]);
    }
  }, [priceRange, minPrice, maxPrice, products.length]);

  // Sort products based on selected sort option
  // const filteredProducts = [...filteredProducts].sort((a, b) => {
  //   switch (sortBy) {
  //     case "price-low":
  //       return Number(a.price) - Number(b.price);
  //     case "price-high":
  //       return Number(b.price) - Number(a.price);
  //     case "rating":
  //       return Number(b.rating) - Number(a.rating);
  //     case "popular":
  //     default:
  //       return Number(b.ratingCount) - Number(a.ratingCount);
  //   }
  // });
  // Initialize temp price range
  useEffect(() => {
    if (products.length > 0) {
      setTempPriceRange([minPrice, maxPrice]);
    }
  }, [products, minPrice, maxPrice]);

  // Update temp price range when priceRange prop changes
  useEffect(() => {
    if (priceRange) {
      setTempPriceRange(priceRange);
    }
  }, [priceRange]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to first page when search query or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryId, localPriceRange]);

  const handleApplyFilters = () => {
    setLocalPriceRange(tempPriceRange);
    if (onPriceRangeChange) {
      onPriceRangeChange(tempPriceRange);
    }
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    const resetRange: [number, number] = [minPrice, maxPrice];
    setTempPriceRange(resetRange);
    setLocalPriceRange(undefined);
    if (onPriceRangeChange) {
      onPriceRangeChange(resetRange);
    }
  };

  const getBadgeVariant = (badge: string | null) => {
    if (!badge) return "secondary";
    const badgeClass = `badge-${badge.toLowerCase().replace(/\s+/g, "-")}`;
    return "default";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full h-48" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-xl font-bold text-gray-800">
          {categoryId === null
            ? "Semua Menu"
            : categoryName
              ? `Menu Kategori: ${categoryName}`
              : "Menu Kategori"}
          {(localPriceRange || priceRange) ? ` - Harga: Rp ${(localPriceRange || priceRange)![0].toLocaleString("id-ID")} - Rp ${(localPriceRange || priceRange)![1].toLocaleString("id-ID")}` : ""}
        </h2>
        <div className="flex items-center justify-between sm:justify-end space-x-4">
          <span className="text-gray-600 text-sm">
            Menampilkan {filteredProducts.length} dari {products.length} menu
          </span>

          {/* Desktop Sort Dropdown */}
          {/* <select
            className="hidden sm:block px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popular">Urutkan: Terpopuler</option>
            <option value="price-low">Harga: Terendah</option>
            <option value="price-high">Harga: Tertinggi</option>
            <option value="rating">Rating Tertinggi</option>
          </select> */}

          {/* Mobile Filter Button */}
          <Button
            variant="outline"
            size="sm"
            className="sm:hidden"
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 sm:hidden">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Filter & Urutkan</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Sort Options */}
            {/* <div className="mb-6">
              <h4 className="font-medium mb-3">Urutkan</h4>
              <div className="space-y-2">
                {[
                  { value: "popular", label: "Terpopuler" },
                  { value: "price-low", label: "Harga: Terendah" },
                  { value: "price-high", label: "Harga: Tertinggi" },
                  { value: "rating", label: "Rating Tertinggi" }
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="sort"
                      value={option.value}
                      checked={sortBy === option.value}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div> */}

            {/* Price Range Slider */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Rentang Harga</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Rp {tempPriceRange[0].toLocaleString("id-ID")}</span>
                  <span>Rp {tempPriceRange[1].toLocaleString("id-ID")}</span>
                </div>

                {/* Min Price Slider */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Harga Minimum</label>
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    step={1000}
                    value={tempPriceRange[0]}
                    onChange={(e) => {
                      const newMin = Number(e.target.value);
                      setTempPriceRange([newMin, Math.max(newMin, tempPriceRange[1])]);
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>

                {/* Max Price Slider */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Harga Maksimum</label>
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    step={1000}
                    value={tempPriceRange[1]}
                    onChange={(e) => {
                      const newMax = Number(e.target.value);
                      setTempPriceRange([Math.min(tempPriceRange[0], newMax), newMax]);
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleResetFilters}
              >
                Reset
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleApplyFilters}
              >
                Terapkan Filter
              </Button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .slider-thumb::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #ef4444;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .slider-thumb::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #ef4444;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
        `
      }} />

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">Tidak ada menu ditemukan</div>
          <p className="text-gray-400">
            {searchQuery && priceRange
              ? `Coba ubah kata kunci pencarian atau rentang harga`
              : searchQuery
                ? `Coba ubah kata kunci pencarian`
                : priceRange
                  ? `Coba ubah rentang harga`
                  : `Coba ubah filter atau kata kunci pencarian`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 px-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {currentProducts.map((product: Product) => (
            <div
              key={product.id}
              className="w-full rounded-2xl shadow-lg border border-gray-100 bg-white flex flex-col h-full transition hover:shadow-xl hover:-translate-y-1 p-3 sm:p-5"
            >
              <div className="w-full overflow-hidden rounded-t-2xl bg-gray-50">
                <img
                  src={product.image || "https://via.placeholder.com/300x200?text=No+Image"}
                  alt={product.name}
                  className="w-full h-auto max-h-40 sm:aspect-[4/3] sm:max-h-none object-cover object-center transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 flex flex-col gap-2 justify-between">
                <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-primary font-bold text-xl">Rp {Number(product.price).toLocaleString("id-ID")}</span>
                  {product.originalPrice && (
                    <span className="text-gray-400 line-through text-sm">Rp {Number(product.originalPrice).toLocaleString("id-ID")}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mb-2">Minimal: {product.minOrderQty} pax</div>
                <div className="mt-auto">
                  <Button
                    className="w-full rounded-xl py-3 text-base font-semibold"
                    onClick={() => onProductSelect(product)}
                  >
                    Lihat Menu
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-600">
            Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} dari {filteredProducts.length} produk
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                return page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1;
              })
              .map((page, index, visiblePages) => (
                <div key={page} className="flex items-center">
                  {index > 0 && visiblePages[index - 1] !== page - 1 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-red-600 text-white" : ""}
                  >
                    {page}
                  </Button>
                </div>
              ))
            }

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
