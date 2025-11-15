"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { updateScheduleSettingAction, type ScheduleActionState } from "@/app/(dashboard)/teachers/actions";
import { minutesToTimeString } from "@/lib/time";
import { WEEKDAY_LABELS } from "@/lib/schedule";

const initialState: ScheduleActionState = {
  success: false,
  message: "",
};

type Props = {
  defaultSetting: {
    weekdays: number[];
    startTimeMinutes: number;
    endTimeMinutes: number;
    lessonDurationMinutes: number;
    breakDurationMinutes: number;
  };
  onSubmitted?: () => void;
};

export function ScheduleSettingForm({ defaultSetting, onSubmitted }: Props) {
  const [state, formAction] = useActionState(updateScheduleSettingAction, initialState);
  const weekdaySet = new Set(defaultSetting.weekdays);

  useEffect(() => {
    if (state.success && onSubmitted) {
      onSubmitted();
    }
  }, [state.success, onSubmitted]);

  return (
    <form action={formAction} className="flex flex-col gap-4 text-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-slate-600">
          시작 시간
          <input
            type="time"
            name="startTime"
            defaultValue={minutesToTimeString(defaultSetting.startTimeMinutes)}
            className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-slate-600">
          종료 시간
          <input
            type="time"
            name="endTime"
            defaultValue={minutesToTimeString(defaultSetting.endTimeMinutes)}
            className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
            required
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-slate-600">
          수업 길이 (분)
          <input
            type="number"
            name="lessonDurationMinutes"
            min={30}
            max={180}
            defaultValue={defaultSetting.lessonDurationMinutes}
            className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-slate-600">
          쉬는 시간 (분)
          <input
            type="number"
            name="breakDurationMinutes"
            min={0}
            max={60}
            defaultValue={defaultSetting.breakDurationMinutes}
            className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
            required
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {WEEKDAY_LABELS.map((label, index) => (
          <label
            key={label}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
          >
            <input
              type="checkbox"
              name="weekdays"
              value={index}
              defaultChecked={weekdaySet.has(index)}
              className="h-4 w-4 rounded border-slate-300"
            />
            {label}
          </label>
        ))}
      </div>
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
        className="rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        설정 저장
      </button>
    </form>
  );
}
