import { useState, useEffect } from 'react';

const getInitialArea = (): string => {
    return localStorage.getItem('selectedArea') || "";
};

const getInitialDate = (): Date => {
    const savedDate = localStorage.getItem('selectedDate');
    return savedDate ? new Date(savedDate) : new Date();
};

export function useAreaDate() {
    const [selectedArea, setSelectedArea] = useState<string>(getInitialArea);
    const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate);

    useEffect(() => {
        localStorage.setItem('selectedArea', selectedArea);
    }, [selectedArea]);

    useEffect(() => {
        localStorage.setItem('selectedDate', selectedDate.toISOString());
    }, [selectedDate]);

    const handleAreaChange = (area: string) => {
        console.log('Area changed to:', area);
        setSelectedArea(area);
    };

    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            console.log('Date changed to:', date.toDateString());
            setSelectedDate(date);
        }
    };

    return {
        selectedArea,
        selectedDate,
        onAreaChange: handleAreaChange,
        onDateChange: handleDateChange,
    };
} 