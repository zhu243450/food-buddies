import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const About = () => {
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

        <div className="space-y-6">
          {/* 关于我们 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">关于DineMate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center text-lg">
                连接美食，分享快乐。让每一次聚餐都成为美好回忆。
              </p>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>
                  DineMate是一个专注于社交聚餐的平台，致力于帮助人们发现志趣相投的伙伴，共同享受美食时光。
                  无论你是想结识新朋友、探索当地美食，还是想组织一场有趣的聚餐，DineMate都能为你提供完美的解决方案。
                </p>
                <p>
                  我们相信，分享美食不仅仅是满足味蕾，更是建立人际关系、传递温暖的重要方式。
                  通过我们的平台，你可以轻松找到附近的聚餐活动，或者发起属于自己的美食聚会。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 公司信息 */}
          <Card>
            <CardHeader>
              <CardTitle>公司信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">基本信息</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>公司名称：北京聚餐科技有限公司</p>
                    <p>统一社会信用代码：91110000000000000X</p>
                    <p>成立时间：2024年1月</p>
                    <p>注册资本：100万元人民币</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">经营范围</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• 互联网信息服务</p>
                    <p>• 软件开发与技术服务</p>
                    <p>• 数据处理和存储服务</p>
                    <p>• 企业管理咨询</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 联系方式 */}
          <Card>
            <CardHeader>
              <CardTitle>联系我们</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">邮箱联系</h4>
                    <p className="text-sm text-muted-foreground">
                      客服邮箱：support@dinemate.org<br />
                      商务合作：business@dinemate.org<br />
                      法务事务：legal@dinemate.org
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">电话联系</h4>
                    <p className="text-sm text-muted-foreground">
                      客服热线：400-123-4567<br />
                      工作时间：9:00-18:00<br />
                      （周一至周五）
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">办公地址</h4>
                    <p className="text-sm text-muted-foreground">
                      北京市朝阳区<br />
                      建国门外大街1号<br />
                      国贸大厦A座2001室
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 备案信息 */}
          <Card>
            <CardHeader>
              <CardTitle>备案信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
                <div>
                  <p>网站备案号：京ICP备2024000001号</p>
                  <p>网络文化经营许可证：京网文[2024]0001-001号</p>
                </div>
                <div>
                  <p>增值电信业务经营许可证：京B2-20240001</p>
                  <p>食品经营许可证：JY11010000000001</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};