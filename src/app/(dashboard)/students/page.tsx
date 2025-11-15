import { redirect } from "next/navigation";
import type { Prisma, Role } from "@/generated/prisma-client/client";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { studentScope } from "@/lib/scope";
import { resolveGradeNumbers, gradeFilterOptions } from "@/lib/grade";
import { StudentTable, type StudentRow } from "@/components/students/student-table";
import { CreateStudentModal } from "@/components/students/create-student-modal";

type SearchParams = {
  q?: string;
  grade?: string;
  active?: string;
};

type PageProps = {
  searchParams?: SearchParams | Promise<SearchParams | undefined> | undefined;
};

const studentInclude = {
  teachers: { include: { teacher: { select: { id: true, name: true } } } },
  records: { include: { lessonDay: true } },
} satisfies Prisma.StudentInclude;

type StudentWithRelations = Prisma.StudentGetPayload<{
  include: typeof studentInclude;
}>;

const getStudentRows = (students: StudentWithRelations[]) =>
  students.map((student) => {
    const attendanceRecords = student.records.length || 1;
    const attendanceRate =
      student.records.filter((record) => record.attendanceStatus === "PRESENT")
        .length / attendanceRecords;
    const homeworkRate =
      student.records.filter((record) => record.homeworkStatus === "SUBMITTED")
        .length / attendanceRecords;

    return {
      id: student.id,
      name: student.name,
      school: student.school,
      gradeNumber: student.gradeNumber,
      isActive: student.isActive,
      isOnline: student.isOnline,
      attendanceRate,
      homeworkRate,
      teacherNames: student.teachers.map((teacher) => teacher.teacher.name),
      lastRecord: student.records[0]
        ? {
            date: student.records[0].lessonDay.date,
            memo: student.records[0].memo,
            attendanceStatus: student.records[0].attendanceStatus,
            homeworkStatus: student.records[0].homeworkStatus,
          }
        : undefined,
    } satisfies StudentRow;
  });

const fetchStudents = async (
  userId: number,
  role: Role | undefined,
  searchParams?: SearchParams
): Promise<StudentWithRelations[]> => {
  const where: Prisma.StudentWhereInput = {
    ...studentScope(userId, role),
    ...(searchParams?.q
      ? {
          name: {
            contains: searchParams.q,
            mode: "insensitive",
          },
        }
      : {}),
    ...(searchParams?.grade
      ? {
          gradeNumber: {
            in: resolveGradeNumbers(searchParams.grade) ?? undefined,
          },
        }
      : {}),
    ...(searchParams?.active
      ? { isActive: searchParams.active === "true" }
      : {}),
  };

  const students = await prisma.student.findMany({
    where,
    include: {
      ...studentInclude,
      records: {
        ...studentInclude.records,
        orderBy: { lessonDay: { date: "desc" } },
        take: 6,
      },
    },
    orderBy: [
      { isActive: "desc" },
      { gradeNumber: "asc" },
      { name: "asc" },
    ],
  });

  return students as StudentWithRelations[];
};

export default async function StudentsPage({ searchParams }: PageProps) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/login");
  }

  const resolvedSearchParams = (await searchParams) ?? {};

  const userId = Number(session.user.id);
  const role = session.user.role;
  const [students, teachers] = await Promise.all([
    fetchStudents(userId, role, resolvedSearchParams),
    role === "ADMIN"
      ? prisma.user.findMany({
          where: { role: "TEACHER", isActive: true },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const rows = getStudentRows(students);

  return (
    <div className="space-y-6">
      <section className="glass-panel flex flex-col gap-4 px-6 py-5">
        <div>
          <p className="text-xs text-slate-500">학생 조회</p>
          <p className="text-2xl font-semibold text-slate-900">
            학생 리스트
          </p>
        </div>
        <form className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-4">
          <input
            name="q"
            defaultValue={resolvedSearchParams.q || ""}
            placeholder="학생 이름 / 학교 검색"
            className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
          />
          <select
            name="grade"
            defaultValue={resolvedSearchParams.grade || "all"}
            className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
          >
            {gradeFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            name="active"
            defaultValue={resolvedSearchParams.active || "all"}
            className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
          >
            <option value="all">전체 상태</option>
            <option value="true">수업중</option>
            <option value="false">휴면</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 md:col-span-2 lg:col-span-1"
          >
            검색
          </button>
        </form>
      </section>

      <div className="flex justify-end">
        <CreateStudentModal teachers={teachers} isAdmin={role === "ADMIN"} />
      </div>

      <StudentTable rows={rows} isAdmin={role === "ADMIN"} />
    </div>
  );
}
