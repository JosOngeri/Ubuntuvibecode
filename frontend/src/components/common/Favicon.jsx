import { useEffect, useState } from 'react';
import api from '../../services/api';

const Favicon = () => {
  const [faviconUrl, setFaviconUrl] = useState('/favicon-1.png');

  useEffect(() => {
    const fetchActiveFavicon = async () => {
      try {
        const response = await api.get('/favicons/active');
        const favicon = response.data;

        // Set favicon URL based on type
        if (favicon.type === 'default') {
          setFaviconUrl(favicon.path);
        } else if (favicon.type === 'custom') {
          // For custom uploads, use the full path from the backend
          setFaviconUrl(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${favicon.path}`
          );
        }
      } catch (error) {
        console.error('Error fetching favicon:', error);
        // Fallback to default
        setFaviconUrl('/favicon-1.png');
      }
    };

    fetchActiveFavicon();
  }, []);

  useEffect(() => {
    // Update favicon in the document
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;

    // Also update apple-touch-icon
    let appleLink = document.querySelector("link[rel~='apple-touch-icon']");
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = faviconUrl;
  }, [faviconUrl]);

  return null; // This component doesn't render anything visible
};

export default Favicon;
