import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  FileText,
  TrendingUp,
  Shield,
  Fuel,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
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

export default function ContractDetails({ contract, customer, onClose, onEdit, onDelete, onManageRates }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "draft":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      case "pending_approval":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "expired":
      case "terminated":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "suspended":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const daysUntilExpiry = moment(contract.end_date).diff(moment(), 'days');
  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;

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
                <h1 className="text-3xl font-bold text-white">{contract.contract_number}</h1>
                <Badge className={getStatusColor(contract.status)}>
                  <span className="capitalize">{contract.status.replace('_', ' ')}</span>
                </Badge>
                {isExpiringSoon && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Expires in {daysUntilExpiry} days
                  </Badge>
                )}
              </div>
              <p className="text-slate-400">{contract.contract_name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onEdit(contract)}
              variant="outline"
              className="border-slate-700 text-slate-300"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={onManageRates}
              className="bg-gradient-to-r from-cyan-600 to-violet-600"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Manage Rates
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-red-700 text-red-400 hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Delete Contract?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    This will permanently delete this contract. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(contract.id)} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Customer Name</p>
                    <p className="text-white font-medium">{customer?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Email</p>
                    <p className="text-white font-medium">{customer?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Company</p>
                    <p className="text-white font-medium">{customer?.company || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Phone</p>
                    <p className="text-white font-medium">{customer?.phone || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Details */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Contract Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Contract Type</p>
                    <p className="text-white font-medium capitalize">{contract.contract_type}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Currency</p>
                    <p className="text-white font-medium">{contract.currency}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Start Date</p>
                    <p className="text-white font-medium">{moment(contract.start_date).format('MMM DD, YYYY')}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">End Date</p>
                    <p className="text-white font-medium">{moment(contract.end_date).format('MMM DD, YYYY')}</p>
                  </div>
                </div>
                {contract.auto_renew && (
                  <div className="flex items-center gap-2 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 text-sm">Auto-renewal enabled ({contract.renewal_notice_days} days notice)</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Terms */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                  Financial Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Payment Terms</p>
                    <p className="text-white font-medium">{contract.payment_terms || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Credit Limit</p>
                    <p className="text-white font-medium">{contract.credit_limit ? `${contract.currency} ${contract.credit_limit.toLocaleString()}` : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Minimum Volume</p>
                    <p className="text-white font-medium">{contract.minimum_volume ? `${contract.minimum_volume} ${contract.volume_unit}` : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Discount</p>
                    <p className="text-white font-medium">{contract.discount_percentage ? `${contract.discount_percentage}%` : "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Level Agreement */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Service Level Agreement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Delivery Time</p>
                    <p className="text-white font-medium">{contract.sla_delivery_time}h</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">On-Time Target</p>
                    <p className="text-white font-medium">{contract.sla_on_time_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Penalty/Day</p>
                    <p className="text-white font-medium">{contract.penalty_per_day ? `${contract.currency} ${contract.penalty_per_day}` : "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes & Terms */}
            {(contract.notes || contract.terms_conditions) && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contract.notes && (
                    <div>
                      <p className="text-slate-400 text-sm mb-2">Notes</p>
                      <p className="text-white">{contract.notes}</p>
                    </div>
                  )}
                  {contract.terms_conditions && (
                    <>
                      {contract.notes && <Separator className="bg-slate-700" />}
                      <div>
                        <p className="text-slate-400 text-sm mb-2">Terms & Conditions</p>
                        <p className="text-white whitespace-pre-wrap">{contract.terms_conditions}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Additional Services */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Additional Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300 text-sm">Insurance</span>
                  </div>
                  {contract.insurance_included ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400">
                      {contract.insurance_value_percentage}%
                    </Badge>
                  ) : (
                    <span className="text-slate-500 text-sm">Not included</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300 text-sm">Fuel Surcharge</span>
                  </div>
                  {contract.fuel_surcharge_applicable ? (
                    <Badge className="bg-amber-500/20 text-amber-400">
                      {contract.fuel_surcharge_percentage}%
                    </Badge>
                  ) : (
                    <span className="text-slate-500 text-sm">Not applicable</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contract Signature */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Contract Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Customer Signed</span>
                  {contract.signed_by_customer ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <span className="text-slate-500 text-sm">Pending</span>
                  )}
                </div>
                {contract.signed_date && (
                  <div>
                    <p className="text-slate-400 text-sm">Signed Date</p>
                    <p className="text-white">{moment(contract.signed_date).format('MMM DD, YYYY')}</p>
                  </div>
                )}
                {contract.approved_by && (
                  <>
                    <Separator className="bg-slate-700" />
                    <div>
                      <p className="text-slate-400 text-sm">Approved By</p>
                      <p className="text-white">{contract.approved_by}</p>
                    </div>
                    {contract.approved_date && (
                      <div>
                        <p className="text-slate-400 text-sm">Approval Date</p>
                        <p className="text-white">{moment(contract.approved_date).format('MMM DD, YYYY')}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-slate-400 text-sm">Created</p>
                  <p className="text-white">{moment(contract.created_date).format('MMM DD, YYYY HH:mm')}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Last Updated</p>
                  <p className="text-white">{moment(contract.updated_date).format('MMM DD, YYYY HH:mm')}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Created By</p>
                  <p className="text-white">{contract.created_by}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}