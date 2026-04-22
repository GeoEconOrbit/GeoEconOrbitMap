import React from 'react';
import { ChevronDown } from 'lucide-react';

interface LayerSectionProps {
  title: string;
  items: Array<{
    id: string;
    label: string;
    icon: any;
    color?: string;
  }>;
  activeLayers: Record<string, boolean>;
  toggle: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const LayerSection = React.memo(({ 
  title, 
  items, 
  activeLayers, 
  toggle, 
  collapsed, 
  onToggleCollapse 
}: LayerSectionProps) => {
  return (
    <div className="pb-2">
      <div 
        className="flex items-center justify-between cursor-pointer mb-3 group px-1"
        onClick={onToggleCollapse}
      >
        <h3 className="text-[10px] font-semibold text-geo-text-muted tracking-[0.2em] uppercase group-hover:text-geo-accent transition-colors duration-300">{title}</h3>
        <ChevronDown size={12} className={`text-geo-text-muted transition-all duration-300 group-hover:text-geo-accent ${collapsed ? '-rotate-90' : ''}`} />
      </div>
      
      {!collapsed && (
        <div className="space-y-1">
          {items.map((item) => (
            <div 
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-300 group/item ${
                activeLayers[item.id] 
                  ? 'bg-geo-accent/10 border border-geo-accent/20 shadow-[0_0_15px_rgba(59,130,246,0.08)]' 
                  : 'hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                  activeLayers[item.id] 
                    ? 'bg-geo-accent/20 text-geo-accent' 
                    : 'text-geo-text-muted group-hover/item:text-geo-text-dim'
                }`}>
                  <item.icon size={14} />
                </div>
                <span className={`text-[11px] font-medium tracking-wide transition-colors duration-300 ${
                  activeLayers[item.id] ? 'text-geo-text' : 'text-geo-text-muted group-hover/item:text-geo-text-dim'
                }`}>{item.label}</span>
              </div>
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                activeLayers[item.id] 
                  ? 'bg-geo-accent shadow-[0_0_8px_rgba(59,130,246,0.6)]' 
                  : 'bg-geo-border'
              }`}></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
