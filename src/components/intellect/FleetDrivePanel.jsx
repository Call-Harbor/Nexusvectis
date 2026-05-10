import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  File, FileText, FileImage, Video, Archive, Search, Trash2, 
  Download, Pin, PinOff, Plus, CloudUpload, CheckCircle, Star, ExternalLink,
  MoreVertical, Table, MonitorPlay, Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { postToFleetOffice, escapeHtml } from "@/lib/fleetOfficeBridge";

const FILE_ICONS = {
  document: FileText, spreadsheet: FileText, image: FileImage,
  video: Video, archive: Archive, pdf: FileText, presentation: FileText, other: File,
};

const TYPE_COLOR = {
  document: "#3b82f6", spreadsheet: "#10b981", image: "#ec4899",
  video: "#a855f7", archive: "#f59e0b", pdf: "#ef4444",
  presentation: "#06b6d4", other: "#64748b",
};

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

function inferFileType(mimeType, name) {
  const ext = name?.split(".").pop()?.toLowerCase();
  if (ext === "fleetslide") return "presentation";
  if (mimeType?.startsWith("image/") || ["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return "image";
  if (mimeType?.startsWith("video/") || ["mp4","mov","avi","mkv"].includes(ext)) return "video";
  if (mimeType === "application/pdf" || ext === "pdf") return "pdf";
  if (["doc","docx","txt","rtf","odt","html"].includes(ext)) return "document";
  if (["xls","xlsx","csv","ods"].includes(ext)) return "spreadsheet";
  if (["zip","rar","tar","gz","7z"].includes(ext)) return "archive";
  return "other";
}

// Rotating arc ring
function ArcRing({ size = 48, color = "#06b6d4", speed = 3, reverse = false, opacity = 0.4 }) {
  return (
    <svg width={size} height={size} className="absolute" style={{ opacity }}>
      <circle cx={size/2} cy={size/2} r={size/2 - 2} fill="none" stroke={color} strokeWidth="1"
        strokeDasharray={`${size * 0.4} ${size * 3}`}
        style={{ transformOrigin: "center", animation: `spin ${speed}s linear infinite ${reverse ? "reverse" : ""}` }} />
    </svg>
  );
}

// Hexagon file icon
function HexIcon({ type, size = 36 }) {
  const color = TYPE_COLOR[type] || TYPE_COLOR.other;
  const Icon = FILE_ICONS[type] || File;
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 36 36" className="absolute">
        <polygon points="18,2 32,10 32,26 18,34 4,26 4,10"
          fill={`${color}10`} stroke={color} strokeWidth="1" opacity="0.7" />
        <polygon points="18,6 28,12 28,24 18,30 8,24 8,12"
          fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />
      </svg>
      <Icon style={{ color, width: 13, height: 13, position: "relative", zIndex: 1 }} />
    </div>
  );
}

// Corner bracket decoration
function Corners({ color = "#06b6d4" }) {
  const s = "absolute w-3 h-3";
  const b = `2px solid ${color}`;
  return (
    <>
      <span className={`${s} top-0 left-0`} style={{ borderTop: b, borderLeft: b }} />
      <span className={`${s} top-0 right-0`} style={{ borderTop: b, borderRight: b }} />
      <span className={`${s} bottom-0 left-0`} style={{ borderBottom: b, borderLeft: b }} />
      <span className={`${s} bottom-0 right-0`} style={{ borderBottom: b, borderRight: b }} />
    </>
  );
}

// Radial storage ring
function StorageRing({ percent, totalGB, fileCount }) {
  const r = 40, cx = 52, cy = 52, circumference = 2 * Math.PI * r;
  const dash = (percent / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 104, height: 104 }}>
      <svg width="104" height="104" className="absolute">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(6,182,212,0.08)" strokeWidth="6" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1" strokeDasharray="4 4" />
        <motion.circle cx={cx} cy={cy} r={r} fill="none"
          stroke="url(#arcGrad)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={circumference * 0.25}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference}` }}
          transition={{ duration: 1.5, ease: "easeOut" }} />
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center z-10">
        <div className="text-[10px] font-mono text-cyan-400 font-bold">{totalGB.toFixed(1)}<span className="text-[8px] text-cyan-600"> GB</span></div>
        <div className="text-[9px] font-mono text-slate-500">{fileCount} FILES</div>
      </div>
    </div>
  );
}

export default function FleetDrivePanel({ orgId, openWindow }) {
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [activeFolder, setActiveFolder] = useState("all");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["fleet-drive", orgId],
    queryFn: () => base44.entities.FleetDriveFile.filter({ organization_id: orgId }, "-created_date", 200),
    enabled: !!orgId,
    refetchInterval: 30000,
  });

  // Listen for files added from H.A.R.B.O.R chat and refresh instantly
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ["fleet-drive", orgId] });
    };
    window.addEventListener("fleetdrive_file_added", handler);
    return () => window.removeEventListener("fleetdrive_file_added", handler);
  }, [orgId, queryClient]);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FleetDriveFile.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fleet-drive", orgId] }); toast.success("File deleted"); },
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }) => base44.entities.FleetDriveFile.update(id, { is_pinned: pinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fleet-drive", orgId] }),
  });

  const handleUpload = async (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;
    setUploading(true);
    setUploadProgress(selected.map(f => ({ name: f.name, done: false })));
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      try {
        const res = await base44.integrations.Core.UploadFile({ file });
        const fileUrl = res?.data?.file_url || res?.file_url;
        if (!fileUrl) throw new Error("Upload failed");
        await base44.entities.FleetDriveFile.create({
          organization_id: orgId, name: file.name, file_url: fileUrl,
          file_type: inferFileType(file.type, file.name),
          file_size_bytes: file.size, mime_type: file.type,
          folder: activeFolder === "all" ? "root" : activeFolder, source: "uploaded",
        });
        setUploadProgress(prev => prev.map((p, idx) => idx === i ? { ...p, done: true } : p));
      } catch { toast.error(`Failed: ${file.name}`); }
    }
    queryClient.invalidateQueries({ queryKey: ["fleet-drive", orgId] });
    toast.success(`${selected.length} file(s) uploaded`);
    setUploading(false); setUploadProgress([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const totalBytes = files.reduce((s, f) => s + (f.file_size_bytes || 0), 0);
  const totalGB = totalBytes / 1073741824;
  const storagePercent = Math.min(100, (totalGB / 100) * 100);
  const folders = [...new Set(files.map(f => f.folder || "root"))];

  const filtered = files.filter(f => {
    const matchS = !search || f.name?.toLowerCase().includes(search.toLowerCase());
    const matchF = activeFolder === "all" || (f.folder || "root") === activeFolder;
    return matchS && matchF;
  });

  const pinned = filtered.filter(f => f.is_pinned);
  const unpinned = filtered.filter(f => !f.is_pinned);

  // Type distribution
  const typeCounts = files.reduce((acc, f) => { acc[f.file_type || "other"] = (acc[f.file_type || "other"] || 0) + 1; return acc; }, {});

  const bridgeFileToOffice = async (file) => {
    const ext = file.name?.split(".").pop()?.toLowerCase();
    try {
      if (ext === "csv" || file.file_type === "spreadsheet") {
        const r = await fetch(file.file_url);
        const csv = await r.text();
        postToFleetOffice({
          target: "spreadsheet_editor",
          kind: "grid_csv",
          data: { csv, title: file.name },
          meta: { sourceFileId: file.id, name: file.name },
        });
        toast.success("Data sendt til FleetSheet (Office bridge)");
        return;
      }
      if (file.file_type === "document" || ["html", "htm", "txt", "md"].includes(ext)) {
        const r = await fetch(file.file_url);
        const t = await r.text();
        let html = t;
        if (ext === "txt" || ext === "md") {
          html = `<p>${escapeHtml(t).split("\n").join("</p><p>")}</p>`;
        }
        postToFleetOffice({
          target: "document_editor",
          kind: "html_fragment",
          data: { html },
          meta: { title: file.name, sourceFileId: file.id },
        });
        toast.success("Indhold sendt til FleetDocs (Office bridge)");
        return;
      }
      if (ext === "fleetslide" || file.file_type === "presentation") {
        postToFleetOffice({
          target: "hologram_presentation",
          kind: "replace_deck",
          data: { file_url: file.file_url },
          meta: { title: file.name, sourceFileId: file.id },
        });
        toast.success("Præsentation på bridge — åbn FleetSlide og tryk Import");
        return;
      }
      postToFleetOffice({
        target: "any",
        kind: "file_reference",
        data: { file_url: file.file_url, name: file.name, file_type: file.file_type },
        meta: { sourceFileId: file.id },
      });
      toast.success("Filreference på Office bridge");
    } catch {
      toast.error("Office bridge fejlede");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.04) 0%, rgba(0,5,15,0.98) 60%)", fontFamily: "monospace" }}>
      
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* TOP HEADER — JARVIS style */}
      <div className="relative flex-shrink-0 px-4 pt-4 pb-3">
        {/* top line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #06b6d4, #8b5cf6, transparent)" }} />
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Central ring widget */}
            <div className="relative flex items-center justify-center" style={{ width: 44, height: 44 }}>
              <ArcRing size={44} color="#06b6d4" speed={6} opacity={0.5} />
              <ArcRing size={32} color="#8b5cf6" speed={4} reverse opacity={0.4} />
              <div className="w-4 h-4 rounded-full" style={{ background: "radial-gradient(circle, #06b6d4, #0891b2)", boxShadow: "0 0 12px #06b6d4" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: "#06b6d4", textShadow: "0 0 10px rgba(6,182,212,0.6)" }}>
                  FLEET DRIVE
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded border font-mono"
                  style={{ color: "#8b5cf6", borderColor: "rgba(139,92,246,0.4)", background: "rgba(139,92,246,0.08)" }}>
                  NEURAL ARCHIVE
                </span>
              </div>
              <div className="text-[9px] tracking-[0.15em] mt-0.5" style={{ color: "rgba(6,182,212,0.45)" }}>
                SYS.STORAGE · UNIT-{orgId?.slice(-4)?.toUpperCase() || "0000"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="relative px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all"
              style={{ color: "#06b6d4", border: "1px solid rgba(6,182,212,0.4)", background: "rgba(6,182,212,0.06)" }}>
              <Corners color="rgba(6,182,212,0.6)" />
              {uploading ? "UPLOADING..." : "+ UPLOAD"}
            </button>
            <input ref={fileInputRef} type="file" multiple onChange={handleUpload} className="hidden" />
          </div>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 pb-3">
        <StorageRing percent={storagePercent} totalGB={totalGB} fileCount={files.length} />
        <div className="flex-1 space-y-1.5">
          {Object.entries(typeCounts).slice(0, 4).map(([type, count]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: TYPE_COLOR[type] || "#64748b", boxShadow: `0 0 4px ${TYPE_COLOR[type] || "#64748b"}` }} />
              <span className="text-[9px] tracking-widest uppercase flex-1" style={{ color: "rgba(148,163,184,0.6)" }}>{type}</span>
              <span className="text-[9px] font-bold" style={{ color: TYPE_COLOR[type] || "#64748b" }}>{count}</span>
              <div className="w-12 h-px" style={{ background: `linear-gradient(90deg, ${TYPE_COLOR[type] || "#64748b"}60, transparent)` }} />
            </div>
          ))}
        </div>
      </div>

      {/* DIVIDER */}
      <div className="flex-shrink-0 mx-4 mb-3 relative h-px">
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent)" }} />
        <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 border rotate-45"
          style={{ borderColor: "rgba(6,182,212,0.4)", background: "rgba(6,182,212,0.06)" }} />
      </div>

      {/* SEARCH */}
      <div className="flex-shrink-0 px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "rgba(6,182,212,0.4)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH NEURAL ARCHIVE..."
            className="w-full pl-8 pr-3 py-1.5 text-[10px] tracking-widest outline-none"
            style={{
              background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.15)",
              color: "#06b6d4", caretColor: "#06b6d4",
            }} />
          {search && <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#06b6d4" }} />}
        </div>
        {/* Folder tabs */}
        {folders.length > 1 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {["all", ...folders].map(folder => (
              <button key={folder} onClick={() => setActiveFolder(folder)}
                className="px-2 py-0.5 text-[9px] tracking-widest uppercase transition-all"
                style={{
                  border: `1px solid ${activeFolder === folder ? "rgba(6,182,212,0.5)" : "rgba(6,182,212,0.12)"}`,
                  background: activeFolder === folder ? "rgba(6,182,212,0.1)" : "transparent",
                  color: activeFolder === folder ? "#06b6d4" : "rgba(148,163,184,0.4)",
                }}>
                {folder === "all" ? "ALL" : folder === "root" ? "ROOT" : folder}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Upload progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 mx-4 mb-2 px-3 py-2 space-y-1"
            style={{ border: "1px solid rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.04)" }}>
            {uploadProgress.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] tracking-widest">
                {p.done ? <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" /> : <CloudUpload className="w-3 h-3 animate-pulse flex-shrink-0" style={{ color: "#06b6d4" }} />}
                <span className="truncate" style={{ color: p.done ? "#10b981" : "#06b6d4" }}>{p.name}</span>
                {!p.done && <span className="ml-auto opacity-50 text-[9px]" style={{ color: "#06b6d4" }}>SYNC</span>}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILE LIST */}
      <div className="flex-1 overflow-y-auto px-4 min-h-0 space-y-0.5 pb-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <div className="relative w-10 h-10">
              <ArcRing size={40} color="#06b6d4" speed={2} opacity={0.7} />
              <ArcRing size={28} color="#8b5cf6" speed={1.5} reverse opacity={0.5} />
            </div>
            <span className="text-[9px] tracking-widest animate-pulse" style={{ color: "rgba(6,182,212,0.5)" }}>INDEXING NEURAL ARCHIVE...</span>
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <Corners color="rgba(6,182,212,0.3)" />
              <File className="w-5 h-5" style={{ color: "rgba(6,182,212,0.3)" }} />
            </div>
            <div className="text-center">
              <p className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(6,182,212,0.4)" }}>NO DATA DETECTED</p>
              <p className="text-[9px] mt-1" style={{ color: "rgba(148,163,184,0.3)" }}>Initialize neural archive</p>
            </div>
            <button onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 text-[9px] tracking-widest uppercase transition-all"
              style={{ border: "1px solid rgba(6,182,212,0.3)", color: "#06b6d4", background: "rgba(6,182,212,0.05)" }}>
              + UPLOAD FILE
            </button>
          </div>
        )}

        {pinned.length > 0 && (
          <>
            <div className="flex items-center gap-2 py-1.5">
              <Star className="w-2.5 h-2.5" style={{ color: "#f59e0b" }} />
              <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "rgba(245,158,11,0.6)" }}>PINNED</span>
              <div className="flex-1 h-px" style={{ background: "rgba(245,158,11,0.15)" }} />
            </div>
            {pinned.map(f => <JarvisFileRow key={f.id} file={f} onDelete={deleteMutation.mutate} onPin={pinMutation.mutate} openWindow={openWindow} onBridgeSend={bridgeFileToOffice} selected={selectedFile === f.id} onSelect={setSelectedFile} />)}
          </>
        )}

        {(pinned.length > 0 && unpinned.length > 0) && (
          <div className="flex items-center gap-2 py-1.5">
            <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "rgba(6,182,212,0.3)" }}>FILES</span>
            <div className="flex-1 h-px" style={{ background: "rgba(6,182,212,0.08)" }} />
          </div>
        )}

        {unpinned.map(f => <JarvisFileRow key={f.id} file={f} onDelete={deleteMutation.mutate} onPin={pinMutation.mutate} openWindow={openWindow} onBridgeSend={bridgeFileToOffice} selected={selectedFile === f.id} onSelect={setSelectedFile} />)}
      </div>

      {/* BOTTOM BAR */}
      <div className="flex-shrink-0 relative px-4 py-2">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.25), transparent)" }} />
        <div className="flex items-center justify-between">
          <div className="text-[9px] tracking-widest" style={{ color: "rgba(6,182,212,0.35)" }}>
            {files.length} OBJ · {formatBytes(totalBytes)}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-0.5 relative overflow-hidden" style={{ background: "rgba(6,182,212,0.08)" }}>
              <motion.div className="absolute left-0 top-0 h-full"
                initial={{ width: 0 }} animate={{ width: `${storagePercent}%` }} transition={{ duration: 1.5 }}
                style={{ background: "linear-gradient(90deg, #06b6d4, #8b5cf6)", boxShadow: "0 0 6px #06b6d4" }} />
            </div>
            <span className="text-[9px]" style={{ color: "rgba(6,182,212,0.4)" }}>{totalGB.toFixed(2)}GB</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function JarvisFileRow({ file, onDelete, onPin, openWindow, onBridgeSend, selected, onSelect }) {
  const color = TYPE_COLOR[file.file_type] || TYPE_COLOR.other;
  const isSelected = selected === file.id;

  const handleOpen = () => {
    if (!openWindow) return;
    const ext = file.name?.split('.').pop()?.toLowerCase();
    const ft = file.file_type;
    let windowType;
    if (ext === 'fleetslide' || ft === 'presentation') windowType = 'hologram_presentation';
    else if (ft === 'document' || ['doc','docx','txt','rtf','odt','html'].includes(ext)) windowType = 'document_editor';
    else if (ft === 'spreadsheet' || ['xls','xlsx','csv','ods'].includes(ext)) windowType = 'spreadsheet_editor';
    else windowType = 'hologram_presentation';
    openWindow(windowType, { x: 120, y: 80 }, { initialFileUrl: file.file_url, initialTitle: file.name, initialFileId: file.id });
  };

  const openAs = (windowType, e) => {
    e?.stopPropagation();
    if (!openWindow) return;
    openWindow(windowType, { x: 120, y: 80 }, { initialFileUrl: file.file_url, initialTitle: file.name, initialFileId: file.id });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onSelect(isSelected ? null : file.id)}
      className="group relative flex items-center gap-3 px-3 py-2 cursor-pointer transition-all"
      style={{
        border: `1px solid ${isSelected ? color + "50" : "rgba(6,182,212,0.07)"}`,
        background: isSelected ? `${color}08` : "rgba(6,182,212,0.02)",
        marginBottom: 2,
      }}>
      
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 transition-all"
        style={{ background: isSelected ? color : "transparent", boxShadow: isSelected ? `0 0 6px ${color}` : "none" }} />

      {/* Scan line on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: `linear-gradient(90deg, ${color}05, transparent)` }} />

      <HexIcon type={file.file_type || "other"} size={32} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold truncate" style={{ color: isSelected ? color : "#e2e8f0", textShadow: isSelected ? `0 0 8px ${color}60` : "none" }}>
            {file.name}
          </p>
          {file.is_pinned && <Star className="w-2.5 h-2.5 flex-shrink-0" style={{ color: "#f59e0b" }} />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] tracking-widest" style={{ color: "rgba(148,163,184,0.4)" }}>{formatBytes(file.file_size_bytes)}</span>
          <span className="text-[9px] tracking-widest uppercase" style={{ color: `${color}60` }}>{file.file_type || "FILE"}</span>
          {file.source && file.source !== "uploaded" && (
            <span className="text-[8px] px-1 py-px border"
              style={{
                color: file.source === "chat" ? "#10b981" : "#8b5cf6",
                borderColor: file.source === "chat" ? "rgba(16,185,129,0.3)" : "rgba(139,92,246,0.3)",
                background: file.source === "chat" ? "rgba(16,185,129,0.06)" : "rgba(139,92,246,0.06)"
              }}>
              {file.source === "chat" ? "CHAT" : file.source === "document_editor" ? "DOC" : "SHEET"}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons - show on hover or selected */}
      <div className={`flex items-center gap-1 transition-all ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        <ActionBtn icon={ExternalLink} color={color} onClick={(e) => { e.stopPropagation(); handleOpen(); }} title="Open" />
        <ActionBtn icon={Download} color="#06b6d4" onClick={(e) => { e.stopPropagation(); window.open(file.file_url, "_blank"); }} title="Download" />
        {openWindow && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                title="Office hub"
                className="w-6 h-6 flex items-center justify-center transition-all hover:scale-110"
                style={{ border: `1px solid ${color}30`, background: `${color}08` }}
              >
                <MoreVertical className="w-3 h-3" style={{ color }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-200 min-w-[200px]">
              <DropdownMenuItem onClick={(e) => openAs("document_editor", e)} className="gap-2 cursor-pointer">
                <FileText className="w-3.5 h-3.5 text-blue-400" /> Åbn i FleetDocs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => openAs("spreadsheet_editor", e)} className="gap-2 cursor-pointer">
                <Table className="w-3.5 h-3.5 text-emerald-400" /> Åbn i FleetSheet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => openAs("hologram_presentation", e)} className="gap-2 cursor-pointer">
                <MonitorPlay className="w-3.5 h-3.5 text-cyan-400" /> Åbn i FleetSlide
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onBridgeSend?.(file); }}
                className="gap-2 cursor-pointer text-violet-200 focus:text-violet-100"
              >
                <Share2 className="w-3.5 h-3.5 text-violet-400" /> Send til Office bridge
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <ActionBtn icon={file.is_pinned ? PinOff : Pin} color="#f59e0b" onClick={(e) => { e.stopPropagation(); onPin({ id: file.id, pinned: !file.is_pinned }); }} title="Pin" />
        <ActionBtn icon={Trash2} color="#ef4444" onClick={(e) => { e.stopPropagation(); onDelete(file.id); }} title="Delete" />
      </div>
    </motion.div>
  );
}

function ActionBtn({ icon: Icon, color, onClick, title }) {
  return (
    <button onClick={onClick} title={title}
      className="w-6 h-6 flex items-center justify-center transition-all hover:scale-110"
      style={{ border: `1px solid ${color}30`, background: `${color}08` }}>
      <Icon className="w-3 h-3" style={{ color }} />
    </button>
  );
}