type GradeBand = {
  range: [number, number];
  label: string;
};

const bands: GradeBand[] = [
  { range: [1, 6], label: "초등" },
  { range: [7, 9], label: "중등" },
  { range: [10, 12], label: "고등" },
];

export const gradeNumberToLabel = (gradeNumber: number | null | undefined) => {
  if (!gradeNumber) return "-";
  if (gradeNumber >= 1 && gradeNumber <= 6) {
    return `초${gradeNumber}`;
  }
  if (gradeNumber >= 7 && gradeNumber <= 9) {
    return `중${gradeNumber - 6}`;
  }
  if (gradeNumber >= 10 && gradeNumber <= 12) {
    return `고${gradeNumber - 9}`;
  }
  return `${gradeNumber}학년`;
};

export const guessGradeBand = (gradeNumber?: number | null) => {
  if (!gradeNumber) {
    return null;
  }
  return bands.find((band) => gradeNumber >= band.range[0] && gradeNumber <= band.range[1])?.label;
};

export const gradeFilterOptions = [
  { label: "전체 학년", value: "all" },
  ...Array.from({ length: 12 }).map((_, index) => {
    const gradeNumber = index + 1;
    return {
      label: gradeNumberToLabel(gradeNumber),
      value: gradeNumber.toString(),
    };
  }),
  ...bands.map((band) => ({
    label: `${band.label} 전체`,
    value: `${band.label}-band`,
  })),
];

export const resolveGradeNumbers = (value: string | null) => {
  if (!value || value === "all") {
    return null;
  }
  if (value.endsWith("-band")) {
    const band = bands.find((b) => value.startsWith(b.label));
    if (!band) return null;
    const [start, end] = band.range;
    return Array.from({ length: end - start + 1 }).map((_, idx) => start + idx);
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return null;
  }
  return [numeric];
};
