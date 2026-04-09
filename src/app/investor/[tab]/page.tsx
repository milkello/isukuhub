import PortalWorkspace from "@/components/portal/PortalWorkspace";
import { requirePageRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function InvestorTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const session = await requirePageRole(["INVESTOR"]);
  const { tab } = await params;

  return (
    <PortalWorkspace
      portal="investor"
      tab={tab}
      user={{
        id: session.user.id,
        name: session.user.name ?? "Investor User",
        email: session.user.email,
        role: session.user.role,
      }}
    />
  );
}
