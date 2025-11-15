"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { createStudentAction } from "@/app/(dashboard)/students/actions";
import { gradeNumberToLabel } from "@/lib/grade";

const initialState = {
  success: false,
  message: "",
};

type Teacher = {
  id: number;
  name: string;
};

type Props = {
  teachers: Teacher[];
  onSubmitted?: () => void;
};

export function CreateStudentForm({ teachers, onSubmitted }: Props) {
  const [state, formAction] = useFormState(createStudentAction, initialState);

  useEffect(() => {
    if (state.success && onSubmitted) {
      onSubmitted();
    }
  }, [state.success, onSubmitted]);

  return (
    <form action={formAction} className="flex flex-col gap-3 text-sm">
      <label className="flex flex-col gap-1 text-slate-600">
        이름
        <input
          name="name"
          placeholder="홍길동"
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        학년
        <select
          name="gradeNumber"
          defaultValue={10}
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
          required
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
          placeholder="로지컬고등학교"
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
        />
      </label>
      <label className="flex items-center gap-2 text-slate-600">
        <input
          type="checkbox"
          name="isOnline"
          value="true"
          defaultChecked={true}
          className="h-4 w-4 rounded border-slate-300"
        />
        온라인 학생
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        담당 선생님
        <select
          name="teacherId"
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
        >
          <option value="">지정 안함</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </select>
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
