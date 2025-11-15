import "dotenv/config";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { addDays, formatISO } from "date-fns";
import {
  PrismaClient,
  AttendanceStatus,
  HomeworkStatus,
  Role,
} from "../src/generated/prisma-client/client";
import { buildLessonDayPayloads } from "../src/lib/lesson-day";
import { generateWeeklySlots } from "../src/lib/schedule";

const prisma = new PrismaClient();

type ExcelStudent = {
  number: number | null;
  track: string;
  name: string;
  gradeLabel: string | null;
  gradeNumber: number | null;
  school: string;
  attendanceCount: number;
  homeworkSubmits: number;
  attendanceRate: number | null;
  lateRate: number | null;
  weekStats: Array<{ label: string; value: number | null }>;
  homeworkCompletion: number | null;
};

const loadExcelStudents = (): ExcelStudent[] => {
  const file = path.resolve(__dirname, "data", "excel-students.json");
  if (!fs.existsSync(file)) {
    throw new Error(
      "excel-students.json not found. Run `npm run excel:sync` first."
    );
  }
  const content = JSON.parse(fs.readFileSync(file, "utf-8"));
  return content.students as ExcelStudent[];
};

const ratioToAttendance = (ratio?: number | null): AttendanceStatus => {
  if (ratio === null || ratio === undefined) return AttendanceStatus.NONE;
  if (ratio >= 0.9) return AttendanceStatus.PRESENT;
  if (ratio >= 0.6) return AttendanceStatus.LATE;
  if (ratio > 0) return AttendanceStatus.ABSENT;
  return AttendanceStatus.NONE;
};

const ratioToHomework = (ratio?: number | null): HomeworkStatus => {
  if (ratio === null || ratio === undefined) return HomeworkStatus.NO_HOMEWORK;
  if (ratio >= 0.7) return HomeworkStatus.SUBMITTED;
  if (ratio > 0) return HomeworkStatus.NOT_SUBMITTED;
  return HomeworkStatus.NO_HOMEWORK;
};

async function main() {
  console.log("🌱 Start seeding Logical Math workspace...");

  const excelStudents = loadExcelStudents().filter(
    (student) => student.name && student.name !== "이름"
  );

  await prisma.teacherUnavailableSlot.deleteMany();
  await prisma.scheduleSetting.deleteMany();
  await prisma.dailyRecord.deleteMany();
  await prisma.teacherStudent.deleteMany();
  await prisma.lessonDay.deleteMany();
  await prisma.student.deleteMany();

  const [adminPassword, teacherPassword] = await Promise.all([
    bcrypt.hash("logical#2024", 10),
    bcrypt.hash("logical#teacher", 10),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@logicalmath.kr" },
    update: {},
    create: {
      email: "admin@logicalmath.kr",
      name: "슈퍼관리자",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@logicalmath.kr" },
    update: {},
    create: {
      email: "teacher@logicalmath.kr",
      name: "메인담임",
      password: teacherPassword,
      role: Role.TEACHER,
    },
  });

  const demoTeachers = [
    {
      name: "김로지",
      email: "teacher1@logicalmath.kr",
      phone: "010-1234-5678",
      age: 32,
      memo: "고2 문과 담당",
    },
    {
      name: "박도형",
      email: "teacher2@logicalmath.kr",
      phone: "010-2222-3333",
      age: 29,
      memo: "중등 심화",
    },
    {
      name: "최가람",
      email: "teacher3@logicalmath.kr",
      phone: "010-4444-5555",
      age: 35,
      memo: "초등 사고력",
    },
    {
      name: "윤지안",
      email: "teacher4@logicalmath.kr",
      phone: "010-6666-7777",
      age: 30,
      memo: "고1 내신 케어",
    },
    {
      name: "이수현",
      email: "teacher5@logicalmath.kr",
      phone: "010-8888-9999",
      age: 28,
      memo: "중3 졸업반 담당",
    },
  ];

  const extraTeachers = await Promise.all(
    demoTeachers.map((profile) =>
      prisma.user.upsert({
        where: { email: profile.email },
        update: {
          name: profile.name,
          phone: profile.phone,
          age: profile.age,
          memo: profile.memo,
          isActive: true,
        },
        create: {
          email: profile.email,
          name: profile.name,
          password: teacherPassword,
          phone: profile.phone,
          age: profile.age,
          memo: profile.memo,
          role: Role.TEACHER,
          isActive: true,
        },
      })
    )
  );

  await prisma.scheduleSetting.create({
    data: {
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      startTimeMinutes: 17 * 60,
      endTimeMinutes: 22 * 60,
      lessonDurationMinutes: 50,
      breakDurationMinutes: 10,
      timezone: "Asia/Seoul",
    },
  });

  const unavailableSamples = extraTeachers.slice(0, 3).map((t, idx) => ({
    teacherId: t.id,
    weekday: idx,
    startMinutes: 18 * 60,
    endMinutes: 19 * 60,
    memo: "학원 외 일정",
  }));

  if (unavailableSamples.length) {
    await prisma.teacherUnavailableSlot.createMany({
      data: unavailableSamples,
    });
  }

  const studentPayloads = excelStudents.map((student, index) => ({
    name: student.name || `학생${index + 1}`,
    gradeNumber: student.gradeNumber || 10,
    school: student.school || null,
    isActive: true,
  }));

  await prisma.student.createMany({ data: studentPayloads });
  const students = await prisma.student.findMany();

  await prisma.teacherStudent.createMany({
    data: students.map((student) => ({
      studentId: student.id,
      teacherId: teacher.id,
    })),
  });

  const now = new Date();
  const lessonPayloads = buildLessonDayPayloads(
    now.getFullYear(),
    now.getMonth() + 1
  ).slice(0, 5);

  await prisma.lessonDay.createMany({
    data: lessonPayloads.map((lesson) => ({
      date: lesson.date,
      year: lesson.year,
      month: lesson.month,
      weekOfMonth: lesson.weekOfMonth,
      weekLabel: lesson.weekLabel,
      hasHomework: true,
    })),
    skipDuplicates: true,
  });

  const lessonDays = await prisma.lessonDay.findMany({
    orderBy: { date: "asc" },
  });

  for (let i = 0; i < students.length; i += 1) {
    const student = students[i];
    const excelStudent = excelStudents[i] || excelStudents[0];

    await Promise.all(
      lessonDays.map((lessonDay, index) => {
        const targetWeek = excelStudent.weekStats[index];
        const ratio = targetWeek?.value ?? excelStudent.attendanceRate ?? 0.5;
        const homeworkRatio =
          index === lessonDays.length - 1
            ? excelStudent.homeworkCompletion
            : targetWeek?.value;

        return prisma.dailyRecord.create({
          data: {
            studentId: student.id,
            lessonDayId: lessonDay.id,
            teacherId: teacher.id,
            attendanceStatus: ratioToAttendance(ratio),
            homeworkStatus: ratioToHomework(homeworkRatio),
            memo: `${lessonDay.weekLabel || ""} 데이터 이관`,
          },
        });
      })
    );
  }

  // 11/17~11/23 주간 선생님별 가능한 일정 데모 데이터 생성
  const targetWeekStart = new Date("2025-11-17");
  const weekDates = Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(targetWeekStart, index);
    return {
      date: formatISO(date, { representation: "date" }),
      weekday: date.getDay(),
    };
  });

  const scheduleSetting = await prisma.scheduleSetting.findFirst();
  if (scheduleSetting) {
    const allTeachers = await prisma.user.findMany({
      where: { role: Role.TEACHER, isActive: true },
    });

    const templateSlots = generateWeeklySlots({
      weekdays: scheduleSetting.weekdays,
      startTimeMinutes: scheduleSetting.startTimeMinutes,
      endTimeMinutes: scheduleSetting.endTimeMinutes,
      lessonDurationMinutes: scheduleSetting.lessonDurationMinutes,
      breakDurationMinutes: scheduleSetting.breakDurationMinutes,
    });

    const weeklyAvailabilityData: Array<{
      teacherId: number;
      date: string;
      startMinutes: number;
      endMinutes: number;
      isAvailable: boolean;
    }> = [];

    for (const teacher of allTeachers) {
      for (const day of weekDates) {
        const daySlots = templateSlots.filter((slot) => slot.weekday === day.weekday);
        
        // 각 선생님마다 랜덤하게 60-80% 정도의 슬롯을 가능으로 설정
        const availableCount = Math.floor(daySlots.length * (0.6 + Math.random() * 0.2));
        const shuffled = [...daySlots].sort(() => Math.random() - 0.5);
        const availableSlots = shuffled.slice(0, availableCount);

        for (const slot of availableSlots) {
          weeklyAvailabilityData.push({
            teacherId: teacher.id,
            date: day.date,
            startMinutes: slot.startMinutes,
            endMinutes: slot.endMinutes,
            isAvailable: true,
          });
        }
      }
    }

    if (weeklyAvailabilityData.length > 0) {
      await prisma.teacherWeeklyAvailability.createMany({
        data: weeklyAvailabilityData.map((item) => ({
          teacherId: item.teacherId,
          date: new Date(item.date),
          startMinutes: item.startMinutes,
          endMinutes: item.endMinutes,
          isAvailable: item.isAvailable,
        })),
        skipDuplicates: true,
      });
      console.log(
        `✅ Generated ${weeklyAvailabilityData.length} weekly availability slots for ${allTeachers.length} teachers (11/17~11/23)`
      );
    }
  }

  console.log(
    `✅ Seed completed. Admin: ${admin.email}, Teacher: ${teacher.email}, Students: ${students.length}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
