import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const MEASUREMENT_ID = 'G-74YHWHZ5ZT';

const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Report a page_view on each route change
    try {
      const page_path = location.pathname + location.search;
      if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
        (window as any).gtag('config', MEASUREMENT_ID, {
          page_path,
          page_title: document.title,
        });
      }
    } catch (e) {
      // fail silently
    }
  }, [location]);

  return null;
};

export default Analytics;
