"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { UpdateStudentForm } from "@/components/students/update-student-form";

type Props = {
  studentId: number;
  defaultValues: {
    name: string;
    gradeNumber: number;
    school: string | null;
    isActive: boolean;
    isOnline: boolean;
  };
  isAdmin: boolean;
  onClose?: () => void;
};

export function StudentDetailModal({
  studentId,
  defaultValues,
  isAdmin,
  onClose,
}: Props) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-10">
      <div className="glass-panel w-full max-w-xl overflow-hidden bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs text-slate-500">학생 관리</p>
            <p className="text-lg font-semibold text-slate-900">
              {defaultValues.name} 정보 수정
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="bg-white px-6 py-5">
          <UpdateStudentForm
            studentId={studentId}
            defaultValues={defaultValues}
            isAdmin={isAdmin}
            onSubmitted={handleClose}
          />
        </div>
      </div>
    </div>
  );
}

