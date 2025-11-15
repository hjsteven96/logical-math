import { formatFullDate } from "@/lib/date";
import { gradeNumberToLabel } from "@/lib/grade";

export type RecordListItem = {
  id: number;
  memo: string | null;
  attendanceStatus: string;
  homeworkStatus: string;
  student: {
    name: string;
    gradeNumber: number;
  };
  lessonDay: {
    date: Date;
  };
};

export function RecentMemos({ records }: { records: RecordListItem[] }) {
  return (
    <div className="glass-panel flex flex-col gap-3 px-6 py-4">
      <p className="text-base font-semibold text-slate-800">최근 메모</p>
      <div className="flex flex-col gap-3">
        {records.map((record) => (
          <div
            key={record.id}
            className="rounded-2xl border border-slate-100 px-3 py-2 text-sm"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {record.student.name} · {gradeNumberToLabel(record.student.gradeNumber)}
              </span>
              <span>{formatFullDate(record.lessonDay.date)}</span>
            </div>
            <p className="text-slate-700">{record.memo || "메모 없음"}</p>
            <div className="mt-1 flex gap-2 text-[11px] font-semibold uppercase tracking-wide">
              <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-slate-700">
                {record.attendanceStatus}
              </span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-600">
                {record.homeworkStatus}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
