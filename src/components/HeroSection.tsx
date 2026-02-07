import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';
import { Sparkles, Users, Utensils, ArrowRight, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-dining.jpg";

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
    },
    {
      emoji: "🎉",
      title: t('hero.slide2Title', '遇见有趣的灵魂'),
      subtitle: t('hero.slide2Subtitle', '和志同道合的人，分享一顿美餐'),
    },
    {
      emoji: "🔥",
      title: t('hero.slide3Title', '闪约模式'),
      subtitle: t('hero.slide3Subtitle', '30分钟内出发，即刻开吃'),
    }
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, dinnersRes, matchesRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('dinners').select('id', { count: 'exact', head: true }),
          supabase.from('dinner_participants').select('id', { count: 'exact', head: true })
        ]);
        setStats({
          users: (usersRes.count || 0) + 100,
          dinners: (dinnersRes.count || 0) + 50,
          matches: (matchesRes.count || 0) + 200
        });
      } catch {
        setStats({ users: 100, dinners: 50, matches: 200 });
      }
    };
    fetchStats();

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden min-h-[85vh] flex flex-col justify-center">
      {/* Hero background image with overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Friends sharing food" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/10" />
      </div>

      {/* Floating light effects */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse" />

      <div className="relative container mx-auto px-4 py-16">
        {/* Carousel area */}
        <div className="text-center mb-10">
          <div className="relative h-44 overflow-hidden">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-700 ${
                  index === currentSlide 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="text-6xl mb-4">{slide.emoji}</div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-3 text-foreground drop-shadow-lg">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl text-foreground/80 font-medium drop-shadow">
                  {slide.subtitle}
                </p>
              </div>
            ))}
          </div>

          {/* Carousel indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'w-10 bg-primary shadow-lg' 
                    : 'w-2 bg-foreground/30 hover:bg-foreground/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-10 max-w-md mx-auto">
          <div className="text-center p-3 rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 shadow-lg">
            <div className="text-2xl md:text-3xl font-black text-primary">{stats.users}+</div>
            <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
              <Users className="w-3 h-3" />
              {t('hero.activeUsers', '活跃用户')}
            </div>
          </div>
          <div className="text-center p-3 rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 shadow-lg">
            <div className="text-2xl md:text-3xl font-black text-secondary">{stats.dinners}+</div>
            <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
              <Utensils className="w-3 h-3" />
              {t('hero.totalDinners', '饭局发起')}
            </div>
          </div>
          <div className="text-center p-3 rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 shadow-lg">
            <div className="text-2xl md:text-3xl font-black text-accent">{stats.matches}+</div>
            <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3" />
              {t('hero.successMatches', '成功约饭')}
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="w-full sm:w-auto h-14 px-10 text-lg font-bold bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-xl hover:shadow-2xl transition-all rounded-2xl"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {t('hero.startNow', '立即开始')}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button 
            size="lg"
            variant="outline"
            onClick={() => navigate("/discover?guest=true")}
            className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 border-primary/50 hover:bg-primary/10 transition-all rounded-2xl bg-card/50 backdrop-blur-md"
          >
            <Zap className="w-5 h-5 mr-2" />
            {t('hero.browseFirst', '先逛逛')}
          </Button>
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          <Badge variant="secondary" className="px-3 py-1.5 text-xs bg-card/70 backdrop-blur-md border border-border/50 text-foreground shadow">
            🔒 {t('hero.safe', '安全可靠')}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1.5 text-xs bg-card/70 backdrop-blur-md border border-border/50 text-foreground shadow">
            ⚡ {t('hero.fast', '快速匹配')}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1.5 text-xs bg-card/70 backdrop-blur-md border border-border/50 text-foreground shadow">
            🎯 {t('hero.precise', '精准推荐')}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1.5 text-xs bg-card/70 backdrop-blur-md border border-border/50 text-foreground shadow">
            💯 {t('hero.free', '免费使用')}
          </Badge>
        </div>
      </div>
    </div>
  );
};
