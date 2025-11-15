import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
  });

  const baseNav = [
    { label: "대시보드", href: "/" },
    { label: "학생 목록", href: "/students" },
    { label: "수업 캘린더", href: "/lesson-board" },
  ];

  const navItems = [
    ...baseNav,
    ...(session.user.role === "ADMIN"
      ? [
          { label: "선생님 관리", href: "/teachers" },
          { label: "수업 관리", href: "/lesson-management" },
        ]
      : []),
    ...(session.user.role === "TEACHER"
      ? [{ label: "일정 등록", href: "/my-schedule" }]
      : []),
  ];

  return (
    <div className="flex bg-slate-50">
      <Sidebar
        navItems={navItems}
        userName={user?.name || session.user.name || "담당자"}
        userEmail={user?.email || session.user.email || ""}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
