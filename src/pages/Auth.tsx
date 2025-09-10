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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Github, Facebook, Twitter, Phone } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { User, Session } from '@supabase/supabase-js';

const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
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

  const handleWechatLogin = async () => {
    try {
      // 这里将调用微信登录Edge Function
      const { data, error } = await supabase.functions.invoke('wechat-auth', {
        body: { code: 'temp_code' } // 这里需要从微信获取真实的code
      });

      if (error) {
        toast({
          title: t('auth.wechatLoginFailed'),
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t('auth.wechatLoginFailed'),
        description: t('auth.tryAgainLater'),
        variant: "destructive",
      });
    }
  };

  const handleQQLogin = async () => {
    try {
      // 这里将调用QQ登录Edge Function
      const { data, error } = await supabase.functions.invoke('qq-auth', {
        body: { code: 'temp_code' } // 这里需要从QQ获取真实的code
      });

      if (error) {
        toast({
          title: t('auth.qqLoginFailed'),
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t('auth.qqLoginFailed'),
        description: t('auth.tryAgainLater'),
        variant: "destructive",
      });
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 11) {
      toast({
        title: "手机号格式错误",
        description: "请输入正确的11位手机号",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+86${phone}`,
        options: {
          shouldCreateUser: true
        }
      });

      if (error) {
        toast({
          title: "发送验证码失败",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setOtpSent(true);
        toast({
          title: "验证码已发送",
          description: "请检查短信并输入6位验证码",
        });
      }
    } catch (error: any) {
      toast({
        title: "发送验证码失败",
        description: error.message || "发送验证码时发生未知错误",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !otp || otp.length !== 6) {
      toast({
        title: "验证码错误",
        description: "请输入6位验证码",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+86${phone}`,
        token: otp,
        type: 'sms'
      });

      if (error) {
        toast({
          title: "验证码验证失败",
          description: error.message === "Token has expired or is invalid" 
            ? "验证码已过期或无效，请重新发送"
            : error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "登录成功",
          description: "正在跳转...",
        });
      }
    } catch (error: any) {
      toast({
        title: "验证失败",
        description: error.message || "验证时发生未知错误",
        variant: "destructive",
      });
    }
    
    setLoading(false);
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
              <TabsTrigger value="phone">
                <Phone className="w-4 h-4 mr-1" />
                手机登录
              </TabsTrigger>
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

            <TabsContent value="phone">
              <div className="space-y-4">
                {!otpSent ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">手机号码</Label>
                      <div className="flex">
                        <div className="flex items-center px-3 border border-r-0 rounded-l-md border-input bg-muted">
                          <span className="text-sm text-muted-foreground">+86</span>
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="请输入11位手机号"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                          className="rounded-l-none"
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="button"
                      onClick={handleSendOtp}
                      className="w-full bg-primary text-black hover:bg-primary/90 hover:text-black font-bold" 
                      disabled={loading || !phone || phone.length !== 11}
                    >
                      {loading ? "发送中..." : "发送验证码"}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label>验证码已发送到 +86 {phone}</Label>
                      <div className="flex justify-center">
                        <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setOtpSent(false);
                          setOtp("");
                        }}
                        disabled={loading}
                      >
                        重新发送
                      </Button>
                      <Button 
                        type="submit"
                        className="flex-1 bg-accent text-black hover:bg-accent/90 hover:text-black font-bold" 
                        disabled={loading || otp.length !== 6}
                      >
                        {loading ? "验证中..." : "验证登录"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 flex justify-center">
            <LanguageSwitcher />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;