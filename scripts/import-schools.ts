import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { CREATE_SCHOOLS_SQL } from "./schema";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "yanbot.db");
const SRC = path.join(DATA_DIR, "yanbot-prod.schools.json");

type RawSchool = {
  _id?: { $oid?: string };
  school_id: string;
  name: string;
  schoolCode?: string;
  type?: string;
  typeText?: string;
  typeSchoolText?: string;
  is211?: boolean;
  is985?: boolean;
  isDual_class?: string;
  provinceText?: string;
  provinceAreaText?: string;
  rank?: number;
  logo?: string;
  detail?: string;
};

function safeJson<T = unknown>(s: unknown): T | null {
  if (typeof s !== "string") return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function toNullText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function main() {
  if (!fs.existsSync(SRC)) throw new Error(`source not found: ${SRC}`);
  const data: RawSchool[] = JSON.parse(fs.readFileSync(SRC, "utf8"));
  console.log(`source records: ${data.length}`);

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(CREATE_SCHOOLS_SQL);

  const insert = db.prepare(`
    INSERT INTO schools (
      school_id, name, school_code, type, type_text, type_school_text,
      is_211, is_985, is_dual_class,
      province_text, province_area_text, belongs_to, school_address,
      rank, logo, source_oid, raw_detail
    ) VALUES (
      @schoolId, @name, @schoolCode, @type, @typeText, @typeSchoolText,
      @is211, @is985, @isDualClass,
      @provinceText, @provinceAreaText, @belongsTo, @schoolAddress,
      @rank, @logo, @sourceOid, @rawDetail
    )
  `);

  let written = 0;
  let skippedNoName = 0;
  let dupName = 0;
  const seenNames = new Set<string>();
  const seenIds = new Set<string>();

  const tx = db.transaction((rows: RawSchool[]) => {
    for (const r of rows) {
      const name = toNullText(r.name);
      const schoolId = toNullText(r.school_id);
      if (!name || !schoolId) {
        skippedNoName++;
        continue;
      }
      if (seenIds.has(schoolId) || seenNames.has(name)) {
        dupName++;
        continue;
      }
      seenIds.add(schoolId);
      seenNames.add(name);

      const detail = safeJson<{ belongsTo?: string; school_address?: string }>(r.detail);
      insert.run({
        schoolId,
        name,
        schoolCode: toNullText(r.schoolCode),
        type: toNullText(r.type),
        typeText: toNullText(r.typeText),
        typeSchoolText: toNullText(r.typeSchoolText),
        is211: r.is211 ? 1 : 0,
        is985: r.is985 ? 1 : 0,
        isDualClass: r.isDual_class === "双一流" ? 1 : 0,
        provinceText: toNullText(r.provinceText),
        provinceAreaText: toNullText(r.provinceAreaText),
        belongsTo: toNullText(detail?.belongsTo),
        schoolAddress: toNullText(detail?.school_address),
        rank: typeof r.rank === "number" ? r.rank : null,
        logo: toNullText(r.logo),
        sourceOid: toNullText(r._id?.$oid),
        rawDetail: typeof r.detail === "string" ? r.detail : null,
      });
      written++;
    }
  });
  tx(data);

  console.log(`done. written=${written} skipped_no_name=${skippedNoName} dup=${dupName}`);
  // Checkpoint WAL and revert to DELETE journal mode so the resulting .db
  // file is safe to mount read-only in Docker (WAL mode requires -shm which
  // cannot be created on a :ro volume).
  db.pragma("wal_checkpoint(TRUNCATE)");
  db.pragma("journal_mode = DELETE");
  db.close();
}

main();
