import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Github, Facebook, Twitter } from "lucide-react";
import type { User, Session } from '@supabase/supabase-js';

const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          navigate("/my-dinners");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate("/my-dinners");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      toast({
        title: "注册失败",
        description: error.message === "User already registered" 
          ? "该邮箱已经注册，请直接登录" 
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "注册成功",
        description: "请检查您的邮箱以确认账户",
      });
    }
    
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "登录失败",
        description: error.message === "Invalid login credentials" 
          ? "邮箱或密码错误" 
          : error.message,
        variant: "destructive",
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
          title: "登录失败",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "登录失败", 
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
          title: "微信登录失败",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "微信登录失败",
        description: "请稍后重试",
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
          title: "QQ登录失败",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "QQ登录失败",
        description: "请稍后重试",
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
          <CardTitle className="text-2xl">饭搭子</CardTitle>
          <CardDescription>找到你的完美饭搭子</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">登录</TabsTrigger>
              <TabsTrigger value="signup">注册</TabsTrigger>
            </TabsList>
            
            {/* 一键登录滑动选择器 */}
            <div className="space-y-4 mt-6">
              <div className="text-center text-sm font-medium text-muted-foreground mb-4">
                一键登录
              </div>
              
              {/* 滑动式社交登录 */}
              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-2 min-w-max">
                  {/* 微信登录 */}
                  <Button
                    variant="outline"
                    onClick={handleWechatLogin}
                    className="flex-col h-20 w-20 p-2 bg-gradient-to-br from-green-400 to-green-600 text-white border-green-500 hover:from-green-500 hover:to-green-700 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl hover-scale"
                    type="button"
                  >
                    <svg className="w-8 h-8 mb-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.7 13.2a1.6 1.6 0 101.6-1.6 1.6 1.6 0 00-1.6 1.6zM14.6 13.2a1.6 1.6 0 101.6-1.6 1.6 1.6 0 00-1.6 1.6z"/>
                      <path d="M16.1 9.1C16.1 6.3 12.8 4 8.7 4S1.3 6.3 1.3 9.1 4.6 14.2 8.7 14.2c1.3 0 2.5-.3 3.6-.8l3.3 1.7z"/>
                      <path d="M18.4 16.8c0-1.9-2.3-3.5-5.1-3.5s-5.1 1.6-5.1 3.5 2.3 3.5 5.1 3.5c.9 0 1.8-.2 2.5-.6l2.3 1.2z"/>
                    </svg>
                    <span className="text-xs">微信</span>
                  </Button>

                  {/* QQ登录 */}
                  <Button
                    variant="outline"
                    onClick={handleQQLogin}
                    className="flex-col h-20 w-20 p-2 bg-gradient-to-br from-blue-400 to-blue-600 text-white border-blue-500 hover:from-blue-500 hover:to-blue-700 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl hover-scale"
                    type="button"
                  >
                    <svg className="w-8 h-8 mb-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    <span className="text-xs">QQ</span>
                  </Button>

                  {/* Google登录 */}
                  <Button
                    variant="outline"
                    onClick={() => handleSocialLogin('google')}
                    className="flex-col h-20 w-20 p-2 bg-gradient-to-br from-red-400 to-red-600 text-white border-red-500 hover:from-red-500 hover:to-red-700 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl hover-scale"
                    type="button"
                  >
                    <svg className="w-8 h-8 mb-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-xs">Google</span>
                  </Button>

                  {/* Facebook登录 */}
                  <Button
                    variant="outline"
                    onClick={() => handleSocialLogin('facebook')}
                    className="flex-col h-20 w-20 p-2 bg-gradient-to-br from-blue-500 to-blue-700 text-white border-blue-600 hover:from-blue-600 hover:to-blue-800 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl hover-scale"
                    type="button"
                  >
                    <Facebook className="w-8 h-8 mb-1" />
                    <span className="text-xs">Facebook</span>
                  </Button>

                  {/* Twitter/X登录 */}
                  <Button
                    variant="outline"
                    onClick={() => handleSocialLogin('twitter')}
                    className="flex-col h-20 w-20 p-2 bg-gradient-to-br from-gray-700 to-black text-white border-gray-600 hover:from-gray-800 hover:to-gray-900 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl hover-scale"
                    type="button"
                  >
                    <Twitter className="w-8 h-8 mb-1" />
                    <span className="text-xs">X</span>
                  </Button>

                  {/* GitHub登录 */}
                  <Button
                    variant="outline"
                    onClick={() => handleSocialLogin('github')}
                    className="flex-col h-20 w-20 p-2 bg-gradient-to-br from-gray-600 to-gray-800 text-white border-gray-500 hover:from-gray-700 hover:to-gray-900 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl hover-scale"
                    type="button"
                  >
                    <Github className="w-8 h-8 mb-1" />
                    <span className="text-xs">GitHub</span>
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">或者使用邮箱</span>
                </div>
              </div>
            </div>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">邮箱</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">密码</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/90 hover:text-black font-bold" disabled={loading}>
                  {loading ? "登录中..." : "登录"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">邮箱</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">密码</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full bg-accent text-black hover:bg-accent/90 hover:text-black font-bold" disabled={loading}>
                  {loading ? "注册中..." : "注册"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;