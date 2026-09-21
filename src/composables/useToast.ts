import { ref } from 'vue';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'loading';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  sticky: boolean;
}

// module-level singleton: every useToast() call shares one list
const toasts = ref<ToastItem[]>([]);
let nextId = 1;

const AUTO_DISMISS_MS: Record<ToastType, number> = {
  info: 3000,
  success: 3000,
  warning: 4000,
  error: 5000,
  loading: 0, // sticky until dismissed
};

const dismiss = (id?: number) => {
  if (id !== undefined) {
    const i = toasts.value.findIndex((t) => t.id === id);
    if (i !== -1) toasts.value.splice(i, 1);
    return;
  }
  // no id: close every sticky (loading) toast
  toasts.value = toasts.value.filter((t) => !t.sticky);
};

const show = (type: ToastType, message: string): number => {
  const sticky = AUTO_DISMISS_MS[type] === 0;
  const id = nextId++;
  toasts.value.push({ id, type, message, sticky });
  if (!sticky) setTimeout(() => dismiss(id), AUTO_DISMISS_MS[type]);
  return id;
};

export function useToast() {
  return {
    toasts,
    dismiss,
    info: (message: string) => show('info', message),
    success: (message: string) => show('success', message),
    warning: (message: string) => show('warning', message),
    error: (message: string) => show('error', message),
    /** Sticky toast with spinner. Returns { id, close() } — call close() when the work finishes. */
    loading: (message: string) => {
      const id = show('loading', message);
      return { id, close: () => dismiss(id) };
    },
  };
}
