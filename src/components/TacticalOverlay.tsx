import React, { useState, useEffect } from 'react';
import L from 'leaflet';

interface TacticalOverlayProps {
  mapRef: React.RefObject<L.Map | null>;
  showCoords: boolean;
}

export const TacticalOverlay = React.memo(({ mapRef, showCoords }: TacticalOverlayProps) => {
  const [mousePos, setMousePos] = useState({ lat: 25, lng: 15 });
  const [zoom, setZoom] = useState(3);
  
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    const onMouseMove = (e: L.LeafletMouseEvent) => {
      setMousePos({ lat: e.latlng.lat, lng: e.latlng.lng });
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

  return (
    <div className="pointer-events-none absolute inset-0 z-[950] overflow-hidden">
      {/* Corner Brackets */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-luxury-gold/30"></div>
      <div className="absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 border-luxury-gold/30"></div>
      <div className="absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 border-luxury-gold/30"></div>
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-luxury-gold/30"></div>

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center opacity-30">
        <div className="w-full h-[1px] bg-luxury-gold"></div>
        <div className="h-full w-[1px] bg-luxury-gold absolute"></div>
      </div>

      {/* Compass */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-16 h-16 border border-luxury-gold/10 rounded-full flex items-center justify-center">
        <div className="text-[8px] font-mono text-luxury-gold/40 absolute top-1">N</div>
        <div className="text-[8px] font-mono text-luxury-gold/40 absolute bottom-1">S</div>
        <div className="text-[8px] font-mono text-luxury-gold/40 absolute left-1">W</div>
        <div className="text-[8px] font-mono text-luxury-gold/40 absolute right-1">E</div>
        <div className="w-[1px] h-8 bg-luxury-gold/30 rotate-45"></div>
        <div className="w-[1px] h-8 bg-luxury-gold/30 -rotate-45"></div>
      </div>

      {/* Live Coordinates */}
      {showCoords && (
        <div className="absolute bottom-10 right-10 flex flex-col gap-2 text-[10px] font-mono text-luxury-gold tracking-widest bg-luxury-black/80 px-4 py-3 border border-luxury-gold/20 backdrop-blur-md transition-all duration-500 rounded-sm shadow-2xl">
          <div className="flex justify-between gap-4 border-b border-luxury-gold/10 pb-1">
            <span className="opacity-40 uppercase">Lat</span>
            <span>{mousePos.lat.toFixed(6)}°</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-luxury-gold/10 pb-1">
            <span className="opacity-40 uppercase">Lng</span>
            <span>{mousePos.lng.toFixed(6)}°</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="opacity-40 uppercase">Alt</span>
            <span>{Math.max(150, (1000 - zoom * 80)).toFixed(2)}km</span>
          </div>
        </div>
      )}

      {/* Tactical Grid Labels */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-20 text-[8px] font-mono text-luxury-gold/20">
        <span>A-1</span><span>A-2</span><span>A-3</span><span>A-4</span>
      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-20 text-[8px] font-mono text-luxury-gold/20">
        <span>X-01</span><span>X-02</span><span>X-03</span><span>X-04</span>
      </div>
    </div>
  );
});
