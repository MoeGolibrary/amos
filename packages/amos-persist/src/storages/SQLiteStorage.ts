/*
 * @since 2024-10-18 00:33:43
 * @author junbao <junbao@moego.pet>
 */

import { PersistRow, PersistSpan, PersistValue, StorageEngine } from '../types';

export interface Database {
  runAsync(sql: string, values?: any[]): Promise<void>;
  getAllAsync<T>(sql: string, values?: any[]): Promise<T[]>;
}

export class SQLiteStorage implements StorageEngine {
  private db!: Database;

  constructor(
    readonly database: string,
    readonly table: string,
    readonly open: (db: string) => Promise<Database>,
  ) {}

  async init() {
    this.db = await this.open(this.database);
    await this.db.runAsync(
      `CREATE TABLE IF NOT EXISTS ${this.table}
       (
         key     TEXT    NOT NULL PRIMARY KEY,
         version INTEGER NOT NULL,
         value   TEXT
       );`,
    );
  }

  async getMulti(items: readonly string[]): Promise<readonly (PersistValue | null)[]> {
    const rows = items.map(() => '?').join(', ');
    const result = await this.db.getAllAsync<PersistRow>(
      `SELECT key, version, value
       FROM ${this.table}
       WHERE key IN (${rows})`,
      items as any[],
    );
    const map = Object.fromEntries(
      result.map(
        (r) => [r.key, [r.version, r.value === null ? void 0 : JSON.parse(r.value)]] as const,
      ),
    );
    return items.map((key) => map[key]);
  }

  async getPrefix(prefix: string): Promise<readonly PersistSpan[]> {
    const result = await this.db.getAllAsync<PersistRow>(
      `SELECT key, version, value
       FROM ${this.table}
       WHERE key LIKE ? ESCAPE '\\'`,
      [this.like(prefix)],
    );
    return result.map((r) => [r.key, r.version, r.value]);
  }

  async setMulti(items: readonly PersistSpan[]): Promise<void> {
    const rows = items.map(() => '?, ?, ?').join('), (');
    const values = items
      .map(([k, version, value]) => [k, version, value === void 0 ? null : JSON.stringify(value)])
      .flat();
    await this.db.runAsync(
      `INSERT INTO ${this.table}
         (key, version, value)
       VALUES (${rows})
       ON CONFLICT (key) DO UPDATE
         SET version = excluded.version,
             value   = excluded.value`,
      values,
    );
  }

  async removeMulti(items: readonly string[]): Promise<void> {
    const rows = items.map(() => '?').join(', ');
    await this.db.runAsync(
      `DELETE
       FROM ${this.table}
       WHERE key in (${rows})`,
      items as any[],
    );
  }

  async removePrefix(prefix: string): Promise<void> {
    await this.db.runAsync(
      `DELETE
       FROM ${this.table}
       WHERE key like ? ESCAPE '\\'`,
      [this.like(prefix)],
    );
  }

  private like(prefix: string) {
    return prefix.replace(/([\\%])/g, '\\$1') + '%';
  }
}