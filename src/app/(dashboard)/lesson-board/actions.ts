"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { buildLessonDayPayloads } from "@/lib/lesson-day";

export type LessonDayActionState = {
  success: boolean;
  message?: string;
};

export async function ensureLessonDaysAction(
  _: LessonDayActionState,
  formData: FormData
): Promise<LessonDayActionState> {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, message: "관리자만 생성할 수 있습니다." };
  }

  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));

  if (Number.isNaN(year) || Number.isNaN(month)) {
    return { success: false, message: "연도와 월을 확인해주세요." };
  }

  const payloads = buildLessonDayPayloads(year, month);
  await prisma.lessonDay.createMany({
    data: payloads.map((payload) => ({
      ...payload,
      hasHomework: true,
    })),
    skipDuplicates: true,
  });

  revalidatePath("/lesson-board");
  return { success: true, message: `${month}월 주차가 준비되었습니다.` };
}

export async function createNextMonthAction(
  _: LessonDayActionState,
  formData: FormData
): Promise<LessonDayActionState> {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, message: "관리자만 생성할 수 있습니다." };
  }

  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));

  if (Number.isNaN(year) || Number.isNaN(month)) {
    return { success: false, message: "연도와 월을 확인해주세요." };
  }

  const payloads = buildLessonDayPayloads(year, month);
  await prisma.lessonDay.createMany({
    data: payloads.map((payload) => ({
      ...payload,
      hasHomework: true,
    })),
    skipDuplicates: true,
  });

  revalidatePath("/lesson-board");
  return { success: true, message: `${year}년 ${month}월 주차가 생성되었습니다.` };
}
