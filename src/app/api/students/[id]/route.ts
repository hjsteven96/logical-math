import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { studentScope } from "@/lib/scope";
import { studentPayloadSchema } from "@/lib/validators";

type Params = {
  params: { id: string };
};

export async function GET(_: NextRequest, { params }: Params) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const studentId = Number(params.id);
  if (Number.isNaN(studentId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const userId = Number(session.user.id);
  const role = session.user.role;

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      ...studentScope(userId, role),
    },
    include: {
      teachers: {
        include: { teacher: { select: { id: true, email: true, name: true } } },
      },
      records: {
        include: {
          lessonDay: true,
          teacher: { select: { id: true, name: true } },
        },
        orderBy: { lessonDay: { date: "desc" } },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: student });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const studentId = Number(params.id);
  if (Number.isNaN(studentId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const json = await request.json();
  const payload = studentPayloadSchema.partial().safeParse(json);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await prisma.student.update({
    where: { id: studentId },
    data: payload.data,
  });

  return NextResponse.json({ data: updated });
}
