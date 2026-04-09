"use server";

import { Prisma } from "@prisma/client";
import { ensureDemoData } from "@/lib/demo";
import { prisma } from "@/lib/prisma";
import { requireActionRole } from "@/lib/session";
import {
  createManagedUser,
  deleteManagedUser,
  getManagedUserById,
  updateManagedUser,
} from "@/lib/user-management";

function asString(value: unknown, label: string) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    throw new Error(`${label} is required.`);
  }
  return normalized;
}

function asOptionalString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function asNumber(value: unknown, label: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a valid number.`);
  }
  return parsed;
}

function asOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asDate(value: unknown, label: string) {
  const parsed = new Date(String(value ?? ""));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} must be a valid date.`);
  }
  return parsed;
}

function asOptionalDate(value: unknown) {
  if (!value) {
    return null;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }

  return fallback;
}

function createPublicId(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-8)}`;
}

async function getAgentProfileIdForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { agentProfile: true },
  });

  if (!user || user.role !== "AGENT" || !user.agentProfile) {
    throw new Error("Selected agent does not have a valid profile.");
  }

  return user.agentProfile.id;
}

async function getDefaultAgentUserId() {
  const agent = await prisma.user.findFirst({
    where: { role: "AGENT", isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!agent) {
    throw new Error("No active agent is available for assignment.");
  }

  return agent.id;
}

function toActionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return new Error("That record already exists with the same unique value.");
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("The request could not be completed.");
}

export async function upsertPortalUserAction(payload: Record<string, unknown>) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "AGENT"]);
  const id = asOptionalString(payload.id);
  const role = asString(payload.role, "Role");

  if (session.user.role === "AGENT" && role !== "HOUSEHOLD") {
    throw new Error("Agents can only register or update household accounts.");
  }

  try {
    if (id) {
      const existing = await getManagedUserById(id);
      if (!existing) {
        throw new Error("User not found.");
      }

      if (session.user.role === "AGENT" && existing.role !== "HOUSEHOLD") {
        throw new Error("Agents can only update household accounts.");
      }

      await updateManagedUser(id, payload);
      return;
    }

    await createManagedUser({
      ...payload,
      email: asString(payload.email, "Email"),
      name: asString(payload.name, "Name"),
      role,
    });
  } catch (error) {
    throw toActionError(error);
  }
}

export async function deletePortalUserAction(id: string) {
  await ensureDemoData();
  await requireActionRole(["ADMIN"]);

  try {
    await deleteManagedUser(id);
  } catch (error) {
    throw toActionError(error);
  }
}

export async function upsertCollectionAction(payload: Record<string, unknown>) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "AGENT", "HOUSEHOLD"]);
  const id = asOptionalString(payload.id);
  const requestedHouseholdId = asOptionalString(payload.householdId);
  const requestedAgentId = asOptionalString(payload.agentId);

  const householdId =
    session.user.role === "HOUSEHOLD"
      ? session.user.id
      : requestedHouseholdId ?? (() => {
          throw new Error("Household is required.");
        })();

  const agentId =
    session.user.role === "AGENT"
      ? session.user.id
      : requestedAgentId ?? (await getDefaultAgentUserId());

  try {
    if (id) {
      const existing = await prisma.collection.findUnique({ where: { id } });
      if (!existing) {
        throw new Error("Collection not found.");
      }

      if (session.user.role === "HOUSEHOLD" && existing.householdId !== session.user.id) {
        throw new Error("You can only update your own collection requests.");
      }

      if (session.user.role === "AGENT" && existing.agentId !== session.user.id) {
        throw new Error("You can only update collections assigned to you.");
      }

      await prisma.collection.update({
        where: { id },
        data: {
          householdId,
          agentId,
          collectionId: asString(payload.collectionId ?? existing.collectionId, "Collection ID"),
          wasteType: asString(payload.wasteType, "Waste type"),
          weight: asNumber(payload.weight, "Weight"),
          status: asString(payload.status, "Status"),
          scheduledDate: asDate(payload.scheduledDate, "Scheduled date"),
          completedDate: asOptionalDate(payload.completedDate),
          location: asOptionalString(payload.location),
          notes: asOptionalString(payload.notes),
        },
      });
      return;
    }

    await prisma.collection.create({
      data: {
        collectionId: asOptionalString(payload.collectionId) ?? createPublicId("COL"),
        householdId,
        agentId,
        wasteType: asString(payload.wasteType, "Waste type"),
        weight: asNumber(payload.weight, "Weight"),
        status: asOptionalString(payload.status) ?? "SCHEDULED",
        scheduledDate: asDate(payload.scheduledDate, "Scheduled date"),
        completedDate: asOptionalDate(payload.completedDate),
        location: asOptionalString(payload.location),
        notes: asOptionalString(payload.notes),
      },
    });
  } catch (error) {
    throw toActionError(error);
  }
}

export async function deleteCollectionAction(id: string) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "AGENT", "HOUSEHOLD"]);
  const existing = await prisma.collection.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Collection not found.");
  }

  if (session.user.role === "HOUSEHOLD" && existing.householdId !== session.user.id) {
    throw new Error("You can only cancel your own collection requests.");
  }

  if (session.user.role === "AGENT" && existing.agentId !== session.user.id) {
    throw new Error("You can only remove collections assigned to you.");
  }

  await prisma.collection.delete({ where: { id } });
}

export async function updateCollectionStatusAction(payload: Record<string, unknown>) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "AGENT", "HOUSEHOLD"]);
  const id = asString(payload.id, "Collection");
  const status = asString(payload.status, "Status");
  const existing = await prisma.collection.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Collection not found.");
  }

  if (session.user.role === "HOUSEHOLD" && existing.householdId !== session.user.id) {
    throw new Error("You can only update your own collection requests.");
  }

  if (session.user.role === "AGENT" && existing.agentId !== session.user.id) {
    throw new Error("You can only update collections assigned to you.");
  }

  await prisma.collection.update({
    where: { id },
    data: {
      status,
      completedDate: status === "COMPLETED" ? new Date() : existing.completedDate,
    },
  });
}

export async function upsertRouteAction(payload: Record<string, unknown>) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "AGENT"]);
  const id = asOptionalString(payload.id);
  const routeAgentUserId =
    session.user.role === "AGENT"
      ? session.user.id
      : asString(payload.agentId, "Agent");
  const agentProfileId = await getAgentProfileIdForUser(routeAgentUserId);

  try {
    if (id) {
      const existing = await prisma.route.findUnique({
        where: { id },
        include: { agent: { include: { user: true } } },
      });

      if (!existing) {
        throw new Error("Route not found.");
      }

      if (session.user.role === "AGENT" && existing.agent.userId !== session.user.id) {
        throw new Error("You can only update your own routes.");
      }

      await prisma.route.update({
        where: { id },
        data: {
          agentId: agentProfileId,
          name: asString(payload.name, "Route name"),
          description: asOptionalString(payload.description),
          waypoints: asString(payload.waypoints, "Waypoints"),
          distance: asOptionalNumber(payload.distance),
          estimatedTime: asOptionalNumber(payload.estimatedTime),
          status: asOptionalString(payload.status) ?? "PLANNED",
          plannedDate: asDate(payload.plannedDate, "Planned date"),
          completedDate: asOptionalDate(payload.completedDate),
        },
      });
      return;
    }

    await prisma.route.create({
      data: {
        agentId: agentProfileId,
        name: asString(payload.name, "Route name"),
        description: asOptionalString(payload.description),
        waypoints: asString(payload.waypoints, "Waypoints"),
        distance: asOptionalNumber(payload.distance),
        estimatedTime: asOptionalNumber(payload.estimatedTime),
        status: asOptionalString(payload.status) ?? "PLANNED",
        plannedDate: asDate(payload.plannedDate, "Planned date"),
        completedDate: asOptionalDate(payload.completedDate),
      },
    });
  } catch (error) {
    throw toActionError(error);
  }
}

export async function deleteRouteAction(id: string) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "AGENT"]);
  const existing = await prisma.route.findUnique({
    where: { id },
    include: { agent: true },
  });

  if (!existing) {
    throw new Error("Route not found.");
  }

  if (session.user.role === "AGENT") {
    const currentAgentProfileId = await getAgentProfileIdForUser(session.user.id);
    if (existing.agentId !== currentAgentProfileId) {
      throw new Error("You can only delete your own routes.");
    }
  }

  await prisma.route.delete({ where: { id } });
}

export async function upsertTransactionAction(payload: Record<string, unknown>) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "HOUSEHOLD", "RECYCLER", "INVESTOR"]);
  const id = asOptionalString(payload.id);
  const userId =
    session.user.role === "ADMIN"
      ? asString(payload.userId, "User")
      : session.user.id;

  try {
    if (id) {
      const existing = await prisma.transaction.findUnique({ where: { id } });
      if (!existing) {
        throw new Error("Transaction not found.");
      }

      if (session.user.role !== "ADMIN" && existing.userId !== session.user.id) {
        throw new Error("You can only update your own transactions.");
      }

      await prisma.transaction.update({
        where: { id },
        data: {
          userId,
          type: asString(payload.type, "Type"),
          amount: asNumber(payload.amount, "Amount"),
          currency: asOptionalString(payload.currency) ?? "USD",
          description: asString(payload.description, "Description"),
          referenceId: asOptionalString(payload.referenceId),
          status: asOptionalString(payload.status) ?? "PENDING",
        },
      });
      return;
    }

    await prisma.transaction.create({
      data: {
        userId,
        type: asString(payload.type, "Type"),
        amount: asNumber(payload.amount, "Amount"),
        currency: asOptionalString(payload.currency) ?? "USD",
        description: asString(payload.description, "Description"),
        referenceId: asOptionalString(payload.referenceId),
        status: asOptionalString(payload.status) ?? "PENDING",
      },
    });
  } catch (error) {
    throw toActionError(error);
  }
}

export async function deleteTransactionAction(id: string) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "HOUSEHOLD", "RECYCLER", "INVESTOR"]);
  const existing = await prisma.transaction.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Transaction not found.");
  }

  if (session.user.role !== "ADMIN" && existing.userId !== session.user.id) {
    throw new Error("You can only delete your own transactions.");
  }

  await prisma.transaction.delete({ where: { id } });
}

export async function payHouseholdSubscriptionAction() {
  await ensureDemoData();

  const session = await requireActionRole(["HOUSEHOLD"]);
  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      type: "SUBSCRIPTION",
      amount: 18,
      currency: "USD",
      description: "Manual subscription payment from household portal",
      status: "COMPLETED",
    },
  });
}

export async function upsertMaterialAction(payload: Record<string, unknown>) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "RECYCLER"]);
  const id = asOptionalString(payload.id);
  const recyclerId =
    session.user.role === "RECYCLER"
      ? session.user.id
      : asString(payload.recyclerId, "Recycler");

  try {
    if (id) {
      const existing = await prisma.material.findUnique({ where: { id } });
      if (!existing) {
        throw new Error("Material not found.");
      }

      if (session.user.role === "RECYCLER" && existing.recyclerId !== session.user.id) {
        throw new Error("You can only update your own material listings.");
      }

      await prisma.material.update({
        where: { id },
        data: {
          recyclerId,
          name: asString(payload.name, "Material name"),
          category: asString(payload.category, "Category"),
          description: asOptionalString(payload.description),
          pricePerKg: asNumber(payload.pricePerKg, "Price"),
          availableWeight: asNumber(payload.availableWeight, "Available weight"),
          quality: asOptionalString(payload.quality) ?? "STANDARD",
          location: asString(payload.location, "Location"),
          isActive: asBoolean(payload.isActive, true),
        },
      });
      return;
    }

    await prisma.material.create({
      data: {
        recyclerId,
        name: asString(payload.name, "Material name"),
        category: asString(payload.category, "Category"),
        description: asOptionalString(payload.description),
        pricePerKg: asNumber(payload.pricePerKg, "Price"),
        availableWeight: asNumber(payload.availableWeight, "Available weight"),
        quality: asOptionalString(payload.quality) ?? "STANDARD",
        location: asString(payload.location, "Location"),
        isActive: asBoolean(payload.isActive, true),
      },
    });
  } catch (error) {
    throw toActionError(error);
  }
}

export async function deleteMaterialAction(id: string) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "RECYCLER"]);
  const existing = await prisma.material.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Material not found.");
  }

  if (session.user.role === "RECYCLER" && existing.recyclerId !== session.user.id) {
    throw new Error("You can only delete your own material listings.");
  }

  await prisma.material.delete({ where: { id } });
}

export async function upsertNotificationAction(payload: Record<string, unknown>) {
  await ensureDemoData();

  const session = await requireActionRole([
    "ADMIN",
    "AGENT",
    "HOUSEHOLD",
    "RECYCLER",
    "INVESTOR",
    "GOVERNMENT",
  ]);
  const id = asOptionalString(payload.id);
  const userId =
    session.user.role === "ADMIN"
      ? asString(payload.userId, "Recipient")
      : session.user.id;

  try {
    if (id) {
      const existing = await prisma.notification.findUnique({ where: { id } });
      if (!existing) {
        throw new Error("Notification not found.");
      }

      if (session.user.role !== "ADMIN" && existing.userId !== session.user.id) {
        throw new Error("You can only update your own notifications.");
      }

      await prisma.notification.update({
        where: { id },
        data: {
          userId,
          title: asString(payload.title, "Title"),
          message: asString(payload.message, "Message"),
          type: asOptionalString(payload.type) ?? "SYSTEM_UPDATE",
          isRead: asBoolean(payload.isRead, false),
          data: asOptionalString(payload.data),
        },
      });
      return;
    }

    await prisma.notification.create({
      data: {
        userId,
        title: asString(payload.title, "Title"),
        message: asString(payload.message, "Message"),
        type: asOptionalString(payload.type) ?? "SYSTEM_UPDATE",
        isRead: asBoolean(payload.isRead, false),
        data: asOptionalString(payload.data),
      },
    });
  } catch (error) {
    throw toActionError(error);
  }
}

export async function deleteNotificationAction(id: string) {
  await ensureDemoData();

  const session = await requireActionRole([
    "ADMIN",
    "AGENT",
    "HOUSEHOLD",
    "RECYCLER",
    "INVESTOR",
    "GOVERNMENT",
  ]);
  const existing = await prisma.notification.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Notification not found.");
  }

  if (session.user.role !== "ADMIN" && existing.userId !== session.user.id) {
    throw new Error("You can only delete your own notifications.");
  }

  await prisma.notification.delete({ where: { id } });
}

export async function markNotificationReadAction(id: string) {
  await ensureDemoData();

  const session = await requireActionRole([
    "ADMIN",
    "AGENT",
    "HOUSEHOLD",
    "RECYCLER",
    "INVESTOR",
    "GOVERNMENT",
  ]);
  const existing = await prisma.notification.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Notification not found.");
  }

  if (session.user.role !== "ADMIN" && existing.userId !== session.user.id) {
    throw new Error("You can only update your own notifications.");
  }

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function upsertInvestmentAction(payload: Record<string, unknown>) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "INVESTOR"]);
  const id = asOptionalString(payload.id);
  const investorId =
    session.user.role === "INVESTOR"
      ? session.user.id
      : asString(payload.investorId, "Investor");

  try {
    if (id) {
      const existing = await prisma.investment.findUnique({ where: { id } });
      if (!existing) {
        throw new Error("Investment not found.");
      }

      if (session.user.role === "INVESTOR" && existing.investorId !== session.user.id) {
        throw new Error("You can only update your own investments.");
      }

      await prisma.investment.update({
        where: { id },
        data: {
          investorId,
          type: asString(payload.type, "Type"),
          amount: asNumber(payload.amount, "Amount"),
          currency: asOptionalString(payload.currency) ?? "USD",
          expectedReturn: asOptionalNumber(payload.expectedReturn),
          actualReturn: asOptionalNumber(payload.actualReturn),
          status: asOptionalString(payload.status) ?? "ACTIVE",
          investmentDate: asDate(payload.investmentDate, "Investment date"),
          maturityDate: asOptionalDate(payload.maturityDate),
          notes: asOptionalString(payload.notes),
        },
      });
      return;
    }

    await prisma.investment.create({
      data: {
        investorId,
        type: asString(payload.type, "Type"),
        amount: asNumber(payload.amount, "Amount"),
        currency: asOptionalString(payload.currency) ?? "USD",
        expectedReturn: asOptionalNumber(payload.expectedReturn),
        actualReturn: asOptionalNumber(payload.actualReturn),
        status: asOptionalString(payload.status) ?? "ACTIVE",
        investmentDate: asDate(payload.investmentDate, "Investment date"),
        maturityDate: asOptionalDate(payload.maturityDate),
        notes: asOptionalString(payload.notes),
      },
    });
  } catch (error) {
    throw toActionError(error);
  }
}

export async function deleteInvestmentAction(id: string) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "INVESTOR"]);
  const existing = await prisma.investment.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Investment not found.");
  }

  if (session.user.role === "INVESTOR" && existing.investorId !== session.user.id) {
    throw new Error("You can only delete your own investments.");
  }

  await prisma.investment.delete({ where: { id } });
}

export async function upsertReportAction(payload: Record<string, unknown>) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "GOVERNMENT"]);
  const id = asOptionalString(payload.id);
  const governmentId =
    session.user.role === "GOVERNMENT"
      ? session.user.id
      : asString(payload.governmentId, "Government owner");

  try {
    if (id) {
      const existing = await prisma.report.findUnique({ where: { id } });
      if (!existing) {
        throw new Error("Report not found.");
      }

      if (session.user.role === "GOVERNMENT" && existing.governmentId !== session.user.id) {
        throw new Error("You can only update your own reports.");
      }

      await prisma.report.update({
        where: { id },
        data: {
          governmentId,
          title: asString(payload.title, "Title"),
          type: asString(payload.type, "Type"),
          content: asString(payload.content, "Content"),
          period: asString(payload.period, "Period"),
          status: asOptionalString(payload.status) ?? "DRAFT",
          publishedAt: asOptionalDate(payload.publishedAt),
        },
      });
      return;
    }

    await prisma.report.create({
      data: {
        governmentId,
        title: asString(payload.title, "Title"),
        type: asString(payload.type, "Type"),
        content: asString(payload.content, "Content"),
        period: asString(payload.period, "Period"),
        status: asOptionalString(payload.status) ?? "DRAFT",
        publishedAt: asOptionalDate(payload.publishedAt),
      },
    });
  } catch (error) {
    throw toActionError(error);
  }
}

export async function deleteReportAction(id: string) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "GOVERNMENT"]);
  const existing = await prisma.report.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Report not found.");
  }

  if (session.user.role === "GOVERNMENT" && existing.governmentId !== session.user.id) {
    throw new Error("You can only delete your own reports.");
  }

  await prisma.report.delete({ where: { id } });
}

export async function publishReportAction(id: string) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "GOVERNMENT"]);
  const existing = await prisma.report.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Report not found.");
  }

  if (session.user.role === "GOVERNMENT" && existing.governmentId !== session.user.id) {
    throw new Error("You can only publish your own reports.");
  }

  await prisma.report.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
}

export async function upsertRegulationAction(payload: Record<string, unknown>) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "GOVERNMENT"]);
  const id = asOptionalString(payload.id);
  const governmentId =
    session.user.role === "GOVERNMENT"
      ? session.user.id
      : asString(payload.governmentId, "Government owner");

  try {
    if (id) {
      const existing = await prisma.regulation.findUnique({ where: { id } });
      if (!existing) {
        throw new Error("Regulation not found.");
      }

      if (session.user.role === "GOVERNMENT" && existing.governmentId !== session.user.id) {
        throw new Error("You can only update your own regulations.");
      }

      await prisma.regulation.update({
        where: { id },
        data: {
          governmentId,
          title: asString(payload.title, "Title"),
          description: asString(payload.description, "Description"),
          type: asString(payload.type, "Type"),
          requirements: asString(payload.requirements, "Requirements"),
          penalties: asOptionalString(payload.penalties),
          effectiveDate: asDate(payload.effectiveDate, "Effective date"),
          expiryDate: asOptionalDate(payload.expiryDate),
          status: asOptionalString(payload.status) ?? "ACTIVE",
        },
      });
      return;
    }

    await prisma.regulation.create({
      data: {
        governmentId,
        title: asString(payload.title, "Title"),
        description: asString(payload.description, "Description"),
        type: asString(payload.type, "Type"),
        requirements: asString(payload.requirements, "Requirements"),
        penalties: asOptionalString(payload.penalties),
        effectiveDate: asDate(payload.effectiveDate, "Effective date"),
        expiryDate: asOptionalDate(payload.expiryDate),
        status: asOptionalString(payload.status) ?? "ACTIVE",
      },
    });
  } catch (error) {
    throw toActionError(error);
  }
}

export async function deleteRegulationAction(id: string) {
  await ensureDemoData();

  const session = await requireActionRole(["ADMIN", "GOVERNMENT"]);
  const existing = await prisma.regulation.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Regulation not found.");
  }

  if (session.user.role === "GOVERNMENT" && existing.governmentId !== session.user.id) {
    throw new Error("You can only delete your own regulations.");
  }

  await prisma.regulation.delete({ where: { id } });
}
