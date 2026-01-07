import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';
import { Sparkles, Users, Utensils, ArrowRight, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  users: number;
  dinners: number;
  matches: number;
}

export const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({ users: 0, dinners: 0, matches: 0 });
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      emoji: "🍜",
      title: t('hero.slide1Title', '今晚不想一个人吃'),
      subtitle: t('hero.slide1Subtitle', '找个饭搭子，让美食更有温度'),
      color: "from-primary to-accent"
    },
    {
      emoji: "🎉",
      title: t('hero.slide2Title', '遇见有趣的灵魂'),
      subtitle: t('hero.slide2Subtitle', '和志同道合的人，分享一顿美餐'),
      color: "from-secondary to-primary"
    },
    {
      emoji: "🔥",
      title: t('hero.slide3Title', '闪约模式'),
      subtitle: t('hero.slide3Subtitle', '30分钟内出发，即刻开吃'),
      color: "from-accent to-destructive"
    }
  ];

  useEffect(() => {
    // 获取统计数据
    const fetchStats = async () => {
      try {
        const [usersRes, dinnersRes, matchesRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('dinners').select('id', { count: 'exact', head: true }),
          supabase.from('dinner_participants').select('id', { count: 'exact', head: true })
        ]);

        setStats({
          users: (usersRes.count || 0) + 100, // 基础数 + 实际数
          dinners: (dinnersRes.count || 0) + 50,
          matches: (matchesRes.count || 0) + 200
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats({ users: 100, dinners: 50, matches: 200 });
      }
    };

    fetchStats();

    // 轮播切换
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* 背景动画 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative container mx-auto px-4 py-12">
        {/* 轮播区域 */}
        <div className="text-center mb-8">
          <div className="relative h-40 overflow-hidden">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-700 ${
                  index === currentSlide 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="text-6xl mb-4 animate-bounce">{slide.emoji}</div>
                <h1 className={`text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r ${slide.color} bg-clip-text text-transparent`}>
                  {slide.title}
                </h1>
                <p className="text-lg text-muted-foreground">{slide.subtitle}</p>
              </div>
            ))}
          </div>

          {/* 轮播指示器 */}
          <div className="flex justify-center gap-2 mt-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'w-8 bg-primary' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 社交证明统计 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 rounded-2xl bg-card/50 backdrop-blur border border-border/50">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
              {stats.users}+
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              {t('hero.activeUsers', '活跃用户')}
            </div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-card/50 backdrop-blur border border-border/50">
            <div className="text-2xl md:text-3xl font-bold text-secondary mb-1">
              {stats.dinners}+
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Utensils className="w-3 h-3" />
              {t('hero.totalDinners', '饭局发起')}
            </div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-card/50 backdrop-blur border border-border/50">
            <div className="text-2xl md:text-3xl font-bold text-accent mb-1">
              {stats.matches}+
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              {t('hero.successMatches', '成功约饭')}
            </div>
          </div>
        </div>

        {/* CTA 按钮组 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {t('hero.startNow', '立即开始')}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button 
            size="lg"
            variant="outline"
            onClick={() => navigate("/discover?guest=true")}
            className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 border-primary/50 hover:bg-primary/10 transition-all"
          >
            <Zap className="w-5 h-5 mr-2" />
            {t('hero.browseFirst', '先逛逛')}
          </Button>
        </div>

        {/* 特色标签 */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          <Badge variant="secondary" className="px-3 py-1 text-xs bg-primary/10 text-primary border-0">
            🔒 {t('hero.safe', '安全可靠')}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1 text-xs bg-secondary/10 text-secondary border-0">
            ⚡ {t('hero.fast', '快速匹配')}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1 text-xs bg-accent/10 text-accent border-0">
            🎯 {t('hero.precise', '精准推荐')}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1 text-xs bg-destructive/10 text-destructive border-0">
            💯 {t('hero.free', '免费使用')}
          </Badge>
        </div>
      </div>
    </div>
  );
};
