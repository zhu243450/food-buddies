import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Privacy = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 安全获取数组数据的辅助函数
  const getArrayData = (key: string): string[] => {
    const data = t(key, { returnObjects: true });
    if (Array.isArray(data)) {
      return data.filter(item => typeof item === 'string') as string[];
    }
    return [];
  };

  const collectionItems = getArrayData('privacy.sections.collection.items');
  const usageItems = getArrayData('privacy.sections.usage.items');
  const sharingItems = getArrayData('privacy.sections.sharing.items');
  const rightsItems = getArrayData('privacy.sections.rights.items');
  const thirdPartyItems = getArrayData('privacy.sections.thirdParties.items');
  const legalItems = getArrayData('privacy.sections.legal.items');
  const cookiesItems = getArrayData('privacy.sections.cookies.items');
  const retentionItems = getArrayData('privacy.sections.retention.items');
  const exerciseItems = getArrayData('privacy.sections.exercise.items');

  useEffect(() => {
    document.title = `${t('privacy.title')} - 饭约社`;
  }, [t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-center">{t('privacy.title')}</h1>
            <p className="text-sm text-muted-foreground text-center">
              {t('privacy.lastUpdated')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm max-w-none">
            <section>
              <h3 className="text-lg font-semibold mb-3">{t('privacy.sections.collection.title')}</h3>
              <p className="text-muted-foreground">
                {t('privacy.sections.collection.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                {collectionItems.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('privacy.sections.usage.title')}</h3>
              <p className="text-muted-foreground">
                {t('privacy.sections.usage.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                {usageItems.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('privacy.sections.thirdParties.title')}</h3>
              <p className="text-muted-foreground">
                {t('privacy.sections.thirdParties.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                {thirdPartyItems.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('privacy.sections.legal.title')}</h3>
              <p className="text-muted-foreground">
                {t('privacy.sections.legal.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                {legalItems.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('privacy.sections.sharing.title')}</h3>
              <p className="text-muted-foreground">
                {t('privacy.sections.sharing.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                {sharingItems.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('privacy.sections.security.title')}</h3>
              <p className="text-muted-foreground">
                {t('privacy.sections.security.description')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('privacy.sections.rights.title')}</h3>
              <p className="text-muted-foreground">
                {t('privacy.sections.rights.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                {rightsItems.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('privacy.sections.exercise.title')}</h3>
              <p className="text-muted-foreground">
                {t('privacy.sections.exercise.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                {exerciseItems.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('privacy.sections.cookies.title')}</h3>
              <p className="text-muted-foreground">
                {t('privacy.sections.cookies.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                {cookiesItems.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('privacy.sections.crossBorder.title')}</h3>
              <p className="text-muted-foreground">
                {t('privacy.sections.crossBorder.description')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('privacy.sections.retention.title')}</h3>
              <p className="text-muted-foreground">
                {t('privacy.sections.retention.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                {retentionItems.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('privacy.sections.children.title')}</h3>
              <p className="text-muted-foreground">
                {t('privacy.sections.children.description')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('privacy.sections.updates.title')}</h3>
              <p className="text-muted-foreground">
                {t('privacy.sections.updates.description')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('privacy.sections.contact.title')}</h3>
              <p className="text-muted-foreground">
                {t('privacy.sections.contact.description')}
              </p>
              <div className="bg-muted p-4 rounded-lg mt-2">
                <p className="text-sm">
                  {t('contact.emailLabel')}：{t('contact.email')}<br />
                  {t('contact.phoneLabel')}：{t('contact.phone')}<br />
                  {t('contact.addressLabel')}：{t('contact.address')}
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};