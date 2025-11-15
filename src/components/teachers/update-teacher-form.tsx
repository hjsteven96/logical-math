"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { updateTeacherAction } from "@/app/(dashboard)/teachers/actions";

const initialState = { success: false, message: "" };

type Props = {
  teacherId: number;
  defaultValues: {
    name: string;
    email: string;
    phone: string | null;
    age: number | null;
    memo: string | null;
    isActive: boolean;
  };
  onSubmitted?: () => void;
};

export function UpdateTeacherForm({
  teacherId,
  defaultValues,
  onSubmitted,
}: Props) {
  const [state, formAction] = useFormState(updateTeacherAction, initialState);

  useEffect(() => {
    if (state.success && onSubmitted) {
      onSubmitted();
    }
  }, [state.success, onSubmitted]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 text-sm"
    >
      <input type="hidden" name="teacherId" value={teacherId} />
      
      <label className="flex flex-col gap-1 text-slate-600">
        이름
        <input
          name="name"
          defaultValue={defaultValues.name}
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        이메일
        <input
          type="email"
          name="email"
          defaultValue={defaultValues.email}
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        비밀번호 변경 (선택)
        <input
          type="password"
          name="password"
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
          placeholder="변경하지 않으려면 비워두세요"
        />
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        휴대폰 번호
        <input
          name="phone"
          defaultValue={defaultValues.phone || ""}
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
          placeholder="010-0000-0000"
        />
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        나이
        <input
          name="age"
          type="number"
          min={0}
          defaultValue={defaultValues.age || ""}
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        메모
        <textarea
          name="memo"
          rows={3}
          defaultValue={defaultValues.memo || ""}
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
          placeholder="과목 / 특이사항 등"
        />
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        상태
        <select
          name="isActive"
          defaultValue={defaultValues.isActive ? "true" : "false"}
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
        >
          <option value="true">활성</option>
          <option value="false">비활성</option>
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

