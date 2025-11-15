import { z } from "zod";
import { AttendanceStatus, HomeworkStatus } from "@/generated/prisma-client/client";

export const studentPayloadSchema = z.object({
  name: z.string().min(1),
  gradeNumber: z.number().int().min(1).max(12),
  school: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isOnline: z.boolean().optional(),
});

export const teacherStudentSchema = z.object({
  studentId: z.number().int(),
  teacherId: z.number().int(),
});

export const lessonDaySchema = z.object({
  date: z.string().transform((value) => new Date(value)),
  hasHomework: z.boolean().optional().default(true),
  weekLabel: z.string().optional().nullable(),
});

export const dailyRecordSchema = z.object({
  studentId: z.number().int(),
  lessonDayId: z.number().int(),
  attendanceStatus: z.nativeEnum(AttendanceStatus),
  homeworkStatus: z.nativeEnum(HomeworkStatus),
  memo: z.string().optional().nullable(),
});

export const teacherPayloadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional().nullable(),
  age: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((value) => {
      if (value === undefined || value === null || value === "") {
        return undefined;
      }
      const numeric = Number(value);
      return Number.isNaN(numeric) ? undefined : numeric;
    })
    .refine(
      (value) => value === undefined || value >= 0,
      "나이는 숫자로 입력해주세요."
    ),
  memo: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const teacherUpdatePayloadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  phone: z.string().optional().nullable(),
  age: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((value) => {
      if (value === undefined || value === null || value === "") {
        return undefined;
      }
      const numeric = Number(value);
      return Number.isNaN(numeric) ? undefined : numeric;
    })
    .refine(
      (value) => value === undefined || value >= 0,
      "나이는 숫자로 입력해주세요."
    ),
  memo: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const scheduleSettingPayloadSchema = z.object({
  weekdays: z.array(z.number().int().min(0).max(6)).min(1),
  startTimeMinutes: z.number().int().min(0).max(23 * 60 + 50),
  endTimeMinutes: z.number().int().min(1).max(24 * 60),
  lessonDurationMinutes: z.number().int().min(30).max(180),
  breakDurationMinutes: z.number().int().min(0).max(60),
}).refine(
  (data) => data.endTimeMinutes - data.startTimeMinutes >= data.lessonDurationMinutes,
  {
    message: "수업 시간이 시작/종료 범위를 벗어납니다.",
    path: ["endTimeMinutes"],
  }
);

export const teacherUnavailableSlotSchema = z.object({
  teacherId: z.number().int(),
  weekday: z.number().int().min(0).max(6),
  startMinutes: z.number().int().min(0).max(24 * 60 - 1),
  endMinutes: z.number().int().min(1).max(24 * 60),
  memo: z.string().optional().nullable(),
}).refine((data) => data.endMinutes > data.startMinutes, {
  message: "종료 시간은 시작 시간보다 커야 합니다.",
  path: ["endMinutes"],
});

export const teacherWeeklyAvailabilitySchema = z.object({
  teacherId: z.number().int(),
  date: z.string().transform((value) => new Date(value)),
  startMinutes: z.number().int().min(0).max(24 * 60 - 1),
  endMinutes: z.number().int().min(1).max(24 * 60),
  isAvailable: z.boolean(),
  memo: z.string().optional().nullable(),
}).refine((data) => data.endMinutes > data.startMinutes, {
  message: "종료 시간은 시작 시간보다 커야 합니다.",
  path: ["endMinutes"],
});

export const teacherWeeklyAvailabilityBatchSchema = z.object({
  teacherId: z.number().int(),
  startDate: z.string().transform((value) => new Date(value)),
  endDate: z.string().transform((value) => new Date(value)),
  slots: z.array(z.object({
    date: z.string().transform((value) => new Date(value)),
    startMinutes: z.number().int().min(0).max(24 * 60 - 1),
    endMinutes: z.number().int().min(1).max(24 * 60),
    isAvailable: z.boolean(),
    memo: z.string().optional().nullable(),
  })).refine((slots) => slots.every((slot) => slot.endMinutes > slot.startMinutes), {
    message: "종료 시간은 시작 시간보다 커야 합니다.",
  }),
});
