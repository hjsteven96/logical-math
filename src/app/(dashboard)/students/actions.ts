"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { studentPayloadSchema } from "@/lib/validators";

export type ActionState = {
  success: boolean;
  message?: string;
};

export async function createStudentAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, message: "권한이 없습니다." };
  }

  const parsed = studentPayloadSchema.safeParse({
    name: formData.get("name"),
    gradeNumber: Number(formData.get("gradeNumber")),
    school: formData.get("school") || undefined,
    isActive: true,
    isOnline: formData.get("isOnline") === "true",
  });

  if (!parsed.success) {
    return { success: false, message: "입력값을 확인해주세요." };
  }

  const teacherId = Number(formData.get("teacherId"));

  const created = await prisma.student.create({
    data: parsed.data,
  });

  if (teacherId) {
    await prisma.teacherStudent.upsert({
      where: {
        teacherId_studentId: {
          studentId: created.id,
          teacherId,
        },
      },
      update: {},
      create: {
        studentId: created.id,
        teacherId,
      },
    });
  }

  revalidatePath("/students");
  return { success: true, message: "학생이 등록되었습니다." };
}

export async function updateStudentAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, message: "권한이 없습니다." };
  }

  const studentId = Number(formData.get("studentId"));
  const parsed = studentPayloadSchema.partial().safeParse({
    name: formData.get("name") || undefined,
    gradeNumber: formData.get("gradeNumber")
      ? Number(formData.get("gradeNumber"))
      : undefined,
    school: formData.get("school") || undefined,
    isActive:
      formData.get("isActive") !== null
        ? formData.get("isActive") === "true"
        : undefined,
    isOnline:
      formData.get("isOnline") !== null
        ? formData.get("isOnline") === "true"
        : undefined,
  });

  if (!parsed.success || Number.isNaN(studentId)) {
    return { success: false, message: "입력값을 확인해주세요." };
  }

  await prisma.student.update({
    where: { id: studentId },
    data: parsed.data,
  });

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students");
  return { success: true, message: "저장되었습니다." };
}
