import { addDays, format, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";

export const formatShortDate = (date: Date | string) =>
  format(new Date(date), "M.d(eee)", { locale: ko });

export const formatFullDate = (date: Date | string) =>
  format(new Date(date), "yyyy.MM.dd (eee)", { locale: ko });

export const getWeekDates = (referenceDate = new Date(), weekStartsOn: 0 | 1 = 0) => {
  const start = startOfWeek(referenceDate, { weekStartsOn });
  return Array.from({ length: 7 }).map((_, idx) => addDays(start, idx));
};

export const getWeekStart = (referenceDate = new Date(), weekStartsOn: 0 | 1 = 1) =>
  startOfWeek(referenceDate, { weekStartsOn });

export const getWeekRange = (referenceDate = new Date(), weekStartsOn: 0 | 1 = 1) => {
  const start = getWeekStart(referenceDate, weekStartsOn);
  const end = addDays(start, 6);
  return { start, end };
};
