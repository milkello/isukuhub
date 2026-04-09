type DataColumn = {
  key: string;
  label: string;
};

type DataRecord = {
  id: string;
  [key: string]: unknown;
};

type DataTableSectionProps = {
  title: string;
  description: string;
  columns: DataColumn[];
  records: DataRecord[];
  emptyMessage: string;
};

export default function DataTableSection({
  title,
  description,
  columns,
  records,
  emptyMessage,
}: DataTableSectionProps) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur lg:p-8">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
          Live data
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-slate-200">
        {records.length === 0 ? (
          <div className="bg-white px-6 py-14 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-4 py-3 font-medium">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    {columns.map((column) => (
                      <td
                        key={`${record.id}-${column.key}`}
                        className="whitespace-nowrap px-4 py-3 text-slate-700"
                      >
                        {String(record[column.key] ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
