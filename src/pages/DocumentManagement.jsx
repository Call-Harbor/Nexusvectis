import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Plus,
  Search,
  Upload,
  Download,
  Eye,
  Trash2,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  Archive,
  X,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import DocumentUploader from "../components/documents/DocumentUploader.jsx";
import DocumentViewer from "../components/documents/DocumentViewer.jsx";
import CMRGenerator from "../components/documents/CMRGenerator.jsx";

export default function DocumentManagement() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showCMRGenerator, setShowCMRGenerator] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Document.filter(
        { organization_id: user.organization_id },
        '-created_date',
        200
      );
    },
    enabled: !!user?.organization_id
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (docId) => base44.entities.Document.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success("Document deleted");
      setSelectedDocument(null);
    }
  });

  const getDocumentIcon = (type) => {
    switch (type) {
      case "CMR":
        return <FileCheck className="w-4 h-4" />;
      case "BOL":
        return <FileText className="w-4 h-4" />;
      case "POD":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "signed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "pending_signature":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "archived":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default:
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.document_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || doc.document_type === typeFilter;
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "date") return new Date(b.created_date) - new Date(a.created_date);
    if (sortBy === "name") return (a.title || "").localeCompare(b.title || "");
    if (sortBy === "type") return (a.document_type || "").localeCompare(b.document_type || "");
    return 0;
  });

  const stats = {
    total: documents.length,
    cmr: documents.filter(d => d.document_type === "CMR").length,
    bol: documents.filter(d => d.document_type === "BOL").length,
    signed: documents.filter(d => d.status === "signed").length
  };

  const exportToCSV = () => {
    const headers = ["Title", "Document Number", "Type", "Status", "Issue Date", "Created Date"];
    const rows = filteredDocuments.map(d => [
      d.title || "-",
      d.document_number || "-",
      d.document_type || "-",
      d.status || "-",
      d.issue_date ? moment(d.issue_date).format('DD-MM-YYYY') : "-",
      d.created_date ? moment(d.created_date).format('DD-MM-YYYY') : "-"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documents-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (showUploader) {
    return (
      <DocumentUploader
        onClose={() => setShowUploader(false)}
        onUpload={() => {
          queryClient.invalidateQueries({ queryKey: ['documents'] });
          setShowUploader(false);
        }}
      />
    );
  }

  if (showCMRGenerator) {
    return (
      <CMRGenerator
        onClose={() => setShowCMRGenerator(false)}
        onGenerate={() => {
          queryClient.invalidateQueries({ queryKey: ['documents'] });
          setShowCMRGenerator(false);
        }}
      />
    );
  }

  if (selectedDocument) {
    return (
      <DocumentViewer
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        onDelete={(docId) => deleteDocumentMutation.mutate(docId)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Document Management</h1>
            <p className="text-slate-400">
              {filteredDocuments.length} of {documents.length} documents
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setShowCMRGenerator(true)}
              variant="outline"
              className="border-slate-700 text-slate-300"
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Generate CMR
            </Button>
            <Button
              onClick={() => setShowUploader(true)}
              className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Documents</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-slate-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">CMR Documents</p>
                  <p className="text-2xl font-bold text-cyan-400">{stats.cmr}</p>
                </div>
                <FileCheck className="w-8 h-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Bills of Lading</p>
                  <p className="text-2xl font-bold text-violet-400">{stats.bol}</p>
                </div>
                <FileText className="w-8 h-8 text-violet-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Signed</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats.signed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by title, document number, filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              {["all", "CMR", "BOL", "POD", "invoice"].map((type) => (
                <Button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  variant={typeFilter === type ? "default" : "outline"}
                  size="sm"
                  className={typeFilter === type 
                    ? "bg-cyan-600 hover:bg-cyan-500" 
                    : "border-slate-700 text-slate-300"}
                >
                  {type === "all" ? "All" : type}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Status:</label>
              <div className="flex gap-2">
                {["all", "draft", "pending_signature", "signed", "archived"].map((status) => (
                  <Button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    className={statusFilter === status ? "bg-violet-600" : "border-slate-700 text-slate-300"}
                  >
                    {status === "all" ? "All" : status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Sort by:</label>
              <div className="flex gap-2">
                {[
                  { value: "date", label: "Date" },
                  { value: "name", label: "Name" },
                  { value: "type", label: "Type" }
                ].map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    variant={sortBy === option.value ? "default" : "outline"}
                    size="sm"
                    className={sortBy === option.value ? "bg-emerald-600" : "border-slate-700 text-slate-300"}
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {(searchTerm || typeFilter !== "all" || statusFilter !== "all") && (
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-slate-400">Active filters:</span>
              {searchTerm && (
                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  Search: {searchTerm}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setSearchTerm("")}
                  />
                </Badge>
              )}
              {typeFilter !== "all" && (
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Type: {typeFilter}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setTypeFilter("all")}
                  />
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="outline" className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                  Status: {statusFilter}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setStatusFilter("all")}
                  />
                </Badge>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="text-slate-500 hover:text-white text-xs ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">Loading documents...</p>
              </CardContent>
            </Card>
          ) : filteredDocuments.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800 col-span-full">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No documents found</p>
              </CardContent>
            </Card>
          ) : (
            filteredDocuments.map((doc) => (
              <Card 
                key={doc.id} 
                className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer"
                onClick={() => setSelectedDocument(doc)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                      {getDocumentIcon(doc.document_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{doc.title}</h3>
                      <p className="text-slate-400 text-sm">{doc.document_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-slate-500">
                      {moment(doc.created_date).format('MMM DD')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}