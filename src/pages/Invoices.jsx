import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, DollarSign, Loader2, Receipt } from "lucide-react";
import moment from "moment";
import { jsPDF } from "jspdf";

export default function Invoices() {
  const [user, setUser] = useState(null);

  const downloadInvoice = (invoice) => {
    const doc = new jsPDF();
    
    // Background color for header
    doc.setFillColor(15, 23, 42); // slate-950
    doc.rect(0, 0, 210, 50, 'F');
    
    // Company name/logo
    doc.setFontSize(28);
    doc.setTextColor(6, 182, 212); // cyan-400
    doc.text('NexusVectis', 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('AI-Powered Fleet Intelligence', 20, 35);
    
    // Invoice title
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('FAKTURA', 150, 25);
    
    // Invoice number in box
    doc.setFillColor(6, 182, 212, 0.2);
    doc.setDrawColor(6, 182, 212);
    doc.setLineWidth(0.5);
    doc.roundedRect(145, 30, 50, 12, 2, 2, 'FD');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(invoice.invoice_number, 170, 38, { align: 'center' });
    
    // Invoice details section
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85); // slate-700
    
    doc.text('Fakturadetaljer:', 20, 65);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    
    doc.text(`Periode:`, 20, 75);
    doc.setTextColor(15, 23, 42);
    doc.text(invoice.period_month, 60, 75);
    
    doc.setTextColor(100, 116, 139);
    doc.text(`Status:`, 20, 82);
    
    // Status badge
    const statusColors = {
      pending: [234, 179, 8],
      paid: [34, 197, 94],
      overdue: [239, 68, 68],
      cancelled: [148, 163, 184]
    };
    const color = statusColors[invoice.status] || statusColors.pending;
    doc.setFillColor(color[0], color[1], color[2], 0.2);
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.roundedRect(58, 77, 25, 7, 1, 1, 'FD');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(9);
    doc.text(statusLabels[invoice.status], 70.5, 81.5, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    if (invoice.due_date) {
      doc.text(`Forfaldsdato:`, 20, 93);
      doc.setTextColor(15, 23, 42);
      doc.text(moment(invoice.due_date).format('DD/MM/YYYY'), 60, 93);
    }
    
    // Specification section
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.line(20, 105, 190, 105);
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Specifikation', 20, 115);
    
    // Table header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(20, 120, 170, 10, 'F');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('Beskrivelse', 25, 126);
    doc.text('Antal', 120, 126, { align: 'right' });
    doc.text('Pris', 145, 126, { align: 'right' });
    doc.text('Total', 180, 126, { align: 'right' });
    
    // Line items
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    
    const vehicleTotal = (invoice.vehicle_count || 0) * (invoice.vehicle_price_euro || 15);
    doc.text('Køretøjer', 25, 138);
    doc.text(`${invoice.vehicle_count || 0}`, 120, 138, { align: 'right' });
    doc.text(`€${(invoice.vehicle_price_euro || 15).toFixed(2)}`, 145, 138, { align: 'right' });
    doc.text(`€${vehicleTotal.toFixed(2)}`, 180, 138, { align: 'right' });
    
    const resourceTotal = (invoice.resource_count || 0) * (invoice.resource_price_euro || 40);
    doc.text('Ressourcer', 25, 148);
    doc.text(`${invoice.resource_count || 0}`, 120, 148, { align: 'right' });
    doc.text(`€${(invoice.resource_price_euro || 40).toFixed(2)}`, 145, 148, { align: 'right' });
    doc.text(`€${resourceTotal.toFixed(2)}`, 180, 148, { align: 'right' });
    
    // Subtotal line
    doc.setDrawColor(203, 213, 225);
    doc.line(20, 155, 190, 155);
    
    // Total section with gradient effect
    doc.setFillColor(6, 182, 212, 0.1);
    doc.rect(120, 160, 70, 15, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(6, 182, 212);
    doc.text('TOTAL:', 125, 170);
    doc.setFontSize(16);
    doc.text(`€${invoice.total_amount.toFixed(2)}`, 180, 170, { align: 'right' });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('NexusVectis ApS | CVR: 12345678', 105, 280, { align: 'center' });
    doc.text('Email: billing@nexusvectis.com | Web: nexusvectis.com', 105, 285, { align: 'center' });
    
    // Save
    doc.save(`${invoice.invoice_number}.pdf`);
  };

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const u = await base44.auth.me();
      setUser(u);
      return u;
    }
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', currentUser?.organization_id],
    queryFn: async () => {
      if (!currentUser?.organization_id) return [];
      return await base44.entities.Invoice.filter(
        { organization_id: currentUser.organization_id },
        '-created_date'
      );
    },
    enabled: !!currentUser?.organization_id
  });

  const statusColors = {
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    paid: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    overdue: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' }
  };

  const statusLabels = {
    pending: 'Afventer',
    paid: 'Betalt',
    overdue: 'Forfalden',
    cancelled: 'Annulleret'
  };

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const paidCount = invoices.filter(inv => inv.status === 'paid').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Fakturaer</h1>
          <p className="text-slate-400">Administrer dine fakturaer og betalinger</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total faktureret</CardTitle>
              <DollarSign className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">€{totalAmount.toLocaleString('da-DK')}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Afventer betaling</CardTitle>
              <Receipt className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">€{pendingAmount.toLocaleString('da-DK')}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Betalte fakturaer</CardTitle>
              <FileText className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{paidCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Alle fakturaer</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Ingen fakturaer endnu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => {
                  const status = statusColors[invoice.status] || statusColors.pending;
                  return (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center border border-cyan-500/30">
                          <FileText className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{invoice.invoice_number}</h4>
                            <Badge variant="outline" className={`${status.bg} ${status.text} ${status.border}`}>
                              {statusLabels[invoice.status]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{invoice.period_month}</span>
                            </div>
                            <span>•</span>
                            <span>
                              {invoice.vehicle_count || 0} køretøjer × €{invoice.vehicle_price_euro || 15} + {invoice.resource_count || 0} ressourcer × €{invoice.resource_price_euro || 40}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                       <div className="text-right">
                         <div className="text-xl font-bold text-white">€{invoice.total_amount.toLocaleString('da-DK')}</div>
                         {invoice.due_date && (
                           <div className="text-xs text-slate-400">
                             Forfald: {moment(invoice.due_date).format('DD/MM/YYYY')}
                           </div>
                         )}
                       </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                          onClick={() => downloadInvoice(invoice)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}