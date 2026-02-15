import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Trash2, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import moment from "moment";

export default function DocumentViewer({ document, onClose, onDelete }) {
  const navigate = useNavigate();

  const { data: shipment } = useQuery({
    queryKey: ['shipment', document.shipment_id],
    queryFn: async () => {
      if (!document.shipment_id) return null;
      const shipments = await base44.entities.Shipment.filter({ id: document.shipment_id });
      return shipments[0] || null;
    },
    enabled: !!document.shipment_id
  });

  const { data: contract } = useQuery({
    queryKey: ['contract', document.contract_id],
    queryFn: async () => {
      if (!document.contract_id) return null;
      const contracts = await base44.entities.Contract.filter({ id: document.contract_id });
      return contracts[0] || null;
    },
    enabled: !!document.contract_id
  });

  const { data: customer } = useQuery({
    queryKey: ['customer', document.customer_id],
    queryFn: async () => {
      if (!document.customer_id) return null;
      const customers = await base44.entities.Customer.filter({ id: document.customer_id });
      return customers[0] || null;
    },
    enabled: !!document.customer_id
  });

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

  const handleDownload = () => {
    window.open(document.file_url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={onClose}
              variant="outline"
              size="icon"
              className="border-slate-700 text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{document.title}</h1>
                <Badge className={getStatusColor(document.status)}>
                  {document.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-slate-400">{document.document_number}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="border-slate-700 text-slate-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-red-700 text-red-400">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Delete Document?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    This will permanently delete this document. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(document.id)} className="bg-red-600">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Document Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {document.file_url && document.mime_type?.includes('pdf') ? (
                  <iframe
                    src={document.file_url}
                    className="w-full h-[600px] rounded-lg"
                    title="Document Preview"
                  />
                ) : document.mime_type?.includes('image') ? (
                  <img
                    src={document.file_url}
                    alt={document.title}
                    className="w-full rounded-lg"
                  />
                ) : (
                  <div className="h-[600px] flex items-center justify-center bg-slate-800/50 rounded-lg">
                    <div className="text-center">
                      <Eye className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">Preview not available</p>
                      <Button onClick={handleDownload} className="mt-4" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download to View
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Document Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-slate-400 text-sm">Type</p>
                  <p className="text-white font-medium">{document.document_type}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Document Number</p>
                  <p className="text-white font-medium">{document.document_number}</p>
                </div>
                {document.issue_date && (
                  <div>
                    <p className="text-slate-400 text-sm">Issue Date</p>
                    <p className="text-white font-medium">{moment(document.issue_date).format('MMM DD, YYYY')}</p>
                  </div>
                )}
                {document.file_size && (
                  <div>
                    <p className="text-slate-400 text-sm">File Size</p>
                    <p className="text-white font-medium">{(document.file_size / 1024).toFixed(1)} KB</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {shipment && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Related Shipment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/50 transition-colors cursor-pointer"
                    onClick={() => navigate(createPageUrl('Shipments'))}
                  >
                    <p className="text-white font-medium">{shipment.tracking_number}</p>
                    <p className="text-slate-400 text-xs">{shipment.origin} → {shipment.destination}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {contract && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Related Contract</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/50 transition-colors cursor-pointer"
                    onClick={() => navigate(createPageUrl('ContractManagement'))}
                  >
                    <p className="text-white font-medium">{contract.contract_number}</p>
                    <p className="text-slate-400 text-xs">{contract.contract_name}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {customer && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Related Customer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/50 transition-colors cursor-pointer"
                    onClick={() => navigate(createPageUrl('CustomerManagement'))}
                  >
                    <p className="text-white font-medium">{customer.name}</p>
                    <p className="text-slate-400 text-xs">{customer.email}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {document.signed_by && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Signature Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-slate-400 text-sm">Signed By</p>
                    <p className="text-white font-medium">{document.signed_by}</p>
                  </div>
                  {document.signed_date && (
                    <div>
                      <p className="text-slate-400 text-sm">Signed Date</p>
                      <p className="text-white font-medium">{moment(document.signed_date).format('MMM DD, YYYY HH:mm')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {document.notes && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white whitespace-pre-wrap">{document.notes}</p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-slate-400 text-sm">Created</p>
                  <p className="text-white">{moment(document.created_date).format('MMM DD, YYYY HH:mm')}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Created By</p>
                  <p className="text-white">{document.created_by}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}