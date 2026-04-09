import PortalWorkspace from "@/components/portal/PortalWorkspace";
import { requirePageRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function GovernmentTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const session = await requirePageRole(["GOVERNMENT"]);
  const { tab } = await params;

  return (
    <PortalWorkspace
      portal="government"
      tab={tab}
      user={{
        id: session.user.id,
        name: session.user.name ?? "Government User",
        email: session.user.email,
        role: session.user.role,
      }}
    />
  );
}
