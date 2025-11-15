"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { CreateStudentForm } from "@/components/students/create-student-form";

type Teacher = {
  id: number;
  name: string;
};

type Props = {
  teachers: Teacher[];
  isAdmin: boolean;
};

export function CreateStudentModal({ teachers, isAdmin }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" />
        신규 학생 등록
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-10">
          <div className="glass-panel w-full max-w-xl overflow-hidden bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-xs text-slate-500">학생 관리</p>
                <p className="text-lg font-semibold text-slate-900">
                  신규 학생 등록
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-white px-6 py-5">
              <CreateStudentForm
                teachers={teachers}
                onSubmitted={() => setIsOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
