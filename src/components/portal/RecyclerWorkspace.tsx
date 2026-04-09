import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { portalConfigs } from "@/lib/portal-config";
import PortalShell from "./PortalShell";
import CrudSection, { CrudField } from "./CrudSection";
import DataTableSection from "./DataTableSection";
import {
  CollectionRecord,
  collectionInclude,
  MaterialRecord,
  makeTabs,
  mapCollectionRecord,
  mapMaterialRecord,
  mapNotificationRecord,
  mapTransactionRecord,
  mapUserRecord,
  materialInclude,
  NotificationRecord,
  notificationInclude,
  TransactionRecord,
  transactionInclude,
  UserRecord,
  WorkspaceUser,
} from "./workspace-helpers";
import { userInclude } from "@/lib/user-management";
import {
  deleteMaterialAction,
  deleteNotificationAction,
  deleteTransactionAction,
  upsertMaterialAction,
  upsertNotificationAction,
  upsertTransactionAction,
} from "@/app/actions/portal";

export default async function RecyclerWorkspace({
  tab,
  user,
}: {
  tab: string;
  user: WorkspaceUser;
}) {
  const config = portalConfigs.recycler;
  const tabs = makeTabs("recycler");
  const currentTab = config.tabs.find((item) => item.key === tab);
  if (!currentTab) {
    notFound();
  }

  const [materials, transactions, notifications, collections, households, agents] = await Promise.all([
    prisma.material.findMany({ where: { recyclerId: user.id }, include: materialInclude, orderBy: { createdAt: "desc" } }),
    prisma.transaction.findMany({ where: { userId: user.id }, include: transactionInclude, orderBy: { createdAt: "desc" } }),
    prisma.notification.findMany({ where: { userId: user.id }, include: notificationInclude, orderBy: { createdAt: "desc" } }),
    prisma.collection.findMany({ include: collectionInclude, orderBy: { scheduledDate: "desc" } }),
    prisma.user.findMany({ where: { role: "HOUSEHOLD" }, include: userInclude, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { role: "AGENT" }, include: userInclude, orderBy: { createdAt: "desc" } }),
  ]);

  const materialRecords: MaterialRecord[] = materials.map(mapMaterialRecord);
  const transactionRecords: TransactionRecord[] = transactions.map(mapTransactionRecord);
  const notificationRecords: NotificationRecord[] = notifications.map(mapNotificationRecord);
  const collectionRecords: CollectionRecord[] = collections.map(mapCollectionRecord);

  const supplierRecords = [
    ...households.map(mapUserRecord).map((record: UserRecord) => {
      const matchedCollections = collectionRecords.filter((collection: CollectionRecord) => collection.householdId === record.id);
      return {
        id: record.id,
        supplier: String(record.name),
        role: "HOUSEHOLD",
        location: String(record.address || "Unassigned"),
        pickups: String(matchedCollections.length),
        lastPickup: matchedCollections[0]?.scheduledDate || "",
      };
    }),
    ...agents.map(mapUserRecord).map((record: UserRecord) => {
      const matchedCollections = collectionRecords.filter((collection: CollectionRecord) => collection.agentId === record.id);
      return {
        id: record.id,
        supplier: String(record.name),
        role: "AGENT",
        location: String(record.department || "Collections"),
        pickups: String(matchedCollections.length),
        lastPickup: matchedCollections[0]?.scheduledDate || "",
      };
    }),
  ];

  const stats = [
    { label: "Listings", value: String(materialRecords.length), help: `${materialRecords.filter((record: MaterialRecord) => record.status === "ACTIVE").length} live offers.` },
    { label: "Orders", value: String(transactionRecords.length), help: `${transactionRecords.filter((record: TransactionRecord) => record.status === "PENDING").length} pending confirmations.` },
    { label: "Messages", value: String(notificationRecords.length), help: `${notificationRecords.filter((record: NotificationRecord) => record.status === "UNREAD").length} unread updates.` },
    { label: "Suppliers", value: String(supplierRecords.length), help: "Connected households and agents supplying volume." },
  ];

  const materialFields: CrudField[] = [
    { name: "name", label: "Material name", required: true },
    {
      name: "category",
      label: "Category",
      type: "select",
      required: true,
      options: [
        { label: "Plastic", value: "PLASTIC" },
        { label: "Paper", value: "PAPER" },
        { label: "Metal", value: "METAL" },
        { label: "Glass", value: "GLASS" },
        { label: "Organic", value: "ORGANIC" },
        { label: "Electronic", value: "ELECTRONIC" },
        { label: "Other", value: "OTHER" },
      ],
    },
    { name: "description", label: "Description", type: "textarea" },
    { name: "pricePerKg", label: "Price per kg", type: "number", required: true },
    { name: "availableWeight", label: "Available weight", type: "number", required: true },
    { name: "quality", label: "Quality", type: "select", required: true, options: [{ label: "Low", value: "LOW" }, { label: "Standard", value: "STANDARD" }, { label: "Premium", value: "PREMIUM" }, { label: "Excellent", value: "EXCELLENT" }] },
    { name: "location", label: "Location", required: true },
    { name: "isActive", label: "Active", type: "select", required: true, options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
  ];

  const orderFields: CrudField[] = [
    { name: "type", label: "Order type", type: "select", required: true, options: [{ label: "Material purchase", value: "MATERIAL_PURCHASE" }, { label: "Material sale", value: "MATERIAL_SALE" }] },
    { name: "amount", label: "Amount", type: "number", required: true },
    { name: "currency", label: "Currency", required: true, placeholder: "USD" },
    { name: "description", label: "Description", type: "textarea", required: true },
    { name: "referenceId", label: "Reference ID" },
    { name: "status", label: "Status", type: "select", required: true, options: [{ label: "Pending", value: "PENDING" }, { label: "Confirmed", value: "CONFIRMED" }, { label: "Completed", value: "COMPLETED" }, { label: "Cancelled", value: "CANCELLED" }] },
  ];

  const messageFields: CrudField[] = [
    { name: "title", label: "Title", required: true },
    { name: "message", label: "Message", type: "textarea", required: true },
    { name: "type", label: "Type", type: "select", required: true, options: [{ label: "Alert", value: "ALERT" }, { label: "System update", value: "SYSTEM_UPDATE" }, { label: "Material available", value: "MATERIAL_AVAILABLE" }] },
    { name: "isRead", label: "Read", type: "select", required: true, options: [{ label: "No", value: "false" }, { label: "Yes", value: "true" }] },
  ];

  const content = {
    marketplace: (
      <CrudSection
        title="Marketplace listings"
        description="Create and maintain every material you want buyers to see."
        records={materialRecords}
        fields={materialFields}
        columns={[{ key: "name", label: "Material" }, { key: "category", label: "Category" }, { key: "priceLabel", label: "Price" }, { key: "availableWeightLabel", label: "Weight" }, { key: "quality", label: "Quality" }, { key: "status", label: "Status" }]}
        emptyMessage="No marketplace listings available."
        createLabel="List material"
        saveAction={upsertMaterialAction}
        deleteAction={deleteMaterialAction}
      />
    ),
    orders: (
      <CrudSection
        title="Orders"
        description="Track purchase orders, sale agreements, and settlement status."
        records={transactionRecords}
        fields={orderFields}
        columns={[{ key: "type", label: "Type" }, { key: "amountLabel", label: "Amount" }, { key: "description", label: "Description" }, { key: "status", label: "Status" }, { key: "createdAt", label: "Created" }]}
        emptyMessage="No orders recorded yet."
        createLabel="Create order"
        saveAction={upsertTransactionAction}
        deleteAction={deleteTransactionAction}
      />
    ),
    suppliers: (
      <DataTableSection
        title="Supplier network"
        description="A live directory of households and agents contributing material flow into the ecosystem."
        columns={[{ key: "supplier", label: "Supplier" }, { key: "role", label: "Role" }, { key: "location", label: "Location" }, { key: "pickups", label: "Pickups" }, { key: "lastPickup", label: "Last pickup" }]}
        records={supplierRecords}
        emptyMessage="No suppliers connected yet."
      />
    ),
    invoices: (
      <DataTableSection
        title="Invoice ledger"
        description="Use the order stream as your invoice ledger until settlement is complete."
        columns={[{ key: "type", label: "Type" }, { key: "description", label: "Description" }, { key: "amountLabel", label: "Amount" }, { key: "status", label: "Status" }, { key: "createdAt", label: "Issued" }]}
        records={transactionRecords}
        emptyMessage="No invoice history available."
      />
    ),
    messages: (
      <CrudSection
        title="Messages"
        description="Keep your internal message board alive with supplier and system updates."
        records={notificationRecords}
        fields={messageFields}
        columns={[{ key: "title", label: "Title" }, { key: "type", label: "Type" }, { key: "status", label: "Read state" }, { key: "message", label: "Message" }, { key: "createdAt", label: "Created" }]}
        emptyMessage="No messages available."
        createLabel="Post message"
        saveAction={upsertNotificationAction}
        deleteAction={deleteNotificationAction}
      />
    ),
  }[tab];

  return (
    <PortalShell title={`${config.title} - ${currentTab.label}`} description={config.description} accent={config.accent} tabs={tabs} currentTab={tab} stats={stats} user={{ ...user, name: user.name || "Recycler User" }}>
      {content}
    </PortalShell>
  );
}
