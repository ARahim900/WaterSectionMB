import React, { useState, useMemo } from 'react';
import { YM } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { MONTH_INDEX } from '../utils/dataUtils';

interface MonthPickerProps {
  allMonths: YM[];
  selectedYm: YM;
  onSelectMonth: (ym: YM) => void;
  onClose: () => void;
  minMonth?: YM;
  maxMonth?: YM;
}

const MONTH_NAMES = Object.keys(MONTH_INDEX);

export const MonthPicker: React.FC<MonthPickerProps> = ({
  allMonths,
  selectedYm,
  onSelectMonth,
  onClose,
  minMonth,
  maxMonth,
}) => {
  const [displayYear, setDisplayYear] = useState(selectedYm?.y || new Date().getFullYear());

  const availableMonthsMap = useMemo(() => {
    const map = new Map<string, YM>();
    allMonths.forEach(ym => map.set(`${ym.y}-${ym.m}`, ym));
    return map;
  }, [allMonths]);

  const handleMonthClick = (monthIndex: number) => {
    const ym = { y: displayYear, m: monthIndex };
    onSelectMonth(ym);
  };

  const availableYears = useMemo(() => [...new Set(allMonths.map(m => m.y))], [allMonths]);
  const minYear = availableYears[0];
  const maxYear = availableYears[availableYears.length - 1];

  return (
    <>
      <div className="fixed inset-0 bg-black/10 z-40" onClick={onClose} />
      <Card className="absolute top-full mt-2 w-72 bg-white shadow-xl z-50 p-3">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="icon" onClick={() => setDisplayYear(y => y - 1)} disabled={displayYear <= minYear}>
            &lt;
          </Button>
          <span className="font-semibold text-gray-800">{displayYear}</span>
          <Button variant="ghost" size="icon" onClick={() => setDisplayYear(y => y + 1)} disabled={displayYear >= maxYear}>
            &gt;
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {MONTH_NAMES.map((monthName, index) => {
            const monthNumber = index + 1;
            const currentYm = { y: displayYear, m: monthNumber };
            const isAvailable = availableMonthsMap.has(`${displayYear}-${monthNumber}`);
            
            let isDisabled = !isAvailable;
            if (minMonth && (displayYear < minMonth.y || (displayYear === minMonth.y && monthNumber < minMonth.m))) {
              isDisabled = true;
            }
            if (maxMonth && (displayYear > maxMonth.y || (displayYear === maxMonth.y && monthNumber > maxMonth.m))) {
              isDisabled = true;
            }

            const isSelected = selectedYm?.y === displayYear && selectedYm?.m === monthNumber;

            return (
              <button
                key={monthName}
                disabled={isDisabled}
                onClick={() => handleMonthClick(monthNumber)}
                className={`p-2 rounded-md text-sm text-center transition-colors
                  ${isSelected ? 'bg-gray-900 text-white font-semibold' : ''}
                  ${!isSelected && !isDisabled ? 'hover:bg-gray-100' : ''}
                  ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'}
                `}
              >
                {monthName}
              </button>
            );
          })}
        </div>
      </Card>
    </>
  );
};
