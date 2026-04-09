import Link from "next/link";
import PortalShell from "@/components/portal/PortalShell";
import CrudSection, { CrudField } from "@/components/portal/CrudSection";
import DataTableSection from "@/components/portal/DataTableSection";
import { requirePageRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { userInclude } from "@/lib/user-management";
import {
  buildSelectOptions,
  CollectionRecord,
  collectionInclude,
  mapCollectionRecord,
  mapNotificationRecord,
  mapRouteRecord,
  mapUserRecord,
  NotificationRecord,
  notificationInclude,
  RouteRecord,
  routeInclude,
  UserRecord,
} from "@/components/portal/workspace-helpers";
import {
  deleteCollectionAction,
  deleteRouteAction,
  upsertCollectionAction,
  upsertPortalUserAction,
  upsertRouteAction,
} from "@/app/actions/portal";

export const dynamic = "force-dynamic";

export default async function AgentPage() {
  const session = await requirePageRole(["AGENT"]);

  const [households, collections, routes, notifications] = await Promise.all([
    prisma.user.findMany({
      where: { role: "HOUSEHOLD" },
      include: userInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.collection.findMany({
      where: { agentId: session.user.id },
      include: collectionInclude,
      orderBy: { scheduledDate: "desc" },
    }),
    prisma.route.findMany({
      include: routeInclude,
      orderBy: { plannedDate: "desc" },
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      include: notificationInclude,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const tabs = [
    { key: "overview", label: "Overview", href: "/agent#overview" },
    { key: "households", label: "Households", href: "/agent#households" },
    { key: "collections", label: "Collections", href: "/agent#collections" },
    { key: "routes", label: "Routes", href: "/agent#routes" },
  ];

  const householdRecords: UserRecord[] = households.map(mapUserRecord);
  const collectionRecords: CollectionRecord[] = collections.map(mapCollectionRecord);
  const routeRecords: RouteRecord[] = routes
    .map(mapRouteRecord)
    .filter((record: RouteRecord) => record.agentId === session.user.id);
  const notificationRecords: NotificationRecord[] = notifications.map(mapNotificationRecord);
  const householdOptions = buildSelectOptions(
    householdRecords.map((record: UserRecord) => ({
      id: record.id,
      name: String(record.name),
      email: String(record.email),
    })),
  );

  const householdFields: CrudField[] = [
    {
      name: "role",
      label: "Role",
      type: "select",
      required: true,
      disabledOnEdit: true,
      options: [{ label: "Household", value: "HOUSEHOLD" }],
    },
    { name: "name", label: "Household name", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "password", label: "Password" },
    { name: "phone", label: "Phone" },
    { name: "address", label: "Address", required: true },
    { name: "householdSize", label: "Household size", type: "number" },
    {
      name: "subscriptionPlan",
      label: "Plan",
      type: "select",
      options: [
        { label: "Basic", value: "BASIC" },
        { label: "Premium", value: "PREMIUM" },
        { label: "Enterprise", value: "ENTERPRISE" },
      ],
    },
    {
      name: "billingCycle",
      label: "Billing cycle",
      type: "select",
      options: [
        { label: "Monthly", value: "MONTHLY" },
        { label: "Quarterly", value: "QUARTERLY" },
        { label: "Yearly", value: "YEARLY" },
      ],
    },
    {
      name: "isActive",
      label: "Active",
      type: "select",
      options: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ],
    },
  ];

  const collectionFields: CrudField[] = [
    { name: "collectionId", label: "Collection ID" },
    { name: "householdId", label: "Household", type: "select", required: true, options: householdOptions },
    {
      name: "wasteType",
      label: "Waste type",
      type: "select",
      required: true,
      options: [
        { label: "General waste", value: "GENERAL_WASTE" },
        { label: "Recyclable", value: "RECYCLABLE" },
        { label: "Organic", value: "ORGANIC" },
        { label: "Hazardous", value: "HAZARDOUS" },
        { label: "Electronic", value: "ELECTRONIC" },
      ],
    },
    { name: "weight", label: "Weight (kg)", type: "number", required: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { label: "Scheduled", value: "SCHEDULED" },
        { label: "In progress", value: "IN_PROGRESS" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Cancelled", value: "CANCELLED" },
      ],
    },
    { name: "scheduledDate", label: "Scheduled date", type: "date", required: true },
    { name: "completedDate", label: "Completed date", type: "date" },
    { name: "location", label: "Location" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];

  const routeFields: CrudField[] = [
    { name: "agentId", label: "Agent", type: "select", required: true, options: [{ label: session.user.name ?? "Current agent", value: session.user.id }] },
    { name: "name", label: "Route name", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "waypoints", label: "Waypoints", type: "textarea", required: true },
    { name: "distance", label: "Distance (km)", type: "number" },
    { name: "estimatedTime", label: "ETA (min)", type: "number" },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { label: "Planned", value: "PLANNED" },
        { label: "Active", value: "ACTIVE" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Cancelled", value: "CANCELLED" },
      ],
    },
    { name: "plannedDate", label: "Planned date", type: "date", required: true },
    { name: "completedDate", label: "Completed date", type: "date" },
  ];

  const stats = [
    { label: "Assigned pickups", value: String(collectionRecords.length), help: `${collectionRecords.filter((record: CollectionRecord) => record.status === "COMPLETED").length} already completed.` },
    { label: "Households", value: String(householdRecords.length), help: "Residents available for registration and service updates." },
    { label: "Routes", value: String(routeRecords.length), help: `${routeRecords.filter((record: RouteRecord) => record.status === "ACTIVE").length} routes currently active.` },
    { label: "Alerts", value: String(notificationRecords.length), help: `${notificationRecords.filter((record: NotificationRecord) => record.status === "UNREAD").length} unread messages in your inbox.` },
  ];

  return (
    <PortalShell
      title="Agent Field Workspace"
      description="Register households, track assigned pickups, keep route plans current, and move directly into landfill operations when loads arrive."
      accent="blue"
      tabs={tabs}
      currentTab="overview"
      stats={stats}
      user={{
        name: session.user.name ?? "Agent User",
        email: session.user.email,
        role: session.user.role,
      }}
      actions={
        <Link href="/landfill/operations" className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20">
          Open landfill portal
        </Link>
      }
    >
      <section id="overview" className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur lg:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Overview</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Field team snapshot</h2>
        <p className="mt-3 text-sm text-slate-600">
          This page ties your registrations, collection queue, and route planning into the same live database the admin and landfill portals use.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="#households" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
            Register household
          </Link>
          <Link href="#collections" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            Update collection queue
          </Link>
          <Link href="#routes" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            Plan routes
          </Link>
        </div>
      </section>

      <div id="households">
        <CrudSection
          title="Household registration"
          description="Agents can register and update household service records directly from the field."
          records={householdRecords}
          fields={householdFields}
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "address", label: "Address" },
            { key: "subscriptionPlan", label: "Plan" },
            { key: "status", label: "Status" },
          ]}
          emptyMessage="No households available yet."
          createLabel="Register household"
          saveAction={upsertPortalUserAction}
          allowCreate
          allowEdit
        />
      </div>

      <div id="collections">
        <CrudSection
          title="Assigned collections"
          description="Create, update, and close out the collection records currently assigned to you."
          records={collectionRecords}
          fields={collectionFields}
          columns={[
            { key: "collectionId", label: "Collection" },
            { key: "householdName", label: "Household" },
            { key: "wasteType", label: "Waste type" },
            { key: "weight", label: "Weight" },
            { key: "status", label: "Status" },
            { key: "scheduledDate", label: "Scheduled" },
          ]}
          emptyMessage="No collections assigned to you yet."
          createLabel="Add collection"
          saveAction={upsertCollectionAction}
          deleteAction={deleteCollectionAction}
        />
      </div>

      <div id="routes">
        <CrudSection
          title="Route planner"
          description="Keep your pickup route synchronized with what the landfill and admin teams see."
          records={routeRecords}
          fields={routeFields}
          columns={[
            { key: "name", label: "Route" },
            { key: "status", label: "Status" },
            { key: "plannedDate", label: "Planned date" },
            { key: "distance", label: "Distance" },
            { key: "estimatedTime", label: "ETA" },
            { key: "waypoints", label: "Waypoints" },
          ]}
          emptyMessage="No routes assigned to you yet."
          createLabel="Create route"
          saveAction={upsertRouteAction}
          deleteAction={deleteRouteAction}
        />
      </div>

      <DataTableSection
        title="Notifications"
        description="Messages and alerts reaching your field account."
        columns={[
          { key: "title", label: "Title" },
          { key: "type", label: "Type" },
          { key: "status", label: "Read state" },
          { key: "message", label: "Message" },
          { key: "createdAt", label: "Created" },
        ]}
        records={notificationRecords}
        emptyMessage="No notifications available."
      />
    </PortalShell>
  );
}
