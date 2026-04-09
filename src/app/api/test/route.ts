import { NextResponse } from "next/server";
import { ensureDemoData, getDemoSummary } from "@/lib/demo";
import { dbInterface } from "@/lib/database";

export async function GET() {
  try {
    await ensureDemoData();
    const [users, summary] = await Promise.all([
      dbInterface.getAllUsers(),
      getDemoSummary(),
    ]);

    return NextResponse.json({
      message: "Database connection successful.",
      userCount: users.length,
      users: users.map((user: (typeof users)[number]) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      })),
      counts: summary.counts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Database connection failed.",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
