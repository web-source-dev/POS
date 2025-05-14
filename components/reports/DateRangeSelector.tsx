"use client";

import { FC, useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DATE_RANGES, getDateRange } from '@/services/reportService';

interface DateRangeSelectorProps {
  onDateRangeChange: (range: { startDate: string; endDate: string }) => void;
  className?: string;
}

const DateRangeSelector: FC<DateRangeSelectorProps> = ({
  onDateRangeChange,
  className,
}) => {
  const [selectedRange, setSelectedRange] = useState<string>(DATE_RANGES.THIS_MONTH);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  // Use a ref to track initialization
  const isInitialized = useRef(false);

  // Handle predefined range selection
  const handleRangeChange = (value: string) => {
    setSelectedRange(value);

    if (value !== DATE_RANGES.CUSTOM) {
      const newRange = getDateRange(value);
      onDateRangeChange(newRange);

      // Also update the calendar
      setDateRange({
        from: new Date(newRange.startDate),
        to: new Date(newRange.endDate),
      });
    }
  };

  // Handle custom date range selection
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range);
      setSelectedRange(DATE_RANGES.CUSTOM);

      const customRange = {
        startDate: format(range.from, 'yyyy-MM-dd'),
        endDate: format(range.to, 'yyyy-MM-dd'),
      };

      onDateRangeChange(customRange);
    }
  };

  // Initialize with default range - only run once when component mounts
  useEffect(() => {
    if (!isInitialized.current) {
      const initialRange = getDateRange(selectedRange);
      onDateRangeChange(initialRange);
      setDateRange({
        from: new Date(initialRange.startDate),
        to: new Date(initialRange.endDate),
      });
      isInitialized.current = true;
    }
  }, [onDateRangeChange, selectedRange]);

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Select value={selectedRange} onValueChange={handleRangeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DATE_RANGES.TODAY}>Today</SelectItem>
          <SelectItem value={DATE_RANGES.YESTERDAY}>Yesterday</SelectItem>
          <SelectItem value={DATE_RANGES.THIS_WEEK}>This Week</SelectItem>
          <SelectItem value={DATE_RANGES.LAST_WEEK}>Last Week</SelectItem>
          <SelectItem value={DATE_RANGES.THIS_MONTH}>This Month</SelectItem>
          <SelectItem value={DATE_RANGES.LAST_MONTH}>Last Month</SelectItem>
          <SelectItem value={DATE_RANGES.THIS_YEAR}>This Year</SelectItem>
          <SelectItem value={DATE_RANGES.CUSTOM}>Custom Range</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateRangeChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangeSelector; 