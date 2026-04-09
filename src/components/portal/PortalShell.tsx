import Link from "next/link";
import SignOutButton from "./SignOutButton";

type PortalTab = {
  key: string;
  label: string;
  href: string;
};

type PortalStat = {
  label: string;
  value: string;
  help: string;
};

type PortalShellProps = {
  title: string;
  description: string;
  accent: "emerald" | "cyan" | "violet" | "slate" | "amber" | "blue";
  tabs: PortalTab[];
  currentTab: string;
  stats: PortalStat[];
  user: {
    name: string;
    email?: string | null;
    role: string;
  };
  actions?: React.ReactNode;
  children: React.ReactNode;
};

const accentClasses = {
  emerald: {
    pill: "bg-emerald-100 text-emerald-800",
    active: "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20",
    accent: "from-emerald-500 to-teal-500",
  },
  cyan: {
    pill: "bg-cyan-100 text-cyan-800",
    active: "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20",
    accent: "from-cyan-500 to-sky-500",
  },
  violet: {
    pill: "bg-violet-100 text-violet-800",
    active: "bg-violet-600 text-white shadow-lg shadow-violet-600/20",
    accent: "from-violet-500 to-fuchsia-500",
  },
  slate: {
    pill: "bg-slate-200 text-slate-800",
    active: "bg-slate-800 text-white shadow-lg shadow-slate-800/20",
    accent: "from-slate-700 to-slate-500",
  },
  amber: {
    pill: "bg-amber-100 text-amber-800",
    active: "bg-amber-600 text-white shadow-lg shadow-amber-600/20",
    accent: "from-amber-500 to-orange-500",
  },
  blue: {
    pill: "bg-blue-100 text-blue-800",
    active: "bg-blue-600 text-white shadow-lg shadow-blue-600/20",
    accent: "from-blue-500 to-indigo-500",
  },
} as const;

export default function PortalShell({
  title,
  description,
  accent,
  tabs,
  currentTab,
  stats,
  user,
  actions,
  children,
}: PortalShellProps) {
  const theme = accentClasses[accent];

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur lg:flex lg:flex-col">
          <Link href="/" className="group">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 transition-colors group-hover:border-slate-300 group-hover:bg-white">
              <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${theme.accent}`} />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  IsukuHub
                </p>
                <p className="text-sm font-semibold text-slate-900">Portal Home</p>
              </div>
            </div>
          </Link>

          <div className="mt-8 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Signed in
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  {user.name}
                </h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.pill}`}>
                {user.role}
              </span>
            </div>
            {user.email ? (
              <p className="mt-3 text-sm text-slate-600">{user.email}</p>
            ) : null}
          </div>

          <nav className="mt-8 space-y-2">
            {tabs.map((tab) => {
              const isActive = tab.key === currentTab;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? theme.active
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <SignOutButton />
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <section className="overflow-hidden rounded-[2.4rem] border border-white/70 bg-white/80 shadow-2xl shadow-slate-900/5 backdrop-blur">
            <div className={`bg-gradient-to-r ${theme.accent} px-6 py-10 text-white lg:px-10`}>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.26em] text-white/80">
                    Dynamic workspace
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
                    {title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm text-white/85 sm:text-base">
                    {description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`rounded-full px-4 py-2 text-sm font-semibold ${theme.pill}`}>
                    {user.role}
                  </div>
                  <div className="lg:hidden">
                    <SignOutButton />
                  </div>
                  {actions}
                </div>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 xl:grid-cols-4 lg:px-10">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{stat.help}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">{children}</section>
        </main>
      </div>
    </div>
  );
}
