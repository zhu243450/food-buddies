import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Clock, Calendar } from "lucide-react";

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
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
          {/* 关闭按钮 */}
          <button
            onClick={() => onOpenChange(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>

          {/* 标题 */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              margin: 0, 
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#dc2626'
            }}>
              <AlertTriangle style={{ width: '20px', height: '20px' }} />
              {isCreator ? t('dinner.cancel') : t('dinner.leave')}
            </h2>
          </div>

          {/* 饭局信息 */}
          <div style={{ 
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '6px', 
            padding: '16px', 
            marginBottom: '20px' 
          }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' }}>
              {dinnerTitle}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '14px' }}>
              <Calendar style={{ width: '16px', height: '16px' }} />
              {new Date(dinnerTime).toLocaleString("zh-CN", {
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                weekday: "long",
              })}
            </div>
          </div>

          {/* 时间警告 */}
          {isLateCancel && (
            <div style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '6px', 
              padding: '16px', 
              marginBottom: '20px' 
            }}>
              <div style={{ 
                backgroundColor: '#dc2626', 
                color: 'white', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                fontSize: '12px',
                display: 'inline-block',
                marginBottom: '8px'
              }}>
                ⚠️ {t('dinner.lastMinuteCancel')}
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#dc2626' }}>
                {isCreator 
                  ? t('dinner.creatorLateWarning')
                  : t('dinner.participantLateWarning')
                }
              </p>
            </div>
          )}

          <p style={{ marginBottom: '20px', color: '#1f2937' }}>
            {isCreator 
              ? t('dinner.cancelConfirm')
              : t('dinner.leaveConfirm')
            }
          </p>

          {/* 取消原因输入 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1f2937' }}>
              {t('dinner.cancelReason')}
            </label>
            <textarea
              placeholder={isCreator ? t('dinner.cancelReasonPlaceholder') : t('dinner.leaveReasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* 按钮 */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancel}
              disabled={loading}
              style={{
                padding: '12px 20px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {t('dinner.continueParticipate')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#dc2626',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {loading ? t('common.loading') : (isCreator ? t('dinner.confirmCancel') : t('dinner.confirmLeave'))}
            </button>
          </div>
        </div>
    </div>
  );
};

export default CancelDinnerDialog;