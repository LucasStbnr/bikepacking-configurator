"use client";

import { useState, useTransition } from "react";
import { disableSharing, enableSharing } from "@/actions/setups";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { track } from "@/lib/analytics";

export function ShareDialog({
  setupId,
  shareToken,
  open,
  onOpenChange,
}: {
  setupId: number;
  shareToken: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  // Overrides the server prop until revalidation catches up, so the drawer
  // reacts instantly to enable/disable
  const [tokenOverride, setTokenOverride] = useState<string | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  const token = tokenOverride !== undefined ? tokenOverride : shareToken;
  // Only rendered inside the drawer portal (client-only), so window is safe here
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const shareUrl = token ? `${origin}/share/${token}` : null;

  function enable() {
    startTransition(async () => {
      const created = await enableSharing(setupId);
      setTokenOverride(created);
      track("share_enabled");
    });
  }

  function disable() {
    startTransition(async () => {
      await disableSharing(setupId);
      setTokenOverride(null);
      track("share_disabled");
    });
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      track("share_link_copied");
    } catch {
      // Clipboard can be unavailable (http, permissions) — the URL stays selectable
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Share this setup"
      description="A public read-only page — no editing, no login needed."
    >
      <div className="flex flex-col gap-6">
        {/* Public link */}
        <section className="flex flex-col gap-3">
          <h3 className="spec-label">Public link</h3>
          {token ? (
            <>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl ?? ""}
                  onFocus={(e) => e.target.select()}
                  aria-label="Public share link"
                  className="h-9 min-w-0 flex-1 rounded-md border border-line-strong bg-surface px-2.5 font-mono text-xs text-ink outline-none focus:border-accent"
                />
                <Button variant="outline" size="sm" onClick={copyLink} disabled={!shareUrl}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-muted">
                Anyone with this link can view the setup and its packing list. Changes you
                make stay live on the shared page.
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={disable}
                disabled={isPending}
                className="self-start"
              >
                Disable link
              </Button>
            </>
          ) : (
            <>
              <p className="text-xs text-muted">
                Create an unguessable link that shows a read-only version of this setup.
                You can revoke it at any time.
              </p>
              <Button variant="primary" size="sm" onClick={enable} disabled={isPending} className="self-start">
                Create share link
              </Button>
            </>
          )}
        </section>

        <div className="border-t border-line" />

        {/* Image recap */}
        <section className="flex flex-col gap-3">
          <h3 className="spec-label">Image recap</h3>
          <p className="text-xs text-muted">
            A picture of the setup — bike, bags and totals — to drop straight into a chat
            or post. No link required.
          </p>
          <a
            href={`/setups/${setupId}/recap`}
            download
            onClick={() => track("share_recap_downloaded")}
            className="inline-flex h-8 items-center gap-2 self-start rounded-md border border-line-strong px-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M7 1.5v8m0 0L3.8 6.3M7 9.5l3.2-3.2M2 12.5h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download image
          </a>
          {token ? (
            <p className="text-xs text-faint">
              The share link also serves this image at{" "}
              <span className="font-mono">/share/…/recap</span> and shows a preview card
              when pasted into chats and social apps.
            </p>
          ) : null}
        </section>
      </div>
    </Drawer>
  );
}
