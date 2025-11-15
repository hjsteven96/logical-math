"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { createTeacherAction } from "@/app/(dashboard)/teachers/actions";

const initialState = {
  success: false,
  message: "",
};

type Props = {
  onSubmitted?: () => void;
};

export function CreateTeacherForm({ onSubmitted }: Props) {
  const [state, formAction] = useFormState(createTeacherAction, initialState);

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
      <label className="flex flex-col gap-1 text-slate-600">
        이름
        <input
          name="name"
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
          placeholder="김로지"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        이메일
        <input
          type="email"
          name="email"
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
          placeholder="teacher@example.com"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        초기 비밀번호
        <input
          type="password"
          name="password"
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
          placeholder="8자 이상 영문/숫자"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        휴대폰 번호
        <input
          name="phone"
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
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        메모
        <textarea
          name="memo"
          rows={3}
          className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
          placeholder="과목 / 특이사항 등"
        />
      </label>
      <label className="flex flex-col gap-1 text-slate-600">
        상태
        <select
          name="isActive"
          defaultValue="true"
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
