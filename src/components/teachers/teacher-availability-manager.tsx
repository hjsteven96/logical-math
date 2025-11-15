"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateWeeklySlots, isSlotBlocked, WEEKDAY_LABELS } from "@/lib/schedule";
import { minutesToTimeString } from "@/lib/time";

type SlotRecord = {
  id: number;
  weekday: number;
  startMinutes: number;
  endMinutes: number;
  memo?: string | null;
};

type Props = {
  scheduleSetting: {
    weekdays: number[];
    startTimeMinutes: number;
    endTimeMinutes: number;
    lessonDurationMinutes: number;
    breakDurationMinutes: number;
  };
  teachers: {
    id: number;
    name: string;
  }[];
  initialUnavailable: Record<number, SlotRecord[]>;
  showTeacherSelect?: boolean;
};

export function TeacherAvailabilityManager({
  scheduleSetting,
  teachers,
  initialUnavailable,
  showTeacherSelect = true,
}: Props) {
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    teachers[0]?.id ?? null
  );
  const [slotMap, setSlotMap] = useState<Record<number, SlotRecord[]>>(
    initialUnavailable
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const slots = useMemo(() => generateWeeklySlots(scheduleSetting), [scheduleSetting]);

  const groupedSlots = useMemo(() => {
    const group: Record<number, typeof slots> = {};
    slots.forEach((slot) => {
      if (!group[slot.weekday]) {
        group[slot.weekday] = [];
      }
      group[slot.weekday]?.push(slot);
    });
    return group;
  }, [slots]);

  const unavailableForCurrent = useMemo(
    () => (selectedTeacherId ? slotMap[selectedTeacherId] ?? [] : []),
    [selectedTeacherId, slotMap]
  );

  const handleToggle = (slot: { weekday: number; startMinutes: number; endMinutes: number }) => {
    if (!selectedTeacherId) return;
    const currentSlot = unavailableForCurrent.find(
      (item) =>
        item.weekday === slot.weekday &&
        item.startMinutes === slot.startMinutes &&
        item.endMinutes === slot.endMinutes
    );

    startTransition(async () => {
      if (currentSlot) {
        await fetch("/api/teacher-unavailable", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: currentSlot.id }),
        });
        setSlotMap((prev) => ({
          ...prev,
          [selectedTeacherId]: (prev[selectedTeacherId] || []).filter((item) => item.id !== currentSlot.id),
        }));
      } else {
        const response = await fetch("/api/teacher-unavailable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacherId: selectedTeacherId,
            weekday: slot.weekday,
            startMinutes: slot.startMinutes,
            endMinutes: slot.endMinutes,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          setSlotMap((prev) => ({
            ...prev,
            [selectedTeacherId]: [...(prev[selectedTeacherId] || []), data.data],
          }));
        }
      }
      router.refresh();
    });
  };

  if (teachers.length === 0) {
    return (
      <div className="glass-panel px-6 py-5 text-sm text-slate-500">
        등록된 선생님이 없습니다.
      </div>
    );
  }

  return (
    <div className="glass-panel flex flex-col gap-4 px-6 py-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs text-slate-500">선생님 일정</p>
          <h2 className="text-lg font-semibold text-slate-900">
            비가용 시간 관리
          </h2>
        </div>
        {showTeacherSelect && teachers.length > 1 ? (
          <select
            value={selectedTeacherId ?? ""}
            onChange={(event) => setSelectedTeacherId(Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
          >
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm font-semibold text-slate-700">
            {teachers[0]?.name}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {WEEKDAY_LABELS.map((label, index) => {
          const dailySlots = groupedSlots[index] || [];
          const isActiveDay = scheduleSetting.weekdays.includes(index);
          return (
            <div key={label} className="rounded-2xl border border-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-700">{label}</p>
              {!isActiveDay ? (
                <p className="mt-2 text-xs text-slate-400">운영 안 함</p>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  {dailySlots.map((slot) => {
                    const blocked = isSlotBlocked(slot, unavailableForCurrent);
                    return (
                      <button
                        key={`${slot.weekday}-${slot.startMinutes}`}
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggle(slot)}
                        className={`rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                          blocked
                            ? "bg-slate-100 text-slate-500 border border-slate-200"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}
                      >
                        {minutesToTimeString(slot.startMinutes)}~
                        {minutesToTimeString(slot.endMinutes)}
                        <span className="ml-2 text-[10px] font-normal text-slate-400">
                          {blocked ? "불가" : "가능"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
