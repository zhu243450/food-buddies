import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Clock, Trash2, Download, FileText } from 'lucide-react';

interface PrivacyComplianceProps {
  className?: string;
}

export function PrivacyCompliance({ className }: PrivacyComplianceProps) {
  const complianceItems = [
    {
      icon: Shield,
      title: 'GDPR 合规',
      description: '符合欧盟通用数据保护条例',
      status: 'compliant',
      details: [
        '数据最小化原则：只收集必要数据',
        '用户同意机制：明确告知数据使用目的',
        '数据可携带权：用户可导出个人数据',
        '被遗忘权：用户可申请删除账户'
      ]
    },
    {
      icon: Eye,
      title: '透明度原则',
      description: '用户了解数据处理方式',
      status: 'compliant',
      details: [
        '隐私政策详细说明数据使用',
        '管理员访问记录完整审计',
        '举报调查流程公开透明',
        '用户可查询数据访问历史'
      ]
    },
    {
      icon: Clock,
      title: '数据保留期限',
      description: '合理的数据保存时间',
      status: 'compliant',
      details: [
        '聊天记录：正常保存，举报时可访问',
        '审计日志：90天后自动清理',
        '已解决举报：相关数据定期清理',
        '用户注销：数据在30天内删除'
      ]
    },
    {
      icon: Trash2,
      title: '数据清理机制',
      description: '自动清理过期数据',
      status: 'compliant',
      details: [
        '定期清理已解决举报的访问日志',
        '用户注销后数据清理流程',
        '过期会话数据自动归档',
        '图片文件定期清理优化'
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-100 text-green-800 border-green-300">✓ 合规</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">⚠ 注意</Badge>;
      case 'violation':
        return <Badge variant="destructive">✗ 违规</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            隐私保护与合规状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {complianceItems.map((item, index) => (
              <Card key={index} className="border border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{item.title}</span>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1">
                    {item.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="text-xs text-green-700 flex items-start gap-1">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 用户权利说明 */}
          <Card className="mt-4 border border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                用户数据权利
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <div className="font-medium text-blue-800">访问权</div>
                  <p className="text-xs text-blue-700">用户可以申请查看平台收集的个人数据</p>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-blue-800">更正权</div>
                  <p className="text-xs text-blue-700">用户可以要求更正不准确的个人数据</p>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-blue-800">删除权</div>
                  <p className="text-xs text-blue-700">用户可以要求删除其个人数据（被遗忘权）</p>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-blue-800">可携带权</div>
                  <p className="text-xs text-blue-700">用户可以申请导出个人数据</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 法规符合性 */}
          <Card className="mt-4 border border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">法规符合性</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-purple-800">欧盟 GDPR</div>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-300 mt-1">✓ 合规</Badge>
                </div>
                <div className="text-center">
                  <div className="font-medium text-purple-800">美国 CCPA</div>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-300 mt-1">✓ 合规</Badge>
                </div>
                <div className="text-center">
                  <div className="font-medium text-purple-800">中国《个保法》</div>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-300 mt-1">✓ 合规</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}