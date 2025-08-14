import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

export const useSEO = () => {
  const { t } = useTranslation();
  const location = useLocation();
  
  const getPageSEO = (pageType: string, data?: any) => {
    const baseUrl = window.location.origin;
    const currentUrl = `${baseUrl}${location.pathname}`;
    
    switch (pageType) {
      case 'home':
        return {
          title: t('seo.home.title', '找到你完美的饭搭子'),
          description: t('seo.home.description', '饭约社是一款社交拼饭应用，帮助你找到志趣相投的饭友，一起享受美食时光。支持闪约、预约、团饭等多种模式。'),
          keywords: t('seo.home.keywords', '饭约社,拼饭,美食,社交,饭友,聚餐,约饭,找饭友'),
          structuredData: {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": t('common.appName', '饭约社'),
            "description": t('seo.home.description'),
            "url": baseUrl,
            "applicationCategory": "SocialApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "CNY"
            }
          }
        };
        
      case 'discover':
        return {
          title: t('seo.discover.title', '发现附近的饭局'),
          description: t('seo.discover.description', '发现你附近的精彩饭局，找到志趣相投的饭友，享受美食与社交的完美结合。'),
          keywords: t('seo.discover.keywords', '发现饭局,附近美食,社交聚餐,找饭友'),
          structuredData: {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": t('seo.discover.title'),
            "description": t('seo.discover.description'),
            "url": currentUrl
          }
        };
        
      case 'create-dinner':
        return {
          title: t('seo.createDinner.title', '创建饭局'),
          description: t('seo.createDinner.description', '轻松创建你的饭局，邀请志趣相投的朋友一起享受美食时光。'),
          keywords: t('seo.createDinner.keywords', '创建饭局,组织聚餐,邀请朋友,美食社交'),
          structuredData: {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": t('seo.createDinner.title'),
            "description": t('seo.createDinner.description'),
            "url": currentUrl
          }
        };
        
      case 'dinner-detail':
        return {
          title: data?.title ? `${data.title} - 饭局详情` : t('seo.dinnerDetail.title', '饭局详情'),
          description: data?.description || t('seo.dinnerDetail.description', '查看饭局详细信息，了解活动安排，与饭友互动交流。'),
          keywords: t('seo.dinnerDetail.keywords', '饭局详情,聚餐信息,美食活动'),
          structuredData: data ? {
            "@context": "https://schema.org",
            "@type": "Event",
            "name": data.title,
            "description": data.description,
            "startDate": data.dinner_time,
            "location": {
              "@type": "Place",
              "name": data.location,
              "address": data.location
            },
            "organizer": {
              "@type": "Person",
              "name": data.organizer_name || "饭约社用户"
            },
            "offers": {
              "@type": "Offer",
              "price": data.budget_per_person || "0",
              "priceCurrency": "CNY"
            }
          } : undefined
        };
        
      case 'profile':
        return {
          title: data?.display_name ? `${data.display_name} - 用户资料` : t('seo.profile.title', '用户资料'),
          description: t('seo.profile.description', '查看用户资料，了解饭友信息，建立美食社交联系。'),
          keywords: t('seo.profile.keywords', '用户资料,饭友信息,社交档案'),
          type: 'profile' as const,
          structuredData: data ? {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": data.display_name,
            "description": data.bio,
            "image": data.avatar_url
          } : undefined
        };
        
      case 'about':
        return {
          title: t('seo.about.title', '关于我们'),
          description: t('seo.about.description', '了解饭约社的使命愿景，我们致力于打造最优质的美食社交平台。'),
          keywords: t('seo.about.keywords', '关于饭约社,公司介绍,美食社交平台'),
          structuredData: {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": t('common.appName', '饭约社'),
            "description": t('seo.about.description'),
            "url": baseUrl
          }
        };
        
      default:
        return {
          title: t('common.appName', '饭约社'),
          description: t('common.appDescription', '饭约社是一款社交拼饭应用，帮助你找到志趣相投的饭友，一起享受美食时光。'),
          keywords: t('common.keywords', '饭约社,拼饭,美食,社交,饭友,聚餐')
        };
    }
  };
  
  return { getPageSEO };
};