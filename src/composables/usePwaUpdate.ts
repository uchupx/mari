import { useRegisterSW } from 'virtual:pwa-register/vue';

export function usePwaUpdate() {
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update();
        }
      });

      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    },
  });

  const update = async () => {
    await updateServiceWorker(true);
  };

  const dismiss = () => {
    needRefresh.value = false;
  };

  return {
    needRefresh,
    update,
    dismiss,
  };
}
