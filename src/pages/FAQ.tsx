import React from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { SEO } from '@/components/SEO';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, MessageCircle, Shield, Users, Utensils, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
}

const faqData: FAQItem[] = [
  {
    id: 'getting-started-1',
    category: '入门指南',
    question: '如何开始使用饭约社？',
    answer: '首先注册账号并完善个人资料，包括饮食偏好、个性标签等。然后可以浏览附近的饭局或创建自己的饭局邀请其他用户参加。',
    tags: ['注册', '新手', '开始']
  },
  {
    id: 'getting-started-2',
    category: '入门指南',
    question: '完善个人资料有什么好处？',
    answer: '完善的个人资料可以提高匹配度，让系统为你推荐更合适的饭友和饭局。包括头像、昵称、饮食偏好、个性标签、自我介绍等。',
    tags: ['资料', '匹配', '推荐']
  },
  {
    id: 'dinner-creation-1',
    category: '创建饭局',
    question: '如何创建一个吸引人的饭局？',
    answer: '选择有特色的餐厅，写清楚饭局主题和期望，设置合理的时间和预算，并上传餐厅图片。详细的描述和真诚的邀请更容易吸引合适的饭友。',
    tags: ['创建', '吸引力', '描述']
  },
  {
    id: 'dinner-creation-2',
    category: '创建饭局',
    question: '可以设置哪些参与条件？',
    answer: '可以设置性别偏好（同性、异性、无限制）、年龄范围、饮食偏好匹配、个性标签等。合理的条件设置有助于找到更合适的饭友。',
    tags: ['条件', '筛选', '匹配']
  },
  {
    id: 'participation-1',
    category: '参与饭局',
    question: '如何找到合适的饭局？',
    answer: '使用筛选功能按地区、菜系、时间、预算等条件查找，查看饭局详情和创建者资料，选择与自己兴趣相符的饭局申请参加。',
    tags: ['搜索', '筛选', '选择']
  },
  {
    id: 'participation-2',
    category: '参与饭局',
    question: '申请参加饭局后多久会有回复？',
    answer: '创建者通常在24小时内回复申请。系统会发送通知提醒，也可以在"我的饭局"页面查看申请状态。',
    tags: ['申请', '回复', '时间']
  },
  {
    id: 'safety-1',
    category: '安全须知',
    question: '如何确保聚餐安全？',
    answer: '选择公共场所聚餐，提前告知朋友行程，保护个人隐私信息，如遇不适立即离开。饭约社提供举报功能，维护社区安全。',
    tags: ['安全', '公共场所', '隐私']
  },
  {
    id: 'safety-2',
    category: '安全须知',
    question: '遇到不当行为怎么办？',
    answer: '立即举报不当用户，平台会及时处理。可以在聊天页面或用户资料页面进行举报，提供详细描述和证据。',
    tags: ['举报', '不当行为', '处理']
  },
  {
    id: 'chat-1',
    category: '聊天功能',
    question: '什么时候可以开始聊天？',
    answer: '参加同一个饭局的用户可以互相聊天，聊天时间默认持续到饭局结束后7天。可以在聊天中协商具体见面细节。',
    tags: ['聊天', '时间限制', '交流']
  },
  {
    id: 'chat-2',
    category: '聊天功能',
    question: '聊天记录会保存多久？',
    answer: '聊天记录在会话结束后保留7天，过期后自动删除以保护用户隐私。建议及时保存重要信息。',
    tags: ['聊天记录', '保存', '隐私']
  },
  {
    id: 'cancellation-1',
    category: '取消政策',
    question: '可以取消已创建的饭局吗？',
    answer: '可以取消，但建议提前24小时以上取消以免影响其他参与者。频繁的临时取消可能影响信用评级和发布权限。',
    tags: ['取消', '提前', '信用']
  },
  {
    id: 'cancellation-2',
    category: '取消政策',
    question: '退出已参加的饭局有什么后果？',
    answer: '提前24小时以上退出通常没有影响。临时退出（24小时内）会记录为迟到取消，过多的迟到取消可能限制参与权限。',
    tags: ['退出', '后果', '限制']
  },
  {
    id: 'payment-1',
    category: '费用相关',
    question: '饭局费用如何分摊？',
    answer: '费用分摊方式在饭局创建时设定，通常为AA制。建议在聚餐前确认分摊方式，现场可使用移动支付分账功能。',
    tags: ['费用', 'AA制', '分摊']
  },
  {
    id: 'payment-2',
    category: '费用相关',
    question: '如何处理费用争议？',
    answer: '建议事先明确预算和分摊方式，保留消费凭证。如有争议，可通过平台客服协调解决。',
    tags: ['争议', '预算', '凭证']
  }
];

const categories = Array.from(new Set(faqData.map(item => item.category)));

export const FAQ: React.FC = () => {
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  
  const seoData = getPageSEO('faq');
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '入门指南': return <Users className="h-5 w-5" />;
      case '创建饭局': return <Utensils className="h-5 w-5" />;
      case '参与饭局': return <MapPin className="h-5 w-5" />;
      case '安全须知': return <Shield className="h-5 w-5" />;
      case '聊天功能': return <MessageCircle className="h-5 w-5" />;
      case '取消政策': return <HelpCircle className="h-5 w-5" />;
      case '费用相关': return <HelpCircle className="h-5 w-5" />;
      default: return <HelpCircle className="h-5 w-5" />;
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <SEO {...seoData} />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            <HelpCircle className="inline-block h-10 w-10 mr-3 text-primary" />
            常见问题
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            快速找到关于饭约社使用的答案，让你的美食社交体验更顺畅
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/help">
              <Button variant="outline" size="lg">
                联系客服
              </Button>
            </Link>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="mb-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {categories.map((category) => {
              const categoryQuestions = faqData.filter(item => item.category === category);
              return (
                <Card key={category} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {getCategoryIcon(category)}
                      {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-3">
                      {categoryQuestions.length} 个常见问题
                    </p>
                    <p className="text-sm">
                      {category === '入门指南' && '了解如何开始使用饭约社'}
                      {category === '创建饭局' && '学习创建吸引人的饭局'}
                      {category === '参与饭局' && '掌握参与饭局的技巧'}
                      {category === '安全须知' && '确保安全的聚餐体验'}
                      {category === '聊天功能' && '了解聊天功能和规则'}
                      {category === '取消政策' && '了解取消相关规定'}
                      {category === '费用相关' && '了解费用分摊和处理'}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">全部问题</h2>
          {categories.map((category) => {
            const categoryQuestions = faqData.filter(item => item.category === category);
            return (
              <div key={category} className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  {getCategoryIcon(category)}
                  {category}
                </h3>
                <Accordion type="single" collapsible className="space-y-2">
                  {categoryQuestions.map((item) => (
                    <AccordionItem key={item.id} value={item.id} className="border rounded-lg px-4">
                      <AccordionTrigger className="text-left hover:no-underline">
                        <span className="font-medium">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <p className="text-muted-foreground mb-3">{item.answer}</p>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}
        </section>

        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">快速操作</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/create-dinner">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Utensils className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="font-medium">创建饭局</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/discover">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="font-medium">发现饭局</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/chat-list">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="font-medium">查看聊天</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/help">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <HelpCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="font-medium">联系客服</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Contact Section */}
        <section className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            没有找到答案？
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            联系我们的客服团队，我们将为您提供专业的帮助和支持
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/help">
              <Button size="lg">联系客服</Button>
            </Link>
            <Link to="/feedback">
              <Button variant="outline" size="lg">意见反馈</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};