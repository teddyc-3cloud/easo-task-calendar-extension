import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DateInputProps {
  value: string; // yyyy-mm-dd形式または空
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  compact?: boolean; // コンパクトモード（締切用）
  theme?: 'dark' | 'light';
}

// テーマカラー
const themes = {
  dark: {
    inputBg: '#2a2a2a',
    inputText: '#fff',
    inputBorder: '#555',
    buttonBg: '#3a3a3a',
    buttonText: '#ccc',
    calendarBg: '#2d2d30',
    calendarText: '#ccc',
    calendarHeaderText: '#fff',
    todayBg: '#404040',
    selectedBg: '#007acc',
    footerBg: '#333',
    footerText: '#aaa',
  },
  light: {
    inputBg: '#ffffff',
    inputText: '#333',
    inputBorder: '#ccc',
    buttonBg: '#f0f0f0',
    buttonText: '#555',
    calendarBg: '#ffffff',
    calendarText: '#333',
    calendarHeaderText: '#333',
    todayBg: '#e0e0e0',
    selectedBg: '#0066cc',
    footerBg: '#f5f5f5',
    footerText: '#666',
  },
};

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder = 'yyyy/mm/dd',
  style,
  compact = false,
  theme = 'dark',
}) => {
  const colors = themes[theme];
  const [showCalendar, setShowCalendar] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // value (yyyy-mm-dd) からdisplayValue (yyyy/mm/dd) に変換
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setDisplayValue(`${parts[0]}/${parts[1]}/${parts[2]}`);
        setCurrentMonth(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1));
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  // 外部クリックでカレンダーを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // displayValue (yyyy/mm/dd) からvalue (yyyy-mm-dd) に変換 - カレンダー選択用
  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
    setShowCalendar(false);
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    const selectedDate = value ? new Date(value) : null;

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

    return (
      <div style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 100,
        backgroundColor: colors.calendarBg,
        border: `1px solid ${colors.inputBorder}`,
        borderRadius: 4,
        padding: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        minWidth: 200,
      }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: colors.buttonText, cursor: 'pointer', padding: 4 }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 11, color: colors.calendarHeaderText, fontWeight: 600 }}>
            {year}年{month + 1}月
          </span>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: colors.buttonText, cursor: 'pointer', padding: 4 }}>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* 曜日 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 4 }}>
          {weekDays.map((wd, i) => (
            <div key={i} style={{
              textAlign: 'center',
              fontSize: 9,
              color: i === 0 ? '#e06060' : i === 6 ? '#6090e0' : '#888',
              padding: 2,
            }}>
              {wd}
            </div>
          ))}
        </div>

        {/* 日付 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {days.map((day, i) => {
            if (day === null) {
              return <div key={i} style={{ padding: 3 }} />;
            }
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const dayOfWeek = date.getDay();

            return (
              <button
                key={i}
                onClick={() => handleDateSelect(date)}
                style={{
                  padding: 3,
                  fontSize: 10,
                  backgroundColor: isSelected ? colors.selectedBg : isToday ? colors.todayBg : 'transparent',
                  color: isSelected ? '#fff' : dayOfWeek === 0 ? '#e06060' : dayOfWeek === 6 ? '#6090e0' : colors.calendarText,
                  border: 'none',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontWeight: isToday ? 600 : 400,
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* 今日ボタン */}
        <button
          onClick={() => handleDateSelect(new Date())}
          style={{
            width: '100%',
            marginTop: 6,
            padding: '3px 6px',
            backgroundColor: colors.footerBg,
            color: colors.footerText,
            border: `1px solid ${colors.inputBorder}`,
            borderRadius: 3,
            fontSize: 9,
            cursor: 'pointer',
          }}
        >
          今日
        </button>
      </div>
    );
  };

  const inputHeight = compact ? 24 : 28;
  const inputPadding = compact ? '0 6px' : '0 8px';
  const inputFontSize = 11; // 統一
  const buttonPadding = compact ? '0 6px' : '0 6px';

  const handleInputClick = () => {
    setShowCalendar(true);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', ...style }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <input
          type="text"
          value={displayValue}
          readOnly
          onClick={handleInputClick}
          placeholder={placeholder}
          style={{
            flex: 1,
            minWidth: 0,
            height: inputHeight,
            padding: inputPadding,
            fontSize: inputFontSize,
            backgroundColor: colors.inputBg,
            color: colors.inputText,
            border: `1px solid ${colors.inputBorder}`,
            borderRadius: '3px 0 0 3px',
            outline: 'none',
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          style={{
            height: inputHeight,
            padding: buttonPadding,
            backgroundColor: colors.buttonBg,
            color: colors.buttonText,
            border: `1px solid ${colors.inputBorder}`,
            borderLeft: 'none',
            borderRadius: '0 3px 3px 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          <Calendar size={compact ? 12 : 14} />
        </button>
      </div>
      {showCalendar && renderCalendar()}
    </div>
  );
};
