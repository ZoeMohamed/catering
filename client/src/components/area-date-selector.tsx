import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { isStaticMode, mockAreas } from "@/lib/static-data";

// Helper to get dates for the next 365 days
const getDatesForOneYear = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        days.push(date);
    }
    return days;
};

const formatDate = (date: Date) => {
    const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(date);
    const day = date.getDate();
    return { dayName, day };
};

interface AreaDateSelectorProps {
    selectedArea: string;
    onAreaChange: (area: string) => void;
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    className?: string;
}

export default function AreaDateSelector({
    selectedArea,
    onAreaChange,
    selectedDate,
    onDateChange,
    className = ""
}: AreaDateSelectorProps) {
    const [dates, setDates] = useState<Date[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [datePage, setDatePage] = useState(0);
    const DATES_PER_PAGE = 5;

    // Ambil daftar area dari API (DB)
    const { data: areaData } = useQuery<{ areas: { id: number; name: string, slug: string }[] }>({
        queryKey: ["areas"],
        queryFn: async () => {
            if (isStaticMode) {
                return { areas: mockAreas };
            }
            const res = await fetch("/api/areas");
            return res.json();
        }
    });
    const areas = areaData?.areas || [];

    useEffect(() => {
        // Tampilkan tanggal untuk 1 tahun ke depan
        setDates(getDatesForOneYear());
    }, []);

    // Auto scroll to selected date when component mounts or date changes
    useEffect(() => {
        if (scrollContainerRef.current && dates.length > 0) {
            const selectedIndex = dates.findIndex(date => date.toDateString() === selectedDate.toDateString());
            if (selectedIndex >= 0) {
                const scrollContainer = scrollContainerRef.current;
                const dateWidth = 88; // Width of each date item (w-20 + gap)
                const containerWidth = scrollContainer.clientWidth;
                const scrollPosition = (selectedIndex * dateWidth) - (containerWidth / 2) + (dateWidth / 2);

                setTimeout(() => {
                    scrollContainer.scrollTo({
                        left: Math.max(0, scrollPosition),
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }
    }, [selectedDate, dates]);

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -200 : 200;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const handleDateClick = (date: Date) => {
        console.log('Date clicked:', date.toDateString());
        onDateChange(date);
    };

    // Untuk mobile: window tanggal
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
    const datesToShow = isMobile ? dates.slice(datePage * DATES_PER_PAGE, datePage * DATES_PER_PAGE + DATES_PER_PAGE) : dates;
    const canPrev = isMobile ? datePage > 0 : true;
    const canNext = isMobile ? (datePage + 1) * DATES_PER_PAGE < dates.length : true;

    return (
        <div className="w-full">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-full">
                {/* Area Selector */}
                <div className="p-3 sm:p-4 border-b border-gray-100">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Pilih Area</h2>
                    <Select value={selectedArea || "all"} onValueChange={val => onAreaChange(val === "all" ? "" : val)}>
                        <SelectTrigger id="area-select" className="w-full bg-white border-gray-200">
                            <SelectValue placeholder="Pilih Area" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua</SelectItem>
                            {areas.map(area => (
                                <SelectItem key={area.id} value={area.slug}>{area.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Selector */}
                <div className="p-2 sm:p-4 border-b border-gray-100">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                        Pilih Tanggal - {format(selectedDate, "MMMM yyyy", { locale: id })}
                    </h2>
                    <div className="flex items-center gap-2 w-full">
                        {/* Left Arrow Button */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => isMobile ? setDatePage(p => Math.max(0, p - 1)) : handleScroll('left')}
                            className="flex-shrink-0 h-10 w-10 rounded-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                            disabled={!canPrev}
                        >
                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                        </Button>

                        {/* Scrollable Date Container */}
                        <div
                            ref={scrollContainerRef}
                            className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 w-full py-2"
                            style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none'
                            }}
                        >
                            {datesToShow.map((date, index) => {
                                const { dayName, day } = formatDate(date);
                                const isSelected = selectedDate.toDateString() === date.toDateString();
                                const isToday = new Date().toDateString() === date.toDateString();
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                                return (
                                    <div
                                        key={index + datePage * DATES_PER_PAGE}
                                        onClick={() => handleDateClick(date)}
                                        className={`text-center p-2 rounded-xl border-2 flex-shrink-0 flex-1 h-14 sm:h-16 flex flex-col justify-center transition-all duration-200 transform cursor-pointer
                                            ${isSelected
                                                ? 'bg-blue-500 text-white border-blue-500 shadow-lg scale-105'
                                                : isToday
                                                    ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                                            }
                                            ${isWeekend && !isSelected && !isToday ? 'text-gray-400' : ''}
                                            hover:scale-102
                                        `}
                                    >
                                        <div className="text-xs sm:text-sm font-medium uppercase tracking-wide mb-1">
                                            {dayName.substring(0, 3)}
                                        </div>
                                        <div className="text-lg sm:text-xl font-bold leading-none">
                                            {day}
                                        </div>
                                        {isToday && !isSelected && (
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mx-auto mt-1.5"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Right Arrow Button */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => isMobile ? setDatePage(p => p + 1) : handleScroll('right')}
                            className="flex-shrink-0 h-10 w-10 rounded-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                            disabled={!canNext}
                        >
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                        </Button>
                    </div>
                </div>

                {/* Selected Info Display */}
                <div className="bg-gray-50 px-3 sm:px-4 py-1 sm:py-2 rounded-b-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm gap-1 sm:gap-0">
                        <span className="text-gray-600">
                            Area: <span className="font-medium text-gray-800 capitalize">{selectedArea ? selectedArea : 'Semua'}</span>
                        </span>
                        <span className="text-gray-600">
                            Tanggal: <span className="font-medium text-gray-800">{selectedDate.toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>
                        </span>
                    </div>
                </div>
            </div>
            <div className="mb-6" />
        </div>
    );
}
