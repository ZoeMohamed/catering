import React from "react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { useCart } from "@/hooks/use-cart";
import { useQuery } from "@tanstack/react-query";
import { isStaticMode, mockPromos } from "@/lib/static-data";

function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code);
    alert(`Kode promo '${code}' berhasil disalin!`);
}

export default function Promo() {
    const { setIsCartOpen } = useCart();
    // Fetch promos from DB
    const { data: promosData, isLoading } = useQuery({
        queryKey: ["/api/promos"],
        queryFn: async () => {
            if (isStaticMode) {
                return { promos: mockPromos };
            }
            return (await fetch("/api/promos")).json();
        },
    });
    const promos = Array.isArray(promosData?.promos) ? promosData.promos : [];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                onLoginClick={() => { }}
                onCartClick={() => setIsCartOpen(true)}
                searchQuery={""}
                onSearchChange={() => { }}
                onProfileClick={() => { }}
            />
            <div className="flex">
                {/* Sidebar */}
                <Sidebar selectedCategory={null} onCategorySelect={() => { }} />
                {/* Main Content */}
                <main className="flex-1 lg:ml-0">
                    <div className="container mx-auto px-4 py-6">
                        <h1 className="text-3xl font-bold mb-4">Promo & Voucher</h1>
                        <p className="text-gray-700 mb-6">Dapatkan promo menarik berikut ini! Salin kode dan gunakan saat checkout.</p>
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">Memuat promo...</div>
                        ) : promos.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Belum ada promo aktif.</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {promos.map((promo: any) => (
                                    <div key={promo.id} className="bg-white rounded-xl shadow p-6 flex flex-col border border-gray-100 hover:shadow-lg transition-shadow">
                                        <div className="mb-2">
                                            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full mb-2">Voucher</span>
                                            <h2 className="text-lg font-bold text-gray-800 mb-1">{promo.title}</h2>
                                            <p className="text-gray-600 text-sm mb-2">{promo.description}</p>
                                        </div>
                                        <div className="flex items-center mb-3">
                                            <span className="bg-gray-100 text-primary font-mono px-3 py-1 rounded-lg text-base tracking-widest mr-2">{promo.code}</span>
                                            <button
                                                onClick={() => copyToClipboard(promo.code)}
                                                className="ml-auto bg-primary text-white px-3 py-1 rounded hover:bg-primary/90 text-xs font-semibold transition-colors"
                                            >
                                                Salin Kode
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-auto">
                                            Berlaku hingga: {promo.endDate ? new Date(promo.endDate).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
} 
