"use client";

import { useMemo, useState } from "react";

type Props = {
  defaultValue: string;
  name: string;
};

export function MonthSelector({ defaultValue, name }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = useMemo(() => {
    if (value) {
      const [year, month] = value.split("-");
      return `${year}년 ${parseInt(month, 10)}월`;
    }
    const now = new Date();
    return `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
  }, [value]);

  return (
    <div className="relative inline-block min-w-[140px]">
      <input
        type="month"
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        required
      />
      <div
        className={`pointer-events-none rounded-xl border bg-white px-3 py-2 text-slate-900 ${
          isFocused ? "border-slate-900" : "border-slate-200"
        }`}
      >
        {displayValue}
      </div>
    </div>
  );
}
