import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Flame,
  LogOut,
  Settings,
  FileText
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useSettings } from "@/lib/settings";

interface HeaderProps {
  onLoginClick: () => void;
  onCartClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onProfileClick?: () => void;
}

export default function Header({ onLoginClick, onCartClick, searchQuery, onSearchChange, onProfileClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const { settings } = useSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    // Optionally redirect to home page after logout
    window.location.href = '/';
  };

  const itemCount = getItemCount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.siteName || "Logo"}
                className="h-8 w-auto"
                referrerPolicy="no-referrer"
              />
            ) : (
              <>
                <Flame className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">{settings?.siteName || "Catering Aja"}</span>
              </>
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-gray-700 hover:text-primary transition-colors">Beranda</Link>
            <Link href="/promo" className="text-gray-700 hover:text-primary transition-colors">Promo</Link>
            <Link href="/tentang" className="text-gray-700 hover:text-primary transition-colors">Tentang</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Cari menu catering..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 w-64"
            />
          </div>

          {/* Cart Button */}
          <Button
            onClick={onCartClick}
            className="relative bg-primary text-white hover:bg-primary/90"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Keranjang</span>
            {itemCount > 0 && (
              <Badge
                className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs h-6 w-6 flex items-center justify-center p-0 font-bold"
              >
                {itemCount}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <div className="relative">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 text-gray-700 hover:text-primary">
                    <User className="h-5 w-5" />
                    <span className="hidden md:inline font-medium">
                      {user.name || user.username}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Profil Saya</span>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex w-full cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Panel Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role != "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/order-history" className="flex w-full cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Riwayat Pesanan</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Keluar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                onClick={onLoginClick}
                className="flex items-center space-x-2 text-gray-700 hover:text-primary"
              >
                <User className="h-5 w-5" />
                <span className="hidden md:inline font-medium">Masuk</span>
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t py-4">
          <div className="space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Cari menu catering..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>

            {/* Mobile Navigation */}
            <nav className="flex flex-col space-y-2">
              <Link href="/">
                <a className="text-gray-700 hover:text-primary font-medium py-2">Beranda</a>
              </Link>
              <Link href="/promo">
                <a className="text-gray-700 hover:text-primary font-medium py-2">Promo</a>
              </Link>
              <Link href="/tentang">
                <a className="text-gray-700 hover:text-primary font-medium py-2">Tentang</a>
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
