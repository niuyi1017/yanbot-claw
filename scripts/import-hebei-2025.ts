import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import * as XLSX from "xlsx";
import { CREATE_ADMISSIONS_SQL } from "./schema";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "yanbot.db");
const YEAR = 2025;
const PROVINCE = "河北";
const BATCH = "本科批";
const ENROLL_TYPE = "非定向";
const HEADER_ROWS = 6;

type SubjectGroup = "history" | "physics";

const FILES: { file: string; subjectGroup: SubjectGroup }[] = [
  {
    file: "2025年河北省普通高校招生本科批-历史科目组合平行志愿投档情况统计(1).xlsx",
    subjectGroup: "history",
  },
  {
    file: "2025年河北省普通高校招生本科批-物理科目组合平行志愿投档情况统计(2).xlsx",
    subjectGroup: "physics",
  },
];

type Row = {
  schoolCode: string;
  schoolName: string;
  schoolCity: string | null;
  schoolOwner: string | null;
  majorCode: string;
  majorName: string;
  minScore: number | null;
  tieChinMathSum: number | null;
  tieChinMathMax: number | null;
  tieForeign: number | null;
  tiePrimarySubj: number | null;
  tieSecondaryMax: number | null;
  tieSecondary2nd: number | null;
  tieVolunteerNo: number | null;
  remark: string | null;
};

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function toInt(v: unknown): number | null {
  const s = toStr(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

// 形如「安徽财经大学(蚌埠市)[公办]」「东北大学(沈阳市)」「东北大学(沈阳市)(中外合作办学)」「XX大学[民办]」
// 反复剥离末尾的 [...] 与 (...) 直至没有；()城市名（以「市/省/区/盟/州」结尾或纯括号城市）作为 city，
// 其余 () 组合并到 owner，[] 也作为 owner。
function splitSchoolName(raw: string): {
  name: string;
  city: string | null;
  owner: string | null;
} {
  let s = raw.trim();
  let city: string | null = null;
  const ownerParts: string[] = [];

  while (true) {
    const tail = s.match(/(\[[^\[\]]+\]|[（(][^（()）]+[)）])\s*$/);
    if (!tail) break;
    const grp = tail[1];
    const inner = grp.slice(1, -1).trim();
    s = s.slice(0, tail.index).trim();
    if (grp.startsWith("[")) {
      if (inner) ownerParts.unshift(inner);
    } else {
      // 倾向把最先剥下来（=最靠近基名）的 () 当 city；如果已经有 city，则视为附注归入 owner
      if (city === null && /[市省区盟州]$/.test(inner)) {
        city = inner;
      } else if (city === null) {
        // 仍然先当作 city（保守），免得漏报
        city = inner;
      } else {
        if (inner) ownerParts.unshift(inner);
      }
    }
  }

  return {
    name: s,
    city,
    owner: ownerParts.length ? ownerParts.join("/") : null,
  };
}

function parseSheet(filePath: string): { rows: Row[]; skipped: number } {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    raw: true,
  });

  const rows: Row[] = [];
  let skipped = 0;
  for (let i = HEADER_ROWS; i < matrix.length; i++) {
    const r = matrix[i];
    if (!r) continue;
    const schoolCode = toStr(r[0]);
    const schoolNameRaw = toStr(r[1]);
    const majorCode = toStr(r[2]);
    const majorName = toStr(r[3]);

    // 数据行要求院校代号纯数字（如 0005、10001）
    if (!/^\d+$/.test(schoolCode) || !schoolNameRaw || !majorCode || !majorName) {
      // 全空行直接静默
      const empty = r.every((c) => toStr(c) === "");
      if (!empty) skipped++;
      continue;
    }

    const { name, city, owner } = splitSchoolName(schoolNameRaw);
    rows.push({
      schoolCode,
      schoolName: name,
      schoolCity: city,
      schoolOwner: owner,
      majorCode,
      majorName,
      minScore: toInt(r[4]),
      tieChinMathSum: toInt(r[5]),
      tieChinMathMax: toInt(r[6]),
      tieForeign: toInt(r[7]),
      tiePrimarySubj: toInt(r[8]),
      tieSecondaryMax: toInt(r[9]),
      tieSecondary2nd: toInt(r[10]),
      tieVolunteerNo: toInt(r[11]),
      remark: toStr(r[12]) || null,
    });
  }
  return { rows, skipped };
}

function main() {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`data dir not found: ${DATA_DIR}`);
  }
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(CREATE_ADMISSIONS_SQL);

  // Build school name → school_id map (schools must be imported first).
  const schoolRows = db
    .prepare("SELECT school_id AS id, name FROM schools")
    .all() as { id: string; name: string }[];
  const nameToSchoolId = new Map(schoolRows.map((r) => [r.name, r.id]));
  if (schoolRows.length === 0) {
    console.warn(
      "[warn] schools table is empty — school_ref_id will be NULL. Run `pnpm import:schools` first.",
    );
  }

  const insert = db.prepare(`
    INSERT INTO admissions (
      year, province, batch, enroll_type, subject_group,
      school_code, school_name, school_city, school_owner, school_ref_id,
      major_code, major_name,
      min_score, tie_chin_math_sum, tie_chin_math_max, tie_foreign,
      tie_primary_subj, tie_secondary_max, tie_secondary_2nd, tie_volunteer_no,
      remark, source_file
    ) VALUES (
      @year, @province, @batch, @enrollType, @subjectGroup,
      @schoolCode, @schoolName, @schoolCity, @schoolOwner, @schoolRefId,
      @majorCode, @majorName,
      @minScore, @tieChinMathSum, @tieChinMathMax, @tieForeign,
      @tiePrimarySubj, @tieSecondaryMax, @tieSecondary2nd, @tieVolunteerNo,
      @remark, @sourceFile
    )
  `);

  let totalRead = 0;
  let totalWritten = 0;
  let totalSkipped = 0;
  let totalLinked = 0;

  for (const f of FILES) {
    const filePath = path.join(DATA_DIR, f.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[skip] file not found: ${filePath}`);
      continue;
    }
    const { rows, skipped } = parseSheet(filePath);
    let linked = 0;
    const tx = db.transaction((batch: Row[]) => {
      for (const r of batch) {
        const schoolRefId = nameToSchoolId.get(r.schoolName) ?? null;
        if (schoolRefId) linked++;
        insert.run({
          year: YEAR,
          province: PROVINCE,
          batch: BATCH,
          enrollType: ENROLL_TYPE,
          subjectGroup: f.subjectGroup,
          ...r,
          schoolRefId,
          sourceFile: f.file,
        });
      }
    });
    tx(rows);
    console.log(
      `[${f.subjectGroup}] file=${f.file} parsed=${rows.length} linked=${linked}/${rows.length} skipped=${skipped}`,
    );
    totalRead += rows.length;
    totalWritten += rows.length;
    totalSkipped += skipped;
    totalLinked += linked;
  }

  const count = db.prepare("SELECT COUNT(*) AS n FROM admissions").get() as {
    n: number;
  };
  console.log(
    `done. parsed=${totalRead} written=${totalWritten} linked=${totalLinked} skipped=${totalSkipped} db_rows=${count.n} db=${DB_PATH}`,
  );
  // Checkpoint WAL and revert to DELETE journal mode so the resulting .db
  // file is safe to mount read-only in Docker (WAL mode requires -shm which
  // cannot be created on a :ro volume).
  db.pragma("wal_checkpoint(TRUNCATE)");
  db.pragma("journal_mode = DELETE");
  db.close();
}

main();
