"use client";

import { signIn } from "next-auth/react";
import { useState, FormEvent } from "react";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsLoading(true);
    setError(null);

    const response = await signIn("credentials", {
      redirect: false,
      email: formData.get("email"),
      password: formData.get("password"),
      callbackUrl: "/",
    });

    setIsLoading(false);

    if (response?.error) {
      setError("로그인 정보가 일치하지 않습니다.");
      return;
    }

    window.location.href = "/";
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel flex w-full max-w-md flex-col gap-4 px-6 py-8"
    >
      <div>
        <p className="text-sm font-medium text-slate-500">Logical Math</p>
        <p className="text-2xl font-semibold text-slate-900">
          백오피스 로그인
        </p>
      </div>
      <label className="flex flex-col gap-1 text-sm text-slate-600">
        이메일
        <input
          name="email"
          type="email"
          className="rounded-xl border border-slate-200 px-4 py-2 focus:border-slate-900 focus:outline-none"
          placeholder="admin@logicalmath.kr"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-600">
        비밀번호
        <input
          name="password"
          type="password"
          className="rounded-xl border border-slate-200 px-4 py-2 focus:border-slate-900 focus:outline-none"
          placeholder="********"
          required
        />
      </label>
      {error ? (
        <p className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isLoading}
        className="rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {isLoading ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
