"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { UserBadge } from "./user-badge";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
};

type Props = {
  navItems: NavItem[];
  userName: string;
  userEmail: string;
};

export function Sidebar({ navItems, userName, userEmail }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen flex-col border-r border-slate-200 bg-white/90 transition-all duration-300 md:flex",
        isCollapsed ? "w-16 items-center p-3" : "w-64 gap-6 p-6"
      )}
    >
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          aria-label="사이드바 펼치기"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold text-slate-900">
              로지컬수학
              <span className="block text-sm font-normal text-slate-500">
                학생관리 백오피스
              </span>
            </Link>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              aria-label="사이드바 접기"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          <SidebarNav items={navItems} isCollapsed={isCollapsed} />
          <div className="mt-auto">
            <UserBadge name={userName} email={userEmail} />
          </div>
        </>
      )}
    </aside>
  );
}

