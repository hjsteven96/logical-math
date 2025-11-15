"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { teacherPayloadSchema, teacherUpdatePayloadSchema, scheduleSettingPayloadSchema } from "@/lib/validators";
import { timeStringToMinutes } from "@/lib/time";

export type TeacherActionState = {
  success: boolean;
  message: string;
};

export type ScheduleActionState = {
  success: boolean;
  message: string;
};

export async function createTeacherAction(
  prevState: TeacherActionState,
  formData: FormData
): Promise<TeacherActionState> {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, message: "권한이 없습니다." };
  }

  const isActiveValue =
    formData.get("isActive") === null ? undefined : formData.get("isActive");

  const parsed = teacherPayloadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    age: formData.get("age") || undefined,
    memo: formData.get("memo") || undefined,
    isActive:
      isActiveValue === undefined ? undefined : isActiveValue === "true",
  });

  if (!parsed.success) {
    return { success: false, message: "입력값을 확인해주세요." };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      phone: parsed.data.phone || null,
      age: parsed.data.age,
      memo: parsed.data.memo || null,
      role: "TEACHER",
      isActive: parsed.data.isActive ?? true,
    },
  });

  revalidatePath("/teachers");
  return { success: true, message: "선생님이 등록되었습니다." };
}

export async function updateTeacherAction(
  prevState: TeacherActionState,
  formData: FormData
): Promise<TeacherActionState> {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, message: "권한이 없습니다." };
  }

  const teacherId = formData.get("teacherId");
  if (!teacherId) {
    return { success: false, message: "선생님 ID가 필요합니다." };
  }

  const isActiveValue =
    formData.get("isActive") === null ? undefined : formData.get("isActive");

  const password = formData.get("password");
  const parsed = teacherUpdatePayloadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: password && password.toString().trim() !== "" ? password : undefined,
    phone: formData.get("phone") || undefined,
    age: formData.get("age") || undefined,
    memo: formData.get("memo") || undefined,
    isActive:
      isActiveValue === undefined ? undefined : isActiveValue === "true",
  });

  if (!parsed.success) {
    return { success: false, message: "입력값을 확인해주세요." };
  }

  const updateData: {
    name: string;
    email: string;
    phone: string | null;
    age: number | undefined;
    memo: string | null;
    isActive: boolean | undefined;
    password?: string;
  } = {
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    age: parsed.data.age,
    memo: parsed.data.memo || null,
    isActive: parsed.data.isActive,
  };

  if (parsed.data.password) {
    updateData.password = await bcrypt.hash(parsed.data.password, 10);
  }

  await prisma.user.update({
    where: { id: Number(teacherId) },
    data: updateData,
  });

  revalidatePath("/teachers");
  return { success: true, message: "선생님 정보가 수정되었습니다." };
}

export async function deleteTeacherAction(
  teacherId: number
): Promise<TeacherActionState> {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, message: "권한이 없습니다." };
  }

  try {
    // 선생님을 완전히 삭제하지 않고 비활성화 처리
    // 이렇게 하면 TeacherStudent 레코드가 유지됨
    await prisma.user.update({
      where: { id: teacherId },
      data: { isActive: false },
    });

    revalidatePath("/teachers");
    return { success: true, message: "선생님이 비활성화되었습니다." };
  } catch (error) {
    console.error("선생님 비활성화 오류:", error);
    return { success: false, message: "비활성화 중 오류가 발생했습니다." };
  }
}

export async function updateScheduleSettingAction(
  _prev: ScheduleActionState,
  formData: FormData
): Promise<ScheduleActionState> {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, message: "권한이 없습니다." };
  }

  const startTime = formData.get("startTime")?.toString() || "17:00";
  const endTime = formData.get("endTime")?.toString() || "22:00";
  const lessonDuration = Number(formData.get("lessonDurationMinutes") || 50);
  const breakDuration = Number(formData.get("breakDurationMinutes") || 10);
  const weekdayValues = formData.getAll("weekdays").map((value) => Number(value));
  const weekdays =
    weekdayValues.length > 0 ? weekdayValues : [0, 1, 2, 3, 4, 5, 6];
  weekdays.sort((a, b) => a - b);

  try {
    const payload = scheduleSettingPayloadSchema.parse({
      weekdays,
      startTimeMinutes: timeStringToMinutes(startTime),
      endTimeMinutes: timeStringToMinutes(endTime),
      lessonDurationMinutes: lessonDuration,
      breakDurationMinutes: breakDuration,
    });

    const current = await prisma.scheduleSetting.findFirst();
    if (current) {
      await prisma.scheduleSetting.update({
        where: { id: current.id },
        data: payload,
      });
    } else {
      await prisma.scheduleSetting.create({
        data: payload,
      });
    }

    revalidatePath("/teachers");
    revalidatePath("/lesson-management");
    return { success: true, message: "일정 기본 설정이 저장되었습니다." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "설정 저장 중 오류가 발생했습니다." };
  }
}
