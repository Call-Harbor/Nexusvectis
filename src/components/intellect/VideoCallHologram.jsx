import React, { useState } from "react";
import { Video, Copy, ExternalLink, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AIVideoCall from "@/components/intellect/AIVideoCall";

export default function VideoCallHologram({ videoUrl, onClose }) {
  const [urlInput, setUrlInput] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(videoUrl || "");
  const [useAIMode, setUseAIMode] = useState(false);

  const validateVideoUrl = (url) => {
    if (!url.trim()) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const convertUrlToIframeCompatible = (url) => {
    if (!url) return "";
    
    // Google Meet: convert to embed format
    if (url.includes("meet.google.com")) {
      const meetId = url.split("/").pop().split("?")[0];
      return `https://meet.google.com/${meetId}`;
    }
    
    // Whereby: already iframe compatible
    if (url.includes("whereby.com")) {
      return url.includes("?") ? url : url + "?view=embed";
    }
    
    // Jitsi: convert to iframe embed
    if (url.includes("jitsi.org") || url.includes("meet.jit.si")) {
      const roomName = url.split("/").pop();
      return `https://meet.jit.si/${roomName}`;
    }
    
    // Webex: use embed URL
    if (url.includes("webex.com")) {
      if (url.includes("meetingid=")) {
        return url.replace(/https:\/\/.*?\.webex\.com/, "https://webex.com/wbxmjs/joinservice/sites/webex/meeting/embed");
      }
      return url;
    }
    
    // Zoom: cannot be embedded directly - return warning message
    if (url.includes("zoom.us")) {
      return null;
    }
    
    // Teams: cannot be embedded directly - return warning message
    if (url.includes("teams.microsoft.com")) {
      return null;
    }
    
    return url;
  };

  const handleAddUrl = () => {
    if (validateVideoUrl(urlInput)) {
      const iframeUrl = convertUrlToIframeCompatible(urlInput);
      setCurrentUrl(iframeUrl || urlInput);
      setUrlInput("");
      setIsValidUrl(false);
      toast.success("Møde indlæst");
    } else {
      toast.error("Ugyldigt link");
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setUrlInput(url);
    setIsValidUrl(validateVideoUrl(url));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl);
    toast.success("URL copied");
  };

  if (useAIMode && currentUrl) {
    return <AIVideoCall currentUrl={currentUrl} onUrlChange={setCurrentUrl} />;
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Video className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold">Video Call</h3>
            {currentUrl && (
              <p className="text-[10px] text-slate-500">Enhanced mode available</p>
            )}
          </div>
          {currentUrl && (
            <button
              onClick={() => setUseAIMode(true)}
              className="text-xs px-2 py-1 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-lg flex items-center gap-1.5 hover:shadow-lg transition-all"
              title="Switch to AI-enhanced mode"
            >
              <Sparkles className="w-3 h-3" />
              AI Mode
            </button>
          )}
        </div>

        {!currentUrl && (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={urlInput}
                onChange={handleUrlChange}
                placeholder="Paste Teams, Zoom, Meet, or Webex link..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              {isValidUrl && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddUrl}
                disabled={!isValidUrl}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Load
              </Button>
            </div>

            <div className="p-2 rounded bg-slate-800/50 border border-slate-700 text-slate-400 text-xs space-y-1">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-400" />
                <div>
                  <p className="font-semibold text-slate-300">Supported platforms:</p>
                  <p>Microsoft Teams, Zoom, Google Meet, Webex, Whereby, Jitsi</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Call Frame */}
      {currentUrl ? (
        <div className="flex-1 relative overflow-hidden">
          <iframe
            src={currentUrl}
            title="Video Call"
            allow="camera; microphone; speaker; display-capture; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-popups-to-escape-sandbox"
            className="w-full h-full border-0"
          />
          
          {/* Floating Controls */}
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <Button
              onClick={copyToClipboard}
              size="sm"
              variant="ghost"
              className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 h-8 px-2"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => window.open(currentUrl, '_blank')}
              size="sm"
              variant="ghost"
              className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 h-8 px-2"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => setCurrentUrl("")}
              size="sm"
              variant="ghost"
              className="bg-slate-900/80 hover:bg-slate-800 text-red-400 h-8 px-2"
            >
              ✕
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Paste a video call link to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}