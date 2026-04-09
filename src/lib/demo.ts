import { prisma } from "./prisma";
import { DEMO_PASSWORD } from "./constants";
import { createManagedUser, updateManagedUser } from "./user-management";

declare global {
  var __isukuDemoSeeded: boolean | undefined;
  var __isukuDemoPromise: Promise<void> | undefined;
}

type DemoUserSeed = {
  email: string;
  name: string;
  role: string;
  address?: string;
  phone?: string;
  householdSize?: number;
  subscriptionPlan?: string;
  billingCycle?: string;
  employeeId?: string;
  department?: string;
  vehicleType?: string;
  licensePlate?: string;
  companyName?: string;
  registrationNumber?: string;
  contactPerson?: string;
  businessType?: string;
  capacity?: number;
  investorType?: string;
  investmentFocus?: string;
  portfolioSize?: number;
  riskTolerance?: string;
  position?: string;
  jurisdiction?: string;
  accessLevel?: string;
};

const day = 24 * 60 * 60 * 1000;

function daysFromNow(offset: number) {
  return new Date(Date.now() + offset * day);
}

const demoUsers: DemoUserSeed[] = [
  { email: "admin@waste.com", name: "Admin User", role: "ADMIN", phone: "+27 82 100 0001" },
  {
    email: "agent@waste.com",
    name: "Agent User",
    role: "AGENT",
    employeeId: "EMP-1001",
    department: "Collections",
    vehicleType: "Compactor Truck",
    licensePlate: "ISU-AG1",
    phone: "+27 82 100 0002",
  },
  {
    email: "household@waste.com",
    name: "Household User",
    role: "HOUSEHOLD",
    address: "12 Green Street, Central District",
    phone: "+27 82 100 0003",
    householdSize: 4,
    subscriptionPlan: "PREMIUM",
    billingCycle: "MONTHLY",
  },
  {
    email: "recycler@waste.com",
    name: "Recycler User",
    role: "RECYCLER",
    companyName: "RecycleHub Metals",
    registrationNumber: "REG-3001",
    contactPerson: "Recycler User",
    businessType: "Materials Recovery",
    capacity: 1200,
    phone: "+27 82 100 0004",
  },
  {
    email: "investor@waste.com",
    name: "Investor User",
    role: "INVESTOR",
    investorType: "INSTITUTIONAL",
    investmentFocus: "Circular economy infrastructure",
    portfolioSize: 250000,
    riskTolerance: "MEDIUM",
    phone: "+27 82 100 0005",
  },
  {
    email: "government@waste.com",
    name: "Government User",
    role: "GOVERNMENT",
    department: "Environmental Services",
    position: "Regional Officer",
    jurisdiction: "Central District",
    accessLevel: "ADMIN",
    phone: "+27 82 100 0006",
  },
  {
    email: "olive.family@waste.com",
    name: "Olive Family",
    role: "HOUSEHOLD",
    address: "44 Park Lane, North District",
    phone: "+27 82 200 0001",
    householdSize: 3,
    subscriptionPlan: "BASIC",
    billingCycle: "MONTHLY",
  },
  {
    email: "dlamini.home@waste.com",
    name: "Dlamini Household",
    role: "HOUSEHOLD",
    address: "88 Market Road, West District",
    phone: "+27 82 200 0002",
    householdSize: 5,
    subscriptionPlan: "PREMIUM",
    billingCycle: "MONTHLY",
  },
  {
    email: "backup.agent@waste.com",
    name: "Backup Agent",
    role: "AGENT",
    employeeId: "EMP-1002",
    department: "Collections",
    vehicleType: "Route Van",
    licensePlate: "ISU-AG2",
    phone: "+27 82 200 0003",
  },
  {
    email: "eco.loop@waste.com",
    name: "Eco Loop Processing",
    role: "RECYCLER",
    companyName: "Eco Loop Processing",
    registrationNumber: "REG-3002",
    contactPerson: "Eco Loop Processing",
    businessType: "Plastic and organics",
    capacity: 900,
    phone: "+27 82 200 0004",
  },
];

async function seedUsers() {
  for (const user of demoUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existing) {
      await updateManagedUser(existing.id, {
        ...user,
        password: DEMO_PASSWORD,
        isActive: true,
      });
      continue;
    }

    await createManagedUser({
      ...user,
      password: DEMO_PASSWORD,
      isActive: true,
    });
  }
}

async function seedCollectionsAndRoutes() {
  const [collectionsCount, routesCount] = await Promise.all([
    prisma.collection.count(),
    prisma.route.count(),
  ]);

  const households = await prisma.user.findMany({
    where: { role: "HOUSEHOLD" },
    orderBy: { email: "asc" },
  });

  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    orderBy: { email: "asc" },
    include: { agentProfile: true },
  });

  if (collectionsCount === 0 && households.length > 0 && agents.length > 0) {
    const collectionSeeds = [
      {
        collectionId: "COL-1001",
        householdId: households[0].id,
        agentId: agents[0].id,
        wasteType: "GENERAL_WASTE",
        weight: 18.4,
        status: "COMPLETED",
        scheduledDate: daysFromNow(-4),
        completedDate: daysFromNow(-4),
        notes: "Collected on schedule",
        location: "Central District",
      },
      {
        collectionId: "COL-1002",
        householdId: households[1]?.id ?? households[0].id,
        agentId: agents[0].id,
        wasteType: "RECYCLABLE",
        weight: 9.8,
        status: "SCHEDULED",
        scheduledDate: daysFromNow(1),
        notes: "Recycling pickup booked from household portal",
        location: "North District",
      },
      {
        collectionId: "COL-1003",
        householdId: households[2]?.id ?? households[0].id,
        agentId: agents[1]?.id ?? agents[0].id,
        wasteType: "ORGANIC",
        weight: 12.1,
        status: "IN_PROGRESS",
        scheduledDate: daysFromNow(0),
        notes: "Organic pickup assigned to backup route",
        location: "West District",
      },
      {
        collectionId: "COL-1004",
        householdId: households[0].id,
        agentId: agents[1]?.id ?? agents[0].id,
        wasteType: "HAZARDOUS",
        weight: 4.3,
        status: "SCHEDULED",
        scheduledDate: daysFromNow(3),
        notes: "Special handling required",
        location: "Central District",
      },
      {
        collectionId: "COL-1005",
        householdId: households[1]?.id ?? households[0].id,
        agentId: agents[0].id,
        wasteType: "ELECTRONIC",
        weight: 6.5,
        status: "COMPLETED",
        scheduledDate: daysFromNow(-7),
        completedDate: daysFromNow(-7),
        notes: "E-waste batch sent to recycler",
        location: "North District",
      },
    ];

    for (const item of collectionSeeds) {
      await prisma.collection.create({ data: item });
    }
  }

  if (routesCount === 0) {
    const agentProfiles = agents
      .map((agent: (typeof agents)[number]) => agent.agentProfile)
      .filter(Boolean);

    for (const [index, profile] of agentProfiles.entries()) {
      await prisma.route.create({
        data: {
          agentId: profile!.id,
          name: `District Route ${index + 1}`,
          description: "Optimized morning pickup route",
          waypoints: JSON.stringify([
            "Central District",
            "North District",
            "West District",
          ]),
          distance: 24 + index * 6,
          estimatedTime: 180 + index * 25,
          status: index === 0 ? "ACTIVE" : "PLANNED",
          plannedDate: daysFromNow(index),
        },
      });
    }
  }
}

async function seedMaterials() {
  const materialsCount = await prisma.material.count();
  if (materialsCount > 0) {
    return;
  }

  const recyclers = await prisma.user.findMany({
    where: { role: "RECYCLER" },
    orderBy: { email: "asc" },
  });

  if (recyclers.length === 0) {
    return;
  }

  const materials = [
    {
      recyclerId: recyclers[0].id,
      name: "PET Bottles",
      category: "PLASTIC",
      description: "Clean and compressed PET bottles",
      pricePerKg: 0.48,
      availableWeight: 2400,
      quality: "PREMIUM",
      location: "North District Yard",
    },
    {
      recyclerId: recyclers[0].id,
      name: "Cardboard Bales",
      category: "PAPER",
      description: "Bundled cardboard ready for purchase",
      pricePerKg: 0.18,
      availableWeight: 3100,
      quality: "STANDARD",
      location: "Central Transfer Hub",
    },
    {
      recyclerId: recyclers[1]?.id ?? recyclers[0].id,
      name: "Compost Feedstock",
      category: "ORGANIC",
      description: "Sorted organic waste prepared for composting",
      pricePerKg: 0.11,
      availableWeight: 5200,
      quality: "EXCELLENT",
      location: "West District Organics Site",
    },
    {
      recyclerId: recyclers[1]?.id ?? recyclers[0].id,
      name: "Aluminium Cans",
      category: "METAL",
      description: "Crushed aluminium cans in sealed bags",
      pricePerKg: 1.24,
      availableWeight: 980,
      quality: "PREMIUM",
      location: "Industrial Processing Yard",
    },
  ];

  for (const material of materials) {
    await prisma.material.create({ data: material });
  }
}

async function seedTransactions() {
  const transactionsCount = await prisma.transaction.count();
  if (transactionsCount > 0) {
    return;
  }

  const [household, recycler, investor] = await Promise.all([
    prisma.user.findFirst({ where: { role: "HOUSEHOLD" }, orderBy: { email: "asc" } }),
    prisma.user.findFirst({ where: { role: "RECYCLER" }, orderBy: { email: "asc" } }),
    prisma.user.findFirst({ where: { role: "INVESTOR" }, orderBy: { email: "asc" } }),
  ]);

  const collection = await prisma.collection.findFirst({
    where: { status: "COMPLETED" },
    orderBy: { scheduledDate: "asc" },
  });

  const transactions = [
    household && {
      userId: household.id,
      type: "SUBSCRIPTION",
      amount: 18,
      currency: "USD",
      description: "Monthly premium household subscription",
      referenceId: null,
      status: "COMPLETED",
    },
    household &&
      collection && {
        userId: household.id,
        type: "COLLECTION_FEE",
        amount: 6.5,
        currency: "USD",
        description: `Collection fee for ${collection.collectionId}`,
        referenceId: collection.id,
        status: "COMPLETED",
      },
    recycler && {
      userId: recycler.id,
      type: "MATERIAL_SALE",
      amount: 1150,
      currency: "USD",
      description: "Marketplace sale of sorted PET bottles",
      referenceId: null,
      status: "COMPLETED",
    },
    recycler && {
      userId: recycler.id,
      type: "MATERIAL_PURCHASE",
      amount: 640,
      currency: "USD",
      description: "Supplier order for cardboard bales",
      referenceId: null,
      status: "PENDING",
    },
    investor && {
      userId: investor.id,
      type: "INVESTMENT_RETURN",
      amount: 4200,
      currency: "USD",
      description: "Quarterly return from district recycling expansion",
      referenceId: null,
      status: "COMPLETED",
    },
  ].filter(Boolean) as Array<{
    userId: string;
    type: string;
    amount: number;
    currency: string;
    description: string;
    referenceId: string | null;
    status: string;
  }>;

  for (const transaction of transactions) {
    await prisma.transaction.create({ data: transaction });
  }
}

async function seedReportsAndRegulations() {
  const [reportsCount, regulationsCount] = await Promise.all([
    prisma.report.count(),
    prisma.regulation.count(),
  ]);

  const government = await prisma.user.findFirst({
    where: { role: "GOVERNMENT" },
    orderBy: { email: "asc" },
  });

  if (!government) {
    return;
  }

  if (reportsCount === 0) {
    const reports = [
      {
        governmentId: government.id,
        title: "Quarterly Waste Diversion Report",
        type: "RECYCLING_RATE",
        content: "Recycling rate improved across three districts.",
        period: "Q1 2026",
        status: "PUBLISHED",
        publishedAt: daysFromNow(-8),
      },
      {
        governmentId: government.id,
        title: "Collection Coverage Snapshot",
        type: "COLLECTION_STATS",
        content: "Coverage remains above ninety percent in core zones.",
        period: "March 2026",
        status: "APPROVED",
      },
    ];

    for (const report of reports) {
      await prisma.report.create({ data: report });
    }
  }

  if (regulationsCount === 0) {
    const regulations = [
      {
        governmentId: government.id,
        title: "Segregation at Source Standard",
        description: "Households must separate recyclables from general waste.",
        type: "WASTE_MANAGEMENT",
        requirements: "Use dedicated bins for dry recyclables and organics.",
        penalties: "Warnings followed by escalating fines.",
        effectiveDate: daysFromNow(-30),
        status: "ACTIVE",
      },
      {
        governmentId: government.id,
        title: "Recycler Material Traceability Rule",
        description: "Recyclers must maintain source and destination records.",
        type: "RECYCLING",
        requirements: "Maintain auditable batch and invoice records for 24 months.",
        penalties: "License review for repeated non-compliance.",
        effectiveDate: daysFromNow(-14),
        status: "ACTIVE",
      },
    ];

    for (const regulation of regulations) {
      await prisma.regulation.create({ data: regulation });
    }
  }
}

async function seedInvestments() {
  const investmentsCount = await prisma.investment.count();
  if (investmentsCount > 0) {
    return;
  }

  const investor = await prisma.user.findFirst({
    where: { role: "INVESTOR" },
    orderBy: { email: "asc" },
  });

  if (!investor) {
    return;
  }

  const investments = [
    {
      investorId: investor.id,
      type: "DIRECT",
      amount: 50000,
      currency: "USD",
      expectedReturn: 12.5,
      actualReturn: 10.2,
      status: "ACTIVE",
      investmentDate: daysFromNow(-90),
      maturityDate: daysFromNow(275),
      notes: "North district recycling expansion",
    },
    {
      investorId: investor.id,
      type: "FUND",
      amount: 125000,
      currency: "USD",
      expectedReturn: 16.4,
      actualReturn: null,
      status: "ACTIVE",
      investmentDate: daysFromNow(-40),
      maturityDate: daysFromNow(320),
      notes: "Circular economy blended fund",
    },
  ];

  for (const investment of investments) {
    await prisma.investment.create({ data: investment });
  }
}

async function seedNotifications() {
  const notificationsCount = await prisma.notification.count();
  if (notificationsCount > 0) {
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "AGENT", "HOUSEHOLD", "RECYCLER", "INVESTOR", "GOVERNMENT"],
      },
    },
    orderBy: { email: "asc" },
  });

  const notifications = users.map((user: (typeof users)[number], index: number) => ({
    userId: user.id,
    title: "Portal update ready",
    message: `Your ${user.role.toLowerCase()} workspace has fresh data and available actions.`,
    type: index % 2 === 0 ? "SYSTEM_UPDATE" : "ALERT",
    isRead: index % 3 === 0,
    data: null,
  }));

  for (const notification of notifications) {
    await prisma.notification.create({ data: notification });
  }
}

async function seedAuditLogs() {
  const auditCount = await prisma.auditLog.count();
  if (auditCount > 0) {
    return;
  }

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { email: "asc" },
  });

  if (!admin) {
    return;
  }

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "SEED_DEMO",
      resource: "system",
      details: "Demo data initialized for portal activation.",
      ipAddress: "127.0.0.1",
      userAgent: "Codex Desktop",
    },
  });
}

async function runSeed() {
  await seedUsers();
  await seedCollectionsAndRoutes();
  await seedMaterials();
  await seedTransactions();
  await seedReportsAndRegulations();
  await seedInvestments();
  await seedNotifications();
  await seedAuditLogs();
  global.__isukuDemoSeeded = true;
}

export async function ensureDemoData() {
  if (global.__isukuDemoSeeded) {
    return;
  }

  if (!global.__isukuDemoPromise) {
    global.__isukuDemoPromise = runSeed().catch((error) => {
      global.__isukuDemoPromise = undefined;
      throw error;
    });
  }

  await global.__isukuDemoPromise;
}

export async function getDemoSummary() {
  await ensureDemoData();

  const [
    users,
    collections,
    materials,
    transactions,
    reports,
    regulations,
    investments,
    routes,
    notifications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.collection.count(),
    prisma.material.count(),
    prisma.transaction.count(),
    prisma.report.count(),
    prisma.regulation.count(),
    prisma.investment.count(),
    prisma.route.count(),
    prisma.notification.count(),
  ]);

  return {
    password: DEMO_PASSWORD,
    counts: {
      users,
      collections,
      materials,
      transactions,
      reports,
      regulations,
      investments,
      routes,
      notifications,
    },
  };
}
