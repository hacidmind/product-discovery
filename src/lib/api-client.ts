"use client";

export async function checkedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await window.fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(120_000) });
  } catch {
    throw new Error("We could not reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    if (response.status === 401) throw new Error("Your session has expired. Please sign in again.");
    throw new Error(typeof data?.error === "string" ? data.error : "We could not complete that request. Please try again.");
  }
  return response;
}

export async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await checkedFetch(url);
  const blobUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = blobUrl; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}
