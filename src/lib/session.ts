import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { AppRole, getDefaultRouteForRole } from "./constants";

export async function getServerAuthSession() {
  return getServerSession(authOptions);
}

export async function requirePageRole(allowedRoles?: AppRole[]) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect("/auth");
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role as AppRole)) {
    redirect(getDefaultRouteForRole(session.user.role));
  }

  return session;
}

export async function requireActionRole(allowedRoles?: AppRole[]) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role as AppRole)) {
    throw new Error("Forbidden");
  }

  return session;
}
