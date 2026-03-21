import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { Navigation, Compass, Maximize2, Minimize2, Map as MapIcon } from "lucide-react";
import { motion } from "framer-motion";
import L from "leaflet";

// Auto-rotate map based on heading
function MapRotation({ heading }) {
  const map = useMap();
  useEffect(() => {
    if (heading !== null) {
      const mapContainer = map.getContainer();
      mapContainer.style.transform = `rotate(${-heading}deg)`;
    }
  }, [heading, map]);
  return null;
}

// Auto-center and zoom
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function StreetViewMode({ currentPosition, heading, onExit }) {
  const [zoom, setZoom] = useState(18);
  const [tilt, setTilt] = useState(60); // Perspective tilt
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState("satellite"); // satellite or street
  const containerRef = useRef(null);

  const speed = currentPosition?.speed ? Math.round(currentPosition.speed * 3.6) : 0;
  const compassHeading = heading || 0;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Satellite tile layers
  const satelliteLayers = {
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    street: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-slate-950">
      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30">
                <div className="flex items-center gap-3">
                  <Navigation className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-white font-black text-2xl">{speed} km/h</p>
                    <p className="text-cyan-400 text-xs">Current Speed</p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-violet-500/30">
                <div className="flex items-center gap-3">
                  <Compass 
                    className="w-5 h-5 text-violet-400" 
                    style={{ transform: `rotate(${compassHeading}deg)` }}
                  />
                  <div>
                    <p className="text-white font-black text-2xl">{Math.round(compassHeading)}°</p>
                    <p className="text-violet-400 text-xs">Heading</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setMapStyle(mapStyle === "satellite" ? "street" : "satellite")}
                className="p-3 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 text-slate-400 hover:text-white transition-all"
              >
                <MapIcon className="w-5 h-5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 text-slate-400 hover:text-white transition-all"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button
                onClick={onExit}
                className="px-4 py-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-all font-semibold"
              >
                Exit
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <div className="p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-slate-400 text-xs mb-2">Zoom Level</p>
                  <input
                    type="range"
                    min="15"
                    max="20"
                    value={zoom}
                    onChange={(e) => setZoom(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>Far</span>
                    <span>Close</span>
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-slate-400 text-xs mb-2">Perspective Tilt</p>
                  <input
                    type="range"
                    min="0"
                    max="85"
                    value={tilt}
                    onChange={(e) => setTilt(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>Top-down</span>
                    <span>First-person</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Crosshair */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-2 border-cyan-400 rounded-full opacity-30" />
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-cyan-400 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-cyan-400 transform -translate-x-1/2" />
            <div className="absolute bottom-0 left-1/2 w-0.5 h-4 bg-cyan-400 transform -translate-x-1/2" />
            <div className="absolute top-1/2 left-0 w-4 h-0.5 bg-cyan-400 transform -translate-y-1/2" />
            <div className="absolute top-1/2 right-0 w-4 h-0.5 bg-cyan-400 transform -translate-y-1/2" />
          </div>
        </div>

        {/* GPS Status */}
        <div className="absolute top-24 left-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-xs font-semibold">GPS LOCKED</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Map with 3D perspective */}
      <div 
        className="absolute inset-0 transition-all duration-300"
        style={{
          transform: `perspective(1000px) rotateX(${tilt}deg)`,
          transformOrigin: 'center center'
        }}
      >
        <MapContainer
          center={currentPosition ? [currentPosition.lat, currentPosition.lng] : [55.6761, 12.5683]}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url={satelliteLayers[mapStyle]}
            attribution={mapStyle === "satellite" ? '&copy; Esri' : '&copy; OpenStreetMap'}
          />
          <MapController 
            center={currentPosition ? [currentPosition.lat, currentPosition.lng] : null}
            zoom={zoom}
          />
          <MapRotation heading={compassHeading} />

          {currentPosition && (
            <Marker 
              position={[currentPosition.lat, currentPosition.lng]}
              icon={L.divIcon({
                className: 'street-view-marker',
                html: `
                  <div style="position: relative;">
                    <div style="
                      width: 24px;
                      height: 24px;
                      background: linear-gradient(135deg, #22d3ee 0%, #8b5cf6 100%);
                      border: 4px solid white;
                      border-radius: 50%;
                      box-shadow: 0 0 30px rgba(34, 211, 238, 0.8);
                      animation: pulse-glow 2s infinite;
                    "></div>
                    <div style="
                      position: absolute;
                      top: -20px;
                      left: 50%;
                      transform: translateX(-50%) rotate(${compassHeading}deg);
                      width: 0;
                      height: 0;
                      border-left: 8px solid transparent;
                      border-right: 8px solid transparent;
                      border-bottom: 20px solid #22d3ee;
                      filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.6));
                    "></div>
                  </div>
                `,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
            />
          )}
        </MapContainer>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.7;
          }
        }
        
        .leaflet-container {
          background: #0f172a !important;
        }
      `}</style>
    </div>
  );
}