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
import { Github, Facebook, Twitter, Phone, Mail } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { User, Session } from '@supabase/supabase-js';

const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email'); // 默认邮箱模式
  const [isSignIn, setIsSignIn] = useState(true); // 默认登录模式
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  // 倒计时器
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout;
    
    // 先检查当前会话，避免闪烁
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Auth页面检测到已有会话，延迟重定向');
          // 使用延迟重定向避免竞态条件
          redirectTimeout = setTimeout(() => {
            navigate("/my-dinners", { replace: true });
          }, 100);
        }
      } catch (error) {
        console.error('检查会话时出错:', error);
      }
    };

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth页面认证状态变化:', { event, session: !!session });
        setSession(session);
        setUser(session?.user ?? null);
        
        // 只在登录成功时重定向，避免其他状态变化时的误重定向
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('用户成功登录，延迟重定向');
          // 清除之前的重定向
          if (redirectTimeout) {
            clearTimeout(redirectTimeout);
          }
          // 延迟重定向确保状态已更新
          redirectTimeout = setTimeout(() => {
            navigate("/my-dinners", { replace: true });
          }, 200);
        }
      }
    );

    checkInitialSession();

    return () => {
      subscription.unsubscribe();
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [navigate]);

  // 验证手机号格式
  const validatePhoneNumber = (phone: string) => {
    // 简单的中国手机号验证：1开头，11位数字
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // 发送手机验证码
  const handleSendOTP = async () => {
    if (!validatePhoneNumber(phone)) {
      toast({
        title: t('auth.phoneFormatError'),
        description: t('auth.invalidPhoneNumber'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+86${phone}`, // 中国手机号前缀
        options: {
          channel: 'sms'
        }
      });

      if (error) {
        toast({
          title: t('auth.phoneSignUpFailed'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        setOtpSent(true);
        setResendTimer(60); // 60秒倒计时
        toast({
          title: t('auth.verificationCodeSent'),
          description: t('auth.enterVerificationCode'),
        });
      }
    } catch (error: any) {
      toast({
        title: t('auth.phoneSignUpFailed'),
        description: error.message,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  // 验证OTP并登录/注册
  const handleVerifyOTP = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: t('auth.verificationCodeError'),
        description: t('auth.enterVerificationCode'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: `+86${phone}`,
        token: verificationCode,
        type: 'sms'
      });

      if (error) {
        toast({
          title: t('auth.verificationCodeError'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: isSignIn ? t('auth.phoneLoginSuccess') : t('auth.phoneRegistrationSuccess'),
          description: t('auth.redirecting'),
        });
      }
    } catch (error: any) {
      toast({
        title: t('auth.phoneSignInFailed'),
        description: error.message,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

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
          <Tabs value={isSignIn ? "signin" : "signup"} onValueChange={(value) => {
            setIsSignIn(value === "signin");
            setOtpSent(false);
            setVerificationCode("");
            setResendTimer(0);
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              {/* 登录模式选择 */}
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={authMode === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setAuthMode('email');
                    setOtpSent(false);
                    setVerificationCode("");
                  }}
                  className="flex-1 gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {t('auth.loginWithEmail')}
                </Button>
                <Button
                  type="button"
                  variant={authMode === 'phone' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setAuthMode('phone');
                    setOtpSent(false);
                    setVerificationCode("");
                  }}
                  className="flex-1 gap-2"
                >
                  <Phone className="h-4 w-4" />
                  {t('auth.loginWithPhone')}
                </Button>
              </div>

              {authMode === 'email' ? (
                // 邮箱登录表单
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
              ) : (
                // 手机号登录表单
                <div className="space-y-4">
                  {!otpSent ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signin-phone">{t('auth.phone')}</Label>
                        <div className="flex">
                          <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground">
                            +86
                          </div>
                          <Input
                            id="signin-phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="13800138000"
                            className="rounded-l-none"
                            maxLength={11}
                            required
                          />
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        onClick={handleSendOTP}
                        className="w-full bg-primary text-black hover:bg-primary/90 hover:text-black font-bold" 
                        disabled={loading || !phone}
                      >
                        {loading ? `${t('auth.sendVerificationCode')}...` : t('auth.sendVerificationCode')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signin-otp">{t('auth.enterVerificationCode')}</Label>
                        <Input
                          id="signin-otp"
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          maxLength={6}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          onClick={handleVerifyOTP}
                          className="flex-1 bg-primary text-black hover:bg-primary/90 hover:text-black font-bold" 
                          disabled={loading || !verificationCode}
                        >
                          {loading ? `${t('auth.signIn')}...` : t('auth.signIn')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSendOTP}
                          disabled={resendTimer > 0 || loading}
                        >
                          {resendTimer > 0 ? `${resendTimer}s` : t('auth.resendCode')}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="signup">
              {/* 注册模式选择 */}
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={authMode === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setAuthMode('email');
                    setOtpSent(false);
                    setVerificationCode("");
                  }}
                  className="flex-1 gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {t('auth.registerWithEmail')}
                </Button>
                <Button
                  type="button"
                  variant={authMode === 'phone' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setAuthMode('phone');
                    setOtpSent(false);
                    setVerificationCode("");
                  }}
                  className="flex-1 gap-2"
                >
                  <Phone className="h-4 w-4" />
                  {t('auth.registerWithPhone')}
                </Button>
              </div>

              {authMode === 'email' ? (
                // 邮箱注册表单
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
              ) : (
                // 手机号注册表单
                <div className="space-y-4">
                  {!otpSent ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-phone">{t('auth.phone')}</Label>
                        <div className="flex">
                          <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground">
                            +86
                          </div>
                          <Input
                            id="signup-phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="13800138000"
                            className="rounded-l-none"
                            maxLength={11}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <Checkbox 
                          id="phone-terms" 
                          checked={agreeToTerms}
                          onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                        />
                        <Label htmlFor="phone-terms" className="text-sm text-muted-foreground leading-relaxed">
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
                        type="button" 
                        onClick={handleSendOTP}
                        className="w-full bg-accent text-black hover:bg-accent/90 hover:text-black font-bold" 
                        disabled={loading || !phone || !agreeToTerms}
                      >
                        {loading ? `${t('auth.sendVerificationCode')}...` : t('auth.sendVerificationCode')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-otp">{t('auth.enterVerificationCode')}</Label>
                        <Input
                          id="signup-otp"
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          maxLength={6}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          onClick={handleVerifyOTP}
                          className="flex-1 bg-accent text-black hover:bg-accent/90 hover:text-black font-bold" 
                          disabled={loading || !verificationCode}
                        >
                          {loading ? `${t('auth.signUp')}...` : t('auth.signUp')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSendOTP}
                          disabled={resendTimer > 0 || loading}
                        >
                          {resendTimer > 0 ? `${resendTimer}s` : t('auth.resendCode')}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
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