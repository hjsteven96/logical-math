import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { buildLessonDayPayloads } from "@/lib/lesson-day";

export async function GET(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const start = params.get("start");
  const end = params.get("end");

  const lessonDays = await prisma.lessonDay.findMany({
    where: {
      ...(start ? { date: { gte: new Date(start) } } : {}),
      ...(end ? { date: { lte: new Date(end) } } : {}),
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ data: lessonDays });
}

export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await request.json();
  const { year, month } = json;
  if (!year || !month) {
    return NextResponse.json(
      { error: "year, month are required" },
      { status: 400 }
    );
  }

  const payloads = buildLessonDayPayloads(Number(year), Number(month));

  await prisma.lessonDay.createMany({
    data: payloads.map((payload) => ({
      ...payload,
      hasHomework: true,
    })),
    skipDuplicates: true,
  });

  const lessonDays = await prisma.lessonDay.findMany({
    where: { year: Number(year), month: Number(month) },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ data: lessonDays });
}
