import PortalShell from "@/components/portal/PortalShell";
import CrudSection, { CrudField } from "@/components/portal/CrudSection";
import DataTableSection from "@/components/portal/DataTableSection";
import ActionButton from "@/components/portal/ActionButton";
import { requirePageRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  CollectionRecord,
  collectionInclude,
  mapCollectionRecord,
  mapNotificationRecord,
  mapTransactionRecord,
  NotificationRecord,
  notificationInclude,
  TransactionRecord,
  transactionInclude,
} from "@/components/portal/workspace-helpers";
import {
  deleteCollectionAction,
  deleteNotificationAction,
  deleteTransactionAction,
  payHouseholdSubscriptionAction,
  upsertCollectionAction,
  upsertNotificationAction,
  upsertTransactionAction,
} from "@/app/actions/portal";

export const dynamic = "force-dynamic";

export default async function HouseholdPage() {
  const session = await requirePageRole(["HOUSEHOLD"]);

  const [collections, transactions, notifications] = await Promise.all([
    prisma.collection.findMany({
      where: { householdId: session.user.id },
      include: collectionInclude,
      orderBy: { scheduledDate: "desc" },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      include: transactionInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      include: notificationInclude,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const tabs = [
    { key: "overview", label: "Overview", href: "/household#overview" },
    { key: "collections", label: "Collections", href: "/household#collections" },
    { key: "payments", label: "Payments", href: "/household#payments" },
    { key: "inbox", label: "Inbox", href: "/household#inbox" },
  ];

  const collectionRecords: CollectionRecord[] = collections.map(mapCollectionRecord);
  const transactionRecords: TransactionRecord[] = transactions.map(mapTransactionRecord);
  const notificationRecords: NotificationRecord[] = notifications.map(mapNotificationRecord);

  const collectionFields: CrudField[] = [
    { name: "collectionId", label: "Collection ID" },
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
        { label: "Cancelled", value: "CANCELLED" },
        { label: "Completed", value: "COMPLETED" },
      ],
    },
    { name: "scheduledDate", label: "Preferred date", type: "date", required: true },
    { name: "location", label: "Pickup location" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];

  const paymentFields: CrudField[] = [
    {
      name: "type",
      label: "Payment type",
      type: "select",
      required: true,
      options: [
        { label: "Subscription", value: "SUBSCRIPTION" },
        { label: "Collection fee", value: "COLLECTION_FEE" },
        { label: "Refund", value: "REFUND" },
      ],
    },
    { name: "amount", label: "Amount", type: "number", required: true },
    { name: "currency", label: "Currency", required: true, placeholder: "USD" },
    { name: "description", label: "Description", type: "textarea", required: true },
    { name: "referenceId", label: "Reference ID" },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Refunded", value: "REFUNDED" },
      ],
    },
  ];

  const inboxFields: CrudField[] = [
    { name: "title", label: "Title", required: true },
    { name: "message", label: "Message", type: "textarea", required: true },
    {
      name: "type",
      label: "Type",
      type: "select",
      required: true,
      options: [
        { label: "Alert", value: "ALERT" },
        { label: "System update", value: "SYSTEM_UPDATE" },
        { label: "Support request", value: "SYSTEM_UPDATE" },
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

  const stats = [
    { label: "Upcoming pickups", value: String(collectionRecords.filter((record: CollectionRecord) => record.status === "SCHEDULED").length), help: "Collections still waiting to be handled." },
    { label: "Completed", value: String(collectionRecords.filter((record: CollectionRecord) => record.status === "COMPLETED").length), help: "Pickups already closed successfully." },
    { label: "Payments", value: String(transactionRecords.length), help: `${transactionRecords.filter((record: TransactionRecord) => record.status === "COMPLETED").length} completed transactions.` },
    { label: "Inbox", value: String(notificationRecords.length), help: `${notificationRecords.filter((record: NotificationRecord) => record.status === "UNREAD").length} unread messages.` },
  ];

  return (
    <PortalShell
      title="Household Service Portal"
      description="Request pickups, pay for service, and manage your live household record from one place."
      accent="emerald"
      tabs={tabs}
      currentTab="overview"
      stats={stats}
      user={{
        name: session.user.name ?? "Household User",
        email: session.user.email,
        role: session.user.role,
      }}
      actions={
        <ActionButton
          label="Pay subscription"
          pendingLabel="Paying..."
          action={payHouseholdSubscriptionAction}
          className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      }
    >
      <section id="overview" className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur lg:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Overview</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Your service dashboard</h2>
        <p className="mt-3 text-sm text-slate-600">
          The household app is now connected to the same live database as the operations portals, so your requests and payments appear everywhere they should.
        </p>
      </section>

      <div id="collections">
        <CrudSection
          title="Collection requests"
          description="Create and manage your pickup requests directly from the portal."
          records={collectionRecords}
          fields={collectionFields}
          columns={[
            { key: "collectionId", label: "Collection" },
            { key: "wasteType", label: "Waste type" },
            { key: "weight", label: "Weight" },
            { key: "status", label: "Status" },
            { key: "scheduledDate", label: "Date" },
            { key: "agentName", label: "Assigned agent" },
          ]}
          emptyMessage="No collection requests yet."
          createLabel="Request pickup"
          saveAction={upsertCollectionAction}
          deleteAction={deleteCollectionAction}
        />
      </div>

      <div id="payments">
        <CrudSection
          title="Payments"
          description="Track subscriptions, collection fees, and any refunds or credits."
          records={transactionRecords}
          fields={paymentFields}
          columns={[
            { key: "type", label: "Type" },
            { key: "amountLabel", label: "Amount" },
            { key: "description", label: "Description" },
            { key: "status", label: "Status" },
            { key: "createdAt", label: "Created" },
          ]}
          emptyMessage="No payments recorded yet."
          createLabel="Add payment"
          saveAction={upsertTransactionAction}
          deleteAction={deleteTransactionAction}
        />
      </div>

      <div id="inbox">
        <CrudSection
          title="Inbox and support"
          description="Keep your message feed organized and log support requests when needed."
          records={notificationRecords}
          fields={inboxFields}
          columns={[
            { key: "title", label: "Title" },
            { key: "type", label: "Type" },
            { key: "status", label: "Read state" },
            { key: "message", label: "Message" },
            { key: "createdAt", label: "Created" },
          ]}
          emptyMessage="No inbox messages yet."
          createLabel="Create message"
          saveAction={upsertNotificationAction}
          deleteAction={deleteNotificationAction}
        />
      </div>

      <DataTableSection
        title="Service history"
        description="A quick read-only timeline of the collections attached to your household."
        columns={[
          { key: "collectionId", label: "Collection" },
          { key: "wasteType", label: "Waste type" },
          { key: "status", label: "Status" },
          { key: "scheduledDate", label: "Scheduled" },
          { key: "completedDate", label: "Completed" },
          { key: "agentName", label: "Agent" },
        ]}
        records={collectionRecords}
        emptyMessage="No service history available."
      />
    </PortalShell>
  );
}
