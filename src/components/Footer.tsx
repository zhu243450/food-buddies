import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 公司信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">饭约社</h3>
            <p className="text-sm text-muted-foreground">
              连接美食，分享快乐。让每一次聚餐都成为美好回忆。
            </p>
            <p className="text-xs text-muted-foreground">
              智享云上科技发展（广东东莞市）有限责任公司
            </p>
          </div>

          {/* 快速链接 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">{t('footer.about')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-primary transition-colors">
                  {t('footer.help')}
                </Link>
              </li>
            </ul>
          </div>

          {/* 法律信息 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">{t('footer.terms')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>

          {/* 联系我们 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">{t('footer.contact')}</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>邮箱：weishang99@gmail.com</p>
              <p>电话：+86 19068522408</p>
              <div className="pt-2">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />
        
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>{t('footer.copyright')}</p>
          <p>智享云上科技发展（广东东莞市）有限责任公司</p>
        </div>
      </div>
    </footer>
  );
};