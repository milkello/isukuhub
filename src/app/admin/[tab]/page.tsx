import PortalWorkspace from "@/components/portal/PortalWorkspace";
import { requirePageRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const session = await requirePageRole(["ADMIN"]);
  const { tab } = await params;

  return (
    <PortalWorkspace
      portal="admin"
      tab={tab}
      user={{
        id: session.user.id,
        name: session.user.name ?? "Admin User",
        email: session.user.email,
        role: session.user.role,
      }}
    />
  );
}
