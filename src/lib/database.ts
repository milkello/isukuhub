import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { ensureDemoData } from "./demo";
import { prisma } from "./prisma";
import { createManagedUser } from "./user-management";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
let db: Database.Database | null = null;

function getDatabase() {
  if (!db) {
    db = new Database(dbPath);
  }
  return db;
}

export type User = Awaited<ReturnType<typeof prisma.user.findFirst>>;

export const dbInterface = {
  async findUserByEmail(email: string) {
    await ensureDemoData();
    return prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  },

  async findUserById(id: string) {
    await ensureDemoData();
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async createUser(userData: {
    email: string;
    name: string;
    password: string;
    role: string;
    phone?: string;
    address?: string;
  }) {
    await ensureDemoData();
    return createManagedUser(userData);
  },

  async verifyPassword(password: string, hashedPassword: string) {
    return bcrypt.compare(password, hashedPassword);
  },

  async getAllUsers() {
    await ensureDemoData();
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async getAllTableData() {
    await ensureDemoData();

    const database = getDatabase();
    const tables = database
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'table'
            AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `,
      )
      .all() as Array<{ name: string }>;

    const result: Record<string, unknown[]> = {};

    for (const table of tables) {
      result[table.name] = database
        .prepare(`SELECT * FROM "${table.name}"`)
        .all() as unknown[];
    }

    return result;
  },
};
