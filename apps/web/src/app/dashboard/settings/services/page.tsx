"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";

type Service = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMin: number | null;
  isPromo: boolean;
  isActive: boolean;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  services: Service[];
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ServicesSettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Add category form
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatSort, setNewCatSort] = useState<number>(0);

  // Add service per-category state. Keyed by categoryId.
  const [draftService, setDraftService] = useState<
    Record<string, { name: string; priceAzn: string; durationMin: string }>
  >({});

  const load = useCallback(() => {
    void api<Category[]>("/catalog/categories")
      .then(setCategories)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sortedCats = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  async function addCategory() {
    if (!newCatName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api("/catalog/categories", {
        method: "POST",
        json: {
          name: newCatName.trim(),
          slug: (newCatSlug.trim() || slugify(newCatName)).slice(0, 60),
          sortOrder: Number(newCatSort) || 0,
        },
      });
      setNewCatName("");
      setNewCatSlug("");
      setNewCatSort(0);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add category");
    } finally {
      setBusy(false);
    }
  }

  async function updateCategory(id: string, patch: Partial<Category>) {
    setBusy(true);
    setError(null);
    try {
      await api(`/catalog/categories/${id}`, { method: "PATCH", json: patch });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update category");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? Only allowed if it has no active services.")) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/catalog/categories/${id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete category");
    } finally {
      setBusy(false);
    }
  }

  async function addService(categoryId: string) {
    const draft = draftService[categoryId];
    if (!draft || !draft.name.trim()) return;
    const priceCents = Math.round(Number(draft.priceAzn || "0") * 100);
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      setError("Price must be a non-negative number.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/catalog/services", {
        method: "POST",
        json: {
          categoryId,
          name: draft.name.trim(),
          priceCents,
          durationMin: draft.durationMin ? Number(draft.durationMin) : undefined,
        },
      });
      setDraftService((s) => ({
        ...s,
        [categoryId]: { name: "", priceAzn: "", durationMin: "" },
      }));
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add service");
    } finally {
      setBusy(false);
    }
  }

  async function updateService(id: string, patch: Partial<Service>) {
    setBusy(true);
    setError(null);
    try {
      await api(`/catalog/services/${id}`, { method: "PATCH", json: patch });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update service");
    } finally {
      setBusy(false);
    }
  }

  async function archiveService(id: string) {
    if (!confirm("Archive this service? It will be hidden from new orders but kept in history.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api(`/catalog/services/${id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to archive service");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Polishing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={newCatSlug}
                onChange={(e) => setNewCatSlug(e.target.value)}
                placeholder={newCatName ? slugify(newCatName) : "polishing"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-sort">Sort</Label>
              <Input
                id="cat-sort"
                type="number"
                min={0}
                value={newCatSort}
                onChange={(e) => setNewCatSort(Number(e.target.value))}
              />
            </div>
            <Button type="button" onClick={() => void addCategory()} disabled={busy || !newCatName}>
              Add category
            </Button>
          </div>
        </CardContent>
      </Card>

      {sortedCats.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            No categories yet. Create your first one above.
          </CardContent>
        </Card>
      ) : null}

      {sortedCats.map((cat) => (
        <Card key={cat.id}>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <CardTitle className="text-base">
                <CategoryNameEditor cat={cat} onSave={(name) => void updateCategory(cat.id, { name })} />
              </CardTitle>
              <span className="text-xs text-zinc-500 font-mono">{cat.slug}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`sort-${cat.id}`} className="text-xs text-zinc-500">
                Sort
              </Label>
              <Input
                id={`sort-${cat.id}`}
                type="number"
                className="w-20"
                defaultValue={cat.sortOrder}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v !== cat.sortOrder) void updateCategory(cat.id, { sortOrder: v });
                }}
              />
              <Button
                variant="destructive"
                size="sm"
                disabled={busy || cat.services.length > 0}
                onClick={() => void deleteCategory(cat.id)}
                title={cat.services.length > 0 ? "Archive all services first" : "Delete category"}
              >
                Delete
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Service</TableHead>
                  <TableHead className="text-right">Price (AZN)</TableHead>
                  <TableHead className="text-right">Duration (min)</TableHead>
                  <TableHead className="text-center">Promo</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cat.services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-zinc-500 py-6">
                      No services in this category.
                    </TableCell>
                  </TableRow>
                ) : (
                  cat.services.map((svc) => (
                    <ServiceRow
                      key={svc.id}
                      service={svc}
                      busy={busy}
                      onUpdate={(patch) => void updateService(svc.id, patch)}
                      onArchive={() => void archiveService(svc.id)}
                    />
                  ))
                )}
              </TableBody>
            </Table>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Add service</p>
              <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor={`svc-name-${cat.id}`}>Name</Label>
                  <Input
                    id={`svc-name-${cat.id}`}
                    value={draftService[cat.id]?.name ?? ""}
                    onChange={(e) =>
                      setDraftService((s) => ({
                        ...s,
                        [cat.id]: {
                          name: e.target.value,
                          priceAzn: s[cat.id]?.priceAzn ?? "",
                          durationMin: s[cat.id]?.durationMin ?? "",
                        },
                      }))
                    }
                    placeholder="e.g. Premium Wash"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`svc-price-${cat.id}`}>Price (AZN)</Label>
                  <Input
                    id={`svc-price-${cat.id}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={draftService[cat.id]?.priceAzn ?? ""}
                    onChange={(e) =>
                      setDraftService((s) => ({
                        ...s,
                        [cat.id]: {
                          name: s[cat.id]?.name ?? "",
                          priceAzn: e.target.value,
                          durationMin: s[cat.id]?.durationMin ?? "",
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`svc-dur-${cat.id}`}>Duration (min)</Label>
                  <Input
                    id={`svc-dur-${cat.id}`}
                    type="number"
                    min={0}
                    value={draftService[cat.id]?.durationMin ?? ""}
                    onChange={(e) =>
                      setDraftService((s) => ({
                        ...s,
                        [cat.id]: {
                          name: s[cat.id]?.name ?? "",
                          priceAzn: s[cat.id]?.priceAzn ?? "",
                          durationMin: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy || !(draftService[cat.id]?.name?.trim())}
                  onClick={() => void addService(cat.id)}
                >
                  Add service
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CategoryNameEditor({
  cat,
  onSave,
}: {
  cat: Category;
  onSave: (name: string) => void;
}) {
  const [value, setValue] = useState(cat.name);
  const [editing, setEditing] = useState(false);
  useEffect(() => setValue(cat.name), [cat.name]);

  if (!editing) {
    return (
      <button
        type="button"
        className="text-left hover:underline underline-offset-4 decoration-dotted"
        onClick={() => setEditing(true)}
      >
        {cat.name}
      </button>
    );
  }
  return (
    <Input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (value.trim() && value !== cat.name) onSave(value.trim());
        else setValue(cat.name);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setValue(cat.name);
          setEditing(false);
        }
      }}
      className="h-8 max-w-xs"
    />
  );
}

function ServiceRow({
  service,
  busy,
  onUpdate,
  onArchive,
}: {
  service: Service;
  busy: boolean;
  onUpdate: (patch: Partial<Service> & { priceCents?: number }) => void;
  onArchive: () => void;
}) {
  const [name, setName] = useState(service.name);
  const [priceAzn, setPriceAzn] = useState((service.priceCents / 100).toFixed(2));
  const [durationMin, setDurationMin] = useState(service.durationMin?.toString() ?? "");

  useEffect(() => setName(service.name), [service.name]);
  useEffect(() => setPriceAzn((service.priceCents / 100).toFixed(2)), [service.priceCents]);
  useEffect(
    () => setDurationMin(service.durationMin?.toString() ?? ""),
    [service.durationMin],
  );

  return (
    <TableRow>
      <TableCell>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            const next = name.trim();
            if (next && next !== service.name) onUpdate({ name: next });
            else setName(service.name);
          }}
          className="h-8"
        />
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={priceAzn}
          onChange={(e) => setPriceAzn(e.target.value)}
          onBlur={() => {
            const cents = Math.round(Number(priceAzn) * 100);
            if (Number.isFinite(cents) && cents >= 0 && cents !== service.priceCents) {
              onUpdate({ priceCents: cents });
            } else {
              setPriceAzn((service.priceCents / 100).toFixed(2));
            }
          }}
          className="h-8 text-right tabular-nums"
        />
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          min={0}
          value={durationMin}
          onChange={(e) => setDurationMin(e.target.value)}
          onBlur={() => {
            const v = durationMin === "" ? null : Number(durationMin);
            if (v === null && service.durationMin !== null) onUpdate({ durationMin: undefined });
            else if (typeof v === "number" && v !== service.durationMin) onUpdate({ durationMin: v });
          }}
          className="h-8 text-right tabular-nums"
        />
      </TableCell>
      <TableCell className="text-center">
        <input
          type="checkbox"
          checked={service.isPromo}
          disabled={busy}
          onChange={(e) => onUpdate({ isPromo: e.target.checked })}
          className="h-4 w-4 accent-zinc-900 dark:accent-white"
        />
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" disabled={busy} onClick={onArchive}>
          Archive
        </Button>
      </TableCell>
    </TableRow>
  );
}
