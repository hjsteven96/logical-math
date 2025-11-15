import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { teacherUnavailableSlotSchema } from "@/lib/validators";

const canAccessTeacher = (session: { user: { id: string; role?: string } }, teacherId: number) => {
  if (session.user.role === "ADMIN") {
    return true;
  }
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
  const slots = await prisma.teacherUnavailableSlot.findMany({
    where: { teacherId },
    orderBy: [{ weekday: "asc" }, { startMinutes: "asc" }],
  });
  return NextResponse.json({ data: slots });
}

export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await request.json();
  const parsed = teacherUnavailableSlotSchema.safeParse(json);
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

  const slot = await prisma.teacherUnavailableSlot.create({
    data: {
      teacherId,
      weekday: parsed.data.weekday,
      startMinutes: parsed.data.startMinutes,
      endMinutes: parsed.data.endMinutes,
      memo: parsed.data.memo,
    },
  });
  return NextResponse.json({ data: slot }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await request.json();
  const slotId = Number(json.id);
  if (Number.isNaN(slotId)) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const slot = await prisma.teacherUnavailableSlot.findUnique({
    where: { id: slotId },
  });
  if (!slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }
  if (!canAccessTeacher(session, slot.teacherId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.teacherUnavailableSlot.delete({
    where: { id: slotId },
  });
  return NextResponse.json({ success: true });
}
