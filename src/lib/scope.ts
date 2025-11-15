import type { Prisma } from "@/generated/prisma-client/client";
import type { Role } from "@/generated/prisma-client/client";

export const studentScope = (userId: number, role?: Role) => {
  if (role === "ADMIN") {
    return {};
  }
  return {
    teachers: {
      some: {
        teacherId: userId,
      },
    },
  } satisfies Prisma.StudentWhereInput;
};

export const dailyRecordScope = (userId: number, role?: Role) => {
  if (role === "ADMIN") {
    return {};
  }
  return {
    student: {
      teachers: {
        some: { teacherId: userId },
      },
    },
  } satisfies Prisma.DailyRecordWhereInput;
};

export const lessonDayScope = () => ({});
