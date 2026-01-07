import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { LogIn, UserPlus, Sparkles, X } from "lucide-react";
import { useState, useEffect } from "react";

interface GuestBrowsePromptProps {
  show: boolean;
  onClose?: () => void;
}

export const GuestBrowsePrompt = ({ show, onClose }: GuestBrowsePromptProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (show && !dismissed) {
      // 延迟显示，让用户先看看内容
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [show, dismissed]);

  if (!visible || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-4 animate-slide-up">
      <div className="relative max-w-md mx-auto">
        {/* 关闭按钮 */}
        <button 
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-gradient-to-r from-primary/10 via-card to-accent/10 backdrop-blur-lg rounded-2xl border border-primary/20 p-4 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-foreground mb-1">
                {t('guest.promptTitle', '发现感兴趣的饭局了吗？')}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {t('guest.promptDesc', '登录后即可参加饭局，认识更多饭友')}
              </p>
              
               <div className="flex gap-2">
                 <Button 
                   size="sm" 
                   onClick={() => navigate("/auth")}
                   className="bg-gradient-primary text-primary-foreground hover:opacity-90"
                 >
                   <LogIn className="w-4 h-4 mr-1" />
                   {t('auth.signIn', '登录')}
                 </Button>
                 <Button 
                   size="sm" 
                   variant="outline"
                   onClick={() => navigate("/auth")}
                   className="border-primary/50 text-primary"
                 >
                   <UserPlus className="w-4 h-4 mr-1" />
                   {t('auth.signUp', '注册')}
                 </Button>
               </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
