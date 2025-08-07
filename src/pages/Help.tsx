import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const Help = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const faqs = [
    {
      question: "如何发布饭局？",
      answer: "在首页点击发布饭局按钮，填写饭局详情包括时间、地点、人数限制、饮食偏好等信息，然后提交审核即可。"
    },
    {
      question: "如何参加饭局？",
      answer: "在发现页面浏览饭局列表，点击感兴趣的饭局查看详情，然后点击参加按钮即可。饭局创建者会收到通知。"
    },
    {
      question: "可以取消已参加的饭局吗？",
      answer: "可以取消，但建议提前24小时通知。频繁的临时取消可能会影响您的信用评级，限制未来参与饭局的权限。"
    },
    {
      question: "如何设置饮食偏好？",
      answer: "在个人资料页面可以设置您的饮食偏好和禁忌，系统会根据这些信息为您推荐更合适的饭局。"
    },
    {
      question: "安全保障措施有哪些？",
      answer: "我们建议在公共场所聚餐，保护个人隐私信息，如有异常情况及时联系客服。平台会记录用户行为，维护社区安全。"
    },
    {
      question: "如何联系其他用户？",
      answer: "参加饭局后可以通过平台内聊天功能与其他参与者交流，讨论聚餐安排和分享美食体验。"
    },
    {
      question: "账号被限制怎么办？",
      answer: "如果因为多次临时取消等行为导致账号被限制，请联系客服说明情况。我们会根据具体情况进行处理。"
    },
    {
      question: "如何删除账号？",
      answer: "如需删除账号，请发送邮件至support@dinemate.org，我们会在7个工作日内处理您的请求。"
    }
  ];

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
              <CardTitle className="text-2xl text-center">帮助中心</CardTitle>
              <p className="text-muted-foreground text-center">
                常见问题解答和使用指南
              </p>
            </CardHeader>
          </Card>

          {/* 常见问题 */}
          <Card>
            <CardHeader>
              <CardTitle>常见问题</CardTitle>
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
              <CardTitle>快速使用指南</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">新用户入门</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>完善个人资料信息</li>
                    <li>设置饮食偏好和禁忌</li>
                    <li>浏览附近的饭局</li>
                    <li>参加第一个饭局</li>
                    <li>与其他用户交流</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">发布饭局技巧</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>选择合适的时间和地点</li>
                    <li>详细描述饭局特色</li>
                    <li>设置合理的人数限制</li>
                    <li>明确饮食偏好要求</li>
                    <li>及时回复参与者消息</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 联系客服 */}
          <Card>
            <CardHeader>
              <CardTitle>联系客服</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium">在线客服</h4>
                    <p className="text-sm text-muted-foreground">工作时间：9:00-21:00</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium">邮箱支持</h4>
                    <p className="text-sm text-muted-foreground">support@dinemate.org</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium">电话客服</h4>
                    <p className="text-sm text-muted-foreground">400-123-4567</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 安全提示 */}
          <Card>
            <CardHeader>
              <CardTitle>安全提示</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">请注意安全</h4>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>选择公共场所聚餐，避免私人住所</li>
                  <li>不要透露过多个人隐私信息</li>
                  <li>如遇到不当行为，及时举报</li>
                  <li>建议告知朋友聚餐安排</li>
                  <li>保持理性消费，避免纠纷</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};