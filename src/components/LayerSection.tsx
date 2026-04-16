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
    <div className="border-b border-luxury-gold/5 pb-2">
      <div 
        className="flex items-center justify-between cursor-pointer mb-2 group"
        onClick={onToggleCollapse}
      >
        <h3 className="text-[10px] font-light opacity-30 tracking-[0.2em] uppercase group-hover:opacity-60 transition-opacity">{title}</h3>
        <ChevronDown size={10} className={`opacity-20 transition-transform duration-300 ${collapsed ? '-rotate-90' : ''}`} />
      </div>
      
      {!collapsed && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
          {items.map((item) => (
            <div 
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`flex items-center justify-between p-2.5 cursor-pointer transition-all duration-300 ${activeLayers[item.id] ? 'bg-luxury-gold/10 border border-luxury-gold/20' : 'hover:bg-luxury-bone/5 border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={14} className={activeLayers[item.id] ? 'text-luxury-gold' : 'opacity-30'} />
                <span className={`text-[11px] font-light tracking-wide ${activeLayers[item.id] ? 'text-luxury-bone' : 'text-luxury-bone/40'}`}>{item.label}</span>
              </div>
              <div className={`w-1 h-1 rounded-full ${activeLayers[item.id] ? 'bg-luxury-gold shadow-[0_0_8px_#D4AF37]' : 'bg-luxury-bone/10'}`}></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
