"use client";

import { startTransition, useDeferredValue, useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export type CrudField = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "textarea" | "select" | "date" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  disabledOnEdit?: boolean;
};

export type CrudColumn = {
  key: string;
  label: string;
};

export type CrudRecord = {
  id: string;
  [key: string]: unknown;
};

type CrudSectionProps = {
  title: string;
  description: string;
  records: CrudRecord[];
  fields: CrudField[];
  columns: CrudColumn[];
  emptyMessage: string;
  createLabel?: string;
  searchPlaceholder?: string;
  allowCreate?: boolean;
  allowEdit?: boolean;
  saveAction: (payload: Record<string, unknown>) => Promise<unknown>;
  deleteAction?: (id: string) => Promise<unknown>;
};

function getDefaultState(fields: CrudField[]) {
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    acc[field.name] = field.type === "checkbox" ? false : "";
    return acc;
  }, {});
}

function toSearchText(record: CrudRecord) {
  return Object.values(record)
    .map((value) => String(value ?? ""))
    .join(" ")
    .toLowerCase();
}

export default function CrudSection({
  title,
  description,
  records,
  fields,
  columns,
  emptyMessage,
  createLabel = "New Record",
  searchPlaceholder = "Search records",
  allowCreate = true,
  allowEdit = true,
  saveAction,
  deleteAction,
}: CrudSectionProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, unknown>>(
    getDefaultState(fields),
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startFormTransition] = useTransition();

  const filteredRecords = useMemo(() => {
    if (!deferredQuery.trim()) {
      return records;
    }

    const lowered = deferredQuery.trim().toLowerCase();
    return records.filter((record) => toSearchText(record).includes(lowered));
  }, [records, deferredQuery]);

  const openCreateForm = () => {
    setEditingId(null);
    setFormState(getDefaultState(fields));
    setFormOpen(true);
    setFeedback(null);
  };

  const openEditForm = (record: CrudRecord) => {
    setEditingId(record.id);
    setFormState(
      fields.reduce<Record<string, unknown>>((acc, field) => {
        acc[field.name] = record[field.name] ?? (field.type === "checkbox" ? false : "");
        return acc;
      }, {}),
    );
    setFormOpen(true);
    setFeedback(null);
  };

  const closeForm = (preserveFeedback = false) => {
    setEditingId(null);
    setFormState(getDefaultState(fields));
    setFormOpen(false);
    if (!preserveFeedback) {
      setFeedback(null);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    startFormTransition(async () => {
      try {
        const payload = editingId ? { ...formState, id: editingId } : formState;
        await saveAction(payload);
        setFeedback(editingId ? "Record updated." : "Record created.");
        closeForm(true);
        router.refresh();
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Request failed.");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!deleteAction) {
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      try {
        await deleteAction(id);
        setFeedback("Record deleted.");
        router.refresh();
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Delete failed.");
      }
    });
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Live data
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-3 text-sm text-slate-600">{description}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-slate-700 outline-none sm:w-56"
            />
          </label>
          {allowCreate ? (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              {createLabel}
            </button>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {feedback}
        </div>
      ) : null}

      {formOpen ? (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => {
              const type = field.type ?? "text";
              const value = formState[field.name];
              const disabled = Boolean(editingId && field.disabledOnEdit);

              if (type === "textarea") {
                return (
                  <label key={field.name} className="md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      {field.label}
                    </span>
                    <textarea
                      required={field.required}
                      disabled={disabled}
                      value={String(value ?? "")}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400"
                    />
                  </label>
                );
              }

              if (type === "select") {
                return (
                  <label key={field.name}>
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      {field.label}
                    </span>
                    <select
                      required={field.required}
                      disabled={disabled}
                      value={String(value ?? "")}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              }

              if (type === "checkbox") {
                return (
                  <label
                    key={field.name}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          [field.name]: event.target.checked,
                        }))
                      }
                    />
                    {field.label}
                  </label>
                );
              }

              return (
                <label key={field.name}>
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    {field.label}
                  </span>
                  <input
                    required={field.required}
                    disabled={disabled}
                    type={type}
                    value={String(value ?? "")}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        [field.name]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400"
                  />
                </label>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Saving..." : editingId ? "Save changes" : "Create record"}
            </button>
            <button
              type="button"
              onClick={() => closeForm()}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-slate-200">
        {filteredRecords.length === 0 ? (
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
                  {allowEdit || deleteAction ? (
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    {columns.map((column) => (
                      <td key={`${record.id}-${column.key}`} className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {String(record[column.key] ?? "-")}
                      </td>
                    ))}
                    {allowEdit || deleteAction ? (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {allowEdit ? (
                            <button
                              type="button"
                              onClick={() => openEditForm(record)}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          ) : null}
                          {deleteAction ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(record.id)}
                              className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
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
