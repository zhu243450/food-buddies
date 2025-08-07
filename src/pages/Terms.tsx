import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Terms = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
            <CardTitle className="text-2xl text-center">服务条款</CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              最后更新：2024年8月7日
            </p>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm max-w-none">
            <section>
              <h3 className="text-lg font-semibold mb-3">1. 服务说明</h3>
              <p className="text-muted-foreground">
                DineMate（"我们"、"平台"）是一个社交聚餐平台，为用户提供发布和参与聚餐活动的服务。通过使用我们的服务，您同意遵守本服务条款。
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. 用户责任</h3>
              <p className="text-muted-foreground">
                作为平台用户，您需要：
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>提供真实、准确的个人信息</li>
                <li>对您发布的内容承担责任</li>
                <li>尊重其他用户，不进行骚扰或恶意行为</li>
                <li>遵守当地法律法规</li>
                <li>及时履行您承诺参加的聚餐活动</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">3. 平台规则</h3>
              <p className="text-muted-foreground">
                为维护良好的社区环境，我们禁止：
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>发布虚假信息或进行欺诈活动</li>
                <li>发布违法、有害或不当内容</li>
                <li>恶意取消已承诺的聚餐活动</li>
                <li>骚扰、威胁其他用户</li>
                <li>使用自动化工具或机器人</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. 取消政策</h3>
              <p className="text-muted-foreground">
                为保护所有用户的利益，我们制定了以下取消政策：
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>提前24小时以上取消：无限制</li>
                <li>24小时内取消：将影响信用记录</li>
                <li>连续多次临时取消：可能被限制发布新活动</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. 免责声明</h3>
              <p className="text-muted-foreground">
                DineMate作为平台提供商：
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>不对用户间的线下聚餐活动承担责任</li>
                <li>不保证所有信息的准确性</li>
                <li>不对因使用服务而产生的任何损失承担责任</li>
                <li>建议用户在聚餐时注意人身和财产安全</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. 服务变更</h3>
              <p className="text-muted-foreground">
                我们保留随时修改、暂停或终止服务的权利。重大变更将提前通知用户。
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">7. 争议解决</h3>
              <p className="text-muted-foreground">
                因使用本服务产生的争议，应首先通过友好协商解决。协商不成的，提交北京市朝阳区人民法院管辖。
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">8. 联系我们</h3>
              <p className="text-muted-foreground">
                如果您对服务条款有任何疑问，请联系我们：
              </p>
              <div className="bg-muted p-4 rounded-lg mt-2">
                <p className="text-sm">
                  邮箱：legal@dinemate.org<br />
                  电话：+86 400-123-4567<br />
                  地址：北京市朝阳区xxx路xxx号
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};