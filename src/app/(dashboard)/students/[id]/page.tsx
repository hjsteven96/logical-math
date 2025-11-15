import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { studentScope } from "@/lib/scope";
import { gradeNumberToLabel } from "@/lib/grade";
import { UpdateStudentForm } from "@/components/students/update-student-form";
import { RecordTimeline } from "@/components/students/record-timeline";
import { DailyRecordForm } from "@/components/records/daily-record-form";

type PageProps = {
  params: { id: string };
};

export default async function StudentDetailPage({ params }: PageProps) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/login");
  }
  const studentId = Number(params.id);
  if (Number.isNaN(studentId)) {
    notFound();
  }

  const scope = studentScope(Number(session.user.id), session.user.role);

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      ...scope,
    },
    include: {
      teachers: {
        include: { teacher: { select: { id: true, name: true, email: true } } },
      },
      records: {
        include: {
          lessonDay: true,
          teacher: { select: { id: true, name: true } },
        },
        orderBy: { lessonDay: { date: "desc" } },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const lessonDays = await prisma.lessonDay.findMany({
    orderBy: { date: "desc" },
    take: 6,
  });

  const attendanceRate =
    student.records.filter((record) => record.attendanceStatus === "PRESENT")
      .length / Math.max(student.records.length, 1);
  const homeworkRate =
    student.records.filter((record) => record.homeworkStatus === "SUBMITTED")
      .length / Math.max(student.records.length, 1);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="glass-panel px-6 py-4">
          <p className="text-xs text-slate-500">학생 카드</p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-2xl font-semibold text-slate-900">
                {student.name}
              </p>
              <p className="text-sm text-slate-500">
                {gradeNumberToLabel(student.gradeNumber)} ·{" "}
                {student.school || "학교 미등록"}
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400">출석률</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {Math.round(attendanceRate * 100)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">숙제 제출</p>
                <p className="text-lg font-semibold text-blue-600">
                  {Math.round(homeworkRate * 100)}%
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
            {student.teachers.map((assignment) => (
              <span
                key={assignment.teacherId}
                className="rounded-full bg-slate-100 px-3 py-1 text-slate-700"
              >
                {assignment.teacher.name}
              </span>
            ))}
            {student.teachers.length === 0 ? (
              <span className="text-slate-400">배정된 선생님이 없습니다.</span>
            ) : null}
          </div>
        </div>
        <UpdateStudentForm
          studentId={student.id}
          defaultValues={{
            name: student.name,
            gradeNumber: student.gradeNumber,
            school: student.school,
            isActive: student.isActive,
            isOnline: student.isOnline,
          }}
          isAdmin={session.user.role === "ADMIN"}
        />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <RecordTimeline records={student.records.slice(0, 6)} />
        <DailyRecordForm studentId={student.id} lessonDays={lessonDays} />
      </section>
    </div>
  );
}
