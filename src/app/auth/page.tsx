import { redirect } from "next/navigation";
import AuthExperience from "@/components/auth/AuthExperience";
import { AppRole, isValidRole, getDefaultRouteForRole } from "@/lib/constants";
import { ensureDemoData } from "@/lib/demo";
import { getServerAuthSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readString(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await ensureDemoData();

  const session = await getServerAuthSession();
  if (session?.user?.role) {
    redirect(getDefaultRouteForRole(session.user.role));
  }

  const params = await searchParams;
  const mode = readString(params.mode) === "signup" ? "signup" : "login";
  const rawRole = readString(params.role);
  const role =
    rawRole && isValidRole(rawRole.toUpperCase())
      ? (rawRole.toUpperCase() as AppRole)
      : null;
  const callbackUrl = readString(params.callbackUrl);

  return (
    <AuthExperience
      initialMode={mode}
      initialRole={role}
      callbackUrl={callbackUrl}
    />
  );
}
