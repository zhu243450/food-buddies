import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEO } from "@/components/SEO";
import { useSEO } from "@/hooks/useSEO";

export const About = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getPageSEO } = useSEO();
  
  const seoData = getPageSEO('about');

  return (
    <>
      <SEO {...seoData} />
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => {
              try {
                if (document.referrer && document.referrer !== window.location.href) {
                  navigate(-1);
                } else {
                  navigate('/my-dinners');
                }
              } catch {
                navigate('/my-dinners');
              }
            }}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Button>
        </div>

        <div className="space-y-6">
          {/* 关于我们 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">{t('about.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center text-lg">
                {t('about.subtitle')}
              </p>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>
                  {t('about.description')}
                </p>
                <p>
                  {t('about.mission')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 公司信息 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('about.company.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">{t('about.company.basic.title')}</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>{t('about.company.basic.email')}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">{t('about.company.business.title')}</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {(t('about.company.business.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                      <p key={index}>{item}</p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 联系方式 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('about.contact.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">{t('about.contact.email.title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('about.contact.email.customer')}<br />
                    {t('about.contact.email.business')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
    </>
  );
};