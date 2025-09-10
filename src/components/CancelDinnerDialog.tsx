import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, X, Calendar } from "lucide-react";

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

  // 锁定body滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div 
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
          type="button"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-6">
          {/* 标题 */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isCreator ? t('dinner.cancel') : t('dinner.leave')}
            </h2>
          </div>

          {/* 饭局信息 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">
              {dinnerTitle}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(dinnerTime).toLocaleString("zh-CN", {
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  weekday: "long",
                })}
              </span>
            </div>
          </div>

          {/* 时间警告 */}
          {isLateCancel && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="inline-flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium mb-2">
                ⚠️ {t('dinner.lastMinuteCancel')}
              </div>
              <p className="text-sm text-red-700">
                {isCreator 
                  ? t('dinner.creatorLateWarning')
                  : t('dinner.participantLateWarning')
                }
              </p>
            </div>
          )}

          <p className="text-gray-700 mb-6">
            {isCreator 
              ? t('dinner.cancelConfirm')
              : t('dinner.leaveConfirm')
            }
          </p>

          {/* 取消原因输入 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {t('dinner.cancelReason')}
            </label>
            <textarea
              placeholder={isCreator ? t('dinner.cancelReasonPlaceholder') : t('dinner.leaveReasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md text-sm resize-vertical focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
            />
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {t('dinner.continueParticipate')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {loading ? t('common.loading') : (isCreator ? t('dinner.confirmCancel') : t('dinner.confirmLeave'))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelDinnerDialog;