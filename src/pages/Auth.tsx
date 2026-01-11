import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { Gift, X } from 'lucide-react';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // 从URL获取邀请码
  useEffect(() => {
    const urlInviteCode = searchParams.get('invite');
    if (urlInviteCode) {
      setInviteCode(urlInviteCode);
    }
  }, [searchParams]);

  // 如果用户已登录，不显示认证页面
  if (user) {
    return null;
  }

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
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            invite_code: inviteCode || undefined
          }
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
        // 如果有邀请码，处理邀请注册
        if (inviteCode && data.user) {
          try {
            const { data: inviteResult } = await supabase.rpc('process_invite_registration', {
              invitee_user_id: data.user.id,
              used_invite_code: inviteCode
            });
            
            if (inviteResult?.success) {
              toast({
                title: i18n.language === 'zh' ? '注册成功！' : 'Sign up successful!',
                description: i18n.language === 'zh' 
                  ? `恭喜获得 ${inviteResult.invitee_reward} 积分奖励！请检查邮箱确认注册。`
                  : `Congratulations! You earned ${inviteResult.invitee_reward} bonus points! Please check your email.`,
              });
            } else {
              toast({
                title: t('auth.signUpSuccess'),
                description: t('auth.checkEmailConfirmation'),
              });
            }
          } catch {
            toast({
              title: t('auth.signUpSuccess'),
              description: t('auth.checkEmailConfirmation'),
            });
          }
        } else {
          toast({
            title: t('auth.signUpSuccess'),
            description: t('auth.checkEmailConfirmation'),
          });
        }
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
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: t('auth.signInFailed'),
        description: error.message === "Invalid login credentials" 
          ? t('auth.invalidCredentials')
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('auth.signInSuccess'),
        description: t('auth.redirecting'),
      });
      // AuthContext将处理重定向
    }
    
    setLoading(false);
  };

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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? `${t('auth.signIn')}...` : t('auth.signIn')}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* 邀请码提示 */}
                {inviteCode && (
                  <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <Gift className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary">
                        {i18n.language === 'zh' ? '使用邀请码注册' : 'Register with invite code'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {i18n.language === 'zh' ? '注册成功后可获得50积分奖励！' : 'Get 50 bonus points after registration!'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {inviteCode}
                    </Badge>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setInviteCode('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

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

                {/* 邀请码输入框（如果没有从URL获取） */}
                {!inviteCode && (
                  <div className="space-y-2">
                    <Label htmlFor="invite-code" className="text-muted-foreground">
                      {i18n.language === 'zh' ? '邀请码（可选）' : 'Invite Code (optional)'}
                    </Label>
                    <Input
                      id="invite-code"
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder={i18n.language === 'zh' ? '输入好友的邀请码' : 'Enter friend\'s invite code'}
                      className="font-mono tracking-wider"
                      maxLength={8}
                    />
                  </div>
                )}
                
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
                  className="w-full" 
                  disabled={loading || !agreeToTerms}
                >
                  {loading ? `${t('auth.signUp')}...` : t('auth.signUp')}
                </Button>
              </form>
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