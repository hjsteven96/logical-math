"use client";

import { useFormState } from "react-dom";
import { upsertDailyRecordAction } from "@/app/(dashboard)/records/actions";
import {
  attendanceStatuses,
  homeworkStatuses,
  attendanceStatusLabels,
  homeworkStatusLabels,
} from "@/constants/status";
import { formatFullDate } from "@/lib/date";

const initialState = { success: false, message: "" };

type LessonDayOption = {
  id: number;
  date: Date;
  weekLabel?: string | null;
};

type Props = {
  studentId: number;
  lessonDays: LessonDayOption[];
};

export function DailyRecordForm({ studentId, lessonDays }: Props) {
  const [state, formAction] = useFormState(upsertDailyRecordAction, initialState);

  return (
    <form action={formAction} className="glass-panel flex flex-col gap-3 px-6 py-4 text-sm">
      <input type="hidden" name="studentId" value={studentId} />
      <p className="text-base font-semibold text-slate-800">출결 / 숙제 입력</p>
      <label className="flex flex-col gap-1 text-slate-600">
        수업일
        <select
          name="lessonDayId"
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
        >
          {lessonDays.map((lessonDay) => (
            <option key={lessonDay.id} value={lessonDay.id}>
              {lessonDay.weekLabel || formatFullDate(lessonDay.date)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        출석 상태
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
        숙제 상태
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
          placeholder="학습 피드백을 입력하세요."
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
        className="rounded-xl bg-slate-900 py-2 text-white transition hover:bg-slate-800"
      >
        저장
      </button>
    </form>
  );
}
