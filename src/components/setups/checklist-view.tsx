"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { resetChecklist, setItemChecked } from "@/actions/checklist";
import { Button } from "@/components/ui/button";
import { MOUNT_POINT_LABELS } from "@/db/schema";
import type { ItemWithProduct, SetupDetail } from "@/db/queries";
import { track } from "@/lib/analytics";
import { formatWeight } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ChecklistView({ detail }: { detail: SetupDetail }) {
  const { setup, bags, items } = detail;
  const [, startTransition] = useTransition();
  const [optimisticItems, applyOptimistic] = useOptimistic(
    items,
    (state, patch: { itemId: number | "all"; checked: boolean }) =>
      state.map((i) =>
        patch.itemId === "all" || i.id === patch.itemId
          ? { ...i, checked: patch.checked }
          : i,
      ),
  );

  const total = optimisticItems.length;
  const done = optimisticItems.filter((i) => i.checked).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  function toggle(item: ItemWithProduct) {
    const checked = !item.checked;
    startTransition(async () => {
      applyOptimistic({ itemId: item.id, checked });
      await setItemChecked(setup.id, item.id, checked);
      if (checked && done + 1 === total) track("checklist_completed", { setup: setup.name });
    });
  }

  function reset() {
    startTransition(async () => {
      applyOptimistic({ itemId: "all", checked: false });
      await resetChecklist(setup.id);
      track("checklist_reset");
    });
  }

  const sections: { bagId: number | null; title: string; subtitle?: string }[] = [
    ...bags.map((b) => ({
      bagId: b.id as number | null,
      title: b.product.name,
      subtitle: MOUNT_POINT_LABELS[b.mountPoint],
    })),
    { bagId: null, title: "On bike / on body" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/setups/${setup.id}`}
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-accent"
          >
            ← {setup.name}
          </Link>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            Packing checklist
          </h1>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} disabled={done === 0}>
          Reset all
        </Button>
      </div>

      {/* Progress */}
      <div className="rounded-lg border border-line bg-surface px-4 py-3">
        <div className="flex items-baseline justify-between">
          <span className="spec-label">Progress</span>
          <span className="font-mono text-sm">
            <span className={cn("font-semibold", pct === 100 ? "text-success" : "text-accent-hover")}>
              {done}
            </span>
            <span className="text-muted"> / {total} packed</span>
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line/70">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              pct === 100 ? "bg-success" : "bg-accent",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct === 100 && total > 0 ? (
          <p className="mt-2 text-sm font-medium text-success">
            All packed — have a great ride! 🚲
          </p>
        ) : null}
      </div>

      {/* Sections */}
      {sections.map((section) => {
        const sectionItems = optimisticItems.filter((i) => i.bagId === section.bagId);
        if (sectionItems.length === 0) return null;
        return (
          <section key={section.bagId ?? "loose"}>
            <header className="mb-2 flex items-baseline gap-2">
              <h2 className="font-display text-[15px] font-medium">{section.title}</h2>
              {section.subtitle ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                  {section.subtitle}
                </span>
              ) : null}
            </header>
            <ul className="overflow-hidden rounded-lg border border-line bg-surface">
              {sectionItems.map((item, i) => (
                <li key={item.id} className={i > 0 ? "border-t border-line" : undefined}>
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-line/30"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded border transition-all",
                        item.checked
                          ? "border-success bg-success text-white"
                          : "border-line-strong bg-surface",
                      )}
                    >
                      {item.checked ? (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-[15px] transition-all",
                        item.checked && "text-faint line-through",
                      )}
                    >
                      {item.product.name}
                      {item.quantity > 1 ? (
                        <span className="ml-1.5 font-mono text-xs text-accent-hover">
                          ×{item.quantity}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted">
                      {item.product.weightGrams != null
                        ? formatWeight(item.product.weightGrams * item.quantity)
                        : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line-strong py-14 text-center">
          <p className="text-sm text-muted">Nothing to pack yet.</p>
          <Link href={`/setups/${setup.id}`} className="text-sm text-accent underline">
            Add gear in the configurator
          </Link>
        </div>
      ) : null}
    </div>
  );
}
