import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { portalConfigs } from "@/lib/portal-config";
import PortalShell from "./PortalShell";
import CrudSection, { CrudField } from "./CrudSection";
import DataTableSection from "./DataTableSection";
import {
  buildSelectOptions,
  categorySummary,
  CollectionRecord,
  collectionInclude,
  coverageSummary,
  makeTabs,
  MaterialRecord,
  mapCollectionRecord,
  mapMaterialRecord,
  mapRegulationRecord,
  mapReportRecord,
  mapRouteRecord,
  mapTransactionRecord,
  mapUserRecord,
  materialInclude,
  RegulationRecord,
  regulationInclude,
  ReportRecord,
  reportInclude,
  RouteRecord,
  routeInclude,
  statusSummary,
  TransactionRecord,
  transactionInclude,
  transactionSummary,
  UserRecord,
  WorkspaceUser,
} from "./workspace-helpers";
import { userInclude } from "@/lib/user-management";
import {
  deleteRegulationAction,
  deleteReportAction,
  upsertRegulationAction,
  upsertReportAction,
} from "@/app/actions/portal";

export default async function GovernmentWorkspace({
  tab,
  user,
}: {
  tab: string;
  user: WorkspaceUser;
}) {
  const config = portalConfigs.government;
  const tabs = makeTabs("government");
  const currentTab = config.tabs.find((item) => item.key === tab);
  if (!currentTab) {
    notFound();
  }

  const [reports, regulations, users, collections, routes, materials, transactions] = await Promise.all([
    prisma.report.findMany({ include: reportInclude, orderBy: { generatedAt: "desc" } }),
    prisma.regulation.findMany({ include: regulationInclude, orderBy: { effectiveDate: "desc" } }),
    prisma.user.findMany({ include: userInclude, orderBy: { createdAt: "desc" } }),
    prisma.collection.findMany({ include: collectionInclude, orderBy: { scheduledDate: "desc" } }),
    prisma.route.findMany({ include: routeInclude, orderBy: { plannedDate: "desc" } }),
    prisma.material.findMany({ include: materialInclude, orderBy: { createdAt: "desc" } }),
    prisma.transaction.findMany({ include: transactionInclude, orderBy: { createdAt: "desc" } }),
  ]);

  const reportRecords: ReportRecord[] = reports.map(mapReportRecord);
  const regulationRecords: RegulationRecord[] = regulations.map(mapRegulationRecord);
  const userRecords: UserRecord[] = users.map(mapUserRecord);
  const collectionRecords: CollectionRecord[] = collections.map(mapCollectionRecord);
  const routeRecords: RouteRecord[] = routes.map(mapRouteRecord);
  const materialRecords: MaterialRecord[] = materials.map(mapMaterialRecord);
  const transactionRecords: TransactionRecord[] = transactions.map(mapTransactionRecord);
  const governmentOptions = buildSelectOptions(
    userRecords
      .filter((record: UserRecord) => record.role === "GOVERNMENT")
      .map((record: UserRecord) => ({
        id: record.id,
        name: String(record.name),
        email: String(record.email),
      })),
  );

  const stats = [
    { label: "Coverage", value: `${Math.round((collectionRecords.filter((record: CollectionRecord) => record.status === "COMPLETED").length / Math.max(collectionRecords.length, 1)) * 100)}%`, help: "Completion ratio across recorded collections." },
    { label: "Reports", value: String(reportRecords.length), help: `${reportRecords.filter((record: ReportRecord) => record.status === "PUBLISHED").length} published reports.` },
    { label: "Regulations", value: String(regulationRecords.length), help: `${regulationRecords.filter((record: RegulationRecord) => record.status === "ACTIVE").length} still active.` },
    { label: "Stakeholders", value: String(userRecords.length), help: `${userRecords.filter((record: UserRecord) => record.status === "ACTIVE").length} active accounts.` },
  ];

  const officeOptions = governmentOptions.length > 0 ? governmentOptions : [{ label: user.name ?? "Current office", value: user.id }];

  const reportFields: CrudField[] = [
    { name: "governmentId", label: "Office", type: "select", required: true, options: officeOptions },
    { name: "title", label: "Title", required: true },
    { name: "type", label: "Type", type: "select", required: true, options: [{ label: "Collection stats", value: "COLLECTION_STATS" }, { label: "Recycling rate", value: "RECYCLING_RATE" }, { label: "Environmental impact", value: "ENVIRONMENTAL_IMPACT" }, { label: "Compliance", value: "COMPLIANCE" }, { label: "Financial", value: "FINANCIAL" }, { label: "Operational", value: "OPERATIONAL" }] },
    { name: "content", label: "Content", type: "textarea", required: true },
    { name: "period", label: "Period", required: true },
    { name: "status", label: "Status", type: "select", required: true, options: [{ label: "Draft", value: "DRAFT" }, { label: "Pending review", value: "PENDING_REVIEW" }, { label: "Approved", value: "APPROVED" }, { label: "Published", value: "PUBLISHED" }, { label: "Archived", value: "ARCHIVED" }] },
    { name: "publishedAt", label: "Published date", type: "date" },
  ];

  const regulationFields: CrudField[] = [
    { name: "governmentId", label: "Office", type: "select", required: true, options: officeOptions },
    { name: "title", label: "Title", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
    { name: "type", label: "Type", type: "select", required: true, options: [{ label: "Waste management", value: "WASTE_MANAGEMENT" }, { label: "Recycling", value: "RECYCLING" }, { label: "Environmental", value: "ENVIRONMENTAL" }, { label: "Health and safety", value: "HEALTH_SAFETY" }, { label: "Transportation", value: "TRANSPORTATION" }, { label: "Business", value: "BUSINESS" }] },
    { name: "requirements", label: "Requirements", type: "textarea", required: true },
    { name: "penalties", label: "Penalties", type: "textarea" },
    { name: "effectiveDate", label: "Effective date", type: "date", required: true },
    { name: "expiryDate", label: "Expiry date", type: "date" },
    { name: "status", label: "Status", type: "select", required: true, options: [{ label: "Active", value: "ACTIVE" }, { label: "Suspended", value: "SUSPENDED" }, { label: "Expired", value: "EXPIRED" }, { label: "Repealed", value: "REPEALED" }] },
  ];

  const content = {
    overview: (
      <>
        <DataTableSection
          title="Latest reports"
          description="The most recent reporting produced across the system."
          columns={[{ key: "title", label: "Title" }, { key: "type", label: "Type" }, { key: "period", label: "Period" }, { key: "status", label: "Status" }, { key: "generatedAt", label: "Generated" }]}
          records={reportRecords.slice(0, 8)}
          emptyMessage="No reports available."
        />
        <DataTableSection
          title="Active regulations"
          description="Current policy rules shaping operational compliance."
          columns={[{ key: "title", label: "Title" }, { key: "type", label: "Type" }, { key: "status", label: "Status" }, { key: "effectiveDate", label: "Effective" }, { key: "expiryDate", label: "Expiry" }]}
          records={regulationRecords.slice(0, 8)}
          emptyMessage="No regulations available."
        />
      </>
    ),
    analytics: (
      <>
        <DataTableSection title="Collection status analytics" description="Pickup activity and total handled weight by status." columns={[{ key: "status", label: "Status" }, { key: "count", label: "Count" }, { key: "totalWeight", label: "Weight" }]} records={statusSummary(collectionRecords)} emptyMessage="No collection analytics available." />
        <DataTableSection title="Material category analytics" description="Supply and pricing overview by recycler material category." columns={[{ key: "category", label: "Category" }, { key: "listings", label: "Listings" }, { key: "inventory", label: "Inventory" }, { key: "avgPrice", label: "Average price" }]} records={categorySummary(materialRecords)} emptyMessage="No material analytics available." />
        <DataTableSection title="Transaction analytics" description="Financial activity broken down by transaction type." columns={[{ key: "type", label: "Type" }, { key: "count", label: "Count" }, { key: "totalAmount", label: "Total amount" }, { key: "completed", label: "Completed" }]} records={transactionSummary(transactionRecords)} emptyMessage="No transaction analytics available." />
      </>
    ),
    "coverage-map": (
      <DataTableSection title="Coverage map" description="Zone coverage calculated from collection activity and active routes." columns={[{ key: "zone", label: "Zone" }, { key: "collections", label: "Collections" }, { key: "completed", label: "Completed" }, { key: "coverage", label: "Coverage" }, { key: "activeRoutes", label: "Active routes" }]} records={coverageSummary(collectionRecords, routeRecords)} emptyMessage="No zone coverage data available." />
    ),
    reports: (
      <CrudSection
        title="Reports"
        description="Draft, review, and publish reporting artifacts from the government portal."
        records={reportRecords}
        fields={reportFields}
        columns={[{ key: "title", label: "Title" }, { key: "type", label: "Type" }, { key: "period", label: "Period" }, { key: "status", label: "Status" }, { key: "generatedAt", label: "Generated" }, { key: "publishedAt", label: "Published" }]}
        emptyMessage="No reports available."
        createLabel="Create report"
        saveAction={upsertReportAction}
        deleteAction={deleteReportAction}
      />
    ),
    compliance: (
      <CrudSection
        title="Compliance rules"
        description="Maintain the regulations and requirements enforced by the oversight team."
        records={regulationRecords}
        fields={regulationFields}
        columns={[{ key: "title", label: "Title" }, { key: "type", label: "Type" }, { key: "status", label: "Status" }, { key: "effectiveDate", label: "Effective" }, { key: "expiryDate", label: "Expiry" }]}
        emptyMessage="No regulations available."
        createLabel="Add regulation"
        saveAction={upsertRegulationAction}
        deleteAction={deleteRegulationAction}
      />
    ),
    stakeholders: (
      <DataTableSection title="Stakeholder directory" description="A cross-role directory of households, field teams, recyclers, investors, and oversight staff." columns={[{ key: "name", label: "Name" }, { key: "role", label: "Role" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "status", label: "Status" }, { key: "createdAt", label: "Created" }]} records={userRecords} emptyMessage="No stakeholders available." />
    ),
  }[tab];

  return (
    <PortalShell title={`${config.title} - ${currentTab.label}`} description={config.description} accent={config.accent} tabs={tabs} currentTab={tab} stats={stats} user={{ ...user, name: user.name || "Government User" }}>
      {content}
    </PortalShell>
  );
}
