import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { teacherWeeklyAvailabilitySchema, teacherWeeklyAvailabilityBatchSchema } from "@/lib/validators";

const canAccessTeacher = (session: { user: { id: string; role?: string } }, teacherId: number) => {
  if (session.user.role === "ADMIN") return true;
  return Number(session.user.id) === teacherId;
};

export async function GET(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const teacherIdParam = request.nextUrl.searchParams.get("teacherId");
  const teacherId = teacherIdParam ? Number(teacherIdParam) : Number(session.user.id);
  if (Number.isNaN(teacherId)) {
    return NextResponse.json({ error: "teacherId is required" }, { status: 400 });
  }
  if (!canAccessTeacher(session, teacherId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startParam = request.nextUrl.searchParams.get("start");
  const endParam = request.nextUrl.searchParams.get("end");
  if (!startParam || !endParam) {
    return NextResponse.json({ error: "start and end dates are required" }, { status: 400 });
  }
  const startDate = new Date(startParam);
  const endDate = new Date(endParam);

  const slots = await prisma.teacherWeeklyAvailability.findMany({
    where: {
      teacherId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: [{ date: "asc" }, { startMinutes: "asc" }],
  });

  return NextResponse.json({ data: slots });
}

export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = teacherWeeklyAvailabilitySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const teacherId =
    session.user.role === "ADMIN"
      ? parsed.data.teacherId
      : Number(session.user.id);

  if (!canAccessTeacher(session, teacherId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dateOnly = new Date(
    parsed.data.date.getFullYear(),
    parsed.data.date.getMonth(),
    parsed.data.date.getDate()
  );

  if (!parsed.data.isAvailable) {
    await prisma.teacherWeeklyAvailability.deleteMany({
      where: {
        teacherId,
        date: dateOnly,
        startMinutes: parsed.data.startMinutes,
        endMinutes: parsed.data.endMinutes,
      },
    });
    return NextResponse.json({ success: true });
  }

  const slot = await prisma.teacherWeeklyAvailability.upsert({
    where: {
      teacherId_date_startMinutes_endMinutes: {
        teacherId,
        date: dateOnly,
        startMinutes: parsed.data.startMinutes,
        endMinutes: parsed.data.endMinutes,
      },
    },
    update: {
      memo: parsed.data.memo,
      isAvailable: true,
    },
    create: {
      teacherId,
      date: dateOnly,
      startMinutes: parsed.data.startMinutes,
      endMinutes: parsed.data.endMinutes,
      memo: parsed.data.memo,
      isAvailable: true,
    },
  });

  return NextResponse.json({ data: slot });
}

export async function PUT(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = teacherWeeklyAvailabilityBatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const teacherId =
    session.user.role === "ADMIN"
      ? parsed.data.teacherId
      : Number(session.user.id);

  if (!canAccessTeacher(session, teacherId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 해당 주간의 기존 데이터 삭제
  const startDateOnly = new Date(
    parsed.data.startDate.getFullYear(),
    parsed.data.startDate.getMonth(),
    parsed.data.startDate.getDate()
  );
  const endDateOnly = new Date(
    parsed.data.endDate.getFullYear(),
    parsed.data.endDate.getMonth(),
    parsed.data.endDate.getDate()
  );

  await prisma.teacherWeeklyAvailability.deleteMany({
    where: {
      teacherId,
      date: {
        gte: startDateOnly,
        lte: endDateOnly,
      },
    },
  });

  // 새로운 데이터 일괄 생성 (isAvailable이 true인 것만)
  const availableSlots = parsed.data.slots.filter((slot) => slot.isAvailable);
  if (availableSlots.length > 0) {
    await prisma.teacherWeeklyAvailability.createMany({
      data: availableSlots.map((slot) => {
        const dateOnly = new Date(
          slot.date.getFullYear(),
          slot.date.getMonth(),
          slot.date.getDate()
        );
        return {
          teacherId,
          date: dateOnly,
          startMinutes: slot.startMinutes,
          endMinutes: slot.endMinutes,
          memo: slot.memo || null,
          isAvailable: true,
        };
      }),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ success: true });
}
