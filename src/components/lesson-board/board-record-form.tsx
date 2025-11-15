"use client";

import { useFormState } from "react-dom";
import { upsertDailyRecordAction } from "@/app/(dashboard)/records/actions";
import { useRecordSelection } from "@/hooks/use-record-selection";
import {
  attendanceStatuses,
  homeworkStatuses,
  attendanceStatusLabels,
  homeworkStatusLabels,
} from "@/constants/status";

const initialState = { success: false, message: "" };

type LessonDayOption = {
  id: number;
  label: string;
};

export function BoardRecordForm({ lessonDays }: { lessonDays: LessonDayOption[] }) {
  const { selection } = useRecordSelection();
  const [state, formAction] = useFormState(upsertDailyRecordAction, initialState);

  return (
    <form action={formAction} className="glass-panel flex flex-col gap-3 px-6 py-4 text-sm">
      <input type="hidden" name="studentId" value={selection.studentId ?? ""} />
      <input
        type="hidden"
        name="lessonDayId"
        value={selection.lessonDayId ?? lessonDays[0]?.id ?? ""}
      />
      <p className="text-base font-semibold text-slate-800">셀 빠른 수정</p>
      {selection.studentId ? (
        <p className="text-xs text-slate-500">
          {selection.studentName} · {selection.lessonLabel}
        </p>
      ) : (
        <p className="text-xs text-slate-400">학생/주차를 클릭해주세요.</p>
      )}
      <label className="flex flex-col gap-1 text-slate-600">
        출석
        <select
          name="attendanceStatus"
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
        >
          {attendanceStatuses.map((option) => (
            <option key={option} value={option}>
              {attendanceStatusLabels[option]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        숙제
        <select
          name="homeworkStatus"
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
        >
          {homeworkStatuses.map((option) => (
            <option key={option} value={option}>
              {homeworkStatusLabels[option]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        메모
        <textarea
          name="memo"
          rows={3}
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
        />
      </label>
      {state.message ? (
        <p
          className={`rounded-xl px-3 py-2 text-xs ${
            state.success
              ? "bg-emerald-50 text-emerald-600"
              : "bg-rose-50 text-rose-600"
          }`}
        >
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!selection.studentId || lessonDays.length === 0}
        className="rounded-xl bg-slate-900 py-2 text-white transition hover:bg-slate-800 disabled:opacity-40"
      >
        업데이트
      </button>
    </form>
  );
}
