import PortalWorkspace from "@/components/portal/PortalWorkspace";
import { requirePageRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LandfillTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const session = await requirePageRole(["AGENT"]);
  const { tab } = await params;

  return (
    <PortalWorkspace
      portal="landfill"
      tab={tab}
      user={{
        id: session.user.id,
        name: session.user.name ?? "Agent User",
        email: session.user.email,
        role: session.user.role,
      }}
    />
  );
}
