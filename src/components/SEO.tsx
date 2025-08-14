import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  structuredData?: object;
}

export const SEO = ({
  title,
  description,
  keywords,
  image = "https://lovable.dev/opengraph-image-p98pqg.png",
  url,
  type = 'website',
  structuredData
}: SEOProps) => {
  const { t, i18n } = useTranslation();
  
  const siteTitle = t('common.appName', '饭约社');
  const defaultDescription = t('common.appDescription', '饭约社是一款社交拼饭应用，帮助你找到志趣相投的饭友，一起享受美食时光。支持闪约、预约、团饭等多种模式。');
  const defaultKeywords = t('common.keywords', '饭约社,拼饭,美食,社交,饭友,聚餐,约饭,找饭友');
  
  const fullTitle = title ? `${title} - ${siteTitle}` : siteTitle;
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || defaultKeywords;
  const currentUrl = url || window.location.href;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content="饭约社团队" />
      <link rel="canonical" href={currentUrl} />
      
      {/* Language */}
      <html lang={i18n.language === 'zh' ? 'zh-CN' : 'en-US'} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content={i18n.language === 'zh' ? 'zh_CN' : 'en_US'} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@lovable_dev" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* Mobile */}
      <meta name="theme-color" content="#e91e63" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content={siteTitle} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};