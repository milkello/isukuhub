import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureDemoData } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  await ensureDemoData();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const householdId = searchParams.get("householdId");
  const agentId = searchParams.get("agentId");

  const collections = await prisma.collection.findMany({
    where: {
      status: status ?? undefined,
      householdId: householdId ?? undefined,
      agentId: agentId ?? undefined,
    },
    include: {
      household: {
        select: { id: true, name: true, email: true },
      },
      agent: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { scheduledDate: "desc" },
  });

  return NextResponse.json(
    collections.map((collection: (typeof collections)[number]) => ({
      ...collection,
      scheduledDate: collection.scheduledDate.toISOString(),
      completedDate: collection.completedDate?.toISOString() ?? null,
      createdAt: collection.createdAt.toISOString(),
      updatedAt: collection.updatedAt.toISOString(),
    })),
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const householdId = String(body.householdId ?? session.user.id);
  const agentId = String(body.agentId ?? session.user.id);

  const created = await prisma.collection.create({
    data: {
      collectionId: `COL-${Date.now()}`,
      householdId,
      agentId,
      wasteType: String(body.wasteType ?? "GENERAL_WASTE"),
      weight: Number(body.weight ?? 0),
      status: String(body.status ?? "SCHEDULED"),
      scheduledDate: new Date(body.scheduledDate ?? Date.now()),
      completedDate: body.completedDate ? new Date(body.completedDate) : null,
      notes: body.notes ? String(body.notes) : null,
      location: body.location ? String(body.location) : null,
      photos: null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
