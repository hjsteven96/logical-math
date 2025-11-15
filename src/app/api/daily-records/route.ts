import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { dailyRecordScope } from "@/lib/scope";
import { dailyRecordSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const studentId = searchParams.get("studentId");
  const lessonDayId = searchParams.get("lessonDayId");

  const userId = Number(session.user.id);
  const role = session.user.role;

  const records = await prisma.dailyRecord.findMany({
    where: {
      ...dailyRecordScope(userId, role),
      ...(studentId ? { studentId: Number(studentId) } : {}),
      ...(lessonDayId ? { lessonDayId: Number(lessonDayId) } : {}),
    },
    include: {
      student: true,
      lessonDay: true,
      teacher: true,
    },
  });

  return NextResponse.json({ data: records });
}

export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const payload = dailyRecordSchema.safeParse(json);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 }
    );
  }

  const userId = Number(session.user.id);
  const { studentId, lessonDayId, ...rest } = payload.data;

  const record = await prisma.dailyRecord.upsert({
    where: {
      studentId_lessonDayId: {
        studentId,
        lessonDayId,
      },
    },
    update: {
      ...rest,
      teacherId: userId,
    },
    create: {
      studentId,
      lessonDayId,
      teacherId: userId,
      ...rest,
    },
    include: {
      student: true,
      lessonDay: true,
      teacher: true,
    },
  });

  return NextResponse.json({ data: record });
}
