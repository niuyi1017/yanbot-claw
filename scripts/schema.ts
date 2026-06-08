export { schools, admissions } from "@/lib/db/schema";

export const CREATE_SCHOOLS_SQL = `
DROP TABLE IF EXISTS schools;
CREATE TABLE schools (
  school_id           TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  school_code         TEXT,
  type                TEXT,
  type_text           TEXT,
  type_school_text    TEXT,
  is_211              INTEGER NOT NULL DEFAULT 0,
  is_985              INTEGER NOT NULL DEFAULT 0,
  is_dual_class       INTEGER NOT NULL DEFAULT 0,
  province_text       TEXT,
  province_area_text  TEXT,
  belongs_to          TEXT,
  school_address      TEXT,
  rank                INTEGER,
  logo                TEXT,
  source_oid          TEXT,
  raw_detail          TEXT
);
CREATE UNIQUE INDEX uq_schools_name ON schools(name);
CREATE INDEX idx_schools_code ON schools(school_code);
`;

export const CREATE_ADMISSIONS_SQL = `
DROP TABLE IF EXISTS admissions;
CREATE TABLE admissions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  year            INTEGER NOT NULL,
  province        TEXT    NOT NULL,
  batch           TEXT    NOT NULL,
  enroll_type     TEXT    NOT NULL,
  subject_group   TEXT    NOT NULL,
  school_code     TEXT    NOT NULL,
  school_name     TEXT    NOT NULL,
  school_city     TEXT,
  school_owner    TEXT,
  school_ref_id   TEXT REFERENCES schools(school_id),
  major_code      TEXT    NOT NULL,
  major_name      TEXT    NOT NULL,
  min_score           INTEGER,
  tie_chin_math_sum   INTEGER,
  tie_chin_math_max   INTEGER,
  tie_foreign         INTEGER,
  tie_primary_subj    INTEGER,
  tie_secondary_max   INTEGER,
  tie_secondary_2nd   INTEGER,
  tie_volunteer_no    INTEGER,
  remark          TEXT,
  source_file     TEXT    NOT NULL,
  UNIQUE(year, subject_group, school_code, major_code)
);
CREATE INDEX idx_admissions_group_score ON admissions(subject_group, min_score);
CREATE INDEX idx_admissions_school_code ON admissions(school_code);
CREATE INDEX idx_admissions_school_name ON admissions(school_name);
CREATE INDEX idx_admissions_school_ref ON admissions(school_ref_id);
`;
