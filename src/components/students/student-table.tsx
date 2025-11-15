"use client";

import { useState } from "react";
import { gradeNumberToLabel } from "@/lib/grade";
import { toPercent } from "@/lib/utils";
import { StudentDetailModal } from "@/components/students/student-detail-modal";

export type StudentRow = {
  id: number;
  name: string;
  school: string | null;
  gradeNumber: number;
  isActive: boolean;
  isOnline: boolean;
  attendanceRate: number;
  homeworkRate: number;
  teacherNames: string[];
  lastRecord?: {
    date: Date;
    memo?: string | null;
    attendanceStatus: string;
    homeworkStatus: string;
  };
};

type Props = {
  rows: StudentRow[];
  isAdmin: boolean;
};

export function StudentTable({ rows, isAdmin }: Props) {
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  return (
    <div className="glass-panel overflow-hidden">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">학생</th>
            <th className="px-4 py-3 text-left font-semibold">학교/학년</th>
            <th className="px-4 py-3 text-center font-semibold">출석률</th>
            <th className="px-4 py-3 text-center font-semibold">숙제</th>
            <th className="px-4 py-3 text-left font-semibold">최근 메모</th>
            <th className="px-4 py-3 text-left font-semibold">담당</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-slate-100 transition hover:bg-slate-50"
            >
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(row)}
                  className="font-semibold text-slate-900 hover:underline text-left"
                >
                  {row.name}
                </button>
                <div className="mt-1 flex gap-1">
                  {!row.isActive ? (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                      휴면
                    </span>
                  ) : null}
                  {row.isOnline ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700">
                      온라인
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                      오프라인
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">
                <p>{row.school || "-"}</p>
                <p className="text-xs text-slate-400">
                  {gradeNumberToLabel(row.gradeNumber)}
                </p>
              </td>
              <td className="px-4 py-3 text-center font-semibold text-emerald-600">
                {toPercent(row.attendanceRate, 0)}
              </td>
              <td className="px-4 py-3 text-center font-semibold text-blue-600">
                {toPercent(row.homeworkRate, 0)}
              </td>
              <td className="px-4 py-3 text-slate-600">
                <p className="font-medium">
                  {row.lastRecord?.memo || "메모 없음"}
                </p>
                <p className="text-xs text-slate-400">
                  {row.lastRecord?.date
                    ? new Date(row.lastRecord.date).toLocaleDateString("ko")
                    : "-"}
                </p>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {row.teacherNames.length > 0 ? row.teacherNames.join(", ") : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-500">
          조건에 맞는 학생이 없습니다.
        </p>
      ) : null}
      {selectedStudent && (
        <StudentDetailModal
          studentId={selectedStudent.id}
          defaultValues={{
            name: selectedStudent.name,
            gradeNumber: selectedStudent.gradeNumber,
            school: selectedStudent.school,
            isActive: selectedStudent.isActive,
            isOnline: selectedStudent.isOnline,
          }}
          isAdmin={isAdmin}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
