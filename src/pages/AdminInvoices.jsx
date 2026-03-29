import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, CheckCircle, XCircle, Ban, AlertTriangle, Search, Mail, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import AdminLayout from "@/components/admin/AdminLayout";
import moment from "moment";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AdminInvoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['admin-invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date')
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list()
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (invoiceId) => {
      await base44.entities.Invoice.update(invoiceId, {
        status: 'paid',
        paid_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-invoices']);
      toast.success("Invoice marked as paid");
    }
  });

  const cancelInvoiceMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const response = await base44.functions.invoke('cancelInvoiceWithCreditNote', { invoice_id: invoiceId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-invoices']);
      toast.success("Invoice cancelled and credit note sent");
    }
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (invoice) => {
      const response = await base44.functions.invoke('sendPaymentReminder', { invoice_id: invoice.id });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Payment reminder sent");
    }
  });

  const suspendAccountMutation = useMutation({
    mutationFn: async ({ organizationId, invoiceId }) => {
      const response = await base44.functions.invoke('suspendOrganization', {
        organization_id: organizationId,
        invoice_id: invoiceId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations']);
      toast.success("Account suspended");
    }
  });

  const createTestInvoiceMutation = useMutation({
    mutationFn: async (orgId) => {
      const org = organizations.find(o => o.id === orgId);
      if (!org) throw new Error("Organization not found");
      
      const now = new Date();
      const invoiceNumber = `TEST-${Date.now()}`;
      const periodMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
      const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      const invoiceData = {
        organization_id: orgId,
        invoice_number: invoiceNumber,
        period_month: periodMonth,
        vehicle_count: Math.floor(Math.random() * 10) + 1,
        resource_count: Math.floor(Math.random() * 5) + 1,
        vehicle_price_euro: 15,
        resource_price_euro: 40,
        fleetai_commands: Math.floor(Math.random() * 100),
        api_calls: Math.floor(Math.random() * 200),
        harbor_intelligence_calls: Math.floor(Math.random() * 50),
        addon_airport_ops: org.addon_airport_ops ? true : false,
        addon_port_command: org.addon_port_command ? true : false,
        addon_transit_control: org.addon_transit_control ? true : false,
        addon_airport_ops_price: org.addon_airport_ops ? 2000 : 0,
        addon_port_command_price: org.addon_port_command ? 2000 : 0,
        addon_transit_control_price: org.addon_transit_control ? 2000 : 0,
        status: 'pending',
        due_date: dueDate.toISOString().split('T')[0],
        issue_date: now.toISOString().split('T')[0],
        seller_name: 'NexusVectis ApS',
        seller_vat_number: 'DK12345678',
        seller_address: 'Vesterbrogade 123, 1620 København V, Denmark',
        seller_country: 'Denmark',
        buyer_name: org.name,
        buyer_vat_number: org.vat_number,
        buyer_address: org.address,
        buyer_country: org.headquarters_country,
        payment_terms: 'Net 14 days',
        vat_rate: 25,
        currency: 'EUR'
      };
      
      // Calculate totals
      const vehicleTotal = invoiceData.vehicle_count * invoiceData.vehicle_price_euro;
      const resourceTotal = invoiceData.resource_count * invoiceData.resource_price_euro;
      const fleetaiTotal = Math.floor(invoiceData.fleetai_commands / 100) * 5;
      const apiTotal = Math.floor(invoiceData.api_calls / 100) * 5;
      const harborTotal = invoiceData.harbor_intelligence_calls * 0.25;
      const addonTotal = invoiceData.addon_airport_ops_price + invoiceData.addon_port_command_price + invoiceData.addon_transit_control_price;
      
      const subtotal = vehicleTotal + resourceTotal + fleetaiTotal + apiTotal + harborTotal + addonTotal;
      const vatAmount = Math.round(subtotal * (invoiceData.vat_rate / 100) * 100) / 100;
      const totalAmount = subtotal + vatAmount;
      
      invoiceData.subtotal = Math.round(subtotal * 100) / 100;
      invoiceData.vat_amount = vatAmount;
      invoiceData.total_amount = totalAmount;
      
      return await base44.entities.Invoice.create(invoiceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-invoices']);
      setOpenCreateDialog(false);
      setSelectedOrgId("");
      toast.success("Test invoice created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create test invoice: " + error.message);
    }
  });

  const filteredInvoices = invoices.filter(inv => {
    const org = organizations.find(o => o.id === inv.organization_id);
    return (
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0)
  };

  const statusColors = {
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    paid: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    overdue: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' }
  };

  return (
    <AdminLayout currentPage="AdminInvoices">
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">

      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Invoice Management</h1>
            <p className="text-slate-400">Manage all platform invoices and payments</p>
          </div>
          <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Test Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white">Create Test Invoice</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Generate a test invoice with random data for testing purposes
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300 mb-2 block">Organization</Label>
                  <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select an organization" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {organizations.map(org => (
                        <SelectItem key={org.id} value={org.id} className="text-white">
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setOpenCreateDialog(false)}
                    className="bg-slate-800 border-slate-700 text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createTestInvoiceMutation.mutate(selectedOrgId)}
                    disabled={!selectedOrgId || createTestInvoiceMutation.isPending}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {createTestInvoiceMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Invoice'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-1">Total Invoices</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-1">Paid</p>
                <p className="text-2xl font-bold text-green-400">{stats.paid}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-1">Overdue</p>
                <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-1">Revenue</p>
                <p className="text-2xl font-bold text-cyan-400">€{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by invoice number or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-800 text-white"
            />
          </div>
        </div>

        {/* Invoices List */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => {
                const org = organizations.find(o => o.id === invoice.organization_id);
                const status = statusColors[invoice.status] || statusColors.pending;
                const daysOverdue = invoice.due_date ? 
                  Math.max(0, moment().diff(moment(invoice.due_date), 'days')) : 0;
                
                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center border border-cyan-500/30">
                        <FileText className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">{invoice.invoice_number}</h4>
                          <Badge variant="outline" className={`${status.bg} ${status.text} ${status.border}`}>
                            {invoice.status}
                          </Badge>
                          {daysOverdue > 10 && invoice.status !== 'paid' && (
                            <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                              {daysOverdue} days overdue
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span>{org?.name || 'Unknown'}</span>
                          <span>•</span>
                          <span>{invoice.period_month}</span>
                          <span>•</span>
                          <span>Due: {moment(invoice.due_date).format('DD/MM/YYYY')}</span>
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <div className="text-xl font-bold text-white">€{invoice.total_amount.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {invoice.status === 'pending' || invoice.status === 'overdue' ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
                            onClick={() => markAsPaidMutation.mutate(invoice.id)}
                            disabled={markAsPaidMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Paid
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30"
                            onClick={() => sendReminderMutation.mutate(invoice)}
                            disabled={sendReminderMutation.isPending}
                          >
                            <Mail className="w-4 h-4 mr-1" />
                            Reminder
                          </Button>
                          {daysOverdue > 10 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                                >
                                  <Ban className="w-4 h-4 mr-1" />
                                  Suspend
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-slate-900 border-slate-700">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">Suspend Account?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-400">
                                    This will suspend {org?.name}'s account until payment is received. They will not be able to access the platform.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => suspendAccountMutation.mutate({ 
                                      organizationId: invoice.organization_id, 
                                      invoiceId: invoice.id 
                                    })}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Suspend Account
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-900 border-slate-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Cancel Invoice?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                  This will cancel the invoice. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelInvoiceMutation.mutate(invoice.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Cancel Invoice
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      ) : (
                        <Badge className="bg-slate-700/50 text-slate-400">
                          {invoice.status === 'paid' ? 'Completed' : 'Cancelled'}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AdminLayout>
  );
}