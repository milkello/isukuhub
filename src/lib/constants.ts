export const VALID_ROLES = [
  "ADMIN",
  "AGENT",
  "HOUSEHOLD",
  "RECYCLER",
  "INVESTOR",
  "GOVERNMENT",
] as const;

export type AppRole = (typeof VALID_ROLES)[number];

export const DEMO_PASSWORD = "demo123";

export const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Administrator",
  AGENT: "Collection Agent",
  HOUSEHOLD: "Household",
  RECYCLER: "Recycler",
  INVESTOR: "Investor",
  GOVERNMENT: "Government",
};

export const DEFAULT_ROLE_ROUTES: Record<AppRole, string> = {
  ADMIN: "/admin/dashboard",
  AGENT: "/agent",
  HOUSEHOLD: "/household",
  RECYCLER: "/recycler/marketplace",
  INVESTOR: "/investor/landfill-ops",
  GOVERNMENT: "/government/overview",
};

export function isValidRole(role: string): role is AppRole {
  return VALID_ROLES.includes(role as AppRole);
}

export function normalizeRole(role: string): AppRole {
  const normalized = role.trim().toUpperCase();
  if (!isValidRole(normalized)) {
    throw new Error(`Unsupported role: ${role}`);
  }
  return normalized;
}

export function getDefaultRouteForRole(role?: string | null): string {
  if (!role) {
    return "/";
  }

  const normalized = role.trim().toUpperCase();
  return isValidRole(normalized) ? DEFAULT_ROLE_ROUTES[normalized] : "/";
}

export function getRequiredRoleForPath(pathname: string): AppRole | null {
  if (pathname.startsWith("/admin")) return "ADMIN";
  if (pathname.startsWith("/agent")) return "AGENT";
  if (pathname.startsWith("/household")) return "HOUSEHOLD";
  if (pathname.startsWith("/recycler")) return "RECYCLER";
  if (pathname.startsWith("/investor")) return "INVESTOR";
  if (pathname.startsWith("/government")) return "GOVERNMENT";
  if (pathname.startsWith("/landfill")) return "AGENT";
  if (pathname.startsWith("/database")) return "ADMIN";
  return null;
}
