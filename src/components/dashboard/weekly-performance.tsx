import { formatShortDate } from "@/lib/date";
import { toPercent } from "@/lib/utils";

export type WeeklySummary = {
  id: number;
  date: Date;
  weekLabel?: string | null;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  homeworkSubmitted: number;
  totalStudents: number;
};

export function WeeklyPerformance({ summaries }: { summaries: WeeklySummary[] }) {
  return (
    <div className="glass-panel w-full overflow-hidden px-6 py-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-base font-semibold text-slate-800">
          주차별 출결 · 숙제 현황
        </p>
        <span className="text-xs text-slate-500">
          {summaries.length > 0
            ? new Date(summaries[0].date).getFullYear() +
              "년 " +
              (new Date(summaries[0].date).getMonth() + 1) +
              "월"
            : "데이터 없음"}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-3 text-center text-xs font-medium text-slate-500">
        <span>주차</span>
        <span>출석률</span>
        <span>지각률</span>
        <span>결석률</span>
        <span>숙제완료</span>
      </div>
      {summaries.map((summary) => {
        const total = summary.totalStudents || 1;
        return (
          <div
            key={summary.id}
            className="mt-2 grid grid-cols-5 gap-3 rounded-2xl bg-slate-50/80 px-3 py-2 text-center text-sm"
          >
            <div>
              <p className="text-xs font-semibold text-slate-600">
                {summary.weekLabel || formatShortDate(summary.date)}
              </p>
              <p className="text-[10px] text-slate-400">
                {formatShortDate(summary.date)}
              </p>
            </div>
            <span className="font-semibold text-emerald-600">
              {toPercent(summary.presentCount / total, 0)}
            </span>
            <span className="font-semibold text-amber-500">
              {toPercent(summary.lateCount / total, 0)}
            </span>
            <span className="font-semibold text-rose-500">
              {toPercent(summary.absentCount / total, 0)}
            </span>
            <span className="font-semibold text-sky-600">
              {toPercent(summary.homeworkSubmitted / total, 0)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
