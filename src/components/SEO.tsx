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
  image = "https://dinemate.xyz/og-image.jpg",
  url,
  type = 'website',
  structuredData
}: SEOProps) => {
  const { t, i18n } = useTranslation();
  
  const siteTitle = t('common.appName', '饭约社');
  const siteTitleEn = 'DineMate';
  const defaultDescription = t('common.appDescription', '饭约社是一款社交拼饭应用，帮助你找到志趣相投的饭友，一起享受美食时光。支持闪约、预约、团饭等多种模式。');
  const defaultKeywords = t('common.keywords', '饭约社,拼饭,美食,社交,饭友,聚餐,约饭,找饭友,DineMate,social dining,food buddy,group meals');
  
  const fullTitle = title ? `${title} - ${siteTitle}` : `${siteTitle} | ${siteTitleEn}`;
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || defaultKeywords;
  
  const BASE_URL = 'https://dinemate.xyz';

  const getCanonicalUrl = () => {
    if (url) return url;
    
    const pathname = window.location.pathname;
    
    // Normalize alternate routes to their canonical version
    if (pathname === '/my-dinners') {
      return `${BASE_URL}/discover`;
    }
    
    return `${BASE_URL}${pathname}`;
  };
  
  const canonicalUrl = getCanonicalUrl();

  // English description for international social media
  const socialDescription = i18n.language === 'zh' 
    ? metaDescription 
    : 'Find your perfect dining buddy! A social dining app to join group meals, explore cuisines, and make friends over food. 🍜';
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content="饭约社团队 DineMate Team" />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Language */}
      <html lang={i18n.language === 'zh' ? 'zh-CN' : 'en-US'} />
      
      {/* Open Graph - Facebook, Instagram, LinkedIn */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={socialDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="640" />
      <meta property="og:image:alt" content="饭约社 DineMate - Social Dining App" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={`${siteTitle} | ${siteTitleEn}`} />
      <meta property="og:locale" content={i18n.language === 'zh' ? 'zh_CN' : 'en_US'} />
      <meta property="og:locale:alternate" content="en_US" />
      <meta property="og:locale:alternate" content="zh_CN" />
      
      {/* Twitter/X Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${siteTitle} | ${siteTitleEn}`} />
      <meta name="twitter:description" content="Find your perfect dining buddy! Join group meals, explore cuisines & make friends over food 🍜" />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content="DineMate - Social Dining App" />
      
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