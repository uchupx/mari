import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/Home.vue'),
      meta: {
        title: 'Library',
      }
    },
    {
      path: '/sources',
      name: 'sources',
      component: () => import('@/pages/Source.vue'),
      meta: {
        title: 'Sources',
      }
    },
    {
      path: '/source/:id',
      name: 'source-detail',
      component: () => import('@/pages/Source/Detail.vue'),
      meta: {
        title: 'Source Detail',
      }
    },
    {
      path: '/manga/:id',
      name: 'manga-detail',
      component: () => import('@/pages/Manga/Manga.vue'),
      meta: {
        title: 'Manga Detail',
      },
    },
    {
      path: '/manga/:mangaId/chapter/:chapterIndex',
      name: 'reader',
      component: () => import('@/pages/Manga/Reader.vue'),
      meta: {
        title: 'Reader',
        hideNavbar: true,
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/pages/Settings.vue'),
      meta: {
        title: 'Settings',
      },
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/pages/History.vue'),
      meta: {
        title: 'History',
      },
    },
  ],
});

export default router;
