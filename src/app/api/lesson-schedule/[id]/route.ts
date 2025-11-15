import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const scheduleId = Number(id);

    if (Number.isNaN(scheduleId)) {
      return NextResponse.json({ error: "Invalid schedule ID" }, { status: 400 });
    }

    const json = await request.json();
    const { teacherId, studentId, date, startMinutes, endMinutes } = json;

    if (!teacherId || !studentId || !date || startMinutes === undefined || endMinutes === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 기존 일정 확인 (DRAFT 상태만 수정 가능)
    const existing = await prisma.lessonSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json({ error: "Confirmed schedules cannot be modified" }, { status: 400 });
    }

    // 중복 확인 (같은 선생님, 학생, 날짜, 시간대)
    const conflict = await prisma.lessonSchedule.findFirst({
      where: {
        id: { not: scheduleId },
        teacherId,
        studentId,
        date: new Date(date),
        startMinutes,
        endMinutes,
        status: "DRAFT",
      },
    });

    if (conflict) {
      return NextResponse.json({ error: "이미 같은 시간대에 수업이 배치되어 있습니다." }, { status: 400 });
    }

    // 시간대 충돌 확인 (선생님이나 학생이 이미 다른 수업에 배정된 시간대)
    const timeConflict = await prisma.lessonSchedule.findFirst({
      where: {
        id: { not: scheduleId },
        date: new Date(date),
        status: "DRAFT",
        OR: [
          {
            teacherId,
            startMinutes: { lt: endMinutes },
            endMinutes: { gt: startMinutes },
          },
          {
            studentId,
            startMinutes: { lt: endMinutes },
            endMinutes: { gt: startMinutes },
          },
        ],
      },
    });

    if (timeConflict) {
      return NextResponse.json(
        { error: "선생님이나 학생이 이미 해당 시간대에 다른 수업이 배정되어 있습니다." },
        { status: 400 }
      );
    }

    // 일정 업데이트
    const updated = await prisma.lessonSchedule.update({
      where: { id: scheduleId },
      data: {
        teacherId,
        studentId,
        date: new Date(date),
        startMinutes,
        endMinutes,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("일정 수정 오류:", error);
    return NextResponse.json(
      { error: "일정 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const scheduleId = Number(id);

    if (Number.isNaN(scheduleId)) {
      return NextResponse.json({ error: "Invalid schedule ID" }, { status: 400 });
    }

    // 기존 일정 확인 (DRAFT 상태만 삭제 가능)
    const existing = await prisma.lessonSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json({ error: "Confirmed schedules cannot be deleted" }, { status: 400 });
    }

    await prisma.lessonSchedule.delete({
      where: { id: scheduleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("일정 삭제 오류:", error);
    return NextResponse.json(
      { error: "일정 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

