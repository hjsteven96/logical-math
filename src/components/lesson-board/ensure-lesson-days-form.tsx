"use client";

import { useFormState } from "react-dom";
import { ensureLessonDaysAction } from "@/app/(dashboard)/lesson-board/actions";

const initialState = { success: false, message: "" };

export function EnsureLessonDaysForm({
  defaultYear,
  defaultMonth,
  isAdmin,
}: {
  defaultYear: number;
  defaultMonth: number;
  isAdmin: boolean;
}) {
  const [state, formAction] = useFormState(ensureLessonDaysAction, initialState);

  if (!isAdmin) {
    return null;
  }

  return (
    <form action={formAction} className="glass-panel flex flex-col gap-3 px-6 py-4 text-sm">
      <p className="text-base font-semibold text-slate-800">월 주차 생성</p>
      <label className="flex flex-col gap-1 text-slate-600">
        연도
        <input
          type="number"
          name="year"
          defaultValue={defaultYear}
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        월
        <input
          type="number"
          name="month"
          min={1}
          max={12}
          defaultValue={defaultMonth}
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
        생성
      </button>
    </form>
  );
}
