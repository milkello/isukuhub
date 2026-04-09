import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { AppRole, DEMO_PASSWORD, normalizeRole } from "./constants";

export const userInclude = {
  agentProfile: true,
  householdProfile: true,
  recyclerProfile: true,
  investorProfile: true,
  governmentProfile: true,
} satisfies Prisma.UserInclude;

export type UserWithProfiles = Prisma.UserGetPayload<{
  include: typeof userInclude;
}>;

export type ManagedUserInput = {
  email: string;
  name: string;
  role: string;
  password?: string;
  phone?: string | null;
  address?: string | null;
  isActive?: boolean | string;
  employeeId?: string | null;
  department?: string | null;
  vehicleType?: string | null;
  licensePlate?: string | null;
  householdSize?: number | string | null;
  subscriptionPlan?: string | null;
  billingCycle?: string | null;
  companyName?: string | null;
  registrationNumber?: string | null;
  contactPerson?: string | null;
  businessType?: string | null;
  capacity?: number | string | null;
  investorType?: string | null;
  investmentFocus?: string | null;
  portfolioSize?: number | string | null;
  riskTolerance?: string | null;
  position?: string | null;
  jurisdiction?: string | null;
  accessLevel?: string | null;
};

function cleanRequiredString(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} is required.`);
  }
  return normalized;
}

function cleanOptionalString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function cleanOptionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return fallback;
}

function buildAgentProfile(input: ManagedUserInput) {
  return {
    employeeId:
      cleanOptionalString(input.employeeId) ?? `EMP-${Date.now().toString().slice(-6)}`,
    department: cleanOptionalString(input.department) ?? "Collections",
    vehicleType: cleanOptionalString(input.vehicleType),
    licensePlate: cleanOptionalString(input.licensePlate),
    status: "ACTIVE",
  };
}

function buildHouseholdProfile(input: ManagedUserInput) {
  return {
    householdSize: cleanOptionalNumber(input.householdSize) ?? 4,
    subscriptionPlan: cleanOptionalString(input.subscriptionPlan) ?? "BASIC",
    billingCycle: cleanOptionalString(input.billingCycle) ?? "MONTHLY",
    address:
      cleanOptionalString(input.address) ?? "Unassigned household address",
    coordinates: null,
  };
}

function buildRecyclerProfile(input: ManagedUserInput) {
  const name = cleanRequiredString(input.name, "Name");
  return {
    companyName: cleanOptionalString(input.companyName) ?? `${name} Recycling`,
    registrationNumber:
      cleanOptionalString(input.registrationNumber) ??
      `REG-${Date.now().toString().slice(-8)}`,
    licenseNumber: null,
    contactPerson: cleanOptionalString(input.contactPerson) ?? name,
    businessType:
      cleanOptionalString(input.businessType) ?? "Materials Recovery",
    capacity: cleanOptionalNumber(input.capacity),
    certifications: null,
  };
}

function buildInvestorProfile(input: ManagedUserInput) {
  return {
    investorType: cleanOptionalString(input.investorType) ?? "INDIVIDUAL",
    investmentFocus: cleanOptionalString(input.investmentFocus),
    portfolioSize: cleanOptionalNumber(input.portfolioSize),
    riskTolerance: cleanOptionalString(input.riskTolerance) ?? "MEDIUM",
  };
}

function buildGovernmentProfile(input: ManagedUserInput) {
  return {
    department:
      cleanOptionalString(input.department) ?? "Environmental Services",
    position: cleanOptionalString(input.position) ?? "Compliance Officer",
    jurisdiction:
      cleanOptionalString(input.jurisdiction) ?? "Central District",
    accessLevel: cleanOptionalString(input.accessLevel) ?? "BASIC",
  };
}

async function hashPassword(password?: string) {
  return bcrypt.hash(password?.trim() || DEMO_PASSWORD, 12);
}

export function serializeUser(user: UserWithProfiles) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone ?? "",
    address: user.address ?? "",
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    employeeId: user.agentProfile?.employeeId ?? "",
    department:
      user.agentProfile?.department ??
      user.governmentProfile?.department ??
      "",
    vehicleType: user.agentProfile?.vehicleType ?? "",
    licensePlate: user.agentProfile?.licensePlate ?? "",
    householdSize: user.householdProfile?.householdSize ?? "",
    subscriptionPlan: user.householdProfile?.subscriptionPlan ?? "",
    billingCycle: user.householdProfile?.billingCycle ?? "",
    companyName: user.recyclerProfile?.companyName ?? "",
    registrationNumber: user.recyclerProfile?.registrationNumber ?? "",
    contactPerson: user.recyclerProfile?.contactPerson ?? "",
    businessType: user.recyclerProfile?.businessType ?? "",
    capacity: user.recyclerProfile?.capacity ?? "",
    investorType: user.investorProfile?.investorType ?? "",
    investmentFocus: user.investorProfile?.investmentFocus ?? "",
    portfolioSize: user.investorProfile?.portfolioSize ?? "",
    riskTolerance: user.investorProfile?.riskTolerance ?? "",
    position: user.governmentProfile?.position ?? "",
    jurisdiction: user.governmentProfile?.jurisdiction ?? "",
    accessLevel: user.governmentProfile?.accessLevel ?? "",
  };
}

export async function getManagedUsers(role?: string) {
  const normalizedRole = role ? normalizeRole(role) : undefined;
  return prisma.user.findMany({
    where: normalizedRole ? { role: normalizedRole } : undefined,
    include: userInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getManagedUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: userInclude,
  });
}

export async function createManagedUser(input: ManagedUserInput) {
  const role = normalizeRole(input.role);
  const email = cleanRequiredString(input.email, "Email").toLowerCase();
  const name = cleanRequiredString(input.name, "Name");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("A user with that email already exists.");
  }

  const password = await hashPassword(input.password);
  const userData: Prisma.UserCreateInput = {
    email,
    name,
    password,
    role,
    phone: cleanOptionalString(input.phone),
    address: cleanOptionalString(input.address),
    isActive: cleanBoolean(input.isActive, true),
  };

  if (role === "AGENT") {
    userData.agentProfile = { create: buildAgentProfile(input) };
  }

  if (role === "HOUSEHOLD") {
    userData.householdProfile = { create: buildHouseholdProfile(input) };
  }

  if (role === "RECYCLER") {
    userData.recyclerProfile = { create: buildRecyclerProfile(input) };
  }

  if (role === "INVESTOR") {
    userData.investorProfile = { create: buildInvestorProfile(input) };
  }

  if (role === "GOVERNMENT") {
    userData.governmentProfile = { create: buildGovernmentProfile(input) };
  }

  return prisma.user.create({
    data: userData,
    include: userInclude,
  });
}

export async function updateManagedUser(id: string, input: Partial<ManagedUserInput>) {
  const existing = await getManagedUserById(id);
  if (!existing) {
    throw new Error("User not found.");
  }

  const role = input.role ? normalizeRole(input.role) : (existing.role as AppRole);
  if (role !== existing.role) {
    throw new Error("Changing user roles is not supported in-place.");
  }

  const userData: Prisma.UserUpdateInput = {
    email: input.email
      ? cleanRequiredString(input.email, "Email").toLowerCase()
      : undefined,
    name: input.name ? cleanRequiredString(input.name, "Name") : undefined,
    phone: input.phone !== undefined ? cleanOptionalString(input.phone) : undefined,
    address:
      input.address !== undefined ? cleanOptionalString(input.address) : undefined,
    isActive:
      input.isActive !== undefined
        ? cleanBoolean(input.isActive, existing.isActive)
        : undefined,
  };

  if (input.password && input.password.trim()) {
    userData.password = await hashPassword(input.password);
  }

  if (role === "AGENT") {
    userData.agentProfile = {
      upsert: {
        create: buildAgentProfile({ ...existing, ...input, role }),
        update: buildAgentProfile({ ...existing, ...input, role }),
      },
    };
  }

  if (role === "HOUSEHOLD") {
    userData.householdProfile = {
      upsert: {
        create: buildHouseholdProfile({ ...existing, ...input, role }),
        update: buildHouseholdProfile({ ...existing, ...input, role }),
      },
    };
  }

  if (role === "RECYCLER") {
    userData.recyclerProfile = {
      upsert: {
        create: buildRecyclerProfile({ ...existing, ...input, role }),
        update: buildRecyclerProfile({ ...existing, ...input, role }),
      },
    };
  }

  if (role === "INVESTOR") {
    userData.investorProfile = {
      upsert: {
        create: buildInvestorProfile({ ...existing, ...input, role }),
        update: buildInvestorProfile({ ...existing, ...input, role }),
      },
    };
  }

  if (role === "GOVERNMENT") {
    userData.governmentProfile = {
      upsert: {
        create: buildGovernmentProfile({ ...existing, ...input, role }),
        update: buildGovernmentProfile({ ...existing, ...input, role }),
      },
    };
  }

  return prisma.user.update({
    where: { id },
    data: userData,
    include: userInclude,
  });
}

export async function deleteManagedUser(id: string) {
  return prisma.user.delete({ where: { id } });
}
