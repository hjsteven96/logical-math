import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { TeacherTable } from "@/components/teachers/teacher-table";
import { CreateTeacherModal } from "@/components/teachers/create-teacher-modal";
import { TeacherAvailabilityManager } from "@/components/teachers/teacher-availability-manager";

export default async function TeachersPage() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      age: true,
      memo: true,
      isActive: true,
      createdAt: true,
    },
  });

  const defaultSetting = {
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    startTimeMinutes: 17 * 60,
    endTimeMinutes: 22 * 60,
    lessonDurationMinutes: 50,
    breakDurationMinutes: 10,
  };

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

  const unavailableSlots = await prisma.teacherUnavailableSlot.findMany({
    select: {
      id: true,
      teacherId: true,
      weekday: true,
      startMinutes: true,
      endMinutes: true,
      memo: true,
    },
  });

  const unavailableMap = unavailableSlots.reduce<
    Record<
      number,
      {
        id: number;
        weekday: number;
        startMinutes: number;
        endMinutes: number;
        memo: string | null;
      }[]
    >
  >((acc, slot) => {
    if (!acc[slot.teacherId]) {
      acc[slot.teacherId] = [];
    }
    acc[slot.teacherId]?.push({
      id: slot.id,
      weekday: slot.weekday,
      startMinutes: slot.startMinutes,
      endMinutes: slot.endMinutes,
      memo: slot.memo,
    });
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <section className="glass-panel flex flex-col gap-4 px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-slate-500">선생님 관리</p>
            <p className="text-2xl font-semibold text-slate-900">
              계정 · 일정 제어
            </p>
            <p className="text-sm text-slate-500">
              신규 계정을 발급하고, 수업 가능 시간을 통합 관리합니다.
            </p>
          </div>
          <CreateTeacherModal />
        </div>
      </section>

      <TeacherTable teachers={teachers} />

      <TeacherAvailabilityManager
        scheduleSetting={scheduleSetting}
        teachers={teachers.map((teacher) => ({
          id: teacher.id,
          name: teacher.name,
        }))}
        initialUnavailable={unavailableMap}
      />
    </div>
  );
}
