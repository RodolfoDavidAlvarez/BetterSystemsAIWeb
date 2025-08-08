import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

export function SEO({
  title = 'Better Systems AI',
  description = 'Empowering businesses with innovative AI automation solutions. Reduce costs by 90%, save thousands of hours, and achieve 200%+ ROI with our custom AI assistants and consulting services.',
  keywords = 'AI automation, business AI solutions, AI assistants, AI consulting, process automation, cost reduction, ROI optimization, custom AI solutions',
  image = '/og-image.png',
  url = 'https://bettersystems.ai',
  type = 'website'
}: SEOProps) {
  const fullTitle = title === 'Better Systems AI' ? title : `${title} | Better Systems AI`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Better Systems AI" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional Meta */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Better Systems AI" />
      <link rel="canonical" href={url} />
      
      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Better Systems AI",
          "description": description,
          "url": url,
          "logo": `${url}/logo-transparent.png`,
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+1-555-0123",
            "contactType": "customer service",
            "areaServed": "US",
            "availableLanguage": "English"
          },
          "sameAs": [
            "https://twitter.com/bettersystemsai",
            "https://linkedin.com/company/better-systems-ai"
          ]
        })}
      </script>
    </Helmet>
  );
}