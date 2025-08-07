import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Privacy = () => {
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
            <CardTitle className="text-2xl text-center">隐私政策</CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              最后更新：2024年8月7日
            </p>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm max-w-none">
            <section>
              <h3 className="text-lg font-semibold mb-3">1. 信息收集</h3>
              <p className="text-muted-foreground">
                当您使用DineMate服务时，我们可能会收集以下信息：
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>个人身份信息：姓名、邮箱地址、电话号码</li>
                <li>个人资料信息：头像、个人简介、饮食偏好</li>
                <li>位置信息：为了匹配附近的饭局（需要您的授权）</li>
                <li>使用信息：应用使用记录、设备信息</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. 信息使用</h3>
              <p className="text-muted-foreground">
                我们使用收集的信息来：
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>提供和改进我们的服务</li>
                <li>匹配合适的饭局和用户</li>
                <li>发送重要通知和更新</li>
                <li>确保平台安全和防止欺诈</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">3. 信息共享</h3>
              <p className="text-muted-foreground">
                我们不会出售、交易或转让您的个人信息给第三方，除非：
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>获得您的明确同意</li>
                <li>法律要求或政府部门要求</li>
                <li>为了保护我们的权利、财产或安全</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. 数据安全</h3>
              <p className="text-muted-foreground">
                我们采用行业标准的安全措施来保护您的个人信息，包括数据加密、访问控制和定期安全审计。
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. 您的权利</h3>
              <p className="text-muted-foreground">
                您有权：
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>访问和更新您的个人信息</li>
                <li>删除您的账户和相关数据</li>
                <li>限制或反对某些数据处理</li>
                <li>数据可携带性</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. 联系我们</h3>
              <p className="text-muted-foreground">
                如果您对此隐私政策有任何疑问，请通过以下方式联系我们：
              </p>
              <div className="bg-muted p-4 rounded-lg mt-2">
                <p className="text-sm">
                  邮箱：privacy@dinemate.org<br />
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