import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { studentScope } from "@/lib/scope";
import { formatShortDate } from "@/lib/date";
import { BoardCell } from "@/components/lesson-board/board-cell";
import { BoardRecordForm } from "@/components/lesson-board/board-record-form";
import { MonthSelector } from "@/components/lesson-board/month-selector";
import { CreateNextMonthButton } from "@/components/lesson-board/create-next-month-button";

type PageProps = {
  searchParams?: Promise<{
    month?: string;
  }> | {
    month?: string;
  };
};

export default async function LessonBoardPage({ searchParams }: PageProps) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams instanceof Promise 
    ? await searchParams 
    : searchParams || {};

  const baseDate = resolvedSearchParams?.month
    ? new Date(`${resolvedSearchParams.month}-01`)
    : new Date();
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth() + 1;

  const lessonDays = await prisma.lessonDay.findMany({
    where: { year, month },
    orderBy: { date: "asc" },
  });

  const lessonDayIds = lessonDays.map((lessonDay) => lessonDay.id);

  const students = await prisma.student.findMany({
    where: studentScope(Number(session.user.id), session.user.role),
    include: {
      records: {
        where: lessonDayIds.length
          ? {
              lessonDayId: { in: lessonDayIds },
            }
          : undefined,
      },
    },
    orderBy: { name: "asc" },
  });

  const lessonOptions = lessonDays.map((lessonDay) => ({
    id: lessonDay.id,
    label: lessonDay.weekLabel || formatShortDate(lessonDay.date),
  }));

  const boardMonth = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_1fr]">
      <section className="space-y-4">
        <form className="glass-panel flex flex-wrap items-center gap-3 px-6 py-4 text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            조회 월
            <MonthSelector name="month" defaultValue={boardMonth} />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-white"
          >
            이동
          </button>
          {session.user.role === "ADMIN" && (
            <CreateNextMonthButton currentYear={year} currentMonth={month} />
          )}
        </form>

        <div className="glass-panel overflow-x-auto px-4 py-4">
          {lessonDays.length === 0 ? (
            <p className="text-sm text-slate-500">
              선택한 월에 등록된 주차가 없습니다. 우측에서 생성해주세요.
            </p>
          ) : (
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-auto px-1 py-2 text-left font-semibold text-slate-600">
                    학생
                  </th>
                  <th className="w-24 px-1 py-2"></th>
                  {lessonDays.map((lessonDay) => (
                    <th
                      key={lessonDay.id}
                      className="px-2 py-2 text-center text-xs font-semibold text-slate-500"
                    >
                      <span className="block">
                        {lessonDay.weekLabel || formatShortDate(lessonDay.date)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatShortDate(lessonDay.date)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  // 해당 월의 기록만 필터링
                  const monthRecords = student.records.filter((record) =>
                    lessonDayIds.includes(record.lessonDayId)
                  );

                  // 출석률 계산: 미입력(NONE) 제외, (출석 + 지각) / (출석 + 지각 + 결석)
                  const attendanceRecords = monthRecords.filter(
                    (r) => r.attendanceStatus !== "NONE"
                  );
                  const presentOrLate = attendanceRecords.filter(
                    (r) => r.attendanceStatus === "PRESENT" || r.attendanceStatus === "LATE"
                  ).length;
                  const attendanceRate =
                    attendanceRecords.length > 0
                      ? presentOrLate / attendanceRecords.length
                      : 0;

                  // 숙제 제출률 계산: 숙제 없음(NO_HOMEWORK) 제외
                  const homeworkRecords = monthRecords.filter(
                    (r) => r.homeworkStatus !== "NO_HOMEWORK"
                  );
                  const submitted = homeworkRecords.filter(
                    (r) => r.homeworkStatus === "SUBMITTED"
                  ).length;
                  const homeworkRate =
                    homeworkRecords.length > 0 ? submitted / homeworkRecords.length : 0;

                  return (
                    <tr key={student.id} className="border-b border-slate-100">
                      <td className="w-auto px-1 py-2 text-left">
                        <div className="font-semibold text-slate-800">{student.name}</div>
                      </td>
                      <td className="w-24 px-1 py-2 text-left">
                        <div className="text-xs text-slate-500">
                          <div>출석 {Math.round(attendanceRate * 100)}%</div>
                          <div>숙제 {Math.round(homeworkRate * 100)}%</div>
                        </div>
                      </td>
                    {lessonDays.map((lessonDay) => {
                      const record = student.records.find(
                        (item) => item.lessonDayId === lessonDay.id
                      );
                      return (
                        <td key={lessonDay.id} className="px-2 py-2">
                          <BoardCell
                            studentId={student.id}
                            studentName={student.name}
                            lessonDayId={lessonDay.id}
                            lessonLabel={
                              lessonDay.weekLabel ||
                              formatShortDate(lessonDay.date)
                            }
                            attendanceStatus={record?.attendanceStatus}
                            homeworkStatus={record?.homeworkStatus}
                          />
                        </td>
                      );
                    })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <BoardRecordForm lessonDays={lessonOptions} />
      </section>
    </div>
  );
}
