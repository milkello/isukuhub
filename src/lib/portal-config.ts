export const portalConfigs = {
  admin: {
    title: "Admin Control Center",
    description:
      "Operational oversight for users, routes, collections, payments, and system health.",
    accent: "emerald",
    tabs: [
      { key: "dashboard", label: "Dashboard" },
      { key: "households", label: "Households" },
      { key: "agents", label: "Agents" },
      { key: "routes", label: "Routes" },
      { key: "payments", label: "Payments" },
      { key: "analytics", label: "Analytics" },
      { key: "settings", label: "Settings" },
    ],
  },
  recycler: {
    title: "Recycler Marketplace",
    description:
      "Manage listed materials, orders, invoices, supplier relationships, and buyer messages.",
    accent: "cyan",
    tabs: [
      { key: "marketplace", label: "Marketplace" },
      { key: "orders", label: "Orders" },
      { key: "suppliers", label: "Suppliers" },
      { key: "invoices", label: "Invoices" },
      { key: "messages", label: "Messages" },
    ],
  },
  investor: {
    title: "Investor Workspace",
    description:
      "Track landfill performance, investment positions, incoming opportunities, and reporting.",
    accent: "violet",
    tabs: [
      { key: "landfill-ops", label: "Landfill Ops" },
      { key: "batches", label: "Batches" },
      { key: "incoming", label: "Incoming" },
      { key: "reports", label: "Reports" },
    ],
  },
  government: {
    title: "Government Oversight",
    description:
      "Review district coverage, analytics, compliance rules, reports, and stakeholder activity.",
    accent: "slate",
    tabs: [
      { key: "overview", label: "Overview" },
      { key: "analytics", label: "Analytics" },
      { key: "coverage-map", label: "Coverage Map" },
      { key: "reports", label: "Reports" },
      { key: "compliance", label: "Compliance" },
      { key: "stakeholders", label: "Stakeholders" },
    ],
  },
  landfill: {
    title: "Landfill Operations",
    description:
      "Record waste intake, monitor active batches, manage incoming loads, and publish reports.",
    accent: "amber",
    tabs: [
      { key: "operations", label: "Operations" },
      { key: "batches", label: "Batches" },
      { key: "incoming", label: "Incoming" },
      { key: "reports", label: "Reports" },
    ],
  },
} as const;

export type PortalConfigKey = keyof typeof portalConfigs;
