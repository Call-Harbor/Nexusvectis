import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HardDrive, Upload, File, FileText, FileImage, Video, Archive, 
  Folder, Search, Trash2, Download, Pin, PinOff, MoreVertical, 
  Plus, CloudUpload, CheckCircle, X, Star
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
  other: File,
};

const FILE_COLORS = {
  document: "text-blue-400",
  spreadsheet: "text-emerald-400",
  image: "text-pink-400",
  video: "text-purple-400",
  archive: "text-amber-400",
  pdf: "text-red-400",
  other: "text-slate-400",
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
  if (mimeType?.startsWith("image/") || ["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return "image";
  if (mimeType?.startsWith("video/") || ["mp4","mov","avi","mkv"].includes(ext)) return "video";
  if (mimeType === "application/pdf" || ext === "pdf") return "pdf";
  if (["doc","docx","txt","rtf","odt"].includes(ext)) return "document";
  if (["xls","xlsx","csv","ods"].includes(ext)) return "spreadsheet";
  if (["zip","rar","tar","gz","7z"].includes(ext)) return "archive";
  return "other";
}

export default function FleetDrivePanel({ orgId }) {
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
    toast.success(`${selected.length} fil(er) uploadet til Fleet Drive`);
    setUploading(false);
    setUploadProgress([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Stats
  const totalBytes = files.reduce((sum, f) => sum + (f.file_size_bytes || 0), 0);
  const totalGB = totalBytes / (1024 * 1024 * 1024);
  const storageCostEur = Math.max(0, Math.ceil(totalGB / 10));

  // Folders
  const folders = [...new Set(files.map(f => f.folder || "root"))];

  const filtered = files.filter(f => {
    const matchSearch = !search || f.name?.toLowerCase().includes(search.toLowerCase());
    const matchFolder = activeFolder === "all" || (f.folder || "root") === activeFolder;
    return matchSearch && matchFolder;
  });

  const pinned = filtered.filter(f => f.is_pinned);
  const unpinned = filtered.filter(f => !f.is_pinned);

  return (
    <div className="flex flex-col h-full bg-slate-950/60 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <HardDrive className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="font-bold text-white text-sm">Fleet Drive</h2>
            <p className="text-[10px] text-slate-400">Nexus Cloud Storage</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] text-slate-500">{formatBytes(totalBytes)} brugt</p>
            <p className="text-[10px] text-cyan-400 font-semibold">€{storageCostEur}/md — €1 per 10 GB</p>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} size="sm"
            className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 border-0 text-xs h-8">
            <Upload className="w-3.5 h-3.5 mr-1.5" />Upload
          </Button>
          <input ref={fileInputRef} type="file" multiple onChange={handleUpload} className="hidden" accept="*/*" />
        </div>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/20 flex-shrink-0 space-y-1">
            {uploadProgress.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {p.done ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> : <CloudUpload className="w-3.5 h-3.5 text-cyan-400 animate-pulse flex-shrink-0" />}
                <span className={p.done ? "text-emerald-300" : "text-cyan-300"}>{p.name}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Folder Tabs */}
      <div className="p-3 border-b border-slate-800/50 flex-shrink-0 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Søg filer..." className="pl-8 h-7 text-xs bg-slate-900/60 border-slate-700/50 text-white placeholder:text-slate-600" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", ...folders].map(folder => (
            <button key={folder} onClick={() => setActiveFolder(folder)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${activeFolder === folder ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-500 hover:text-slate-300"}`}>
              <Folder className="w-2.5 h-2.5 inline mr-1" />
              {folder === "all" ? "Alle" : folder === "root" ? "Hjem" : folder}
            </button>
          ))}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-cyan-500/50 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <HardDrive className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm font-medium">Fleet Drive er tom</p>
            <p className="text-slate-600 text-xs mt-1">Upload filer eller gem dokumenter fra Document Editor</p>
            <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline"
              className="mt-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />Upload første fil
            </Button>
          </div>
        )}

        {pinned.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-amber-400/70 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Star className="w-3 h-3" />Fastgjorte
            </p>
            {pinned.map(f => <FileRow key={f.id} file={f} onDelete={deleteMutation.mutate} onPin={pinMutation.mutate} />)}
          </div>
        )}

        {unpinned.map(f => <FileRow key={f.id} file={f} onDelete={deleteMutation.mutate} onPin={pinMutation.mutate} />)}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800/50 flex-shrink-0">
        <p className="text-[10px] text-slate-600">{files.length} filer · {formatBytes(totalBytes)}</p>
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full"
              style={{ width: `${Math.min(100, (totalGB / 100) * 100)}%` }} />
          </div>
          <span className="text-[10px] text-slate-500">{totalGB.toFixed(2)} GB</span>
        </div>
      </div>
    </div>
  );
}

function FileRow({ file, onDelete, onPin }) {
  const Icon = FILE_ICONS[file.file_type] || File;
  const colorClass = FILE_COLORS[file.file_type] || "text-slate-400";

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800/40 group transition-all">
      <Icon className={`w-4 h-4 flex-shrink-0 ${colorClass}`} />
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium truncate">{file.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-600">{formatBytes(file.file_size_bytes)}</span>
          {file.source !== "uploaded" && (
            <Badge className="text-[9px] px-1 py-0 h-3.5 bg-violet-500/20 text-violet-400 border-violet-500/30">
              {file.source === "document_editor" ? "Doc" : "Sheet"}
            </Badge>
          )}
          {file.folder && file.folder !== "root" && (
            <span className="text-[10px] text-slate-700">{file.folder}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="h-6 w-6"
          onClick={() => window.open(file.file_url, "_blank")}>
          <Download className="w-3 h-3 text-slate-400 hover:text-cyan-400" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <MoreVertical className="w-3 h-3 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-slate-900 border-slate-700 text-white text-xs" align="end">
            <DropdownMenuItem onClick={() => onPin({ id: file.id, pinned: !file.is_pinned })}
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-800">
              {file.is_pinned ? <PinOff className="w-3.5 h-3.5 text-amber-400" /> : <Pin className="w-3.5 h-3.5 text-amber-400" />}
              {file.is_pinned ? "Fjern fastgøring" : "Fastgør"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(file.file_url, "_blank")}
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-800">
              <Download className="w-3.5 h-3.5 text-cyan-400" />Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(file.id)}
              className="flex items-center gap-2 cursor-pointer text-red-400 hover:bg-red-500/10">
              <Trash2 className="w-3.5 h-3.5" />Slet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}