"use client";

import { Fragment, useState } from "react";
import dynamic from "next/dynamic";

const DocumentImport = dynamic(() => import("./document-import"));

export function ModuleImport({ children, enabled, pathname }: { children: React.ReactNode; enabled: boolean; pathname: string }) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [revision, setRevision] = useState(0);
  return <>
    {enabled && pathname !== "/import" && <section className="mx-auto mb-6 max-w-6xl rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-sm font-semibold">Turn your file into insights</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">Share a document to add evidence across this workspace’s modules.</p></div>
        <button type="button" className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--bg-hover)]" aria-expanded={open} aria-controls="module-document-import" onClick={() => { setHasOpened(true); setOpen(!open); }}>{open ? "Hide file insights" : "Generate from file"}</button>
      </div>
      <div id="module-document-import" hidden={!open} className="mt-5">{hasOpened && <DocumentImport embedded onImported={() => setRevision(value => value + 1)} />}</div>
    </section>}
    <Fragment key={revision}>{children}</Fragment>
  </>;
}
