import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { portalConfigs } from "@/lib/portal-config";
import PortalShell from "./PortalShell";
import CrudSection, { CrudField } from "./CrudSection";
import DataTableSection from "./DataTableSection";
import {
  buildSelectOptions,
  CollectionRecord,
  collectionInclude,
  makeTabs,
  mapCollectionRecord,
  mapNotificationRecord,
  mapRouteRecord,
  mapUserRecord,
  NotificationRecord,
  notificationInclude,
  RouteRecord,
  routeInclude,
  UserRecord,
  WorkspaceUser,
} from "./workspace-helpers";
import { userInclude } from "@/lib/user-management";
import {
  deleteCollectionAction,
  deleteRouteAction,
  upsertCollectionAction,
  upsertRouteAction,
} from "@/app/actions/portal";

export default async function LandfillWorkspace({
  tab,
  user,
}: {
  tab: string;
  user: WorkspaceUser;
}) {
  const config = portalConfigs.landfill;
  const tabs = makeTabs("landfill");
  const currentTab = config.tabs.find((item) => item.key === tab);
  if (!currentTab) {
    notFound();
  }

  const [collections, routes, notifications, households] = await Promise.all([
    prisma.collection.findMany({ where: { agentId: user.id }, include: collectionInclude, orderBy: { scheduledDate: "desc" } }),
    prisma.route.findMany({ include: routeInclude, orderBy: { plannedDate: "desc" } }),
    prisma.notification.findMany({ where: { userId: user.id }, include: notificationInclude, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { role: "HOUSEHOLD" }, include: userInclude, orderBy: { createdAt: "desc" } }),
  ]);

  const householdOptions = buildSelectOptions(
    households.map(mapUserRecord).map((record: UserRecord) => ({
      id: record.id,
      name: String(record.name),
      email: String(record.email),
    })),
  );
  const collectionRecords: CollectionRecord[] = collections.map(mapCollectionRecord);
  const routeRecords: RouteRecord[] = routes.map(mapRouteRecord).filter((record: RouteRecord) => record.agentId === user.id);
  const notificationRecords: NotificationRecord[] = notifications.map(mapNotificationRecord);

  const stats = [
    { label: "Incoming loads", value: String(collectionRecords.length), help: `${collectionRecords.filter((record: CollectionRecord) => record.status === "SCHEDULED").length} still scheduled.` },
    { label: "Processed", value: String(collectionRecords.filter((record: CollectionRecord) => record.status === "COMPLETED").length), help: "Loads already closed out." },
    { label: "Active routes", value: String(routeRecords.filter((record: RouteRecord) => record.status === "ACTIVE").length), help: "Routes currently active for this operator." },
    { label: "Alerts", value: String(notificationRecords.length), help: `${notificationRecords.filter((record: NotificationRecord) => record.status === "UNREAD").length} unread operational alerts.` },
  ];

  const collectionFields: CrudField[] = [
    { name: "collectionId", label: "Load ID" },
    { name: "householdId", label: "Source household", type: "select", required: true, options: householdOptions },
    { name: "wasteType", label: "Waste type", type: "select", required: true, options: [{ label: "General waste", value: "GENERAL_WASTE" }, { label: "Recyclable", value: "RECYCLABLE" }, { label: "Organic", value: "ORGANIC" }, { label: "Hazardous", value: "HAZARDOUS" }, { label: "Electronic", value: "ELECTRONIC" }] },
    { name: "weight", label: "Weight (kg)", type: "number", required: true },
    { name: "status", label: "Status", type: "select", required: true, options: [{ label: "Scheduled", value: "SCHEDULED" }, { label: "In progress", value: "IN_PROGRESS" }, { label: "Completed", value: "COMPLETED" }, { label: "Cancelled", value: "CANCELLED" }] },
    { name: "scheduledDate", label: "Scheduled date", type: "date", required: true },
    { name: "completedDate", label: "Completed date", type: "date" },
    { name: "location", label: "Location" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];

  const routeFields: CrudField[] = [
    { name: "agentId", label: "Agent", type: "select", required: true, options: [{ label: user.name ?? "Current agent", value: user.id }] },
    { name: "name", label: "Route name", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "waypoints", label: "Waypoints", type: "textarea", required: true },
    { name: "distance", label: "Distance (km)", type: "number" },
    { name: "estimatedTime", label: "ETA (min)", type: "number" },
    { name: "status", label: "Status", type: "select", required: true, options: [{ label: "Planned", value: "PLANNED" }, { label: "Active", value: "ACTIVE" }, { label: "Completed", value: "COMPLETED" }, { label: "Cancelled", value: "CANCELLED" }] },
    { name: "plannedDate", label: "Planned date", type: "date", required: true },
    { name: "completedDate", label: "Completed date", type: "date" },
  ];

  const content = {
    operations: (
      <CrudSection
        title="Landfill operations"
        description="Record and update the loads assigned to your operation."
        records={collectionRecords}
        fields={collectionFields}
        columns={[{ key: "collectionId", label: "Load" }, { key: "householdName", label: "Source" }, { key: "wasteType", label: "Waste type" }, { key: "weight", label: "Weight" }, { key: "status", label: "Status" }, { key: "scheduledDate", label: "Scheduled" }]}
        emptyMessage="No landfill loads available."
        createLabel="Add load"
        saveAction={upsertCollectionAction}
        deleteAction={deleteCollectionAction}
      />
    ),
    batches: (
      <DataTableSection
        title="Batch history"
        description="Review the loads already recorded for this operator."
        columns={[{ key: "collectionId", label: "Batch" }, { key: "householdName", label: "Source" }, { key: "wasteType", label: "Waste type" }, { key: "weight", label: "Weight" }, { key: "status", label: "Status" }, { key: "completedDate", label: "Completed" }]}
        records={collectionRecords}
        emptyMessage="No batch history available."
      />
    ),
    incoming: (
      <CrudSection
        title="Incoming routes"
        description="Keep the route plan aligned with actual landfill intake operations."
        records={routeRecords}
        fields={routeFields}
        columns={[{ key: "name", label: "Route" }, { key: "status", label: "Status" }, { key: "plannedDate", label: "Planned date" }, { key: "distance", label: "Distance" }, { key: "estimatedTime", label: "ETA" }, { key: "waypoints", label: "Waypoints" }]}
        emptyMessage="No incoming routes available."
        createLabel="Plan route"
        saveAction={upsertRouteAction}
        deleteAction={deleteRouteAction}
      />
    ),
    reports: (
      <DataTableSection
        title="Operational alerts"
        description="A simple operator report stream based on your current notifications."
        columns={[{ key: "title", label: "Title" }, { key: "type", label: "Type" }, { key: "status", label: "Read state" }, { key: "message", label: "Message" }, { key: "createdAt", label: "Created" }]}
        records={notificationRecords}
        emptyMessage="No operational alerts available."
      />
    ),
  }[tab];

  return (
    <PortalShell title={`${config.title} - ${currentTab.label}`} description={config.description} accent={config.accent} tabs={tabs} currentTab={tab} stats={stats} user={{ ...user, name: user.name || "Agent User" }}>
      {content}
    </PortalShell>
  );
}
