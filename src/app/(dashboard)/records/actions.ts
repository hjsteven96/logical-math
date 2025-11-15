"use server";

import { revalidatePath } from "next/cache";
import { dailyRecordSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";

export type RecordActionState = {
  success: boolean;
  message?: string;
};

export async function upsertDailyRecordAction(
  _: RecordActionState,
  formData: FormData
): Promise<RecordActionState> {
  const session = await getServerAuthSession();
  if (!session) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  const parsed = dailyRecordSchema.safeParse({
    studentId: Number(formData.get("studentId")),
    lessonDayId: Number(formData.get("lessonDayId")),
    attendanceStatus: formData.get("attendanceStatus"),
    homeworkStatus: formData.get("homeworkStatus"),
    memo: formData.get("memo") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "입력값을 확인해주세요." };
  }

  const userId = Number(session.user.id);

  await prisma.dailyRecord.upsert({
    where: {
      studentId_lessonDayId: {
        studentId: parsed.data.studentId,
        lessonDayId: parsed.data.lessonDayId,
      },
    },
    update: {
      attendanceStatus: parsed.data.attendanceStatus,
      homeworkStatus: parsed.data.homeworkStatus,
      memo: parsed.data.memo,
      teacherId: userId,
    },
    create: {
      ...parsed.data,
      teacherId: userId,
    },
  });

  revalidatePath("/lesson-board");
  revalidatePath(`/students/${parsed.data.studentId}`);
  return { success: true, message: "기록이 저장되었습니다." };
}
