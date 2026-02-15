import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";

export default function RelatedContracts({ filterKey, filterValue, title = "Related Contracts" }) {
  const navigate = useNavigate();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['relatedContracts', filterKey, filterValue],
    queryFn: async () => {
      if (!filterValue) return [];
      const filter = { [filterKey]: filterValue };
      return await base44.entities.Contract.filter(filter, '-created_date', 50);
    },
    enabled: !!filterValue
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-6">
          <p className="text-slate-400 text-sm">Loading contracts...</p>
        </CardContent>
      </Card>
    );
  }

  if (contracts.length === 0) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "draft": return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      case "pending_approval": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "expired": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          {title} ({contracts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {contracts.map((contract) => (
          <div
            key={contract.id}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/50 transition-colors cursor-pointer"
            onClick={() => navigate(createPageUrl('ContractManagement'))}
          >
            <div className="flex-1">
              <p className="text-white font-medium">{contract.contract_number}</p>
              <p className="text-slate-400 text-xs">{contract.contract_name}</p>
              <p className="text-slate-500 text-xs mt-1">
                Valid until: {moment(contract.end_date).format('MMM DD, YYYY')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(contract.status)}>
                {contract.status}
              </Badge>
              <ExternalLink className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}