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
    
    // Dark background
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Header with gradient accent
    doc.setFillColor(6, 182, 212, 30);
    doc.rect(0, 0, 210, 60, 'F');
    
    // Company logo/name
    doc.setFontSize(32);
    doc.setTextColor(6, 182, 212);
    doc.text('NexusVectis', 20, 30);
    
    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184);
    doc.text('AI-Powered Fleet Intelligence Platform', 20, 40);
    
    // Invoice title with accent box
    doc.setFillColor(139, 92, 246, 40);
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(1);
    doc.roundedRect(140, 15, 55, 35, 3, 3, 'FD');
    
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('INVOICE', 167.5, 28, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(6, 182, 212);
    doc.text(invoice.invoice_number, 167.5, 40, { align: 'center' });
    
    // Seller & Buyer section with boxes
    const boxY = 70;
    
    // Seller box
    doc.setFillColor(30, 41, 59, 100);
    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, boxY, 85, 45, 2, 2, 'FD');
    
    doc.setFontSize(9);
    doc.setTextColor(6, 182, 212);
    doc.text('FROM', 23, boxY + 6);
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(invoice.seller_name || 'NexusVectis ApS', 23, boxY + 14);
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const sellerLines = (invoice.seller_address || '').split(',');
    let yOffset = boxY + 20;
    sellerLines.forEach(line => {
      doc.text(line.trim(), 23, yOffset);
      yOffset += 4;
    });
    if (invoice.seller_vat_number) {
      doc.text(`VAT: ${invoice.seller_vat_number}`, 23, yOffset);
    }
    
    // Buyer box
    doc.setFillColor(30, 41, 59, 100);
    doc.roundedRect(110, boxY, 85, 45, 2, 2, 'FD');
    
    doc.setFontSize(9);
    doc.setTextColor(139, 92, 246);
    doc.text('TO', 113, boxY + 6);
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(invoice.buyer_name || 'Customer', 113, boxY + 14);
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    yOffset = boxY + 20;
    
    // Display full address
    if (invoice.buyer_address) {
      const buyerLines = invoice.buyer_address.split(',');
      buyerLines.forEach(line => {
        if (line.trim()) {
          doc.text(line.trim(), 113, yOffset);
          yOffset += 4;
        }
      });
    }
    
    // Display country if not already in address
    if (invoice.buyer_country && (!invoice.buyer_address || !invoice.buyer_address.includes(invoice.buyer_country))) {
      doc.text(invoice.buyer_country, 113, yOffset);
      yOffset += 4;
    }
    
    // Display VAT number
    if (invoice.buyer_vat_number) {
      doc.text(`VAT: ${invoice.buyer_vat_number}`, 113, yOffset);
    }
    
    // Invoice details
    const detailsY = 125;
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Issue Date:', 20, detailsY);
    doc.setTextColor(255, 255, 255);
    doc.text(moment(invoice.issue_date || invoice.created_date).format('DD/MM/YYYY'), 50, detailsY);
    
    doc.setTextColor(148, 163, 184);
    doc.text('Due Date:', 20, detailsY + 6);
    doc.setTextColor(255, 255, 255);
    doc.text(moment(invoice.due_date).format('DD/MM/YYYY'), 50, detailsY + 6);
    
    doc.setTextColor(148, 163, 184);
    doc.text('Period:', 20, detailsY + 12);
    doc.setTextColor(255, 255, 255);
    doc.text(invoice.period_month, 50, detailsY + 12);
    
    // Status badge
    const statusMap = {
      pending: { color: [234, 179, 8], label: 'Pending' },
      paid: { color: [34, 197, 94], label: 'Paid' },
      overdue: { color: [239, 68, 68], label: 'Overdue' },
      cancelled: { color: [148, 163, 184], label: 'Cancelled' }
    };
    const status = statusMap[invoice.status] || statusMap.pending;
    doc.setFillColor(status.color[0], status.color[1], status.color[2], 30);
    doc.setDrawColor(status.color[0], status.color[1], status.color[2]);
    doc.roundedRect(150, detailsY - 4, 40, 10, 2, 2, 'FD');
    doc.setTextColor(status.color[0], status.color[1], status.color[2]);
    doc.setFontSize(9);
    doc.text(status.label, 170, detailsY + 2, { align: 'center' });
    
    // Line items table
    const tableY = 150;
    doc.setDrawColor(71, 85, 105);
    doc.line(20, tableY, 190, tableY);
    
    // Table header
    doc.setFontSize(9);
    doc.setTextColor(6, 182, 212);
    doc.text('DESCRIPTION', 25, tableY + 8);
    doc.text('QTY', 125, tableY + 8, { align: 'right' });
    doc.text('RATE', 150, tableY + 8, { align: 'right' });
    doc.text('AMOUNT', 185, tableY + 8, { align: 'right' });
    
    doc.setDrawColor(71, 85, 105);
    doc.line(20, tableY + 12, 190, tableY + 12);
    
    // Line items
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    let itemY = tableY + 22;
    
    if (invoice.line_items && invoice.line_items.length > 0) {
      invoice.line_items.forEach(item => {
        doc.text(item.description, 25, itemY);
        doc.text(String(item.quantity), 125, itemY, { align: 'right' });
        doc.text(`€${item.unit_price.toFixed(2)}`, 150, itemY, { align: 'right' });
        doc.text(`€${item.total.toFixed(2)}`, 185, itemY, { align: 'right' });
        itemY += 8;
      });
    } else {
      const vehicleTotal = (invoice.vehicle_count || 0) * (invoice.vehicle_price_euro || 15);
      doc.text('Fleet Units', 25, itemY);
      doc.text(String(invoice.vehicle_count || 0), 125, itemY, { align: 'right' });
      doc.text(`€${(invoice.vehicle_price_euro || 15).toFixed(2)}`, 150, itemY, { align: 'right' });
      doc.text(`€${vehicleTotal.toFixed(2)}`, 185, itemY, { align: 'right' });
      
      const resourceTotal = (invoice.resource_count || 0) * (invoice.resource_price_euro || 40);
      doc.text('Resources', 25, itemY + 8);
      doc.text(String(invoice.resource_count || 0), 125, itemY + 8, { align: 'right' });
      doc.text(`€${(invoice.resource_price_euro || 40).toFixed(2)}`, 150, itemY + 8, { align: 'right' });
      doc.text(`€${resourceTotal.toFixed(2)}`, 185, itemY + 8, { align: 'right' });
      itemY += 16;
    }
    
    doc.setDrawColor(71, 85, 105);
    doc.line(120, itemY + 5, 190, itemY + 5);
    
    // Subtotal
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('Subtotal:', 125, itemY + 15);
    doc.setTextColor(255, 255, 255);
    doc.text(`€${(invoice.subtotal || invoice.total_amount).toFixed(2)}`, 185, itemY + 15, { align: 'right' });
    
    // VAT
    if (invoice.vat_rate && invoice.vat_rate > 0) {
      doc.setTextColor(148, 163, 184);
      doc.text(`VAT (${invoice.vat_rate}%):`, 125, itemY + 22);
      doc.setTextColor(255, 255, 255);
      doc.text(`€${(invoice.vat_amount || 0).toFixed(2)}`, 185, itemY + 22, { align: 'right' });
    }
    
    if (invoice.reverse_charge) {
      doc.setFontSize(8);
      doc.setTextColor(234, 179, 8);
      doc.text('Reverse Charge', 125, itemY + 29);
    }
    
    // Total with accent
    const totalY = invoice.vat_rate > 0 ? itemY + 35 : itemY + 25;
    doc.setFillColor(6, 182, 212, 20);
    doc.roundedRect(120, totalY - 5, 70, 14, 2, 2, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(6, 182, 212);
    doc.text('TOTAL:', 125, totalY + 4);
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(`€${invoice.total_amount.toFixed(2)}`, 185, totalY + 4, { align: 'right' });
    
    // Payment terms & notes
    if (invoice.payment_terms || invoice.notes) {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      let notesY = totalY + 20;
      
      if (invoice.payment_terms) {
        doc.text(`Payment Terms: ${invoice.payment_terms}`, 20, notesY);
        notesY += 5;
      }
      
      if (invoice.notes) {
        doc.text('Notes:', 20, notesY);
        const noteLines = doc.splitTextToSize(invoice.notes, 170);
        doc.text(noteLines, 20, notesY + 4);
      }
    }
    
    // Footer
    doc.setDrawColor(71, 85, 105);
    doc.line(20, 275, 190, 275);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Thank you for your business!', 105, 282, { align: 'center' });
    doc.text(`${invoice.seller_name || 'NexusVectis ApS'} | ${invoice.seller_country || 'Denmark'}`, 105, 287, { align: 'center' });
    
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
    pending: 'Pending',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled'
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
          <h1 className="text-3xl font-bold text-white mb-2">Invoices</h1>
          <p className="text-slate-400">Manage your invoices and payments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Billed</CardTitle>
              <DollarSign className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">€{totalAmount.toLocaleString('en-US')}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Pending Payment</CardTitle>
              <Receipt className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">€{pendingAmount.toLocaleString('en-US')}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Paid Invoices</CardTitle>
              <FileText className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{paidCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No invoices yet</p>
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
                              {invoice.vehicle_count || 0} units × €{invoice.vehicle_price_euro || 15} + {invoice.resource_count || 0} resources × €{invoice.resource_price_euro || 40}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                       <div className="text-right">
                         <div className="text-xl font-bold text-white">€{invoice.total_amount.toLocaleString('en-US')}</div>
                         {invoice.due_date && (
                           <div className="text-xs text-slate-400">
                             Due: {moment(invoice.due_date).format('DD/MM/YYYY')}
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