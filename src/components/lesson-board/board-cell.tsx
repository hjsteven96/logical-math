"use client";

import { useRecordSelection } from "@/hooks/use-record-selection";
import { cn } from "@/lib/utils";
import {
  attendanceStatusLabels,
  homeworkStatusLabels,
} from "@/constants/status";

type Props = {
  studentId: number;
  studentName: string;
  lessonDayId: number;
  lessonLabel: string;
  attendanceStatus?: string;
  homeworkStatus?: string;
};

const statusClassMap: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  LATE: "bg-amber-100 text-amber-700",
  ABSENT: "bg-rose-100 text-rose-700",
  NONE: "bg-slate-100 text-slate-500",
};

export function BoardCell({
  studentId,
  studentName,
  lessonDayId,
  lessonLabel,
  attendanceStatus = "NONE",
  homeworkStatus = "NO_HOMEWORK",
}: Props) {
  const { setSelection } = useRecordSelection();

  return (
    <button
      type="button"
      onClick={() =>
        setSelection({
          studentId,
          studentName,
          lessonDayId,
          lessonLabel,
        })
      }
      className={cn(
        "flex h-16 w-full flex-col items-center justify-center rounded-xl border border-transparent text-xs font-semibold transition hover:-translate-y-0.5 hover:border-slate-900",
        statusClassMap[attendanceStatus] || statusClassMap.NONE
      )}
    >
      <span>{attendanceStatusLabels[attendanceStatus] || attendanceStatus}</span>
      <span className="text-[10px] text-slate-500">
        {homeworkStatusLabels[homeworkStatus] || homeworkStatus}
      </span>
    </button>
  );
}
