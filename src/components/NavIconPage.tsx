type NavIconPageProps = {
  section: string;
  title: string;
  description: string;
  backHref: string;
};

export default function NavIconPage({
  section,
  title,
  description,
  backHref,
}: NavIconPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {section}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{title}</h1>
        <p className="mt-4 text-slate-600">{description}</p>

        <a
          href={backHref}
          className="mt-8 inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Back to {section}
        </a>
      </div>
    </main>
  );
}
