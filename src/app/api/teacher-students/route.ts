import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { teacherStudentSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await request.json();
  const payload = teacherStudentSchema.safeParse(json);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 }
    );
  }

  const data = await prisma.teacherStudent.upsert({
    where: {
      teacherId_studentId: payload.data,
    },
    update: {},
    create: payload.data,
  });

  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await request.json();
  const payload = teacherStudentSchema.safeParse(json);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 }
    );
  }

  await prisma.teacherStudent.delete({
    where: {
      teacherId_studentId: payload.data,
    },
  });

  return NextResponse.json({ success: true });
}
