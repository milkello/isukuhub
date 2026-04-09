import { Prisma } from "@prisma/client";
import { portalConfigs, PortalConfigKey } from "@/lib/portal-config";
import { serializeUser, UserWithProfiles } from "@/lib/user-management";
import { CrudField } from "./CrudSection";

export type WorkspaceUser = {
  id: string;
  name: string;
  email?: string | null;
  role: string;
};

export const collectionInclude = {
  household: { select: { id: true, name: true, email: true } },
  agent: { select: { id: true, name: true, email: true } },
} satisfies Prisma.CollectionInclude;

export const routeInclude = {
  agent: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
} satisfies Prisma.RouteInclude;

export const transactionInclude = {
  user: { select: { id: true, name: true, email: true, role: true } },
} satisfies Prisma.TransactionInclude;

export const materialInclude = {
  recycler: { select: { id: true, name: true, email: true } },
} satisfies Prisma.MaterialInclude;

export const notificationInclude = {
  user: { select: { id: true, name: true, email: true, role: true } },
} satisfies Prisma.NotificationInclude;

export const reportInclude = {
  government: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ReportInclude;

export const regulationInclude = {
  government: { select: { id: true, name: true, email: true } },
} satisfies Prisma.RegulationInclude;

export const investmentInclude = {
  investor: { select: { id: true, name: true, email: true } },
} satisfies Prisma.InvestmentInclude;

export type CollectionRecordRaw = Prisma.CollectionGetPayload<{ include: typeof collectionInclude }>;
export type RouteRecordRaw = Prisma.RouteGetPayload<{ include: typeof routeInclude }>;
export type TransactionRecordRaw = Prisma.TransactionGetPayload<{ include: typeof transactionInclude }>;
export type MaterialRecordRaw = Prisma.MaterialGetPayload<{ include: typeof materialInclude }>;
export type NotificationRecordRaw = Prisma.NotificationGetPayload<{ include: typeof notificationInclude }>;
export type ReportRecordRaw = Prisma.ReportGetPayload<{ include: typeof reportInclude }>;
export type RegulationRecordRaw = Prisma.RegulationGetPayload<{ include: typeof regulationInclude }>;
export type InvestmentRecordRaw = Prisma.InvestmentGetPayload<{ include: typeof investmentInclude }>;

export function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

export function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export function formatWeight(value: number | null | undefined) {
  return `${(value ?? 0).toFixed(1)} kg`;
}

export function makeTabs(portal: PortalConfigKey) {
  return portalConfigs[portal].tabs.map((tab) => ({
    ...tab,
    href: `/${portal}/${tab.key}`,
  }));
}

export function makeRoleField(role: string, label: string): CrudField {
  return {
    name: "role",
    label,
    type: "select",
    required: true,
    disabledOnEdit: true,
    options: [{ label, value: role }],
  };
}

export function mapUserRecord(user: UserWithProfiles) {
  const serialized = serializeUser(user);
  return {
    ...serialized,
    id: user.id,
    createdAt: formatDate(user.createdAt),
    updatedAt: formatDate(user.updatedAt),
    isActive: String(user.isActive),
    status: user.isActive ? "ACTIVE" : "INACTIVE",
  };
}

export type UserRecord = ReturnType<typeof mapUserRecord>;

export function mapCollectionRecord(collection: CollectionRecordRaw) {
  return {
    id: collection.id,
    collectionId: collection.collectionId,
    householdId: collection.householdId,
    householdName: collection.household?.name ?? "Unknown household",
    agentId: collection.agentId,
    agentName: collection.agent?.name ?? "Unassigned",
    wasteType: collection.wasteType,
    weight: String(collection.weight),
    status: collection.status,
    scheduledDate: formatDate(collection.scheduledDate),
    completedDate: formatDate(collection.completedDate),
    location: collection.location ?? "",
    notes: collection.notes ?? "",
  };
}

export type CollectionRecord = ReturnType<typeof mapCollectionRecord>;

export function mapRouteRecord(route: RouteRecordRaw) {
  return {
    id: route.id,
    agentId: route.agent?.user?.id ?? "",
    agentName: route.agent?.user?.name ?? "Unknown agent",
    name: route.name,
    description: route.description ?? "",
    waypoints: route.waypoints,
    distance: route.distance?.toString() ?? "",
    estimatedTime: route.estimatedTime?.toString() ?? "",
    status: route.status,
    plannedDate: formatDate(route.plannedDate),
    completedDate: formatDate(route.completedDate),
  };
}

export type RouteRecord = ReturnType<typeof mapRouteRecord>;

export function mapTransactionRecord(transaction: TransactionRecordRaw) {
  return {
    id: transaction.id,
    userId: transaction.userId,
    userName: transaction.user?.name ?? "Unknown user",
    role: transaction.user?.role ?? "",
    type: transaction.type,
    amount: String(transaction.amount),
    amountLabel: formatMoney(transaction.amount),
    currency: transaction.currency,
    description: transaction.description,
    referenceId: transaction.referenceId ?? "",
    status: transaction.status,
    createdAt: formatDate(transaction.createdAt),
  };
}

export type TransactionRecord = ReturnType<typeof mapTransactionRecord>;

export function mapMaterialRecord(material: MaterialRecordRaw) {
  return {
    id: material.id,
    recyclerId: material.recyclerId,
    recyclerName: material.recycler?.name ?? "Unknown recycler",
    name: material.name,
    category: material.category,
    description: material.description ?? "",
    pricePerKg: String(material.pricePerKg),
    priceLabel: formatMoney(material.pricePerKg),
    availableWeight: String(material.availableWeight),
    availableWeightLabel: formatWeight(material.availableWeight),
    quality: material.quality,
    location: material.location,
    isActive: String(material.isActive),
    status: material.isActive ? "ACTIVE" : "INACTIVE",
    createdAt: formatDate(material.createdAt),
  };
}

export type MaterialRecord = ReturnType<typeof mapMaterialRecord>;

export function mapNotificationRecord(notification: NotificationRecordRaw) {
  return {
    id: notification.id,
    userId: notification.userId,
    userName: notification.user?.name ?? "Unknown user",
    role: notification.user?.role ?? "",
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: String(notification.isRead),
    status: notification.isRead ? "READ" : "UNREAD",
    createdAt: formatDate(notification.createdAt),
  };
}

export type NotificationRecord = ReturnType<typeof mapNotificationRecord>;

export function mapInvestmentRecord(investment: InvestmentRecordRaw) {
  return {
    id: investment.id,
    investorId: investment.investorId,
    investorName: investment.investor?.name ?? "Unknown investor",
    type: investment.type,
    amount: String(investment.amount),
    amountLabel: formatMoney(investment.amount),
    currency: investment.currency,
    expectedReturn: investment.expectedReturn?.toString() ?? "",
    actualReturn: investment.actualReturn?.toString() ?? "",
    status: investment.status,
    investmentDate: formatDate(investment.investmentDate),
    maturityDate: formatDate(investment.maturityDate),
    notes: investment.notes ?? "",
  };
}

export type InvestmentRecord = ReturnType<typeof mapInvestmentRecord>;

export function mapReportRecord(report: ReportRecordRaw) {
  return {
    id: report.id,
    governmentId: report.governmentId,
    governmentName: report.government?.name ?? "Unknown office",
    title: report.title,
    type: report.type,
    content: report.content,
    period: report.period,
    status: report.status,
    generatedAt: formatDate(report.generatedAt),
    publishedAt: formatDate(report.publishedAt),
  };
}

export type ReportRecord = ReturnType<typeof mapReportRecord>;

export function mapRegulationRecord(regulation: RegulationRecordRaw) {
  return {
    id: regulation.id,
    governmentId: regulation.governmentId,
    governmentName: regulation.government?.name ?? "Unknown office",
    title: regulation.title,
    description: regulation.description,
    type: regulation.type,
    requirements: regulation.requirements,
    penalties: regulation.penalties ?? "",
    effectiveDate: formatDate(regulation.effectiveDate),
    expiryDate: formatDate(regulation.expiryDate),
    status: regulation.status,
  };
}

export type RegulationRecord = ReturnType<typeof mapRegulationRecord>;

export function buildSelectOptions(
  users: Array<{ id: string; name: string; email?: string | null }>,
) {
  return users.map((user) => ({
    label: `${user.name}${user.email ? ` (${user.email})` : ""}`,
    value: user.id,
  }));
}

export function statusSummary(records: Array<{ status: string; weight?: string }>) {
  const summary = new Map<string, { count: number; totalWeight: number }>();

  for (const record of records) {
    const entry = summary.get(record.status) ?? { count: 0, totalWeight: 0 };
    entry.count += 1;
    entry.totalWeight += Number(record.weight ?? 0);
    summary.set(record.status, entry);
  }

  return Array.from(summary.entries()).map(([status, values]) => ({
    id: status,
    status,
    count: String(values.count),
    totalWeight: formatWeight(values.totalWeight),
  }));
}

export function categorySummary(records: Array<{ category: string; availableWeight: string; pricePerKg: string }>) {
  const summary = new Map<string, { count: number; weight: number; totalPrice: number }>();

  for (const record of records) {
    const entry = summary.get(record.category) ?? { count: 0, weight: 0, totalPrice: 0 };
    entry.count += 1;
    entry.weight += Number(record.availableWeight);
    entry.totalPrice += Number(record.pricePerKg);
    summary.set(record.category, entry);
  }

  return Array.from(summary.entries()).map(([category, values]) => ({
    id: category,
    category,
    listings: String(values.count),
    inventory: formatWeight(values.weight),
    avgPrice: formatMoney(values.totalPrice / Math.max(values.count, 1)),
  }));
}

export function transactionSummary(records: Array<{ type: string; amount: string; status: string }>) {
  const summary = new Map<string, { count: number; totalAmount: number; completed: number }>();

  for (const record of records) {
    const entry = summary.get(record.type) ?? { count: 0, totalAmount: 0, completed: 0 };
    entry.count += 1;
    entry.totalAmount += Number(record.amount);
    if (record.status === "COMPLETED") {
      entry.completed += 1;
    }
    summary.set(record.type, entry);
  }

  return Array.from(summary.entries()).map(([type, values]) => ({
    id: type,
    type,
    count: String(values.count),
    totalAmount: formatMoney(values.totalAmount),
    completed: String(values.completed),
  }));
}

export function coverageSummary(
  collections: Array<{ location: string; status: string }>,
  routes: Array<{ status: string }>,
) {
  const byLocation = new Map<string, { total: number; completed: number }>();

  for (const collection of collections) {
    const location = collection.location || "Unassigned zone";
    const entry = byLocation.get(location) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (collection.status === "COMPLETED") {
      entry.completed += 1;
    }
    byLocation.set(location, entry);
  }

  const activeRoutes = routes.filter((route) => route.status === "ACTIVE").length;

  return Array.from(byLocation.entries()).map(([location, values], index) => ({
    id: `${location}-${index}`,
    zone: location,
    collections: String(values.total),
    completed: String(values.completed),
    coverage:
      values.total === 0
        ? "0%"
        : `${Math.round((values.completed / values.total) * 100)}%`,
    activeRoutes: String(activeRoutes),
  }));
}
