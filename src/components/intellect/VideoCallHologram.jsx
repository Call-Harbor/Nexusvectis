import React, { useState, useRef } from "react";
import { Video, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VideoCallHologram({ videoUrl }) {
  const [urlInput, setUrlInput] = useState("");
  const [currentUrl, setCurrentUrl] = useState(videoUrl || "");
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef(null);

  const handleLoad = () => {
    setIframeError(false);
  };

  const handleError = () => {
    setIframeError(true);
  };

  const handleJoin = () => {
    if (!urlInput.trim()) return;
    try {
      new URL(urlInput);
      setCurrentUrl(urlInput);
      setUrlInput("");
      setIframeError(false);
      toast.success("Møde indlæst");
    } catch {
      toast.error("Ugyldigt link");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header / URL input */}
      <div className="p-4 border-b border-slate-800 flex-shrink-0 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Video className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="text-white font-bold">Video Call</h3>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="Indsæt mødelink her..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          <Button onClick={handleJoin} size="sm" className="bg-blue-600 hover:bg-blue-700 px-4">
            Join
          </Button>
        </div>

        {currentUrl && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-500 truncate flex-1">{currentUrl}</p>
            <Button
              onClick={() => window.open(currentUrl, '_blank')}
              size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-white h-7 px-2 flex-shrink-0"
              title="Åbn i nyt vindue"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => { setCurrentUrl(""); setIframeError(false); }}
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-300 h-7 px-2 flex-shrink-0"
            >
              ✕
            </Button>
          </div>
        )}
      </div>

      {/* Content area */}
      {currentUrl ? (
        <div className="flex-1 relative overflow-hidden">
          {!iframeError ? (
            <iframe
              ref={iframeRef}
              src={currentUrl}
              title="Video Call"
              allow="camera; microphone; speaker; display-capture; fullscreen; clipboard-read; clipboard-write"
              allowFullScreen
              className="w-full h-full border-0"
              onLoad={handleLoad}
              onError={handleError}
            />
          ) : null}

          {/* Fallback overlay if blocked */}
          {iframeError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <AlertCircle className="w-12 h-12 text-amber-400" />
              <div>
                <p className="text-white font-semibold mb-1">Siden blokerer embedding</p>
                <p className="text-slate-400 text-sm">Denne platform tillader ikke visning i et vindue. Åbn mødet direkte.</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => window.open(currentUrl, '_blank')} className="bg-blue-600 hover:bg-blue-700">
                  <ExternalLink className="w-4 h-4 mr-2" /> Åbn møde
                </Button>
                <Button onClick={() => { setIframeError(false); if (iframeRef.current) iframeRef.current.src = currentUrl; }} variant="outline" className="border-slate-600 text-slate-300">
                  <RefreshCw className="w-4 h-4 mr-2" /> Prøv igen
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Indsæt et mødelink for at starte</p>
          </div>
        </div>
      )}
    </div>
  );
}