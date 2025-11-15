import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { studentScope, dailyRecordScope } from "@/lib/scope";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  WeeklyPerformance,
  type WeeklySummary,
} from "@/components/dashboard/weekly-performance";
import { RecentMemos } from "@/components/dashboard/recent-memos";
import { gradeNumberToLabel } from "@/lib/grade";

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/login");
  }

  const userId = Number(session.user.id);
  const role = session.user.role;
  const studentFilter = studentScope(userId, role);
  const recordFilter = dailyRecordScope(userId, role);

  // 현재 날짜 기준 해당 월
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [
    totalStudents,
    inactiveStudents,
    recordData,
    lessonDays,
    recentRecords,
    attentionStudents,
  ] = await Promise.all([
    prisma.student.count({ where: studentFilter }),
    prisma.student.count({ where: { ...studentFilter, isActive: false } }),
    prisma.dailyRecord.findMany({
      where: {
        ...recordFilter,
      },
      include: { lessonDay: true },
    }),
    prisma.lessonDay.findMany({
      where: {
        year: currentYear,
        month: currentMonth,
      },
      include: {
        dailyRecords: {
          where: recordFilter,
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.dailyRecord.findMany({
      where: recordFilter,
      include: {
        student: { select: { id: true, name: true, gradeNumber: true } },
        lessonDay: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.student.findMany({
      where: {
        ...studentFilter,
        records: {
          some: {
            attendanceStatus: "ABSENT",
          },
        },
      },
      include: {
        records: {
          orderBy: { lessonDay: { date: "desc" } },
          take: 1,
          include: { lessonDay: true },
        },
      },
      take: 5,
    }),
  ]);

  const attendanceScore =
    recordData.filter((record) => record.attendanceStatus === "PRESENT")
      .length / Math.max(recordData.length, 1);
  const homeworkScore =
    recordData.filter((record) => record.homeworkStatus === "SUBMITTED")
      .length / Math.max(recordData.length, 1);

  const weeklySummaries: WeeklySummary[] = lessonDays.map((day) => {
    const total = day.dailyRecords.length || 1;
    return {
      id: day.id,
      date: day.date,
      weekLabel: day.weekLabel,
      presentCount: day.dailyRecords.filter(
        (record) => record.attendanceStatus === "PRESENT"
      ).length,
      lateCount: day.dailyRecords.filter(
        (record) => record.attendanceStatus === "LATE"
      ).length,
      absentCount: day.dailyRecords.filter(
        (record) => record.attendanceStatus === "ABSENT"
      ).length,
      homeworkSubmitted: day.dailyRecords.filter(
        (record) => record.homeworkStatus === "SUBMITTED"
      ).length,
      totalStudents: total,
    };
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="총 학생 수"
          value={`${totalStudents.toLocaleString()}명`}
          description="담당 학생 전체"
        />
        <StatCard
          title="활성 학생"
          value={`${totalStudents - inactiveStudents}명`}
          description="수업 중인 학생"
          accent="accent"
        />
        <StatCard
          title="최근 출석률"
          value={`${Math.round(attendanceScore * 100)}%`}
          description="DailyRecord 기준"
        />
        <StatCard
          title="숙제 제출률"
          value={`${Math.round(homeworkScore * 100)}%`}
          description="DailyRecord 기준"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyPerformance summaries={weeklySummaries} />
        </div>
        <div className="glass-panel px-6 py-4">
          <p className="mb-4 text-base font-semibold text-slate-800">
            케어 알림
          </p>
          <div className="flex flex-col gap-3 text-sm">
            {attentionStudents.length === 0 ? (
              <p className="text-slate-500">특이사항이 없습니다.</p>
            ) : (
              attentionStudents.map((student) => (
                <div
                  key={student.id}
                  className="rounded-2xl border border-rose-100 bg-rose-50/80 px-3 py-2"
                >
                  <p className="font-semibold text-slate-900">
                    {student.name} · {gradeNumberToLabel(student.gradeNumber)}
                  </p>
                  {student.records[0]?.lessonDay ? (
                    <p className="text-xs text-rose-500">
                      최근 결석 :{" "}
                      {student.records[0].lessonDay.date.toLocaleDateString("ko")}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <RecentMemos records={recentRecords} />
        <div className="glass-panel px-6 py-4">
          <p className="text-base font-semibold text-slate-800">빠른 작업</p>
          <div className="mt-4 grid gap-3 text-sm">
            <Link
              href="/students"
              className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              학생 리스트 확인
            </Link>
            <Link
              href="/lesson-board"
              className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              주간 출결 업데이트
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
