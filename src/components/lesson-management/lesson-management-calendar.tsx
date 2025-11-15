"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { minutesToTimeString } from "@/lib/time";
import { formatShortDate } from "@/lib/date";
import { generateWeeklySlots } from "@/lib/schedule";
import { gradeNumberToLabel } from "@/lib/grade";
import { Toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LessonScheduleEditModal } from "./lesson-schedule-edit-modal";

type WeekDay = {
  date: string;
  weekday: number;
};

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
  weekDays: WeekDay[];
  teachers: Teacher[];
  students: Student[];
  notSubmittedTeachers: string[];
  lessonSchedules: LessonSchedule[];
  scheduleSetting: {
    weekdays: number[];
    startTimeMinutes: number;
    endTimeMinutes: number;
    lessonDurationMinutes: number;
    breakDurationMinutes: number;
  } | null;
  prevWeekHref: string;
  nextWeekHref: string;
  currentWeekLabel: string;
};

export function LessonManagementCalendar({
  weekDays,
  teachers,
  students,
  notSubmittedTeachers,
  lessonSchedules,
  scheduleSetting,
  prevWeekHref,
  nextWeekHref,
  currentWeekLabel,
}: Props) {
  const router = useRouter();
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<LessonSchedule | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "auto-schedule" | "confirm";
    onConfirm: () => void;
  } | null>(null);

  const canAutoSchedule = notSubmittedTeachers.length === 0 && scheduleSetting !== null;

  const handleAutoSchedule = async () => {
    setConfirmDialog({
      type: "auto-schedule",
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsAutoScheduling(true);
        try {
          const response = await fetch("/api/lesson-schedule/auto-schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              weekStart: weekDays[0]?.date,
              weekEnd: weekDays[6]?.date,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            setToast({ message: error.error || "자동 배치 중 오류가 발생했습니다.", type: "error" });
            return;
          }

          const result = await response.json();
          setToast({ 
            message: `수업 일정이 자동으로 배치되었습니다. (${result.count || 0}개 생성)`, 
            type: "success" 
          });
          // 서버 컴포넌트의 데이터를 갱신하기 위해 페이지 새로고침
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch (error) {
          setToast({ message: "자동 배치 중 오류가 발생했습니다.", type: "error" });
        } finally {
          setIsAutoScheduling(false);
        }
      },
    });
  };

  const handleConfirmSchedule = async () => {
    setConfirmDialog({
      type: "confirm",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const response = await fetch("/api/lesson-schedule/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              weekStart: weekDays[0]?.date,
              weekEnd: weekDays[6]?.date,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            setToast({ message: error.error || "일정 확정 중 오류가 발생했습니다.", type: "error" });
            return;
          }

          const result = await response.json();
          setToast({ 
            message: `수업 일정이 확정되었습니다. (${result.count || 0}개 확정)`, 
            type: "success" 
          });
          // 서버 컴포넌트의 데이터를 갱신하기 위해 페이지 새로고침
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch (error) {
          setToast({ message: "일정 확정 중 오류가 발생했습니다.", type: "error" });
        }
      },
    });
  };

  // 날짜별로 수업 일정 그룹화 (시간대별로 맵핑)
  const schedulesByDateAndTime = lessonSchedules.reduce<
    Record<string, Map<string, LessonSchedule>>
  >((acc, schedule) => {
    if (!acc[schedule.date]) {
      acc[schedule.date] = new Map();
    }
    const timeKey = `${schedule.startMinutes}-${schedule.endMinutes}`;
    acc[schedule.date]?.set(timeKey, schedule);
    return acc;
  }, {});

  // 시간 슬롯 생성 (스케줄 설정이 있을 때)
  const availableTimeSlots =
    scheduleSetting
      ? generateWeeklySlots({
          weekdays: scheduleSetting.weekdays,
          startTimeMinutes: scheduleSetting.startTimeMinutes,
          endTimeMinutes: scheduleSetting.endTimeMinutes,
          lessonDurationMinutes: scheduleSetting.lessonDurationMinutes,
          breakDurationMinutes: scheduleSetting.breakDurationMinutes,
        }).map((slot) => ({
          weekday: slot.weekday,
          startMinutes: slot.startMinutes,
          endMinutes: slot.endMinutes,
        }))
      : [];

  const handleScheduleUpdated = () => {
    window.location.reload();
  };

  return (
    <>
      <div className="glass-panel flex flex-col gap-4 px-6 py-5">
        {/* 주차 네비게이션 및 액션 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={prevWeekHref}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-slate-900"
              aria-label="이전 주"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <span className="font-semibold text-slate-700">{currentWeekLabel}</span>
            <Link
              href={nextWeekHref}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-slate-900"
              aria-label="다음 주"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAutoSchedule}
              disabled={!canAutoSchedule || isAutoScheduling}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAutoScheduling ? "배치 중..." : "자동 배치"}
            </button>
            {lessonSchedules.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmSchedule}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                확정
              </button>
            )}
          </div>
        </div>

        {/* 미제출 선생님 목록 */}
        {notSubmittedTeachers.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">일정 미제출 선생님</p>
            <p className="mt-1 text-xs text-amber-700">
              {notSubmittedTeachers.join(", ")} ({notSubmittedTeachers.length}명)
            </p>
            <p className="mt-1 text-xs text-amber-600">
              모든 선생님이 일정을 제출해야 자동 배치를 실행할 수 있습니다.
            </p>
          </div>
        )}

        {notSubmittedTeachers.length === 0 && lessonSchedules.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-600">
              모든 선생님이 일정을 제출했습니다. 자동 배치 버튼을 눌러 수업 일정을 생성하세요.
            </p>
          </div>
        )}

        {/* 주차별 달력 - 그리드 형식 */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-20 border-r border-slate-200 bg-white px-3 py-3 text-left text-xs font-semibold text-slate-500">
                  </th>
                  {weekDays.map((day) => {
                    const dateLabel = formatShortDate(day.date);
                    const weekdayLabel = ["일", "월", "화", "수", "목", "금", "토"][day.weekday];
                    const dateOnly = dateLabel.replace(/\([^)]+\)/, "").trim();

                    return (
                      <th
                        key={day.date}
                        className="border-b border-slate-200 bg-white px-3 py-3 text-center"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-900">{weekdayLabel}</span>
                          <span className="text-xs font-normal text-slate-500">{dateOnly}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {!scheduleSetting || availableTimeSlots.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border-b border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
                      {!scheduleSetting ? "스케줄 설정이 필요합니다." : "시간 슬롯이 없습니다."}
                    </td>
                  </tr>
                ) : (
                  // 모든 시간 슬롯을 가져오기 (운영 요일 기준)
                  Array.from(
                    new Set(
                      availableTimeSlots.map((slot) => `${slot.startMinutes}-${slot.endMinutes}`)
                    )
                  )
                    .sort((a, b) => {
                      const [aStart] = a.split("-").map(Number);
                      const [bStart] = b.split("-").map(Number);
                      return aStart - bStart;
                    })
                    .map((timeKey) => {
                      const [startMinutes, endMinutes] = timeKey.split("-").map(Number);
                      const timeLabel = `${minutesToTimeString(startMinutes)}~${minutesToTimeString(endMinutes)}`;

                      return (
                        <tr key={timeKey} className="border-b border-slate-100">
                          <td className="sticky left-0 z-10 w-20 border-r border-slate-200 bg-white px-3 py-2 text-xs font-normal text-slate-700">
                            {timeLabel}
                          </td>
                          {weekDays.map((day) => {
                            const daySchedulesMap = schedulesByDateAndTime[day.date] || new Map();
                            const schedule = daySchedulesMap.get(timeKey);
                            const isOperatingDay = scheduleSetting
                              ? scheduleSetting.weekdays.includes(day.weekday)
                              : false;

                            if (!isOperatingDay) {
                              return (
                                <td
                                  key={day.date}
                                  className="border-l border-slate-100 bg-slate-50 px-3 py-2"
                                >
                                  <p className="text-xs text-slate-400">-</p>
                                </td>
                              );
                            }

                            if (schedule) {
                              return (
                                <td
                                  key={day.date}
                                  className="border-l border-slate-100 px-3 py-2"
                                >
                                  <button
                                    type="button"
                                    onClick={() => setEditingSchedule(schedule)}
                                    className="w-full rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-left transition hover:bg-emerald-100"
                                  >
                                    <p className="text-xs font-semibold text-emerald-900">
                                      {schedule.teacherName}
                                    </p>
                                    <p className="mt-0.5 text-xs text-emerald-600">
                                      {schedule.studentName} ({gradeNumberToLabel(schedule.studentGrade)})
                                    </p>
                                  </button>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={day.date}
                                className="border-l border-slate-100 bg-white px-3 py-2"
                              >
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                                  <p className="text-xs text-slate-400">수업 없음</p>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
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

      {confirmDialog && (
        <ConfirmDialog
          title={
            confirmDialog.type === "auto-schedule"
              ? "자동 배치 실행"
              : "일정 확정"
          }
          message={
            confirmDialog.type === "auto-schedule"
              ? "선생님들의 가능한 시간대를 바탕으로 수업 일정을 자동으로 배치하시겠습니까?"
              : "현재 주간의 수업 일정을 확정하시겠습니까? 확정 후에는 수정할 수 없습니다."
          }
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          confirmText={confirmDialog.type === "auto-schedule" ? "배치" : "확정"}
          cancelText="취소"
          variant={confirmDialog.type === "auto-schedule" ? "warning" : "danger"}
        />
      )}
      {editingSchedule && (
        <LessonScheduleEditModal
          schedule={editingSchedule}
          teachers={teachers}
          students={students}
          availableTimeSlots={availableTimeSlots}
          onClose={() => setEditingSchedule(null)}
          onUpdated={handleScheduleUpdated}
        />
      )}
    </>
  );
}

