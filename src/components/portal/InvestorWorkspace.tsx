import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { portalConfigs } from "@/lib/portal-config";
import PortalShell from "./PortalShell";
import CrudSection, { CrudField } from "./CrudSection";
import DataTableSection from "./DataTableSection";
import {
  CollectionRecord,
  collectionInclude,
  InvestmentRecord,
  investmentInclude,
  MaterialRecord,
  makeTabs,
  mapCollectionRecord,
  mapInvestmentRecord,
  mapMaterialRecord,
  mapReportRecord,
  mapTransactionRecord,
  materialInclude,
  ReportRecord,
  reportInclude,
  TransactionRecord,
  transactionInclude,
  WorkspaceUser,
} from "./workspace-helpers";
import { deleteInvestmentAction, upsertInvestmentAction } from "@/app/actions/portal";

export default async function InvestorWorkspace({
  tab,
  user,
}: {
  tab: string;
  user: WorkspaceUser;
}) {
  const config = portalConfigs.investor;
  const tabs = makeTabs("investor");
  const currentTab = config.tabs.find((item) => item.key === tab);
  if (!currentTab) {
    notFound();
  }

  const [investments, collections, reports, transactions, materials] = await Promise.all([
    prisma.investment.findMany({ where: { investorId: user.id }, include: investmentInclude, orderBy: { investmentDate: "desc" } }),
    prisma.collection.findMany({ include: collectionInclude, orderBy: { scheduledDate: "desc" } }),
    prisma.report.findMany({ include: reportInclude, orderBy: { generatedAt: "desc" } }),
    prisma.transaction.findMany({ where: { userId: user.id }, include: transactionInclude, orderBy: { createdAt: "desc" } }),
    prisma.material.findMany({ include: materialInclude, orderBy: { availableWeight: "desc" } }),
  ]);

  const investmentRecords: InvestmentRecord[] = investments.map(mapInvestmentRecord);
  const collectionRecords: CollectionRecord[] = collections.map(mapCollectionRecord);
  const reportRecords: ReportRecord[] = reports.map(mapReportRecord);
  const transactionRecords: TransactionRecord[] = transactions.map(mapTransactionRecord);
  const materialRecords: MaterialRecord[] = materials.map(mapMaterialRecord);

  const stats = [
    { label: "Portfolio", value: investmentRecords[0]?.amountLabel ?? "$0.00", help: `${investmentRecords.length} tracked positions.` },
    { label: "Expected return", value: `${(investmentRecords.reduce((sum: number, record: InvestmentRecord) => sum + Number(record.expectedReturn || 0), 0) / Math.max(investmentRecords.length, 1)).toFixed(1)}%`, help: "Average expected return." },
    { label: "Operational loads", value: String(collectionRecords.length), help: `${collectionRecords.filter((record: CollectionRecord) => record.status === "COMPLETED").length} loads processed.` },
    { label: "Reports", value: String(reportRecords.length), help: `${reportRecords.filter((record: ReportRecord) => record.status === "PUBLISHED").length} published reports.` },
  ];

  const investmentFields: CrudField[] = [
    { name: "type", label: "Type", type: "select", required: true, options: [{ label: "Direct", value: "DIRECT" }, { label: "Fund", value: "FUND" }, { label: "Bond", value: "BOND" }, { label: "Equity", value: "EQUITY" }, { label: "Crowdfunding", value: "CROWDFUNDING" }] },
    { name: "amount", label: "Amount", type: "number", required: true },
    { name: "currency", label: "Currency", required: true, placeholder: "USD" },
    { name: "expectedReturn", label: "Expected return %", type: "number" },
    { name: "actualReturn", label: "Actual return %", type: "number" },
    { name: "status", label: "Status", type: "select", required: true, options: [{ label: "Active", value: "ACTIVE" }, { label: "Matured", value: "MATURED" }, { label: "Closed", value: "CLOSED" }, { label: "Defaulted", value: "DEFAULTED" }] },
    { name: "investmentDate", label: "Investment date", type: "date", required: true },
    { name: "maturityDate", label: "Maturity date", type: "date" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];

  const content = {
    "landfill-ops": (
      <>
        <DataTableSection
          title="Operational load performance"
          description="A live stream of collection loads moving through the wider waste network."
          columns={[{ key: "collectionId", label: "Load" }, { key: "householdName", label: "Source" }, { key: "agentName", label: "Agent" }, { key: "wasteType", label: "Waste type" }, { key: "status", label: "Status" }, { key: "scheduledDate", label: "Scheduled" }]}
          records={collectionRecords.slice(0, 10)}
          emptyMessage="No operational loads available."
        />
        <DataTableSection
          title="Top market inventory"
          description="Investor-facing view of the material categories with the most available supply."
          columns={[{ key: "name", label: "Material" }, { key: "category", label: "Category" }, { key: "availableWeightLabel", label: "Weight" }, { key: "priceLabel", label: "Price" }, { key: "recyclerName", label: "Recycler" }]}
          records={materialRecords.slice(0, 8)}
          emptyMessage="No market inventory available."
        />
      </>
    ),
    batches: (
      <DataTableSection
        title="Waste batches"
        description="Completed and pending loads presented as investor-readable operational batches."
        columns={[{ key: "collectionId", label: "Batch" }, { key: "householdName", label: "Source" }, { key: "wasteType", label: "Waste type" }, { key: "weight", label: "Weight" }, { key: "status", label: "Status" }, { key: "scheduledDate", label: "Date" }]}
        records={collectionRecords}
        emptyMessage="No batches available."
      />
    ),
    incoming: (
      <CrudSection
        title="Incoming opportunities"
        description="Create and maintain the investment pipeline that feeds your portfolio."
        records={investmentRecords}
        fields={investmentFields}
        columns={[{ key: "type", label: "Type" }, { key: "amountLabel", label: "Amount" }, { key: "expectedReturn", label: "Expected %" }, { key: "status", label: "Status" }, { key: "investmentDate", label: "Opened" }, { key: "maturityDate", label: "Maturity" }]}
        emptyMessage="No incoming investment opportunities available."
        createLabel="Add opportunity"
        saveAction={upsertInvestmentAction}
        deleteAction={deleteInvestmentAction}
      />
    ),
    reports: (
      <>
        <DataTableSection
          title="Published and draft reports"
          description="Operational and municipal reporting available to investors."
          columns={[{ key: "title", label: "Title" }, { key: "type", label: "Type" }, { key: "period", label: "Period" }, { key: "status", label: "Status" }, { key: "generatedAt", label: "Generated" }, { key: "publishedAt", label: "Published" }]}
          records={reportRecords}
          emptyMessage="No reports available."
        />
        <DataTableSection
          title="Investor returns"
          description="Recorded return transactions attached to your account."
          columns={[{ key: "type", label: "Type" }, { key: "amountLabel", label: "Amount" }, { key: "description", label: "Description" }, { key: "status", label: "Status" }, { key: "createdAt", label: "Created" }]}
          records={transactionRecords}
          emptyMessage="No investor transactions available."
        />
      </>
    ),
  }[tab];

  return (
    <PortalShell title={`${config.title} - ${currentTab.label}`} description={config.description} accent={config.accent} tabs={tabs} currentTab={tab} stats={stats} user={{ ...user, name: user.name || "Investor User" }}>
      {content}
    </PortalShell>
  );
}
