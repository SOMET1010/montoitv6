import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'property';
  propertyData?: {
    price?: number;
    location?: string;
    type?: string;
  };
}

export default function SEOHead({
  title = 'Mon Toit - Location immobilière en Côte d\'Ivoire',
  description = 'Trouvez votre logement idéal en Côte d\'Ivoire. Location d\'appartements, maisons et villas à Abidjan et dans toute la Côte d\'Ivoire.',
  keywords = 'location, immobilier, côte d\'ivoire, abidjan, appartement, maison, villa, logement',
  image = '/og-image.jpg',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  propertyData
}: SEOHeadProps) {

  useEffect(() => {
    document.title = title;

    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },

      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: 'Mon Toit' },
      { property: 'og:locale', content: 'fr_FR' },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },

      { name: 'robots', content: 'index, follow' },
      { name: 'googlebot', content: 'index, follow' },
      { name: 'author', content: 'Mon Toit' },
      { name: 'language', content: 'French' },
      { name: 'geo.region', content: 'CI' },
      { name: 'geo.placename', content: 'Côte d\'Ivoire' }
    ];

    if (propertyData) {
      metaTags.push(
        { property: 'product:price:amount', content: propertyData.price?.toString() || '' },
        { property: 'product:price:currency', content: 'XOF' }
      );
    }

    metaTags.forEach(({ name, property, content }) => {
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      let element = document.querySelector(selector);

      if (!element) {
        element = document.createElement('meta');
        if (name) element.setAttribute('name', name);
        if (property) element.setAttribute('property', property);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    });

    const canonicalLink = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    canonicalLink.setAttribute('href', url);
    if (!document.querySelector('link[rel="canonical"]')) {
      document.head.appendChild(canonicalLink);
    }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': type === 'property' ? 'RealEstateListing' : 'WebSite',
      name: 'Mon Toit',
      url: url,
      description: description,
      ...(type === 'property' && propertyData && {
        offers: {
          '@type': 'Offer',
          price: propertyData.price,
          priceCurrency: 'XOF',
          availability: 'https://schema.org/InStock'
        },
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'CI',
          addressLocality: propertyData.location
        }
      })
    };

    let scriptTag = document.querySelector('script[type="application/ld+json"]');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(jsonLd);

  }, [title, description, keywords, image, url, type, propertyData]);

  return null;
}
