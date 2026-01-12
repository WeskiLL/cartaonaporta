import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PWA_LAST_PATH_KEY = 'pwa-last-path';

// Check if app is running as installed PWA
const isInstalledPwa = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

export const usePwaNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Save current path on every navigation
  useEffect(() => {
    const currentPath = location.pathname + location.search + location.hash;
    if (currentPath !== '/') {
      localStorage.setItem(PWA_LAST_PATH_KEY, currentPath);
    }
  }, [location]);

  // Redirect to last path on PWA open (only once per session)
  useEffect(() => {
    if (!isInstalledPwa()) return;

    const hasRedirected = sessionStorage.getItem('pwa-redirected');
    if (hasRedirected) return;

    const lastPath = localStorage.getItem(PWA_LAST_PATH_KEY);
    if (lastPath && lastPath !== '/' && location.pathname === '/') {
      sessionStorage.setItem('pwa-redirected', 'true');
      navigate(lastPath, { replace: true });
    } else {
      sessionStorage.setItem('pwa-redirected', 'true');
    }
  }, []);
};
