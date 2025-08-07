import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const Help = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const faqs = t('help.faq.items', { returnObjects: true }) as Array<{question: string, answer: string}>;

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

        <div className="space-y-6">
          {/* 页面标题 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">{t('help.title')}</CardTitle>
              <p className="text-muted-foreground text-center">
                {t('help.subtitle')}
              </p>
            </CardHeader>
          </Card>

          {/* 常见问题 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('help.faq.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* 使用指南 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('help.guide.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">{t('help.guide.newUser.title')}</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    {(t('help.guide.newUser.steps', { returnObjects: true }) as string[]).map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">{t('help.guide.publish.title')}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    {(t('help.guide.publish.tips', { returnObjects: true }) as string[]).map((tip: string, index: number) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 联系客服 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('help.support.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{t('help.support.chat.title')}</h4>
                    <p className="text-sm text-muted-foreground">{t('help.support.chat.hours')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{t('help.support.email.title')}</h4>
                    <p className="text-sm text-muted-foreground">{t('help.support.email.address')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{t('help.support.phone.title')}</h4>
                    <p className="text-sm text-muted-foreground">{t('help.support.phone.number')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 安全提示 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('help.safety.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">{t('help.safety.warning')}</h4>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  {(t('help.safety.tips', { returnObjects: true }) as string[]).map((tip: string, index: number) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};