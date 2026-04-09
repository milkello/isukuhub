import { NextResponse } from "next/server";
import { ensureDemoData, getDemoSummary } from "@/lib/demo";

export async function POST() {
  try {
    await ensureDemoData();
    const summary = await getDemoSummary();
    return NextResponse.json({
      message: "Database initialized successfully.",
      ...summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize the database.",
      },
      { status: 500 },
    );
  }
}
