import {
  addDays,
  eachWeekOfInterval,
  endOfMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export const buildLessonDayPayloads = (year: number, month: number) => {
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const weekStarts = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { weekStartsOn: 0 }
  );

  return weekStarts.map((weekStart) => {
    const label = `${weekStart.getMonth() + 1}.${weekStart.getDate()}~`;
    const date = startOfWeek(weekStart, { weekStartsOn: 0 });
    return {
      date,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      weekOfMonth: Math.ceil((date.getDate() - 1) / 7) + 1,
      weekLabel: label,
    };
  });
};

export const ensureWeekRange = (start: Date) =>
  Array.from({ length: 7 }).map((_, idx) => addDays(start, idx));
