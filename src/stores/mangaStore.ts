import { defineStore } from 'pinia';
import {
  sourceService,
  mangaService,
  categoryService,
  settingsService,
} from '@/services';
import type {
  CategoryDataClass,
  ChapterDataClass,
  MangaDataClass,
  SourceDataClass,
} from '@/types/api';

export const useMangaStore = defineStore('manga', {
  state: () => ({
    sources: [] as SourceDataClass[],
    selectedSource: null as SourceDataClass | null,
    popularMangas: [] as MangaDataClass[],
    searchResults: [] as MangaDataClass[],
    currentManga: null as MangaDataClass | null,
    currentChapters: [] as ChapterDataClass[],
    categories: [] as CategoryDataClass[],
    isLoading: false,
    error: null as string | null,
    serverConnected: false,
    serverVersion: '' as string,
  }),

  actions: {
    async checkServerHealth(): Promise<boolean> {
      try {
        const about = await settingsService.getAbout();
        this.serverConnected = true;
        this.serverVersion = `${about.name} v${about.version}`;
        return true;
      } catch (e: any) {
        this.serverConnected = false;
        return false;
      }
    },

    async fetchSources(): Promise<void> {
      this.isLoading = true;
      this.error = null;
      try {
        const sources = await sourceService.getSources();
        this.sources = sources;
        if (sources.length > 0 && !this.selectedSource) {
          this.selectedSource = sources[0];
        }
      } catch (err: any) {
        this.error = `Failed to fetch sources: ${err.message}`;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchPopular(sourceId: string | number, pageNum: number = 1): Promise<void> {
      this.isLoading = true;
      this.error = null;
      try {
        const result = await sourceService.getPopular(sourceId, pageNum);
        this.popularMangas = result.mangaList;
      } catch (err: any) {
        this.error = `Failed to fetch popular manga: ${err.message}`;
      } finally {
        this.isLoading = false;
      }
    },

    async search(sourceId: string | number, query: string, pageNum: number = 1): Promise<void> {
      this.isLoading = true;
      this.error = null;
      try {
        const result = await sourceService.search(sourceId, query, pageNum);
        this.searchResults = result.mangaList;
      } catch (err: any) {
        this.error = `Failed to search manga: ${err.message}`;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMangaDetails(mangaId: number): Promise<void> {
      this.isLoading = true;
      this.error = null;
      try {
        const [manga, chapters] = await Promise.all([
          mangaService.getManga(mangaId),
          mangaService.getChapters(mangaId),
        ]);
        this.currentManga = manga;
        this.currentChapters = chapters;
      } catch (err: any) {
        this.error = `Failed to fetch manga detail: ${err.message}`;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchCategories(): Promise<void> {
      try {
        this.categories = await categoryService.getCategories();
      } catch (err: any) {
        console.warn('Failed to load categories:', err);
      }
    },
  },
});
