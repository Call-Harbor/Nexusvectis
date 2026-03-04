import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HardDrive, Upload, File, FileText, FileImage, Video, Archive, 
  Folder, Search, Trash2, Download, Pin, PinOff, MoreVertical, 
  Plus, CloudUpload, CheckCircle, Star, ExternalLink, Database, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const FILE_ICONS = {
  document: FileText,
  spreadsheet: FileText,
  image: FileImage,
  video: Video,
  archive: Archive,
  pdf: FileText,
  presentation: FileText,
  other: File,
};

const FILE_GLOW = {
  document: "shadow-blue-500/30",
  spreadsheet: "shadow-emerald-500/30",
  image: "shadow-pink-500/30",
  video: "shadow-purple-500/30",
  archive: "shadow-amber-500/30",
  pdf: "shadow-red-500/30",
  presentation: "shadow-cyan-500/30",
  other: "shadow-slate-500/20",
};

const FILE_COLORS = {
  document: "text-blue-400",
  spreadsheet: "text-emerald-400",
  image: "text-pink-400",
  video: "text-purple-400",
  archive: "text-amber-400",
  pdf: "text-red-400",
  presentation: "text-cyan-400",
  other: "text-slate-400",
};

const FILE_BG = {
  document: "bg-blue-500/10 border-blue-500/20",
  spreadsheet: "bg-emerald-500/10 border-emerald-500/20",
  image: "bg-pink-500/10 border-pink-500/20",
  video: "bg-purple-500/10 border-purple-500/20",
  archive: "bg-amber-500/10 border-amber-500/20",
  pdf: "bg-red-500/10 border-red-500/20",
  presentation: "bg-cyan-500/10 border-cyan-500/20",
  other: "bg-slate-800/40 border-slate-700/20",
};

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function inferFileType(mimeType, name) {
  if (!mimeType && !name) return "other";
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

// Animated scan line overlay
function ScanLines() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl opacity-[0.03]"
      style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.15) 2px, rgba(0,255,255,0.15) 4px)" }} />
  );
}

export default function FleetDrivePanel({ orgId, openWindow }) {
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [activeFolder, setActiveFolder] = useState("root");
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["fleet-drive", orgId],
    queryFn: () => base44.entities.FleetDriveFile.filter({ organization_id: orgId }, "-created_date", 200),
    enabled: !!orgId,
    refetchInterval: 30000,
  });

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
        const fileType = inferFileType(file.type, file.name);
        await base44.entities.FleetDriveFile.create({
          organization_id: orgId,
          name: file.name,
          file_url: fileUrl,
          file_type: fileType,
          file_size_bytes: file.size,
          mime_type: file.type,
          folder: activeFolder,
          source: "uploaded",
        });
        setUploadProgress(prev => prev.map((p, idx) => idx === i ? { ...p, done: true } : p));
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    queryClient.invalidateQueries({ queryKey: ["fleet-drive", orgId] });
    toast.success(`${selected.length} file(s) uploaded to Fleet Drive`);
    setUploading(false);
    setUploadProgress([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const totalBytes = files.reduce((sum, f) => sum + (f.file_size_bytes || 0), 0);
  const totalGB = totalBytes / (1024 * 1024 * 1024);
  const storageCostEur = Math.max(0, Math.ceil(totalGB / 10));
  const storagePercent = Math.min(100, (totalGB / 100) * 100);

  const folders = [...new Set(files.map(f => f.folder || "root"))];
  const filtered = files.filter(f => {
    const matchSearch = !search || f.name?.toLowerCase().includes(search.toLowerCase());
    const matchFolder = activeFolder === "all" || (f.folder || "root") === activeFolder;
    return matchSearch && matchFolder;
  });
  const pinned = filtered.filter(f => f.is_pinned);
  const unpinned = filtered.filter(f => !f.is_pinned);

  return (
    <div className="relative flex flex-col h-full overflow-hidden"
      style={{ background: "linear-gradient(180deg, rgba(0,20,40,0.97) 0%, rgba(0,10,25,0.99) 100%)" }}>
      <ScanLines />

      {/* Ambient glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-cyan-500/10 blur-xl rounded-full" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0 border-b border-cyan-500/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-white text-sm tracking-wide">FLEET DRIVE</h2>
              <Badge className="text-[9px] px-1.5 py-0 h-3.5 bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-mono">v2</Badge>
            </div>
            <p className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase">Nexus Neural Storage</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-mono">{formatBytes(totalBytes)}</p>
            <p className="text-[10px] text-cyan-400/70 font-mono">€{storageCostEur}/mo</p>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} size="sm"
            className="relative overflow-hidden bg-transparent border border-cyan-500/40 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/10 text-xs h-8 font-mono">
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-violet-500/5" />
            <Upload className="w-3.5 h-3.5 mr-1.5" />UPLOAD
          </Button>
          <input ref={fileInputRef} type="file" multiple onChange={handleUpload} className="hidden" accept="*/*" />
        </div>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-cyan-500/5 border-b border-cyan-500/20 flex-shrink-0 space-y-1">
            {uploadProgress.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono">
                {p.done
                  ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  : <CloudUpload className="w-3.5 h-3.5 text-cyan-400 animate-pulse flex-shrink-0" />}
                <span className={p.done ? "text-emerald-300" : "text-cyan-300 animate-pulse"}>{p.name}</span>
                {!p.done && <span className="ml-auto text-cyan-500/50 text-[10px]">TRANSMITTING...</span>}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Folder Tabs */}
      <div className="px-3 py-2 border-b border-slate-800/40 flex-shrink-0 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-500/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search neural archive..."
            className="pl-8 h-7 text-xs font-mono bg-slate-950/80 border-cyan-500/20 text-cyan-100 placeholder:text-slate-700 focus:border-cyan-500/50 focus:ring-0" />
          {search && <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", ...folders].map(folder => (
            <button key={folder} onClick={() => setActiveFolder(folder)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all ${
                activeFolder === folder
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20"
                  : "text-slate-600 hover:text-slate-400 border border-transparent"
              }`}>
              <Folder className="w-2.5 h-2.5 inline mr-1" />
              {folder === "all" ? "ALL" : folder === "root" ? "ROOT" : folder.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/20">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full" />
              <div className="absolute inset-0 border-t-2 border-cyan-400 rounded-full animate-spin" />
            </div>
            <p className="text-[10px] text-cyan-500/50 font-mono animate-pulse">LOADING NEURAL ARCHIVE...</p>
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/5 to-violet-500/5 border border-cyan-500/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Database className="w-7 h-7 text-slate-700" />
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-mono font-medium">NO FILES DETECTED</p>
              <p className="text-slate-700 text-[10px] mt-0.5 font-mono">Initialize neural archive</p>
            </div>
            <Button onClick={() => fileInputRef.current?.click()} size="sm"
              className="bg-transparent border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 mr-1.5" />UPLOAD FIRST FILE
            </Button>
          </div>
        )}

        {pinned.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] text-amber-400/70 font-mono font-semibold uppercase tracking-widest">Pinned</span>
              <div className="flex-1 h-px bg-amber-500/10" />
            </div>
            {pinned.map(f => <FileRow key={f.id} file={f} onDelete={deleteMutation.mutate} onPin={pinMutation.mutate} openWindow={openWindow} />)}
          </div>
        )}

        {unpinned.length > 0 && pinned.length > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">Files</span>
            <div className="flex-1 h-px bg-slate-800/60" />
          </div>
        )}

        {unpinned.map(f => <FileRow key={f.id} file={f} onDelete={deleteMutation.mutate} onPin={pinMutation.mutate} openWindow={openWindow} />)}
      </div>

      {/* Footer */}
      <div className="relative px-4 py-2.5 border-t border-cyan-500/10 flex-shrink-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] text-slate-600 font-mono">{files.length} FILES · {formatBytes(totalBytes)}</p>
          <span className="text-[10px] text-cyan-500/50 font-mono">{totalGB.toFixed(3)} GB</span>
        </div>
        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${storagePercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #06b6d4, #8b5cf6)" }}
          />
        </div>
      </div>
    </div>
  );
}

function FileRow({ file, onDelete, onPin, openWindow }) {
  const Icon = FILE_ICONS[file.file_type] || File;
  const colorClass = FILE_COLORS[file.file_type] || "text-slate-400";
  const bgClass = FILE_BG[file.file_type] || "bg-slate-800/40 border-slate-700/20";
  const glowClass = FILE_GLOW[file.file_type] || "shadow-slate-500/20";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 2 }}
      className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-default transition-all duration-200 hover:shadow-md ${bgClass} ${glowClass}`}>
      
      {/* Icon */}
      <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 border ${bgClass}`}>
        <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium truncate leading-tight">{file.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-slate-600 font-mono">{formatBytes(file.file_size_bytes)}</span>
          {file.file_type && file.file_type !== "other" && (
            <span className={`text-[9px] font-mono uppercase ${colorClass} opacity-60`}>{file.file_type}</span>
          )}
          {file.source !== "uploaded" && (
            <Badge className="text-[9px] px-1 py-0 h-3 bg-violet-500/15 text-violet-400 border-violet-500/20 font-mono">
              {file.source === "document_editor" ? "DOC" : "SHEET"}
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-cyan-500/10">
              <MoreVertical className="w-3 h-3 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="border text-white text-xs font-mono"
            style={{ background: "rgba(2,10,20,0.97)", borderColor: "rgba(6,182,212,0.2)" }}
            align="end">
            <DropdownMenuItem
              onClick={() => {
                if (!openWindow) return;
                const ext = file.name?.split('.').pop()?.toLowerCase();
                const ft = file.file_type;
                let windowType;
                if (ext === 'fleetslide' || ft === 'presentation') windowType = 'hologram_presentation';
                else if (ft === 'document' || ['doc','docx','txt','rtf','odt','html'].includes(ext)) windowType = 'document_editor';
                else if (ft === 'spreadsheet' || ['xls','xlsx','csv','ods'].includes(ext)) windowType = 'spreadsheet_editor';
                else windowType = 'hologram_presentation';
                openWindow(windowType, { x: 120, y: 80 }, { initialFileUrl: file.file_url, initialTitle: file.name });
              }}
              className="flex items-center gap-2 cursor-pointer hover:bg-cyan-500/10 hover:text-cyan-300">
              <ExternalLink className="w-3.5 h-3.5 text-violet-400" />OPEN IN FLEET AI
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(file.file_url, "_blank")}
              className="flex items-center gap-2 cursor-pointer hover:bg-cyan-500/10 hover:text-cyan-300">
              <Download className="w-3.5 h-3.5 text-cyan-400" />DOWNLOAD
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPin({ id: file.id, pinned: !file.is_pinned })}
              className="flex items-center gap-2 cursor-pointer hover:bg-cyan-500/10 hover:text-cyan-300">
              {file.is_pinned ? <PinOff className="w-3.5 h-3.5 text-amber-400" /> : <Pin className="w-3.5 h-3.5 text-amber-400" />}
              {file.is_pinned ? "UNPIN" : "PIN"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(file.id)}
              className="flex items-center gap-2 cursor-pointer text-red-400 hover:bg-red-500/10">
              <Trash2 className="w-3.5 h-3.5" />DELETE
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}