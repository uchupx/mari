import { useRegisterSW } from 'virtual:pwa-register/vue';

export function usePwaUpdate() {
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const checkUpdate = () => {
        setTimeout(() => {
          registration.update().catch(() => {});
        }, 1000);
      };

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkUpdate();
        }
      });

      window.addEventListener('pageshow', checkUpdate);
      window.addEventListener('focus', checkUpdate);

      setInterval(() => {
        checkUpdate();
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
