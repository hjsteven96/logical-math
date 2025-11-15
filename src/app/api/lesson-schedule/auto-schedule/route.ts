import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { generateWeeklySlots } from "@/lib/schedule";

export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { weekStart, weekEnd } = json;

    if (!weekStart || !weekEnd) {
      return NextResponse.json({ error: "weekStart and weekEnd are required" }, { status: 400 });
    }

    const startDate = new Date(weekStart);
    const endDate = new Date(weekEnd);

    // 스케줄 설정 조회
    const scheduleSetting = await prisma.scheduleSetting.findFirst();
    if (!scheduleSetting) {
      return NextResponse.json({ error: "스케줄 설정이 없습니다." }, { status: 400 });
    }

    // 활성 선생님 조회
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // 활성 학생 조회
    const students = await prisma.student.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // 해당 주간의 기존 DRAFT 일정 삭제
    await prisma.lessonSchedule.deleteMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: "DRAFT",
      },
    });

    // 각 선생님의 해당 주간 가능한 시간대 조회
    const weekDays = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + index);
      return {
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        weekday: date.getDay(),
      };
    });

    // 선생님별로 해당 주간 가능한 시간대 맵 생성
    const teacherAvailabilities = await Promise.all(
      teachers.map(async (teacher) => {
        const availabilities = await prisma.teacherWeeklyAvailability.findMany({
          where: {
            teacherId: teacher.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
            isAvailable: true,
          },
          orderBy: [{ date: "asc" }, { startMinutes: "asc" }],
        });

        // 날짜별로 그룹화
        const byDate = new Map<string, Array<{ startMinutes: number; endMinutes: number }>>();
        availabilities.forEach((avail) => {
          const dateKey = avail.date.toISOString().split("T")[0];
          if (!byDate.has(dateKey)) {
            byDate.set(dateKey, []);
          }
          byDate.get(dateKey)?.push({
            startMinutes: avail.startMinutes,
            endMinutes: avail.endMinutes,
          });
        });

        return {
          teacherId: teacher.id,
          availabilities: byDate,
        };
      })
    );

    // 주간 일정 템플릿 생성 (한 번만)
    const templateSlots = generateWeeklySlots({
      weekdays: scheduleSetting.weekdays,
      startTimeMinutes: scheduleSetting.startTimeMinutes,
      endTimeMinutes: scheduleSetting.endTimeMinutes,
      lessonDurationMinutes: scheduleSetting.lessonDurationMinutes,
      breakDurationMinutes: scheduleSetting.breakDurationMinutes,
    });

    // 자동 배치 로직
    const scheduledLessons: Array<{
      teacherId: number;
      studentId: number;
      date: Date;
      startMinutes: number;
      endMinutes: number;
    }> = [];

    // 각 학생별로 선생님 배치
    for (const student of students) {
      let scheduled = false;

      // 각 선생님을 순회하면서 가능한 선생님 찾기
      for (const teacher of teachers) {
        if (scheduled) break; // 이미 배치되었으면 다음 학생으로

        const teacherAvail = teacherAvailabilities.find((a) => a.teacherId === teacher.id);
        if (!teacherAvail || teacherAvail.availabilities.size === 0) {
          continue; // 가능한 시간대가 없는 선생님 건너뛰기
        }

        // 주간의 각 날짜를 순회하면서 가능한 시간대 찾기
        for (const weekDay of weekDays) {
          if (scheduled) break; // 이미 배치되었으면 다음 선생님으로

          // 해당 요일이 운영 요일에 포함되어 있는지 확인
          if (!scheduleSetting.weekdays.includes(weekDay.weekday)) {
            continue;
          }

          // 해당 요일의 슬롯 찾기
          const daySlots = templateSlots.filter((slot) => slot.weekday === weekDay.weekday);
          const dateKey = weekDay.date.toISOString().split("T")[0];
          const availableSlots = teacherAvail.availabilities.get(dateKey) || [];

          // 각 시간 슬롯에 대해 확인
          for (const slot of daySlots) {
            // 선생님이 해당 시간대에 가능한지 확인
            const isAvailable = availableSlots.some(
              (avail) =>
                avail.startMinutes <= slot.startMinutes && avail.endMinutes >= slot.endMinutes
            );

            if (!isAvailable) continue;

            // 시간 충돌 확인: 같은 날짜에 같은 선생님 또는 같은 학생이 이미 배정되었는지
            const hasConflict = scheduledLessons.some((lesson) => {
              const lessonDateKey = lesson.date.toISOString().split("T")[0];
              if (lessonDateKey !== dateKey) return false;

              // 같은 선생님이 같은 시간대에 다른 수업
              if (lesson.teacherId === teacher.id) {
                return (
                  (lesson.startMinutes < slot.endMinutes && lesson.endMinutes > slot.startMinutes)
                );
              }

              // 같은 학생이 같은 시간대에 다른 수업
              if (lesson.studentId === student.id) {
                return (
                  (lesson.startMinutes < slot.endMinutes && lesson.endMinutes > slot.startMinutes)
                );
              }

              return false;
            });

            if (!hasConflict) {
              scheduledLessons.push({
                teacherId: teacher.id,
                studentId: student.id,
                date: weekDay.date,
                startMinutes: slot.startMinutes,
                endMinutes: slot.endMinutes,
              });
              scheduled = true; // 이 학생은 배치 완료
              break; // 이 학생의 배치는 완료했으므로 다음 학생으로
            }
          }
        }
      }
    }

    // DB에 일정 저장
    if (scheduledLessons.length > 0) {
      await prisma.lessonSchedule.createMany({
        data: scheduledLessons.map((lesson) => ({
          teacherId: lesson.teacherId,
          studentId: lesson.studentId,
          date: lesson.date,
          startMinutes: lesson.startMinutes,
          endMinutes: lesson.endMinutes,
          status: "DRAFT",
        })),
        skipDuplicates: true,
      });
    }

    // 캐시 무효화
    revalidatePath("/lesson-management");

    return NextResponse.json({
      success: true,
      count: scheduledLessons.length,
    });
  } catch (error) {
    console.error("자동 배치 오류:", error);
    return NextResponse.json(
      { error: "자동 배치 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

