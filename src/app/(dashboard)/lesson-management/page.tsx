import { redirect } from "next/navigation";
import { addDays, formatISO } from "date-fns";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeekRange, formatShortDate } from "@/lib/date";
import { LessonManagementCalendar } from "@/components/lesson-management/lesson-management-calendar";
import { ScheduleSettingButton } from "@/components/lesson-management/schedule-setting-button";

type SearchParams =
  | {
      week?: string;
    }
  | Promise<{
      week?: string;
    }>
  | undefined;

export default async function LessonManagementPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const resolvedSearch = (await searchParams) ?? {};
  const weekParam = resolvedSearch?.week;

  const weekStart = weekParam ? new Date(weekParam) : getWeekRange().start;
  const { start, end } = getWeekRange(weekStart);
  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(start, index);
    return {
      date: formatISO(date, { representation: "date" }),
      weekday: date.getDay(),
    };
  });

  // 활성 선생님 목록
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // 각 선생님의 해당 주간 일정 제출 여부 확인
  const teacherSubmissions = await Promise.all(
    teachers.map(async (teacher) => {
      const availabilityCount = await prisma.teacherWeeklyAvailability.count({
        where: {
          teacherId: teacher.id,
          date: {
            gte: start,
            lte: end,
          },
          isAvailable: true,
        },
      });
      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        hasSubmitted: availabilityCount > 0,
      };
    })
  );

  const notSubmittedTeachers = teacherSubmissions
    .filter((t) => !t.hasSubmitted)
    .map((t) => t.teacherName);

  // 수업 일정 조회 (DRAFT 상태)
  const lessonSchedules = await prisma.lessonSchedule.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
      status: "DRAFT",
    },
    include: {
      teacher: { select: { id: true, name: true } },
      student: { select: { id: true, name: true, gradeNumber: true } },
    },
    orderBy: [{ date: "asc" }, { startMinutes: "asc" }],
  });

  // 활성 학생 목록
  const students = await prisma.student.findMany({
    where: { isActive: true },
    select: { id: true, name: true, gradeNumber: true },
    orderBy: { name: "asc" },
  });

  // 스케줄 설정 조회
  const scheduleSetting = await prisma.scheduleSetting.findFirst();

  const prevWeekStart = formatISO(addDays(start, -7), { representation: "date" });
  const nextWeekStart = formatISO(addDays(start, 7), { representation: "date" });
  const currentWeekLabel = `${formatShortDate(start)} ~ ${formatShortDate(end)}`;

  return (
    <div className="space-y-6">
      <section className="glass-panel flex flex-col gap-4 px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-slate-500">수업 관리</p>
            <h1 className="text-2xl font-semibold text-slate-900">주간 수업 일정 배치</h1>
            <p className="mt-2 text-sm text-slate-500">
              선생님들의 일정 제출 현황을 확인하고, 수업 일정을 자동으로 배치할 수 있습니다.
            </p>
          </div>
          <ScheduleSettingButton
            defaultSetting={
              scheduleSetting
                ? {
                    weekdays: scheduleSetting.weekdays,
                    startTimeMinutes: scheduleSetting.startTimeMinutes,
                    endTimeMinutes: scheduleSetting.endTimeMinutes,
                    lessonDurationMinutes: scheduleSetting.lessonDurationMinutes,
                    breakDurationMinutes: scheduleSetting.breakDurationMinutes,
                  }
                : null
            }
          />
        </div>
      </section>

      <LessonManagementCalendar
        weekDays={weekDays}
        teachers={teachers}
        students={students}
        notSubmittedTeachers={notSubmittedTeachers}
        lessonSchedules={lessonSchedules.map((schedule) => ({
          id: schedule.id,
          teacherId: schedule.teacherId,
          teacherName: schedule.teacher.name,
          studentId: schedule.studentId,
          studentName: schedule.student.name,
          studentGrade: schedule.student.gradeNumber,
          date: formatISO(schedule.date, { representation: "date" }),
          startMinutes: schedule.startMinutes,
          endMinutes: schedule.endMinutes,
          status: schedule.status,
          memo: schedule.memo,
        }))}
        scheduleSetting={
          scheduleSetting
            ? {
                weekdays: scheduleSetting.weekdays,
                startTimeMinutes: scheduleSetting.startTimeMinutes,
                endTimeMinutes: scheduleSetting.endTimeMinutes,
                lessonDurationMinutes: scheduleSetting.lessonDurationMinutes,
                breakDurationMinutes: scheduleSetting.breakDurationMinutes,
              }
            : null
        }
        prevWeekHref={`?week=${prevWeekStart}`}
        nextWeekHref={`?week=${nextWeekStart}`}
        currentWeekLabel={currentWeekLabel}
      />
    </div>
  );
}

