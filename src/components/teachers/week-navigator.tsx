"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type Props = {
  prevWeekHref: string;
  nextWeekHref: string;
  currentWeekLabel: string;
};

export function WeekNavigator({
  prevWeekHref,
  nextWeekHref,
  currentWeekLabel,
}: Props) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <Link
        href={prevWeekHref}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
        aria-label="이전 주"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <span className="font-semibold text-slate-700">{currentWeekLabel}</span>
      <Link
        href={nextWeekHref}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
        aria-label="다음 주"
      >
        <ChevronRight className="h-5 w-5" />
      </Link>
    </div>
  );
}

