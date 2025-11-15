"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

type Props = {
  name: string;
  email: string;
};

export function UserBadge({ name, email }: Props) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">{email}</p>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="로그아웃"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
