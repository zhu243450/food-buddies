import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Terms = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const responsibilityItems = Array.isArray(t('terms.sections.responsibilities.items', { returnObjects: true })) ? t('terms.sections.responsibilities.items', { returnObjects: true }) as string[] : [];
  const rulesItems = Array.isArray(t('terms.sections.rules.items', { returnObjects: true })) ? t('terms.sections.rules.items', { returnObjects: true }) as string[] : [];
  const cancellationItems = Array.isArray(t('terms.sections.cancellation.items', { returnObjects: true })) ? t('terms.sections.cancellation.items', { returnObjects: true }) as string[] : [];
  const disclaimerItems = Array.isArray(t('terms.sections.disclaimer.items', { returnObjects: true })) ? t('terms.sections.disclaimer.items', { returnObjects: true }) as string[] : [];

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
            <CardTitle className="text-2xl text-center">{t('terms.title')}</CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              {t('terms.lastUpdated')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm max-w-none">
            <section>
              <h3 className="text-lg font-semibold mb-3">{t('terms.sections.description.title')}</h3>
              <p className="text-muted-foreground">
                {t('terms.sections.description.content')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('terms.sections.responsibilities.title')}</h3>
              <p className="text-muted-foreground">
                {t('terms.sections.responsibilities.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                {responsibilityItems.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('terms.sections.rules.title')}</h3>
              <p className="text-muted-foreground">
                {t('terms.sections.rules.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                {rulesItems.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('terms.sections.cancellation.title')}</h3>
              <p className="text-muted-foreground">
                {t('terms.sections.cancellation.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                {cancellationItems.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('terms.sections.disclaimer.title')}</h3>
              <p className="text-muted-foreground">
                {t('terms.sections.disclaimer.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                {disclaimerItems.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('terms.sections.changes.title')}</h3>
              <p className="text-muted-foreground">
                {t('terms.sections.changes.content')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('terms.sections.disputes.title')}</h3>
              <p className="text-muted-foreground">
                {t('terms.sections.disputes.content')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">{t('terms.sections.contact.title')}</h3>
              <p className="text-muted-foreground">
                {t('terms.sections.contact.description')}
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