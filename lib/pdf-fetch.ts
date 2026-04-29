/**
 * Skupni helper za prenos PDF-ja z server-side Playwright pipeline-a.
 * Iz JSON odgovora s napako poskusi izluščiti `detail` polje, da je
 * uporabniku vidna konkretna napaka (npr. manjkajoč chromium, timeout).
 */
export async function fetchVectorPDFBlob(endpoint: string): Promise<Blob> {
  const res = await fetch(endpoint, { method: "GET" })
  if (res.ok) {
    return await res.blob()
  }
  const text = await res.text().catch(() => "")
  let message = text || `HTTP ${res.status}`
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === "object") {
      const parts = [parsed.error, parsed.detail].filter(Boolean)
      if (parts.length > 0) message = parts.join(" — ")
    }
  } catch {
    // Pustimo surov text
  }
  throw new Error(message)
}
