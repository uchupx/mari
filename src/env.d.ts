/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of Suwayomi-Server, e.g. http://192.168.1.10:4566. Empty = same origin. */
  readonly SUWAYOMI_SERVER_URL?: string;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
