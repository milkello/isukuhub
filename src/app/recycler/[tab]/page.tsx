import PortalWorkspace from "@/components/portal/PortalWorkspace";
import { requirePageRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RecyclerTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const session = await requirePageRole(["RECYCLER"]);
  const { tab } = await params;

  return (
    <PortalWorkspace
      portal="recycler"
      tab={tab}
      user={{
        id: session.user.id,
        name: session.user.name ?? "Recycler User",
        email: session.user.email,
        role: session.user.role,
      }}
    />
  );
}
