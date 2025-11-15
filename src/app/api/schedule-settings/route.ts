import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { scheduleSettingPayloadSchema } from "@/lib/validators";

const ensureSetting = async () => {
  const existing = await prisma.scheduleSetting.findFirst();
  if (existing) {
    return existing;
  }
  return prisma.scheduleSetting.create({
    data: {
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      startTimeMinutes: 17 * 60,
      endTimeMinutes: 22 * 60,
      lessonDurationMinutes: 50,
      breakDurationMinutes: 10,
      timezone: "Asia/Seoul",
    },
  });
};

export async function GET() {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const setting = await ensureSetting();
  return NextResponse.json({ data: setting });
}

export async function PUT(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = scheduleSettingPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const current = await prisma.scheduleSetting.findFirst();
  const data = parsed.data;
  const next = current
    ? await prisma.scheduleSetting.update({
        where: { id: current.id },
        data,
      })
    : await prisma.scheduleSetting.create({ data });

  return NextResponse.json({ data: next });
}
