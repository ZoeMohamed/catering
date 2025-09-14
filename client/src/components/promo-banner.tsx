import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PromoBannerProps {
  enabled?: boolean;
  text?: string;
  backgroundColor?: string;
  textColor?: string;
}

export default function PromoBanner({ 
  enabled = true,
  text = "Promo spesial hari ini! Gratis ongkir untuk pemesanan minimal Rp 100.000",
  backgroundColor = "#dc2626",
  textColor = "#ffffff"
}: PromoBannerProps) {
  const [isVisible, setIsVisible] = useState(enabled);

  if (!isVisible || !enabled) {
    return null;
  }

  return (
    <div 
      className="relative px-4 py-3 text-center text-sm font-medium"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="flex items-center justify-center">
        <span className="flex-1 text-center">{text}</span>
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-current hover:bg-black/10"
          onClick={() => setIsVisible(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}