import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { SEO } from "@/components/SEO";
import { useSEO } from "@/hooks/useSEO";
import { CampaignBanner } from "@/components/CampaignBanner";
import { useAuth } from '@/contexts/AuthContext';
import { HeroSection } from "@/components/HeroSection";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  const { user, loading } = useAuth();

  const seoData = getPageSEO('home');

  // 用户已登录时自动重定向
  useEffect(() => {
    if (!loading && user) {
      navigate("/discover?tab=myDinners", { replace: true });
    }
  }, [user, loading, navigate]);

  // 如果还在加载或用户已登录，显示加载状态
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <div className="text-lg">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO {...seoData} />
      <div className="min-h-screen bg-background">
        {/* Campaign Banner */}
        <div className="container mx-auto px-4 pt-6">
          <CampaignBanner className="mb-4" />
        </div>
        
        {/* Hero Section with Stats */}
        <HeroSection />
        
        {/* Features Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard 
              emoji="🍜"
              title={t('feature.discoverTitle', '发现饭局')}
              description={t('feature.discoverDesc', '浏览附近的饭局，找到志同道合的饭友')}
            />
            <FeatureCard 
              emoji="⚡"
              title={t('feature.instantTitle', '闪约模式')}
              description={t('feature.instantDesc', '30分钟内出发，即刻开吃不等待')}
            />
            <FeatureCard 
              emoji="💬"
              title={t('feature.chatTitle', '即时聊天')}
              description={t('feature.chatDesc', '在线沟通，确定时间地点菜品')}
            />
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">
              {t('testimonials.title', '饭友们怎么说')}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <TestimonialCard 
                content={t('testimonials.1', '终于不用一个人点外卖了！认识了好几个有趣的小伙伴')}
                author="小红"
                avatar="🙋‍♀️"
              />
              <TestimonialCard 
                content={t('testimonials.2', '闪约模式太棒了，下班后随时能找到一起吃饭的人')}
                author="大明"
                avatar="🙋‍♂️"
              />
              <TestimonialCard 
                content={t('testimonials.3', '作为社恐，这个app让我慢慢敢于和陌生人吃饭了')}
                author="阿花"
                avatar="🙋‍♀️"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Feature Card Component
const FeatureCard = ({ emoji, title, description }: { emoji: string; title: string; description: string }) => (
  <div className="text-center p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all">
    <div className="text-4xl mb-4">{emoji}</div>
    <h3 className="text-lg font-bold mb-2 text-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

// Testimonial Card Component
const TestimonialCard = ({ content, author, avatar }: { content: string; author: string; avatar: string }) => (
  <div className="p-4 rounded-xl bg-card border border-border/50">
    <p className="text-sm text-foreground mb-3">"{content}"</p>
    <div className="flex items-center gap-2">
      <span className="text-xl">{avatar}</span>
      <span className="text-sm font-medium text-muted-foreground">{author}</span>
    </div>
  </div>
);

export default Index;
