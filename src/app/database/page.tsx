import { dbInterface } from "@/lib/database";

export const dynamic = "force-dynamic";

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default async function DatabaseViewerPage() {
  const tableData = await dbInterface.getAllTableData();
  const tableEntries = Object.entries(tableData);

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Database Viewer</h1>
          <p className="mt-2 text-sm text-slate-600">
            Showing all tables and all rows currently available in your SQLite database.
          </p>
        </div>

        {tableEntries.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            No tables found.
          </div>
        ) : (
          tableEntries.map(([tableName, rows]) => {
            const columns = rows.length > 0 ? Object.keys(rows[0] as Record<string, unknown>) : [];
            return (
              <section key={tableName} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">{tableName}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {rows.length} row{rows.length === 1 ? "" : "s"}
                  </span>
                </div>

                {rows.length === 0 ? (
                  <div className="px-6 py-4 text-sm text-slate-500">No data in this table.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          {columns.map((column) => (
                            <th key={column} className="whitespace-nowrap px-4 py-3 font-medium">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((row, index) => {
                          const typedRow = row as Record<string, unknown>;
                          return (
                            <tr key={`${tableName}-${index}`} className="hover:bg-slate-50">
                              {columns.map((column) => (
                                <td key={`${tableName}-${index}-${column}`} className="whitespace-nowrap px-4 py-3 text-slate-700">
                                  {formatCellValue(typedRow[column])}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}
