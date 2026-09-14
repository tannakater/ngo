import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

export function SEO({ title, description, image, url }: SEOProps) {
  useEffect(() => {
    // Update document title
    document.title = `${title} | DakSeba Foundation`;

    // Update meta tags
    const updateMetaTag = (attr: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attr}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    updateMetaTag('name', 'description', description);
    updateMetaTag('property', 'og:title', `${title} | DakSeba Foundation`);
    updateMetaTag('property', 'og:description', description);
    if (image) {
      updateMetaTag('property', 'og:image', image);
    }
    if (url) {
      updateMetaTag('property', 'og:url', url);
    }
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', `${title} | DakSeba Foundation`);
    updateMetaTag('name', 'twitter:description', description);
    if (image) {
      updateMetaTag('name', 'twitter:image', image);
    }
  }, [title, description, image, url]);

  return null;
}
