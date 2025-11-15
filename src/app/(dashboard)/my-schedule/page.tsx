import { redirect } from "next/navigation";
import { addDays, formatISO } from "date-fns";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeekRange, formatShortDate } from "@/lib/date";
import { WeeklyAvailabilityManager } from "@/components/teachers/weekly-availability-manager";

const defaultSetting = {
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  startTimeMinutes: 17 * 60,
  endTimeMinutes: 22 * 60,
  lessonDurationMinutes: 50,
  breakDurationMinutes: 10,
};

type SearchParams =
  | {
      week?: string;
    }
  | Promise<{ week?: string } | undefined>
  | undefined;

export default async function MySchedulePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "TEACHER") {
    redirect("/");
  }

  const resolvedSearch = (await searchParams) ?? {};
  const weekParam = resolvedSearch?.week;

  const teacherId = Number(session.user.id);
  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { id: true, name: true },
  });
  if (!teacher) {
    redirect("/");
  }

  const weekStart = weekParam ? new Date(weekParam) : getWeekRange().start;
  const { start, end } = getWeekRange(weekStart);
  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(start, index);
    return {
      date: formatISO(date, { representation: "date" }),
      weekday: date.getDay(),
    };
  });

  const storedSetting = await prisma.scheduleSetting.findFirst();
  const scheduleSetting = storedSetting
    ? {
        weekdays: storedSetting.weekdays,
        startTimeMinutes: storedSetting.startTimeMinutes,
        endTimeMinutes: storedSetting.endTimeMinutes,
        lessonDurationMinutes: storedSetting.lessonDurationMinutes,
        breakDurationMinutes: storedSetting.breakDurationMinutes,
      }
    : defaultSetting;

  const weeklySlots = await prisma.teacherWeeklyAvailability.findMany({
    where: {
      teacherId,
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: [{ date: "asc" }, { startMinutes: "asc" }],
  });

  const prevWeekStart = formatISO(addDays(start, -7), { representation: "date" });
  const nextWeekStart = formatISO(addDays(start, 7), { representation: "date" });
  const currentWeekLabel = `${formatShortDate(start)} ~ ${formatShortDate(end)}`;

  return (
    <div className="space-y-6">
      <section className="glass-panel flex flex-col gap-4 px-6 py-5">
        <div>
          <p className="text-xs text-slate-500">내 일정</p>
          <h1 className="text-2xl font-semibold text-slate-900">주간 수업 가능시간</h1>
          <p className="mt-2 text-sm text-slate-500">
            가능한 슬롯은 초록색으로 활성화하세요. 주마다 다르게 설정할 수 있습니다.
          </p>
        </div>
      </section>

      <WeeklyAvailabilityManager
        scheduleSetting={scheduleSetting}
        teacherId={teacher.id}
        weekDays={weekDays}
        slots={weeklySlots.map((slot) => ({
          id: slot.id,
          date: formatISO(slot.date, { representation: "date" }),
          startMinutes: slot.startMinutes,
          endMinutes: slot.endMinutes,
          isAvailable: slot.isAvailable,
          memo: slot.memo,
        }))}
        prevWeekHref={`?week=${prevWeekStart}`}
        nextWeekHref={`?week=${nextWeekStart}`}
        currentWeekLabel={currentWeekLabel}
      />
    </div>
  );
}
