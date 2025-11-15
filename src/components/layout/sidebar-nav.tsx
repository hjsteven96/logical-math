"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
};

type Props = {
  items: NavItem[];
  isCollapsed?: boolean;
};

export function SidebarNav({ items, isCollapsed = false }: Props) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-xl text-sm font-medium transition-all",
              isCollapsed ? "px-2 py-2" : "px-4 py-2",
              isActive
                ? "bg-slate-100 text-slate-900 font-semibold"
                : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            {isCollapsed ? (
              <span className="block truncate text-center text-xs">
                {item.label.charAt(0)}
              </span>
            ) : (
              item.label
            )}
          </Link>
        );
      })}
    </nav>
  );
}
