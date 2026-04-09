import { ensureDemoData } from "@/lib/demo";
import { PortalConfigKey } from "@/lib/portal-config";
import AdminWorkspace from "./AdminWorkspace";
import GovernmentWorkspace from "./GovernmentWorkspace";
import InvestorWorkspace from "./InvestorWorkspace";
import LandfillWorkspace from "./LandfillWorkspace";
import RecyclerWorkspace from "./RecyclerWorkspace";
import { WorkspaceUser } from "./workspace-helpers";

export default async function PortalWorkspace({
  portal,
  tab,
  user,
}: {
  portal: PortalConfigKey;
  tab: string;
  user: WorkspaceUser;
}) {
  await ensureDemoData();

  switch (portal) {
    case "admin":
      return <AdminWorkspace tab={tab} user={user} />;
    case "recycler":
      return <RecyclerWorkspace tab={tab} user={user} />;
    case "investor":
      return <InvestorWorkspace tab={tab} user={user} />;
    case "government":
      return <GovernmentWorkspace tab={tab} user={user} />;
    case "landfill":
      return <LandfillWorkspace tab={tab} user={user} />;
    default:
      return null;
  }
}
