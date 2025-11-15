import fs from "fs";
import path from "path";
import XLSX from "xlsx";

const ROOT = path.resolve(__dirname, "..", "..");
const SOURCE_FILE = path.join(ROOT, "20251115_숙제 체크표.xlsm");
const OUTPUT_DIR = path.resolve(__dirname, "..", "prisma", "data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "excel-students.json");

type WeekStat = {
  label: string;
  value: number | null;
};

type StudentRow = {
  number: number | null;
  track: string;
  name: string;
  gradeLabel: string | null;
  gradeNumber: number | null;
  school: string;
  attendanceCount: number;
  homeworkSubmits: number;
  attendanceRate: number | null;
  lateRate: number | null;
  weekStats: WeekStat[];
  homeworkCompletion: number | null;
};

const safeNumber = (value: unknown): number | null => {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const resolveGradeNumber = (gradeLabel = "", school = "") => {
  const digits = String(gradeLabel).replace(/[^0-9]/g, "");
  if (!digits) return null;
  const numeric = parseInt(digits, 10);
  if (!Number.isFinite(numeric)) return null;
  const lowerSchool = school || "";
  if (lowerSchool.includes("초등")) return numeric;
  if (lowerSchool.includes("중학교")) return 6 + numeric;
  if (lowerSchool.includes("고등")) return 9 + numeric;
  return numeric;
};

const main = () => {
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`❌ Excel source file not found: ${SOURCE_FILE}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(SOURCE_FILE);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  const HEADER_ROW_INDEX = 2;
  const headerRow = (rows[HEADER_ROW_INDEX] || []) as string[];
  const studentRows = rows.slice(HEADER_ROW_INDEX + 1).filter((row) => {
    const name = row?.[2];
    return name !== undefined && name !== null && String(name).trim().length > 0;
  });

  const weekLabels = headerRow.slice(40, 44);
  const completionLabel = headerRow[44] || "숙제 완료율";

  const students: StudentRow[] = studentRows.map((row) => {
    const number = safeNumber(row[0]);
    const track = String(row[1] || "").trim();
    const name = String(row[2] || "").trim();
    const gradeLabel = row[3] ? String(row[3]).trim() : null;
    const school = String(row[4] || "").trim();

    const attendanceCount = safeNumber(row[36]) ?? 0;
    const homeworkSubmits = safeNumber(row[37]) ?? 0;
    const attendanceRate = safeNumber(row[38]);
    const lateRate = safeNumber(row[39]);
    const weekStats: WeekStat[] = weekLabels.map((label, idx) => ({
      label: String(label || `Week ${idx + 1}`),
      value: safeNumber(row[40 + idx]),
    }));
    const homeworkCompletion = safeNumber(row[44]);

    return {
      number,
      track,
      name,
      gradeLabel,
      gradeNumber: resolveGradeNumber(gradeLabel || "", school),
      school,
      attendanceCount,
      homeworkSubmits,
      attendanceRate,
      lateRate,
      weekStats,
      homeworkCompletion,
    };
  });

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify({ sheetName, students, completionLabel }, null, 2),
    "utf-8"
  );
  console.log(`✅ Exported ${students.length} students to ${OUTPUT_FILE}`);
};

main();
