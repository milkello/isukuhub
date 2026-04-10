export const dynamic = "force-dynamic";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import {
  ArrowRight,
  Building2,
  Factory,
  Home as HomeIcon,
  LayoutDashboard,
  Recycle,
  ShoppingCart,
  Truck,
  TrendingUp,
} from "lucide-react";
import SignOutButton from "@/components/portal/SignOutButton";
import { DEFAULT_ROLE_ROUTES, getDefaultRouteForRole } from "@/lib/constants";
import { ensureDemoData } from "@/lib/demo";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/session";


type PortalCard = {
  title: string;
  description: string;
  role: string;
  href: string;
  accent: string;
  icon: typeof HomeIcon;
};

function getProtectedHref(sessionRole: string | null | undefined, portal: PortalCard) {
  if (!sessionRole) {
    const params = new URLSearchParams({
      callbackUrl: portal.href,
      role: portal.role,
    });
    return `/auth?${params.toString()}`;
  }

  if (sessionRole === portal.role || (portal.href.startsWith("/landfill") && sessionRole === "AGENT")) {
    return portal.href;
  }

  return getDefaultRouteForRole(sessionRole);
}

export default async function HomePage() {
  await ensureDemoData();

  const session = await getServerAuthSession();
  const [userCount, collectionCount, materialCount, reportCount, recentCollections] =
    await Promise.all([
      prisma.user.count(),
      prisma.collection.count(),
      prisma.material.count(),
      prisma.report.count(),
      prisma.collection.findMany({
        include: {
          household: { select: { name: true } },
          agent: { select: { name: true } },
        },
        orderBy: { scheduledDate: "desc" },
        take: 5,
      }),
    ]);

  type RecentCollection = Prisma.CollectionGetPayload<{
    include: {
      household: { select: { name: true } };
      agent: { select: { name: true } };
    };
  }>;

  const cards: PortalCard[] = [
    {
      title: "Household Portal",
      description: "Request pickups, pay for service, and manage your household history.",
      role: "HOUSEHOLD",
      href: DEFAULT_ROLE_ROUTES.HOUSEHOLD,
      accent: "bg-emerald-100 text-emerald-700",
      icon: HomeIcon,
    },
    {
      title: "Agent Workspace",
      description: "Register households, manage routes, and update field collections.",
      role: "AGENT",
      href: DEFAULT_ROLE_ROUTES.AGENT,
      accent: "bg-blue-100 text-blue-700",
      icon: Truck,
    },
    {
      title: "Admin Control",
      description: "Coordinate the full operation with live users, payments, and analytics.",
      role: "ADMIN",
      href: DEFAULT_ROLE_ROUTES.ADMIN,
      accent: "bg-indigo-100 text-indigo-700",
      icon: LayoutDashboard,
    },
    {
      title: "Landfill Operations",
      description: "Capture incoming loads and align route execution with the field team.",
      role: "AGENT",
      href: "/landfill/operations",
      accent: "bg-amber-100 text-amber-700",
      icon: Factory,
    },
    {
      title: "Recycler Marketplace",
      description: "List materials, manage orders, and communicate with suppliers.",
      role: "RECYCLER",
      href: DEFAULT_ROLE_ROUTES.RECYCLER,
      accent: "bg-cyan-100 text-cyan-700",
      icon: ShoppingCart,
    },
    {
      title: "Government Oversight",
      description: "Monitor coverage, publish reports, and maintain compliance rules.",
      role: "GOVERNMENT",
      href: DEFAULT_ROLE_ROUTES.GOVERNMENT,
      accent: "bg-slate-200 text-slate-700",
      icon: Building2,
    },
    {
      title: "Investor Workspace",
      description: "Track performance, investment opportunities, and reporting.",
      role: "INVESTOR",
      href: DEFAULT_ROLE_ROUTES.INVESTOR,
      accent: "bg-violet-100 text-violet-700",
      icon: TrendingUp,
    },
  ];

  return (
    <main className="min-h-screen">
      <section className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 p-3 text-white">
              <Recycle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">IsukuHub</p>
              <p className="text-lg font-semibold text-slate-900">Dynamic waste platform</p>
            </div>
          </Link>

          {session?.user ? (
            <div className="flex items-center gap-3">
              <Link
                href={getDefaultRouteForRole(session.user.role)}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Open my portal
              </Link>
              <SignOutButton callbackUrl="/auth" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Sign in
              </Link>
              <Link
                href="/auth?mode=signup"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2.4rem] border border-white/70 bg-white/85 p-8 shadow-2xl shadow-slate-900/5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Live system</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold text-slate-900 sm:text-5xl">
              Every major role now opens a working, database-backed portal.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              This project now routes households, agents, recyclers, investors, administrators,
              government teams, and landfill operations into connected workspaces with live CRUD flows.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Users</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{userCount}</p>
              </div>
              <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Collections</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{collectionCount}</p>
              </div>
              <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Materials</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{materialCount}</p>
              </div>
              <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Reports</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{reportCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2.4rem] border border-white/70 bg-white/85 p-8 shadow-2xl shadow-slate-900/5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Recent activity</p>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">Latest collections</h2>
            <div className="mt-6 space-y-3">
              {recentCollections.map((collection: RecentCollection) => (
                <div
                  key={collection.id}
                  className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{collection.collectionId}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {collection.household?.name ?? "Unknown household"} with{" "}
                        {collection.agent?.name ?? "Unassigned agent"}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {collection.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            const href = getProtectedHref(session?.user?.role, card);

            return (
              <Link
                key={card.title}
                href={href}
                className="group rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/5 transition-all hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className={`inline-flex rounded-2xl p-3 ${card.accent}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  Open portal
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
