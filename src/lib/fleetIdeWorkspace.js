/** Local persistence for Fleet AI IDE (IntellectMode) — survives refresh. */
const STORAGE_KEY = "nv_fleet_ide_workspace_v1";

/**
 * @returns {{ files: unknown[], activeFileId: string } | null}
 */
export function loadFleetIdeWorkspace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data.files) || data.files.length === 0) return null;
    return { files: data.files, activeFileId: data.activeFileId || data.files[0]?.id };
  } catch {
    return null;
  }
}

/**
 * @param {{ files: unknown[], activeFileId: string }} payload
 */
export function saveFleetIdeWorkspace(payload) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        files: payload.files,
        activeFileId: payload.activeFileId,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch (e) {
    console.warn("[Fleet IDE] local save failed:", e);
  }
}

export function clearFleetIdeWorkspace() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
