"use client";

import { useState } from "react";
import { createNextMonthAction } from "@/app/(dashboard)/lesson-board/actions";
import { useRouter } from "next/navigation";

type Props = {
  currentYear: number;
  currentMonth: number;
};

export function CreateNextMonthButton({ currentYear, currentMonth }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // 다음 달 계산
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("year", nextYear.toString());
      formData.append("month", nextMonth.toString());
      
      const result = await createNextMonthAction({ success: false }, formData);
      
      if (result.success) {
        const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
        router.push(`/lesson-board?month=${nextMonthStr}`);
        router.refresh();
      }
    } catch (error) {
      console.error("주차 생성 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "생성 중..." : "다음 주차 만들기"}
    </button>
  );
}

