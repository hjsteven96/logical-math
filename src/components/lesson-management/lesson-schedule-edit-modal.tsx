"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { minutesToTimeString } from "@/lib/time";
import { formatShortDate } from "@/lib/date";
import { gradeNumberToLabel } from "@/lib/grade";
import { Toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Teacher = {
  id: number;
  name: string;
};

type Student = {
  id: number;
  name: string;
  gradeNumber: number;
};

type LessonSchedule = {
  id: number;
  teacherId: number;
  teacherName: string;
  studentId: number;
  studentName: string;
  studentGrade: number;
  date: string;
  startMinutes: number;
  endMinutes: number;
  status: "DRAFT" | "CONFIRMED";
  memo: string | null;
};

type Props = {
  schedule: LessonSchedule;
  teachers: Teacher[];
  students: Student[];
  availableTimeSlots: Array<{ startMinutes: number; endMinutes: number }>;
  onClose: () => void;
  onUpdated: () => void;
};

export function LessonScheduleEditModal({
  schedule,
  teachers,
  students,
  availableTimeSlots,
  onClose,
  onUpdated,
}: Props) {
  const [teacherId, setTeacherId] = useState(schedule.teacherId);
  const [studentId, setStudentId] = useState(schedule.studentId);
  const [startMinutes, setStartMinutes] = useState(schedule.startMinutes);
  const [endMinutes, setEndMinutes] = useState(schedule.endMinutes);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/lesson-schedule/${schedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          studentId,
          date: schedule.date,
          startMinutes,
          endMinutes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setToast({ message: error.error || "수정 중 오류가 발생했습니다.", type: "error" });
        return;
      }

      setToast({ message: "수업 일정이 수정되었습니다.", type: "success" });
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 1000);
    } catch (error) {
      setToast({ message: "수정 중 오류가 발생했습니다.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/lesson-schedule/${schedule.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        setToast({ message: error.error || "삭제 중 오류가 발생했습니다.", type: "error" });
        return;
      }

      setToast({ message: "수업 일정이 삭제되었습니다.", type: "success" });
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 1000);
    } catch (error) {
      setToast({ message: "삭제 중 오류가 발생했습니다.", type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  // 시간 슬롯 생성 (startMinutes와 endMinutes로 필터링)
  const timeSlotOptions = availableTimeSlots
    .filter((slot) => slot.startMinutes < slot.endMinutes)
    .map((slot) => ({
      value: `${slot.startMinutes}-${slot.endMinutes}`,
      label: `${minutesToTimeString(slot.startMinutes)}~${minutesToTimeString(slot.endMinutes)}`,
      startMinutes: slot.startMinutes,
      endMinutes: slot.endMinutes,
    }));

  const selectedTimeSlot = timeSlotOptions.find(
    (option) => option.startMinutes === startMinutes && option.endMinutes === endMinutes
  ) || {
    value: `${startMinutes}-${endMinutes}`,
    label: `${minutesToTimeString(startMinutes)}~${minutesToTimeString(endMinutes)}`,
    startMinutes,
    endMinutes,
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-10">
        <div className="glass-panel w-full max-w-xl overflow-hidden bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <p className="text-xs text-slate-500">수업 일정 수정</p>
              <p className="text-lg font-semibold text-slate-900">
                {formatShortDate(schedule.date)} 수업 수정
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="bg-white px-6 py-5">
            <div className="flex flex-col gap-4 text-sm">
              <div>
                <label className="flex flex-col gap-1 text-slate-600">
                  선생님
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(Number(e.target.value))}
                    className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
                    disabled={schedule.status === "CONFIRMED"}
                  >
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label className="flex flex-col gap-1 text-slate-600">
                  학생
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(Number(e.target.value))}
                    className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
                    disabled={schedule.status === "CONFIRMED"}
                  >
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({gradeNumberToLabel(student.gradeNumber)})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label className="flex flex-col gap-1 text-slate-600">
                  시간대
                  <select
                    value={selectedTimeSlot.value}
                    onChange={(e) => {
                      const selected = timeSlotOptions.find((opt) => opt.value === e.target.value);
                      if (selected) {
                        setStartMinutes(selected.startMinutes);
                        setEndMinutes(selected.endMinutes);
                      }
                    }}
                    className="rounded-xl border border-slate-200 px-3 py-2 focus:border-slate-900 focus:outline-none"
                    disabled={schedule.status === "CONFIRMED"}
                  >
                    {timeSlotOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    {!timeSlotOptions.find((opt) => opt.value === selectedTimeSlot.value) && (
                      <option value={selectedTimeSlot.value}>{selectedTimeSlot.label}</option>
                    )}
                  </select>
                </label>
              </div>
              {schedule.status === "CONFIRMED" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-xs text-amber-700">
                    확정된 일정은 수정할 수 없습니다.
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                {schedule.status === "DRAFT" && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    disabled={isDeleting || isSaving}
                    className="flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    삭제
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isDeleting || schedule.status === "CONFIRMED"}
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="수업 일정 삭제"
          message="이 수업 일정을 삭제하시겠습니까?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          confirmText="삭제"
          cancelText="취소"
          variant="danger"
        />
      )}
    </>
  );
}

