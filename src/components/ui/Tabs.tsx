import { ReactNode, useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export default function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className="w-full">
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 px-6 py-3 text-sm font-medium rounded-t-lg
                transition-all duration-200 whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-white text-terracotta-600 border-b-2 border-terracotta-500'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="animate-fade-in">
        {activeTabContent}
      </div>
    </div>
  );
}
