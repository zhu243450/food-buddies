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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div 
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          border: '2px solid #ffffff',
          padding: '24px'
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
            padding: '4px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10
          }}
          type="button"
        >
          <X style={{ width: '20px', height: '20px', color: '#6b7280' }} />
        </button>

        {/* 标题 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            flexShrink: 0,
            width: '40px',
            height: '40px',
            backgroundColor: '#fef2f2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle style={{ width: '20px', height: '20px', color: '#dc2626' }} />
          </div>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#111827', 
            margin: 0 
          }}>
            {isCreator ? t('dinner.cancel') : t('dinner.leave')}
          </h2>
        </div>

        {/* 饭局信息 */}
        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            fontWeight: '500', 
            color: '#111827', 
            marginBottom: '8px', 
            margin: 0 
          }}>
            {dinnerTitle}
          </h3>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '14px', 
            color: '#6b7280' 
          }}>
            <Calendar style={{ width: '16px', height: '16px' }} />
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
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              ⚠️ {t('dinner.lastMinuteCancel')}
            </div>
            <p style={{ 
              fontSize: '14px', 
              color: '#dc2626', 
              margin: 0 
            }}>
              {isCreator 
                ? t('dinner.creatorLateWarning')
                : t('dinner.participantLateWarning')
              }
            </p>
          </div>
        )}

        <p style={{ 
          marginBottom: '24px', 
          color: '#374151', 
          fontSize: '14px',
          margin: '0 0 24px 0'
        }}>
          {isCreator 
            ? t('dinner.cancelConfirm')
            : t('dinner.leaveConfirm')
          }
        </p>

        {/* 取消原因输入 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#111827' 
          }}>
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
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            rows={3}
          />
        </div>

        {/* 按钮 */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end' 
        }}>
          <button
            onClick={handleCancel}
            disabled={loading}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {t('dinner.continueParticipate')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'white',
              backgroundColor: '#dc2626',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
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