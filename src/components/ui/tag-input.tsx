"use client";

import { useId, useState } from "react";

const controlClass =
  "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm outline-none transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20";

export function TagInput({
  defaultTags = [],
  suggestions = [],
  name = "tags",
  placeholder = "Add tag…",
}: {
  defaultTags?: string[];
  suggestions?: string[];
  name?: string;
  placeholder?: string;
}) {
  const [tags, setTags] = useState<string[]>(() =>
    Array.from(new Set(defaultTags.map((t) => t.trim().toLowerCase()).filter(Boolean))),
  );
  const [draft, setDraft] = useState("");
  const listId = useId();

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag) return;
    setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
    setDraft("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  const available = suggestions.filter((s) => !tags.includes(s));

  return (
    <div>
      {tags.map((tag) => (
        <input key={tag} type="hidden" name={name} value={tag} />
      ))}
      <div className={controlClass}>
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              onClick={() => removeTag(tag)}
              className="cursor-pointer text-faint transition-colors hover:text-danger"
            >
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path
                  d="M1.5 1.5l7 7M8.5 1.5l-7 7"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          list={available.length ? listId : undefined}
          placeholder={placeholder}
          className="min-w-24 flex-1 bg-transparent text-sm text-ink placeholder:text-faint outline-none"
        />
        {available.length ? (
          <datalist id={listId}>
            {available.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        ) : null}
      </div>
    </div>
  );
}
