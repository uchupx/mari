import { mangaService } from "@/services";
import { CheckUpdatePayload, CheckUpdateResult } from "./types";

export async function checkUpdateWorker(payload: CheckUpdatePayload): Promise<CheckUpdateResult> {
  try {
    const { mangaId, pageCount } = payload;
    const chapters = await mangaService.getChapters(mangaId);
    const isUpdateAvailable = chapters.length > pageCount;

    return { status: "success", isUpdateAvailable };
  } catch (error) {
    return { status: "error", isUpdateAvailable: false, error: error instanceof Error ? error.message : String(error) };
  }
}
