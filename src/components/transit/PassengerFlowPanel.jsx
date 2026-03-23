import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, TrendingDown, AlertCircle } from 'lucide-react';

export default function PassengerFlowPanel() {
  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ['passenger-flow-recommendations'],
    queryFn: async () => {
      return await base44.functions.invoke('passengerFlowCopilot', { 
        organizationId: 'default'
      }).then(res => res.data.recommendations);
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (actionId) => {
      return await base44.entities.RecommendedAction.update(actionId, { status: 'approved' });
    },
    onSuccess: () => refetch()
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Passenger Flow Co-pilot</CardTitle>
        <CardDescription>AI-suggested operational adjustments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-6 text-slate-500">Analyzing crowding patterns...</div>
          ) : recommendations?.length === 0 ? (
            <div className="text-center py-6 text-slate-500">No recommendations at this time</div>
          ) : (
            recommendations?.map((rec) => (
              <div key={rec.id} className="p-3 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{rec.action_type.replace(/_/g, ' ').toUpperCase()}</div>
                    <div className="text-sm text-slate-700 mt-1">{rec.description}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 ${
                    rec.status === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {rec.status.toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <TrendingDown className="w-3 h-3" />
                  <span>Expected impact: {rec.expected_impact.change_percentage}% {rec.expected_impact.metric.replace(/_/g, ' ')}</span>
                </div>
                {rec.status === 'pending' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => approveMutation.mutate(rec.id)}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}