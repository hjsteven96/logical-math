"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { generateWeeklySlots } from "@/lib/schedule";
import { minutesToTimeString } from "@/lib/time";
import { formatShortDate } from "@/lib/date";
import { WeekNavigator } from "./week-navigator";
import { Toast } from "@/components/ui/toast";

type SlotRecord = {
  id?: number;
  date: string;
  startMinutes: number;
  endMinutes: number;
  isAvailable: boolean;
  memo?: string | null;
};

type WeekDay = {
  date: string;
  weekday: number;
};

type Props = {
  scheduleSetting: {
    weekdays: number[];
    startTimeMinutes: number;
    endTimeMinutes: number;
    lessonDurationMinutes: number;
    breakDurationMinutes: number;
  };
  teacherId: number;
  weekDays: WeekDay[];
  slots: SlotRecord[];
  prevWeekHref: string;
  nextWeekHref: string;
  currentWeekLabel: string;
};

export function WeeklyAvailabilityManager({
  scheduleSetting,
  teacherId,
  weekDays,
  slots,
  prevWeekHref,
  nextWeekHref,
  currentWeekLabel,
}: Props) {
  const [entries, setEntries] = useState<Map<string, SlotRecord>>(() => {
    const map = new Map<string, SlotRecord>();
    slots.forEach((slot) => {
      const key = `${slot.date}-${slot.startMinutes}`;
      map.set(key, slot);
    });
    return map;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  // slots prop이 변경되면 entries 업데이트
  useEffect(() => {
    if (!isEditing) {
      const map = new Map<string, SlotRecord>();
      slots.forEach((slot) => {
        const key = `${slot.date}-${slot.startMinutes}`;
        map.set(key, slot);
      });
      setEntries(map);
    }
  }, [slots, isEditing]);

  const templateSlots = useMemo(
    () => generateWeeklySlots(scheduleSetting),
    [scheduleSetting]
  );

  const slotsByWeekday = useMemo(() => {
    const grouped: Record<number, typeof templateSlots> = {};
    templateSlots.forEach((slot) => {
      if (!grouped[slot.weekday]) {
        grouped[slot.weekday] = [];
      }
      grouped[slot.weekday]?.push(slot);
    });
    return grouped;
  }, [templateSlots]);

  const handleToggle = (dateStr: string, weekday: number, slot: { startMinutes: number; endMinutes: number }) => {
    if (!isEditing) return;

    const key = `${dateStr}-${slot.startMinutes}`;
    const hasEntry = entries.has(key);
    const nextState = !hasEntry;

    setEntries((prev) => {
      const clone = new Map(prev);
      if (nextState) {
        clone.set(key, {
          date: dateStr,
          startMinutes: slot.startMinutes,
          endMinutes: slot.endMinutes,
          isAvailable: true,
        });
      } else {
        clone.delete(key);
      }
      return clone;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const startDate = weekDays[0]?.date;
      const endDate = weekDays[weekDays.length - 1]?.date;
      
      if (!startDate || !endDate) {
        setToast({ message: "날짜 정보가 없습니다.", type: "error" });
        return;
      }

      const allSlots: Array<{
        date: string;
        startMinutes: number;
        endMinutes: number;
        isAvailable: boolean;
      }> = [];

      weekDays.forEach((day) => {
        const daySlots = slotsByWeekday[day.weekday] || [];
        daySlots.forEach((slot) => {
          const key = `${day.date}-${slot.startMinutes}`;
          allSlots.push({
            date: day.date,
            startMinutes: slot.startMinutes,
            endMinutes: slot.endMinutes,
            isAvailable: entries.has(key),
          });
        });
      });

      const response = await fetch("/api/teacher-weekly-availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          startDate,
          endDate,
          slots: allSlots,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setToast({ message: error.error || "제출 중 오류가 발생했습니다.", type: "error" });
        return;
      }

      setToast({ message: "일정이 제출되었습니다.", type: "success" });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      setToast({ message: "제출 중 오류가 발생했습니다.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <>
      <div className="glass-panel flex flex-col gap-4 px-6 py-5">
        <div className="flex items-center justify-between">
          <WeekNavigator
            prevWeekHref={prevWeekHref}
            nextWeekHref={nextWeekHref}
            currentWeekLabel={currentWeekLabel}
          />
          {isEditing ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? "제출 중..." : "제출"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEdit}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              수정
            </button>
          )}
        </div>

        <p className="text-sm text-slate-600">
          해당 주차에서 가능한 시간을{" "}
          <span className="font-semibold text-emerald-600">초록색</span>으로
          표시해주세요. {isEditing ? "클릭하면 상태가 전환됩니다." : "수정 버튼을 눌러 편집하세요."}
        </p>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {weekDays.map((day) => {
          const daySlots = slotsByWeekday[day.weekday] || [];
          const dateLabel = formatShortDate(day.date);
          if (daySlots.length === 0) {
            return (
              <div
                key={day.date}
                className="rounded-2xl border border-slate-100 p-4"
              >
                <p className="text-sm font-semibold text-slate-700">
                  {dateLabel}
                </p>
                <p className="mt-2 text-xs text-slate-400">운영하지 않는 요일</p>
              </div>
            );
          }
          return (
            <div
              key={day.date}
              className="rounded-2xl border border-slate-100 p-4"
            >
              <p className="text-sm font-semibold text-slate-700">
                {dateLabel}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {daySlots.map((slot) => {
                  const key = `${day.date}-${slot.startMinutes}`;
                  const isAvailable = entries.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!isEditing || isSubmitting}
                      onClick={() => handleToggle(day.date, day.weekday, slot)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        isAvailable
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-500"
                      } ${!isEditing ? "opacity-75 cursor-not-allowed" : ""}`}
                    >
                      <span>
                        {minutesToTimeString(slot.startMinutes)}~
                        {minutesToTimeString(slot.endMinutes)}
                      </span>
                      <span className="text-[10px] font-normal">
                        {isAvailable ? "가능" : "미등록"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
