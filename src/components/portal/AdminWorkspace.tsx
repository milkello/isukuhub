import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { portalConfigs } from "@/lib/portal-config";
import PortalShell from "./PortalShell";
import CrudSection, { CrudField } from "./CrudSection";
import DataTableSection from "./DataTableSection";
import {
  collectionInclude,
  makeRoleField,
  makeTabs,
  CollectionRecord,
  MaterialRecord,
  mapCollectionRecord,
  mapMaterialRecord,
  mapNotificationRecord,
  mapRouteRecord,
  mapTransactionRecord,
  mapUserRecord,
  materialInclude,
  NotificationRecord,
  notificationInclude,
  RouteRecord,
  routeInclude,
  statusSummary,
  categorySummary,
  TransactionRecord,
  transactionInclude,
  transactionSummary,
  buildSelectOptions,
  UserRecord,
  WorkspaceUser,
} from "./workspace-helpers";
import { userInclude } from "@/lib/user-management";
import {
  deleteNotificationAction,
  deletePortalUserAction,
  deleteRouteAction,
  deleteTransactionAction,
  upsertNotificationAction,
  upsertPortalUserAction,
  upsertRouteAction,
  upsertTransactionAction,
} from "@/app/actions/portal";

export default async function AdminWorkspace({
  tab,
  user,
}: {
  tab: string;
  user: WorkspaceUser;
}) {
  const config = portalConfigs.admin;
  const tabs = makeTabs("admin");
  const currentTab = config.tabs.find((item) => item.key === tab);
  if (!currentTab) {
    notFound();
  }

  const [users, collections, routes, transactions, materials, notifications] = await Promise.all([
    prisma.user.findMany({ include: userInclude, orderBy: { createdAt: "desc" } }),
    prisma.collection.findMany({ include: collectionInclude, orderBy: { scheduledDate: "desc" } }),
    prisma.route.findMany({ include: routeInclude, orderBy: { plannedDate: "desc" } }),
    prisma.transaction.findMany({ include: transactionInclude, orderBy: { createdAt: "desc" } }),
    prisma.material.findMany({ include: materialInclude, orderBy: { createdAt: "desc" } }),
    prisma.notification.findMany({ include: notificationInclude, orderBy: { createdAt: "desc" } }),
  ]);

  const userRecords: UserRecord[] = users.map(mapUserRecord);
  const householdRecords: UserRecord[] = userRecords.filter((record: UserRecord) => record.role === "HOUSEHOLD");
  const agentRecords: UserRecord[] = userRecords.filter((record: UserRecord) => record.role === "AGENT");
  const routeRecords: RouteRecord[] = routes.map(mapRouteRecord);
  const transactionRecords: TransactionRecord[] = transactions.map(mapTransactionRecord);
  const materialRecords: MaterialRecord[] = materials.map(mapMaterialRecord);
  const notificationRecords: NotificationRecord[] = notifications.map(mapNotificationRecord);
  const collectionRecords: CollectionRecord[] = collections.map(mapCollectionRecord);

  const userOptions = buildSelectOptions(
    userRecords.map((record) => ({
      id: record.id,
      name: String(record.name),
      email: String(record.email),
    })),
  );
  const agentOptions = buildSelectOptions(
    agentRecords.map((record) => ({
      id: record.id,
      name: String(record.name),
      email: String(record.email),
    })),
  );

  const stats = [
    {
      label: "Users",
      value: String(userRecords.length),
      help: `${householdRecords.length} households and ${agentRecords.length} agents live.`,
    },
    {
      label: "Collections",
      value: String(collectionRecords.length),
      help: `${collectionRecords.filter((record: CollectionRecord) => record.status === "COMPLETED").length} pickups completed.`,
    },
    {
      label: "Revenue",
      value: transactionRecords[0]?.amountLabel ?? "$0.00",
      help: `${transactionRecords.length} transaction records available.`,
    },
    {
      label: "Materials",
      value: String(materialRecords.length),
      help: `${materialRecords.filter((record: MaterialRecord) => record.status === "ACTIVE").length} active listings.`,
    },
  ];

  const householdFields: CrudField[] = [
    makeRoleField("HOUSEHOLD", "Role"),
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

  const agentFields: CrudField[] = [
    makeRoleField("AGENT", "Role"),
    { name: "name", label: "Agent name", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "password", label: "Password" },
    { name: "phone", label: "Phone" },
    { name: "employeeId", label: "Employee ID", required: true },
    { name: "department", label: "Department", required: true },
    { name: "vehicleType", label: "Vehicle type" },
    { name: "licensePlate", label: "License plate" },
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

  const routeFields: CrudField[] = [
    { name: "agentId", label: "Agent", type: "select", required: true, options: agentOptions },
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

  const paymentFields: CrudField[] = [
    { name: "userId", label: "User", type: "select", required: true, options: userOptions },
    {
      name: "type",
      label: "Type",
      type: "select",
      required: true,
      options: [
        { label: "Collection fee", value: "COLLECTION_FEE" },
        { label: "Subscription", value: "SUBSCRIPTION" },
        { label: "Material purchase", value: "MATERIAL_PURCHASE" },
        { label: "Material sale", value: "MATERIAL_SALE" },
        { label: "Investment return", value: "INVESTMENT_RETURN" },
      ],
    },
    { name: "amount", label: "Amount", type: "number", required: true },
    { name: "currency", label: "Currency", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
    { name: "referenceId", label: "Reference ID" },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Confirmed", value: "CONFIRMED" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Cancelled", value: "CANCELLED" },
      ],
    },
  ];

  const notificationFields: CrudField[] = [
    { name: "userId", label: "Recipient", type: "select", required: true, options: userOptions },
    { name: "title", label: "Title", required: true },
    { name: "message", label: "Message", type: "textarea", required: true },
    {
      name: "type",
      label: "Type",
      type: "select",
      required: true,
      options: [
        { label: "System update", value: "SYSTEM_UPDATE" },
        { label: "Alert", value: "ALERT" },
        { label: "Collection scheduled", value: "COLLECTION_SCHEDULED" },
        { label: "Collection completed", value: "COLLECTION_COMPLETED" },
      ],
    },
    {
      name: "isRead",
      label: "Read",
      type: "select",
      required: true,
      options: [
        { label: "No", value: "false" },
        { label: "Yes", value: "true" },
      ],
    },
  ];

  const content = {
    dashboard: (
      <>
        <DataTableSection
          title="Recent collections"
          description="The latest waste pickups flowing through the platform."
          columns={[
            { key: "collectionId", label: "Collection" },
            { key: "householdName", label: "Household" },
            { key: "agentName", label: "Agent" },
            { key: "wasteType", label: "Waste type" },
            { key: "status", label: "Status" },
            { key: "scheduledDate", label: "Scheduled" },
          ]}
          records={collectionRecords.slice(0, 8)}
          emptyMessage="No collections available yet."
        />
        <DataTableSection
          title="Recent payments"
          description="Household, recycler, and investor cashflow in one place."
          columns={[
            { key: "userName", label: "User" },
            { key: "role", label: "Role" },
            { key: "type", label: "Type" },
            { key: "amountLabel", label: "Amount" },
            { key: "status", label: "Status" },
            { key: "createdAt", label: "Created" },
          ]}
          records={transactionRecords.slice(0, 8)}
          emptyMessage="No payments available yet."
        />
      </>
    ),
    households: (
      <CrudSection
        title="Household accounts"
        description="Register households, keep subscription details clean, and manage active service coverage."
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
        emptyMessage="No household accounts found."
        createLabel="Add household"
        saveAction={upsertPortalUserAction}
        deleteAction={deletePortalUserAction}
      />
    ),
    agents: (
      <CrudSection
        title="Collection agents"
        description="Keep field teams, vehicles, and contact information synchronized."
        records={agentRecords}
        fields={agentFields}
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "employeeId", label: "Employee ID" },
          { key: "department", label: "Department" },
          { key: "vehicleType", label: "Vehicle" },
          { key: "status", label: "Status" },
        ]}
        emptyMessage="No agents found."
        createLabel="Add agent"
        saveAction={upsertPortalUserAction}
        deleteAction={deletePortalUserAction}
      />
    ),
    routes: (
      <CrudSection
        title="Route planning"
        description="Assign routes to agents and keep operational timing up to date."
        records={routeRecords}
        fields={routeFields}
        columns={[
          { key: "name", label: "Route" },
          { key: "agentName", label: "Agent" },
          { key: "status", label: "Status" },
          { key: "plannedDate", label: "Planned date" },
          { key: "distance", label: "Distance" },
          { key: "estimatedTime", label: "ETA" },
        ]}
        emptyMessage="No routes have been planned yet."
        createLabel="Plan route"
        saveAction={upsertRouteAction}
        deleteAction={deleteRouteAction}
      />
    ),
    payments: (
      <CrudSection
        title="Payments and transactions"
        description="Track subscriptions, collection fees, material sales, and investor returns."
        records={transactionRecords}
        fields={paymentFields}
        columns={[
          { key: "userName", label: "User" },
          { key: "role", label: "Role" },
          { key: "type", label: "Type" },
          { key: "amountLabel", label: "Amount" },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Created" },
        ]}
        emptyMessage="No transactions recorded yet."
        createLabel="Add payment"
        saveAction={upsertTransactionAction}
        deleteAction={deleteTransactionAction}
      />
    ),
    analytics: (
      <>
        <DataTableSection
          title="Collection status mix"
          description="Pickup volume broken down by operational state."
          columns={[
            { key: "status", label: "Status" },
            { key: "count", label: "Count" },
            { key: "totalWeight", label: "Weight" },
          ]}
          records={statusSummary(collectionRecords)}
          emptyMessage="No collection analytics available."
        />
        <DataTableSection
          title="Marketplace categories"
          description="Inventory, listing count, and average price by material category."
          columns={[
            { key: "category", label: "Category" },
            { key: "listings", label: "Listings" },
            { key: "inventory", label: "Inventory" },
            { key: "avgPrice", label: "Average price" },
          ]}
          records={categorySummary(materialRecords)}
          emptyMessage="No material analytics available."
        />
        <DataTableSection
          title="Transaction mix"
          description="A quick operational finance snapshot by transaction type."
          columns={[
            { key: "type", label: "Type" },
            { key: "count", label: "Count" },
            { key: "totalAmount", label: "Total amount" },
            { key: "completed", label: "Completed" },
          ]}
          records={transactionSummary(transactionRecords)}
          emptyMessage="No transaction analytics available."
        />
      </>
    ),
    settings: (
      <>
        <CrudSection
          title="System notifications"
          description="Publish internal notices and keep role-specific inboxes updated."
          records={notificationRecords}
          fields={notificationFields}
          columns={[
            { key: "userName", label: "Recipient" },
            { key: "role", label: "Role" },
            { key: "title", label: "Title" },
            { key: "type", label: "Type" },
            { key: "status", label: "Read state" },
            { key: "createdAt", label: "Created" },
          ]}
          emptyMessage="No notifications available."
          createLabel="Send notice"
          saveAction={upsertNotificationAction}
          deleteAction={deleteNotificationAction}
        />
        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur lg:p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Admin tools</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Operations shortcuts</h2>
          <p className="mt-3 text-sm text-slate-600">
            Jump into the raw database viewer or return to the public role switcher when you need to inspect the system end to end.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/database" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
              Open database viewer
            </Link>
            <Link href="/home" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
              Open role switcher
            </Link>
          </div>
        </section>
      </>
    ),
  }[tab];

  return (
    <PortalShell
      title={`${config.title} - ${currentTab.label}`}
      description={config.description}
      accent={config.accent}
      tabs={tabs}
      currentTab={tab}
      stats={stats}
      user={{ ...user, name: user.name || "Admin User" }}
    >
      {content}
    </PortalShell>
  );
}
