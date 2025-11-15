import { formatFullDate } from "@/lib/date";

type Record = {
  id: number;
  lessonDay: { date: Date; weekLabel?: string | null };
  attendanceStatus: string;
  homeworkStatus: string;
  memo: string | null;
  teacher?: { name: string | null };
};

export function RecordTimeline({ records }: { records: Record[] }) {
  return (
    <div className="glass-panel px-6 py-4">
      <p className="mb-3 text-base font-semibold text-slate-800">최근 활동</p>
      <div className="space-y-3">
        {records.map((record) => (
          <div
            key={record.id}
            className="rounded-2xl border border-slate-100 px-4 py-3 text-sm"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {record.lessonDay.weekLabel || formatFullDate(record.lessonDay.date)}
              </span>
              <span>{formatFullDate(record.lessonDay.date)}</span>
            </div>
            <p className="font-medium text-slate-800">
              {record.memo || "메모 없음"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
              <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-slate-700">
                {record.attendanceStatus}
              </span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-600">
                {record.homeworkStatus}
              </span>
              {record.teacher?.name ? (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-600">
                  by {record.teacher.name}
                </span>
              ) : null}
            </div>
          </div>
        ))}
        {records.length === 0 ? (
          <p className="text-sm text-slate-500">기록이 없습니다.</p>
        ) : null}
      </div>
    </div>
  );
}
