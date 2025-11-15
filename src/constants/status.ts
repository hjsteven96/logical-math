export const attendanceStatuses = [
  "PRESENT",
  "LATE",
  "ABSENT",
  "NONE",
] as const;

export const homeworkStatuses = [
  "SUBMITTED",
  "NOT_SUBMITTED",
  "NO_HOMEWORK",
] as const;

export const attendanceStatusLabels: Record<string, string> = {
  PRESENT: "출석",
  LATE: "지각",
  ABSENT: "결석",
  NONE: "미입력",
};

export const homeworkStatusLabels: Record<string, string> = {
  SUBMITTED: "제출",
  NOT_SUBMITTED: "미제출",
  NO_HOMEWORK: "숙제 없음",
};
