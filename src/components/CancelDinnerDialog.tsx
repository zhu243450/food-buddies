import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CancelDinnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
  dinnerTitle: string;
  dinnerTime: string;
  isCreator: boolean;
  loading?: boolean;
}

const CancelDinnerDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  dinnerTitle,
  dinnerTime,
  isCreator,
  loading = false
}: CancelDinnerDialogProps) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setReason("");
  };

  // 计算距离开始时间
  const getTimeUntilStart = () => {
    const now = new Date();
    const dinnerDate = new Date(dinnerTime);
    const hoursUntil = Math.floor((dinnerDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    return hoursUntil;
  };

  const hoursUntil = getTimeUntilStart();
  const isLateCancel = hoursUntil < 24;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            {isCreator ? t('dinner.cancel') : t('dinner.leave')}
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
              <p className="font-medium text-foreground">{dinnerTitle}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(dinnerTime).toLocaleString("zh-CN", {
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  weekday: "long",
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {t('dinner.timeUntilStart', { hours: hoursUntil })}
                </span>
              </div>
              
              {isLateCancel && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <Badge variant="destructive" className="mb-2">
                    ⚠️ {t('dinner.lastMinuteCancel')}
                  </Badge>
                  <p className="text-sm text-destructive">
                    {isCreator 
                      ? t('dinner.creatorLateWarning')
                      : t('dinner.participantLateWarning')
                    }
                  </p>
                </div>
              )}
            </div>

            <p className="text-foreground">
              {isCreator 
                ? t('dinner.cancelConfirm')
                : t('dinner.leaveConfirm')
              }
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            {t('dinner.cancelReason')}
          </label>
          <Textarea
            placeholder={isCreator ? t('dinner.cancelReasonPlaceholder') : t('dinner.leaveReasonPlaceholder')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={loading}
          >
            {t('dinner.continueParticipate')}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? t('common.loading') : (isCreator ? t('dinner.confirmCancel') : t('dinner.confirmLeave'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelDinnerDialog;