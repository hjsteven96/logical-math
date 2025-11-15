"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { updateStudentAction } from "@/app/(dashboard)/students/actions";
import { gradeNumberToLabel } from "@/lib/grade";

const initialState = { success: false, message: "" };

type Props = {
  studentId: number;
  defaultValues: {
    name: string;
    gradeNumber: number;
    school: string | null;
    isActive: boolean;
    isOnline: boolean;
  };
  isAdmin: boolean;
  onSubmitted?: () => void;
};

export function UpdateStudentForm({
  studentId,
  defaultValues,
  isAdmin,
  onSubmitted,
}: Props) {
  const [state, formAction] = useFormState(updateStudentAction, initialState);

  useEffect(() => {
    if (state.success && onSubmitted) {
      onSubmitted();
    }
  }, [state.success, onSubmitted]);

  if (!isAdmin) {
    return null;
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 text-sm"
    >
      <input type="hidden" name="studentId" value={studentId} />
    
      <label className="flex flex-col gap-1 text-slate-600">
        이름
        <input
          name="name"
          defaultValue={defaultValues.name}
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        학년
        <select
          name="gradeNumber"
          defaultValue={defaultValues.gradeNumber}
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
        >
          {Array.from({ length: 12 }).map((_, index) => {
            const gradeNumber = index + 1;
            return (
              <option key={gradeNumber} value={gradeNumber}>
                {gradeNumberToLabel(gradeNumber)}
              </option>
            );
          })}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        학교
        <input
          name="school"
          defaultValue={defaultValues.school || ""}
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
        />
      </label>
      <label className="flex items-center gap-2 text-slate-600">
        <input
          type="checkbox"
          name="isActive"
          value="true"
          defaultChecked={defaultValues.isActive}
          className="h-4 w-4 rounded border-slate-300"
        />
        활동 중
      </label>
      <label className="flex items-center gap-2 text-slate-600">
        <input
          type="checkbox"
          name="isOnline"
          value="true"
          defaultChecked={defaultValues.isOnline}
          className="h-4 w-4 rounded border-slate-300"
        />
        온라인 학생
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
