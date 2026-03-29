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
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceData, setInvoiceData] = useState({
    vehicleCount: 5,
    resourceCount: 3,
    fleetaiCommands: 50,
    apiCalls: 100,
    harborCalls: 10,
    addonAirport: false,
    addonPort: false,
    addonTransit: false,
    addonAirportHours: 730,
    addonPortHours: 730,
    addonTransitHours: 730
  });
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
      
      const invoiceDataPayload = {
        organization_id: orgId,
        invoice_number: invoiceNumber,
        period_month: periodMonth,
        vehicle_count: parseInt(invoiceData.vehicleCount) || 0,
        resource_count: parseInt(invoiceData.resourceCount) || 0,
        vehicle_price_euro: 15,
        resource_price_euro: 40,
        fleetai_commands: parseInt(invoiceData.fleetaiCommands) || 0,
        api_calls: parseInt(invoiceData.apiCalls) || 0,
        harbor_intelligence_calls: parseInt(invoiceData.harborCalls) || 0,
        addon_airport_ops: invoiceData.addonAirport && org.addon_airport_ops ? true : false,
        addon_port_command: invoiceData.addonPort && org.addon_port_command ? true : false,
        addon_transit_control: invoiceData.addonTransit && org.addon_transit_control ? true : false,
        addon_airport_ops_price: invoiceData.addonAirport && org.addon_airport_ops ? Math.round((2000 / 730) * parseInt(invoiceData.addonAirportHours) * 100) / 100 : 0,
        addon_port_command_price: invoiceData.addonPort && org.addon_port_command ? Math.round((2000 / 730) * parseInt(invoiceData.addonPortHours) * 100) / 100 : 0,
        addon_transit_control_price: invoiceData.addonTransit && org.addon_transit_control ? Math.round((2000 / 730) * parseInt(invoiceData.addonTransitHours) * 100) / 100 : 0,
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
      const vehicleTotal = invoiceDataPayload.vehicle_count * invoiceDataPayload.vehicle_price_euro;
      const resourceTotal = invoiceDataPayload.resource_count * invoiceDataPayload.resource_price_euro;
      const fleetaiTotal = Math.floor(invoiceDataPayload.fleetai_commands / 100) * 5;
      const apiTotal = Math.floor(invoiceDataPayload.api_calls / 100) * 5;
      const harborTotal = invoiceDataPayload.harbor_intelligence_calls * 0.25;
      const addonTotal = invoiceDataPayload.addon_airport_ops_price + invoiceDataPayload.addon_port_command_price + invoiceDataPayload.addon_transit_control_price;
      
      const subtotal = vehicleTotal + resourceTotal + fleetaiTotal + apiTotal + harborTotal + addonTotal;
      const vatAmount = Math.round(subtotal * (invoiceDataPayload.vat_rate / 100) * 100) / 100;
      const totalAmount = subtotal + vatAmount;
      
      invoiceDataPayload.subtotal = Math.round(subtotal * 100) / 100;
      invoiceDataPayload.vat_amount = vatAmount;
      invoiceDataPayload.total_amount = totalAmount;
      
      return await base44.entities.Invoice.create(invoiceDataPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-invoices']);
      setOpenCreateDialog(false);
      setSelectedOrgId("");
      setInvoiceData({
        vehicleCount: 5,
        resourceCount: 3,
        fleetaiCommands: 50,
        apiCalls: 100,
        harborCalls: 10,
        addonAirport: false,
        addonPort: false,
        addonTransit: false,
        addonAirportHours: 730,
        addonPortHours: 730,
        addonTransitHours: 730
      });
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
            <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Create Test Invoice</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Configure products and quantities
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
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

                <div className="border-t border-slate-700 pt-4">
                  <p className="text-slate-300 font-semibold mb-3 text-sm">Products & Services</p>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-slate-400 text-sm mb-1 block">Vehicles (€15 each)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={invoiceData.vehicleCount}
                        onChange={(e) => setInvoiceData({...invoiceData, vehicleCount: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm mb-1 block">Resources (€40 each)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={invoiceData.resourceCount}
                        onChange={(e) => setInvoiceData({...invoiceData, resourceCount: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm mb-1 block">FLEET AI Commands (€5 per 100)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={invoiceData.fleetaiCommands}
                        onChange={(e) => setInvoiceData({...invoiceData, fleetaiCommands: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm mb-1 block">API Calls (€5 per 100)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={invoiceData.apiCalls}
                        onChange={(e) => setInvoiceData({...invoiceData, apiCalls: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm mb-1 block">Harbor Intelligence (€0.25 each)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={invoiceData.harborCalls}
                        onChange={(e) => setInvoiceData({...invoiceData, harborCalls: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <p className="text-slate-300 font-semibold mb-3 text-sm">Add-ons (€2000/month = €2.73/hour)</p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={invoiceData.addonAirport}
                          onChange={(e) => setInvoiceData({...invoiceData, addonAirport: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-slate-300 text-sm">Airport Ops Center</span>
                      </label>
                      {invoiceData.addonAirport && (
                        <div className="ml-6 flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="730"
                            value={invoiceData.addonAirportHours}
                            onChange={(e) => setInvoiceData({...invoiceData, addonAirportHours: e.target.value})}
                            className="bg-slate-700 border-slate-600 text-white text-sm w-20"
                          />
                          <span className="text-slate-400 text-xs">hours (€{(Math.round((2000 / 730) * parseInt(invoiceData.addonAirportHours) * 100) / 100).toFixed(2)})</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={invoiceData.addonPort}
                          onChange={(e) => setInvoiceData({...invoiceData, addonPort: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-slate-300 text-sm">Port Command Center</span>
                      </label>
                      {invoiceData.addonPort && (
                        <div className="ml-6 flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="730"
                            value={invoiceData.addonPortHours}
                            onChange={(e) => setInvoiceData({...invoiceData, addonPortHours: e.target.value})}
                            className="bg-slate-700 border-slate-600 text-white text-sm w-20"
                          />
                          <span className="text-slate-400 text-xs">hours (€{(Math.round((2000 / 730) * parseInt(invoiceData.addonPortHours) * 100) / 100).toFixed(2)})</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={invoiceData.addonTransit}
                          onChange={(e) => setInvoiceData({...invoiceData, addonTransit: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-slate-300 text-sm">Transit Control</span>
                      </label>
                      {invoiceData.addonTransit && (
                        <div className="ml-6 flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="730"
                            value={invoiceData.addonTransitHours}
                            onChange={(e) => setInvoiceData({...invoiceData, addonTransitHours: e.target.value})}
                            className="bg-slate-700 border-slate-600 text-white text-sm w-20"
                          />
                          <span className="text-slate-400 text-xs">hours (€{(Math.round((2000 / 730) * parseInt(invoiceData.addonTransitHours) * 100) / 100).toFixed(2)})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-slate-700">
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-cyan-500/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        View
                      </Button>
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

        {/* Invoice Detail Modal */}
        {selectedInvoice && (
          <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
            <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Invoice Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Header */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-700">
                  <div>
                    <p className="text-slate-500 text-sm">Invoice Number</p>
                    <p className="text-white font-semibold">{selectedInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Period</p>
                    <p className="text-white font-semibold">{selectedInvoice.period_month}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Status</p>
                    <Badge className={statusColors[selectedInvoice.status]?.bg + ' ' + statusColors[selectedInvoice.status]?.text}>
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Issue Date</p>
                    <p className="text-white font-semibold">{moment(selectedInvoice.issue_date).format('DD/MM/YYYY')}</p>
                  </div>
                </div>

                {/* Buyer & Seller */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 font-semibold mb-2">Bill To</p>
                    <div className="text-sm space-y-1">
                      <p className="text-white">{selectedInvoice.buyer_name}</p>
                      <p className="text-slate-400">{selectedInvoice.buyer_vat_number}</p>
                      <p className="text-slate-400">{selectedInvoice.buyer_address}</p>
                      <p className="text-slate-400">{selectedInvoice.buyer_country}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold mb-2">From</p>
                    <div className="text-sm space-y-1">
                      <p className="text-white">{selectedInvoice.seller_name}</p>
                      <p className="text-slate-400">{selectedInvoice.seller_vat_number}</p>
                      <p className="text-slate-400">{selectedInvoice.seller_address}</p>
                      <p className="text-slate-400">{selectedInvoice.seller_country}</p>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <p className="text-slate-400 font-semibold mb-3">Line Items</p>
                  <div className="space-y-2 text-sm">
                    {selectedInvoice.vehicle_count > 0 && (
                      <div className="flex justify-between text-slate-300">
                        <span>{selectedInvoice.vehicle_count} vehicles @ €{selectedInvoice.vehicle_price_euro}</span>
                        <span>€{(selectedInvoice.vehicle_count * selectedInvoice.vehicle_price_euro).toFixed(2)}</span>
                      </div>
                    )}
                    {selectedInvoice.resource_count > 0 && (
                      <div className="flex justify-between text-slate-300">
                        <span>{selectedInvoice.resource_count} resources @ €{selectedInvoice.resource_price_euro}</span>
                        <span>€{(selectedInvoice.resource_count * selectedInvoice.resource_price_euro).toFixed(2)}</span>
                      </div>
                    )}
                    {selectedInvoice.fleetai_commands > 0 && (
                      <div className="flex justify-between text-slate-300">
                        <span>FLEET AI: {selectedInvoice.fleetai_commands} commands @ €{selectedInvoice.fleetai_price_per_100}/100</span>
                        <span>€{(Math.floor(selectedInvoice.fleetai_commands / 100) * selectedInvoice.fleetai_price_per_100).toFixed(2)}</span>
                      </div>
                    )}
                    {selectedInvoice.api_calls > 0 && (
                      <div className="flex justify-between text-slate-300">
                        <span>API Calls: {selectedInvoice.api_calls} @ €{selectedInvoice.api_price_per_100}/100</span>
                        <span>€{(Math.floor(selectedInvoice.api_calls / 100) * selectedInvoice.api_price_per_100).toFixed(2)}</span>
                      </div>
                    )}
                    {selectedInvoice.harbor_intelligence_calls > 0 && (
                      <div className="flex justify-between text-slate-300">
                        <span>Harbor Intelligence: {selectedInvoice.harbor_intelligence_calls} @ €{selectedInvoice.harbor_intelligence_price_per_call}</span>
                        <span>€{(selectedInvoice.harbor_intelligence_calls * selectedInvoice.harbor_intelligence_price_per_call).toFixed(2)}</span>
                      </div>
                    )}
                    {selectedInvoice.addon_airport_ops && selectedInvoice.addon_airport_ops_price > 0 && (
                      <div className="flex justify-between text-slate-300">
                        <span>Airport Ops Center</span>
                        <span>€{selectedInvoice.addon_airport_ops_price.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedInvoice.addon_port_command && selectedInvoice.addon_port_command_price > 0 && (
                      <div className="flex justify-between text-slate-300">
                        <span>Port Command Center</span>
                        <span>€{selectedInvoice.addon_port_command_price.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedInvoice.addon_transit_control && selectedInvoice.addon_transit_control_price > 0 && (
                      <div className="flex justify-between text-slate-300">
                        <span>Transit Control</span>
                        <span>€{selectedInvoice.addon_transit_control_price.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-4 border-t border-slate-700">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span>€{(selectedInvoice.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>VAT ({selectedInvoice.vat_rate}%)</span>
                    <span>€{(selectedInvoice.vat_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-slate-600">
                    <span>Total</span>
                    <span>€{selectedInvoice.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="space-y-2 pt-4 border-t border-slate-700 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Due Date</span>
                    <span className="text-white">{moment(selectedInvoice.due_date).format('DD/MM/YYYY')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Terms</span>
                    <span className="text-white">{selectedInvoice.payment_terms}</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
    </AdminLayout>
  );
}