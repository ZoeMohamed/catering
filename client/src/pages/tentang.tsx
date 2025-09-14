import React from "react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { useCart } from "@/hooks/use-cart";

export default function Tentang() {
    const { setIsCartOpen } = useCart();
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header
                onLoginClick={() => { }}
                onCartClick={() => setIsCartOpen(true)}
                searchQuery={""}
                onSearchChange={() => { }}
                onProfileClick={() => { }}
            />
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <Sidebar
                    selectedCategory={null}
                    onCategorySelect={() => { }}
                />
                {/* Main Content */}
                <main className="flex-1 lg:ml-0 overflow-y-auto">
                    <div className="container mx-auto px-4 py-6">
                        <img src="/src/assets/catering.jpg" alt="Cateringaja" className="w-full h-48 object-cover mb-4 rounded-lg" />
                        <h1 className="text-3xl font-bold mb-4">Tentang Kami</h1>
                        <p className="text-gray-700 mb-6">PT. Cateringaja Indonesia adalah perusahaan layanan & produksi jasa boga yang didirikan
                            pada tahun 2018 di Gading Serpong, Tangerang. Cateringaja dilengkapi sarana operasional
                            yang lengkap dengan SDM yang berpengalaman tinggi di bidang perhotelan, nutrisi,
                            pengolahan & penyediaan makanan. Kami memberikan yang terbaik untuk klien kami dengan
                            mengutamakan kualitas, keamanan pangan, nutrisi & higienitas.</p>
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-2">Visi</h2>
                            <p className="text-gray-700 mb-4">Menjadi layanan katering baik dalam sekala nasional maupun internasional yang dipercaya
                                setiap segmen baik individu maupun korporat.</p>
                            <h2 className="text-xl font-semibold mb-2">Misi</h2>
                            <ul className="list-disc pl-6 text-gray-700 mb-4">
                                <li>Menghadirkan kebebasan memilih menu sesuai selera</li>
                                <li>Memberikan kualitas premium dengan harga paling bersaing.</li>
                                <li>Melayani dengan kecepatan dan ketepatan waktu.</li>
                                <li>Menjadi mitra andalan individu & perusahaan.</li>
                                <li>Mengembangkan inovasi menu berdasarkan preferensi segmen.</li>
                            </ul>
                            <h2 className="text-xl font-semibold mb-2">Kontak</h2>
                            <p className="text-gray-700">Email: sales@cateringaja.com</p>
                            <p className="text-gray-700">Telepon: +6285945005007</p>
                            <h2 className="text-xl font-semibold mb-2">Coorporate Office 1</h2>
                            <p className="text-gray-700">Ruko Sentra Gading Blok SG 3 No. 5, Pakulonan Bar., Kec. Klp. Dua, Kabupaten Tangerang,
                                Banten 15810</p>
                            <h2 className="text-xl font-semibold mb-2">Coorporate Office 2</h2>
                            <p className="text-gray-700">Ruko Maggiore Grande, Blok I Jl. Springs Boulevard No. 3, Gading, Kec. Serpong, Kabupaten
                                Tangerang, Banten 15332</p>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
} 