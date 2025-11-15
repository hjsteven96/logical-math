import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma-client/client";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { studentScope } from "@/lib/scope";
import { resolveGradeNumbers } from "@/lib/grade";
import { studentPayloadSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const role = session.user.role;

  const params = request.nextUrl.searchParams;
  const search = params.get("q");
  const grade = params.get("grade");
  const active = params.get("active");

  const gradeFilter = resolveGradeNumbers(grade);

  const where: Prisma.StudentWhereInput = {
    ...studentScope(userId, role),
    ...(search
      ? {
          name: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {}),
    ...(gradeFilter ? { gradeNumber: { in: gradeFilter } } : {}),
    ...(active ? { isActive: active === "true" } : {}),
  };

  const students = await prisma.student.findMany({
    where,
    include: {
      teachers: {
        include: { teacher: { select: { id: true, name: true, email: true } } },
      },
      records: {
        orderBy: {
          lessonDay: { date: "desc" },
        },
        take: 5,
        include: { lessonDay: true },
      },
    },
    orderBy: [
      { gradeNumber: "asc" },
      { name: "asc" },
    ],
  });

  return NextResponse.json({ data: students });
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
  const payload = studentPayloadSchema.safeParse(json);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 }
    );
  }

  const student = await prisma.student.create({
    data: payload.data,
  });
  return NextResponse.json({ data: student }, { status: 201 });
}
