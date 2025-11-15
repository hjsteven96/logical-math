"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { TeacherDetailModal } from "@/components/teachers/teacher-detail-modal";
import { Toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteTeacherAction } from "@/app/(dashboard)/teachers/actions";

type Teacher = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  age: number | null;
  memo: string | null;
  isActive: boolean;
  createdAt: Date;
};

type Props = {
  teachers: Teacher[];
};

export function TeacherTable({ teachers }: Props) {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Teacher | null>(null);
  const router = useRouter();

  const handleDeleteClick = (teacher: Teacher) => {
    setConfirmDelete(teacher);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;

    setDeletingId(confirmDelete.id);
    setConfirmDelete(null);

    try {
      const result = await deleteTeacherAction(confirmDelete.id);
      if (result.success) {
        setToast({ message: result.message, type: "success" });
        router.refresh();
      } else {
        setToast({ message: result.message, type: "error" });
      }
    } catch {
      setToast({ message: "비활성화 중 오류가 발생했습니다.", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(null);
  };

  return (
    <>
      <div className="glass-panel overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">이름</th>
              <th className="px-4 py-3 text-left font-semibold">연락처</th>
              <th className="px-4 py-3 text-left font-semibold">연령</th>
              <th className="px-4 py-3 text-left font-semibold">메모</th>
              <th className="px-4 py-3 text-left font-semibold">상태</th>
              <th className="px-4 py-3 text-left font-semibold">등록일</th>
              <th className="px-4 py-3 text-left font-semibold">작업</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr
                key={teacher.id}
                className="border-b border-slate-100 transition hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTeacher(teacher)}
                    className="font-semibold text-slate-900 hover:underline text-left"
                  >
                    {teacher.name}
                  </button>
                  <p className="text-xs text-slate-500">{teacher.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {teacher.phone || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {teacher.age ? `${teacher.age}세` : "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {teacher.memo || "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      teacher.isActive
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {teacher.isActive ? "활성" : "비활성"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {new Date(teacher.createdAt).toLocaleDateString("ko")}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(teacher)}
                    disabled={deletingId === teacher.id}
                    className="rounded-full p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                    aria-label="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {teachers.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            등록된 선생님이 없습니다.
          </p>
        ) : null}
      </div>
      {selectedTeacher && (
        <TeacherDetailModal
          teacherId={selectedTeacher.id}
          defaultValues={{
            name: selectedTeacher.name,
            email: selectedTeacher.email,
            phone: selectedTeacher.phone,
            age: selectedTeacher.age,
            memo: selectedTeacher.memo,
            isActive: selectedTeacher.isActive,
          }}
          onClose={() => setSelectedTeacher(null)}
        />
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="선생님 비활성화"
          message={`${confirmDelete.name} 선생님을 비활성화하시겠습니까?\n비활성화된 선생님은 목록에서 숨겨지지만, 관련 레코드는 유지됩니다.`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          confirmText="비활성화"
          cancelText="취소"
          variant="danger"
        />
      )}
    </>
  );
}
