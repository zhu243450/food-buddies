import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Privacy = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const collectionItems = t('privacy.sections.collection.items', { returnObjects: true }) as string[];
  const usageItems = t('privacy.sections.usage.items', { returnObjects: true }) as string[];
  const sharingItems = t('privacy.sections.sharing.items', { returnObjects: true }) as string[];
  const rightsItems = t('privacy.sections.rights.items', { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{t('privacy.title')}</CardTitle>
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
              <h3 className="text-lg font-semibold mb-3">{t('privacy.sections.contact.title')}</h3>
              <p className="text-muted-foreground">
                {t('privacy.sections.contact.description')}
              </p>
              <div className="bg-muted p-4 rounded-lg mt-2">
                <p className="text-sm">
                  邮箱：weishang99@gmail.com<br />
                  电话：+86 19068522408<br />
                  地址：广东省东莞市塘厦镇塘莆东路22号之一
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};