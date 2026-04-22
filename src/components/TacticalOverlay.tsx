import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';

interface TacticalOverlayProps {
  mapRef: React.RefObject<L.Map | null>;
  showCoords: boolean;
}

export const TacticalOverlay = React.memo(({ mapRef, showCoords }: TacticalOverlayProps) => {
  const [mousePos, setMousePos] = useState({ lat: 25, lng: 15, x: 0, y: 0 });
  const [zoom, setZoom] = useState(3);
  const rippleRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    const onMouseMove = (e: L.LeafletMouseEvent) => {
      setMousePos({ lat: e.latlng.lat, lng: e.latlng.lng, x: e.containerPoint.x, y: e.containerPoint.y });
    };
    
    const onZoom = () => {
      setZoom(map.getZoom());
    };

    map.on('mousemove', onMouseMove);
    map.on('zoomend', onZoom);
    
    return () => {
      map.off('mousemove', onMouseMove);
      map.off('zoomend', onZoom);
    };
  }, [mapRef]);

  const altitude = Math.max(0.5, (40000 / Math.pow(2, zoom))).toFixed(1);

  return (
    <div className="pointer-events-none absolute inset-0 z-[950] overflow-hidden mix-blend-screen">
      {/* Dynamic Water Caustic Effect at Cursor */}
      <div 
        ref={rippleRef}
        className="water-cursor-effect absolute w-96 h-96 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none opacity-40 mix-blend-color-dodge"
        style={{ left: mousePos.x, top: mousePos.y }}
      ></div>

      {/* Modern High-End Corner Brackets removed as requested */}

      {/* Subtle Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center opacity-30">
        <div className="w-full h-[1px] bg-geo-cyan shadow-[0_0_8px_rgba(6,182,212,1)]"></div>
        <div className="h-full w-[1px] bg-geo-cyan shadow-[0_0_8px_rgba(6,182,212,1)] absolute"></div>
        <div className="w-1.5 h-1.5 bg-geo-cyan rounded-full absolute shadow-[0_0_10px_rgba(6,182,212,1)]"></div>
      </div>

      {/* Compass */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-16 h-16 border border-geo-cyan/20 rounded-full flex items-center justify-center backdrop-blur-sm bg-black/10">
        <div className="text-[9px] font-display text-geo-cyan absolute -top-1 font-bold shadow-[0_0_5px_rgba(6,182,212,0.5)]">N</div>
        <div className="text-[8px] font-mono text-geo-text-muted absolute -bottom-1">S</div>
        <div className="text-[8px] font-mono text-geo-text-muted absolute -left-1">W</div>
        <div className="text-[8px] font-mono text-geo-text-muted absolute -right-1">E</div>
        <div className="w-[1px] h-8 bg-gradient-to-b from-geo-cyan/50 to-transparent"></div>
      </div>

      {/* Live Coordinates */}
      {showCoords && (
        <div className="absolute bottom-16 right-12 bg-black/60 backdrop-blur-2xl border border-geo-cyan/30 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col gap-2">
          <div className="flex justify-between gap-8 text-xs font-mono">
            <span className="text-geo-text-muted tracking-widest uppercase">Lat</span>
            <span className="text-geo-cyan font-bold">{mousePos.lat.toFixed(6)}°</span>
          </div>
          <div className="flex justify-between gap-8 text-xs font-mono pt-2 border-t border-white/10">
            <span className="text-geo-text-muted tracking-widest uppercase">Lng</span>
            <span className="text-geo-cyan font-bold">{mousePos.lng.toFixed(6)}°</span>
          </div>
          <div className="flex justify-between gap-8 text-xs font-mono pt-2 border-t border-white/10">
            <span className="text-geo-text-muted tracking-widest uppercase">Alt</span>
            <span className="text-geo-accent font-bold drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]">{altitude} km</span>
          </div>
        </div>
      )}
    </div>
  );
});
