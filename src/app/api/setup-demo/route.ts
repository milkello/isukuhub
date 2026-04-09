import { NextResponse } from "next/server";
import { ensureDemoData, getDemoSummary } from "@/lib/demo";

async function buildResponse() {
  await ensureDemoData();
  const summary = await getDemoSummary();

  return NextResponse.json({
    message: "Demo data is ready.",
    ...summary,
  });
}

export async function POST() {
  return buildResponse();
}

export async function GET() {
  return buildResponse();
}
