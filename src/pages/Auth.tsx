import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Github, Facebook, Twitter } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { User, Session } from '@supabase/supabase-js';

const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout;
    let mounted = true;
    
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth页面认证状态变化:', { event, session: !!session });
        
        // 同步更新状态
        setSession(session);
        setUser(session?.user ?? null);
        
        // 只在登录成功时立即重定向，避免延迟
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('用户成功登录，立即重定向');
          navigate("/my-dinners", { replace: true });
        }
      }
    );

    // 检查初始会话
    const checkInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted || error) {
          if (error) console.error('获取会话时出错:', error);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Auth页面检测到已有会话，立即重定向');
          navigate("/my-dinners", { replace: true });
        }
      } catch (error) {
        console.error('检查会话时出错:', error);
      }
    };

    checkInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreeToTerms) {
      toast({
        title: t('auth.privacyAgreement'),
        description: t('auth.agreeToTermsRequired'),
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        // 处理速率限制错误
        if (error.message.includes("For security purposes, you can only request this after")) {
          const match = error.message.match(/after (\d+) seconds/);
          const seconds = match ? match[1] : "60";
          toast({
            title: "发送频率过快",
            description: `为了安全考虑，请等待 ${seconds} 秒后再试。如果您已经注册过，请直接登录。`,
            variant: "destructive",
          });
        } else if (error.message === "User already registered") {
          toast({
            title: "用户已存在",
            description: "此邮箱已经注册过了，请直接登录。",
            variant: "destructive",
          });
        } else {
          toast({
            title: t('auth.signUpFailed'),
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t('auth.signUpSuccess'),
          description: t('auth.checkEmailConfirmation'),
        });
      }
    } catch (error: any) {
      toast({
        title: t('auth.signUpFailed'),
        description: error.message || "注册时发生未知错误",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('开始登录:', { email });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('登录结果:', { data, error });

    if (error) {
      console.error('登录错误:', error);
      toast({
        title: t('auth.signInFailed'),
        description: error.message === "Invalid login credentials" 
          ? t('auth.invalidCredentials')
          : error.message,
        variant: "destructive",
      });
    } else {
      console.log('登录成功，用户信息:', data.user);
      toast({
        title: t('auth.signInSuccess'),
        description: t('auth.redirecting'),
      });
    }
    
    setLoading(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'twitter' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/my-dinners`
        }
      });

      if (error) {
        toast({
          title: t('auth.signInFailed'),
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t('auth.signInFailed'), 
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">饭约社</CardTitle>
          <CardDescription>{t('about.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" className="text-sm">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup" className="text-sm">{t('auth.signUp')}</TabsTrigger>
            </TabsList>
            
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t('auth.email')}</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t('auth.password')}</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/90 hover:text-black font-bold" disabled={loading}>
                  {loading ? `${t('auth.signIn')}...` : t('auth.signIn')}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.email')}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.password')}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                    {t('auth.privacyAgreement')}{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      {t('auth.privacyPolicy')}
                    </Link>{' '}
                    {t('auth.and')}{' '}
                    <Link to="/terms" className="text-primary hover:underline">
                      {t('auth.termsOfService')}
                    </Link>
                  </Label>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-accent text-black hover:bg-accent/90 hover:text-black font-bold" 
                  disabled={loading || !agreeToTerms}
                >
                  {loading ? `${t('auth.signUp')}...` : t('auth.signUp')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin('github')}
                disabled={loading}
                className="w-full"
              >
                <Github className="w-4 h-4" />
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin('facebook')}
                disabled={loading}
                className="w-full"
              >
                <Facebook className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <LanguageSwitcher />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;