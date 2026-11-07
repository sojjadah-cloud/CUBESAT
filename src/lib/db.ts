import fs from "node:fs";
import path from "node:path";

/**
 * Minimal database layer. Uses a real PostgreSQL server when DATABASE_URL is
 * set; otherwise falls back to an embedded PostgreSQL (PGlite) stored under
 * .data/ so the platform runs locally without installing a database server.
 * All queries are parameterised.
 */

type Row = Record<string, unknown>;

export interface Queryable {
  query<T extends object = Row>(sql: string, params?: unknown[]): Promise<T[]>;
}

interface Driver extends Queryable {
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
  exec(sql: string): Promise<void>;
}

async function createPgDriver(url: string): Promise<Driver> {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: url,
    max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" }
        : undefined,
  });
  return {
    async query<T extends object>(sql: string, params?: unknown[]) {
      const res = await pool.query(sql, params);
      return res.rows as T[];
    },
    async exec(sql) {
      await pool.query(sql);
    },
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await fn({
          async query<T extends object>(sql: string, params?: unknown[]) {
            const res = await client.query(sql, params);
            return res.rows as T[];
          },
        });
        await client.query("COMMIT");
        return result;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },
  };
}

async function createPgliteDriver(): Promise<Driver> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = path.resolve(process.env.PGLITE_DIR ?? ".data/pglite");
  fs.mkdirSync(dir, { recursive: true });
  const db = await PGlite.create(dir);
  return {
    async query<T extends object>(sql: string, params?: unknown[]) {
      const res = await db.query<T>(sql, params);
      return res.rows;
    },
    async exec(sql) {
      await db.exec(sql);
    },
    async transaction(fn) {
      return db.transaction(async (tx) =>
        fn({
          async query<T extends object>(sql: string, params?: unknown[]) {
            const res = await tx.query<T>(sql, params);
            return res.rows;
          },
        }),
      );
    },
  };
}

async function init(): Promise<Driver> {
  const url = process.env.DATABASE_URL;
  const driver = url ? await createPgDriver(url) : await createPgliteDriver();
  const schema = fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8");
  await driver.exec(schema);
  return driver;
}

const globalForDb = globalThis as unknown as { __cubesatDb?: Promise<Driver> };

function driver(): Promise<Driver> {
  if (!globalForDb.__cubesatDb) {
    globalForDb.__cubesatDb = init().catch((err) => {
      globalForDb.__cubesatDb = undefined;
      throw err;
    });
  }
  return globalForDb.__cubesatDb;
}

export async function query<T extends object = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await driver()).query<T>(sql, params);
}

export async function queryOne<T extends object = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
  return (await driver()).transaction(fn);
}
