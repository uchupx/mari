import { dbService } from '@/db/indexdb';
import type { ChapterDataClass, MangaDataClass } from '@/types/api';
import type { ReadingHistoryEntry } from '@/types/indexeddb';

export class HistoryService {
  constructor(private db = dbService) {}

  buildEntry(
    manga: Pick<MangaDataClass, 'id' | 'title' | 'thumbnailUrl' | 'sourceId'>,
    chapter: Pick<ChapterDataClass, 'id' | 'name' | 'chapterNumber' | 'index' | 'pageCount'>,
    page: number
  ): ReadingHistoryEntry {
    // const progressPercentage = chapter.pageCount > 0 ? Math.round((page / chapter.pageCount) * 100) : 0;

    return {
      id: `${manga.id}_${manga.sourceId}`,
      mangaId: manga.id,
      chapterId: chapter.id,
      mangaTitle: manga.title,
      mangaThumbnailUrl: manga.thumbnailUrl,
      chapterName: chapter.name,
      chapterIndex: chapter.index,
      lastPageRead: page,
      pageCount: chapter.pageCount,
      // progressPercentage,
      readAt: Date.now(),
    };
  }


  async save(entry: ReadingHistoryEntry): Promise<void> {
    await this.db.saveReadingHistory(entry);
  }


  async getAll(): Promise<ReadingHistoryEntry[]> {
    return this.db.getReadingHistory();
  }


  async getForManga(mangaId: number): Promise<ReadingHistoryEntry[]> {
    const all = await this.db.getReadingHistory();
    return all.filter((e) => e.mangaId === mangaId);
  }


  async getById(id: string): Promise<ReadingHistoryEntry | undefined> {
    const all = await this.db.getReadingHistory();
    return all.find((e) => e.id === id);
  }


  async remove(id: string): Promise<void> {
    await this.db.deleteReadingHistoryEntry(id);
  }


  async clear(): Promise<void> {
    await this.db.clearReadingHistory();
  }


  latestPerManga(entries: ReadingHistoryEntry[]): ReadingHistoryEntry[] {
    const seen = new Set<number>();
    const result: ReadingHistoryEntry[] = [];
    for (const entry of entries) {
      if (seen.has(entry.mangaId)) continue;
      seen.add(entry.mangaId);
      result.push(entry);
    }
    return result;
  }
}

export const historyService = new HistoryService();
