import type { ScheduleSetting, TeacherUnavailableSlot } from "@/generated/prisma-client/client";
import { minutesToTimeString } from "./time";

export type TimeSlot = {
  weekday: number;
  startMinutes: number;
  endMinutes: number;
};

export const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

type SettingInput = Pick<
  ScheduleSetting,
  "weekdays" | "startTimeMinutes" | "endTimeMinutes" | "lessonDurationMinutes" | "breakDurationMinutes"
>;

export const generateWeeklySlots = (setting: SettingInput): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const lessonWindow = setting.endTimeMinutes - setting.startTimeMinutes;
  if (lessonWindow <= 0) {
    return slots;
  }
  const blockLength = setting.lessonDurationMinutes + setting.breakDurationMinutes;
  const count = Math.max(1, Math.floor((lessonWindow + setting.breakDurationMinutes) / blockLength));

  setting.weekdays.forEach((weekday) => {
    let currentStart = setting.startTimeMinutes;
    for (let i = 0; i < count; i += 1) {
      const slotEnd = Math.min(currentStart + setting.lessonDurationMinutes, setting.endTimeMinutes);
      slots.push({
        weekday,
        startMinutes: currentStart,
        endMinutes: slotEnd,
      });
      currentStart += blockLength;
      if (currentStart >= setting.endTimeMinutes) {
        break;
      }
    }
  });

  return slots;
};

export const slotLabel = (slot: TimeSlot) =>
  `${WEEKDAY_LABELS[slot.weekday]} ${minutesToTimeString(slot.startMinutes)}~${minutesToTimeString(
    slot.endMinutes
  )}`;

export const isSlotBlocked = (
  slot: TimeSlot,
  blocks: Pick<TeacherUnavailableSlot, "weekday" | "startMinutes" | "endMinutes">[]
) =>
  blocks.some(
    (block) =>
      block.weekday === slot.weekday &&
      block.startMinutes === slot.startMinutes &&
      block.endMinutes === slot.endMinutes
  );
