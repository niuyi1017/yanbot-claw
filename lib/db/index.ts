import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";

const DB_PATH = process.env.YANBOT_DB_PATH || path.join(process.cwd(), "data", "yanbot.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`sqlite db not found: ${DB_PATH}`);
    }
    _db = new Database(DB_PATH, { readonly: true });
  }
  return _db;
}
