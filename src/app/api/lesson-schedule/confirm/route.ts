import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";

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

    // 해당 주간의 DRAFT 상태 일정을 CONFIRMED로 변경
    const result = await prisma.lessonSchedule.updateMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: "DRAFT",
      },
      data: {
        status: "CONFIRMED",
      },
    });

    // 캐시 무효화
    revalidatePath("/lesson-management");

    return NextResponse.json({
      success: true,
      count: result.count,
    });
  } catch (error) {
    console.error("일정 확정 오류:", error);
    return NextResponse.json(
      { error: "일정 확정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

