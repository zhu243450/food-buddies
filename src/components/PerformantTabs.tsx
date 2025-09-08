import React, { useState, useMemo, memo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface PerformantTabsProps {
  items: TabItem[];
  defaultValue?: string;
  className?: string;
  lazyLoad?: boolean;
}

export const PerformantTabs = memo<PerformantTabsProps>(({
  items,
  defaultValue,
  className = '',
  lazyLoad = true
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue || items[0]?.id);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(
    new Set(defaultValue ? [defaultValue] : items.slice(0, 1).map(item => item.id))
  );

  // 只渲染已加载的标签页内容
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    if (lazyLoad && !loadedTabs.has(value)) {
      setLoadedTabs(prev => new Set([...prev, value]));
    }
  }, [lazyLoad, loadedTabs]);

  // 优化的标签触发器
  const tabTriggers = useMemo(() => 
    items.map(item => (
      <TabsTrigger 
        key={item.id} 
        value={item.id}
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        {item.label}
      </TabsTrigger>
    )), 
    [items]
  );

  // 只渲染需要的内容
  const tabContents = useMemo(() => 
    items.map(item => (
      <TabsContent 
        key={item.id} 
        value={item.id} 
        className="mt-6"
      >
        {/* 懒加载：只有已加载的标签页才渲染内容 */}
        {(!lazyLoad || loadedTabs.has(item.id)) ? (
          item.content
        ) : (
          // 占位符
          <div className="h-96 bg-muted animate-pulse rounded-md" />
        )}
      </TabsContent>
    )), 
    [items, lazyLoad, loadedTabs]
  );

  return (
    <Tabs 
      value={activeTab}
      onValueChange={handleTabChange}
      className={className}
    >
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
        {tabTriggers}
      </TabsList>
      {tabContents}
    </Tabs>
  );
});

PerformantTabs.displayName = 'PerformantTabs';