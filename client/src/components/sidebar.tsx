import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Category } from "@shared/schema";

interface SidebarProps {
  selectedCategory: number | null;
  onCategorySelect: (categoryId: number | null) => void;
  onPriceChange?: (range: [number, number]) => void;
}

export default function Sidebar({ selectedCategory, onCategorySelect, onPriceChange }: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set([1]));
  const [minPrice, setMinPrice] = useState(10000);
  const [maxPrice, setMaxPrice] = useState(300000);

  const { data } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  const categories = Array.isArray(data) ? data : (data?.categories ?? []);

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Number(e.target.value);
    setMinPrice(newMin);
    onPriceChange?.([newMin, maxPrice]);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Number(e.target.value);
    setMaxPrice(newMax);
    onPriceChange?.([minPrice, newMax]);
  };

  return (
    <aside className="hidden lg:block w-80 bg-white shadow-sm h-screen sticky top-20 overflow-y-auto scrollbar-hide">
      <div className="p-6">
        <h3 className="font-bold text-lg text-gray-800 mb-4">Kategori Menu</h3>

        {/* Semua Menu */}
        <div className="mb-4">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => onCategorySelect(null)}
          >
            🏠 Semua Menu
          </Button>
        </div>

        {/* Daftar Kategori */}
        <div className="space-y-2">
          {categories
            .filter(cat => !cat.parentId)
            .map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const isSelected = selectedCategory === category.id;
              const subCategories = categories.filter(cat => cat.parentId === category.id);

              return (
                <Card key={category.id} className="overflow-hidden">
                  <div className="border-0">
                    <Button
                      variant={isSelected ? "default" : "ghost"}
                      className={`w-full justify-between p-4 h-auto ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-gray-50"}`}
                      onClick={() => {
                        onCategorySelect(category.id);
                        if (subCategories.length > 0) {
                          toggleCategory(category.id);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{category.name}</span>
                      </div>
                      {subCategories.length > 0 && (
                        isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Sub Kategori */}
                    {isExpanded && subCategories.length > 0 && (
                      <CardContent className="pt-0 pb-2 px-2">
                        <div className="space-y-1">
                          {subCategories.map((subCat) => (
                            <Button
                              key={subCat.id}
                              variant={selectedCategory === subCat.id ? "secondary" : "ghost"}
                              size="sm"
                              className="w-full justify-start pl-8"
                              onClick={() => onCategorySelect(subCat.id)}
                            >
                              {subCat.name}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </div>
                </Card>
              );
            })}
        </div>

        {/* Filter Harga */}
        <div className="mt-8">
          <h4 className="font-medium text-gray-800 mb-3">Filter Harga</h4>
          <div className="space-y-3">
            <div className="text-sm text-gray-700 font-medium">
              Rp {minPrice.toLocaleString()} - Rp {maxPrice.toLocaleString()}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs w-14">Min</span>
                <input
                  type="range"
                  min={10000}
                  max={300000}
                  step={1000}
                  value={minPrice}
                  onChange={handleMinPriceChange}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs w-14">Max</span>
                <input
                  type="range"
                  min={10000}
                  max={300000}
                  step={1000}
                  value={maxPrice}
                  onChange={handleMaxPriceChange}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
