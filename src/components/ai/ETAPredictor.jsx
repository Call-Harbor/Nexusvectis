import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, TrendingUp, AlertTriangle, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ETAPredictor({ vehicle_id, shipment_id, onPredictionComplete }) {
  const [prediction, setPrediction] = useState(null);

  const predictMutation = useMutation({
    mutationFn: async () => {
      const { data } = await base44.functions.invoke('predictETA', {
        vehicle_id,
        shipment_id
      });
      return data;
    },
    onSuccess: (data) => {
      setPrediction(data.prediction);
      if (onPredictionComplete) {
        onPredictionComplete(data);
      }
    }
  });

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return "text-emerald-400";
    if (confidence >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  const getDelayColor = (probability) => {
    if (probability < 20) return "text-emerald-400";
    if (probability < 50) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Sparkles className="w-5 h-5 text-violet-400" />
          AI-Powered ETA Prediction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!prediction ? (
          <Button
            onClick={() => predictMutation.mutate()}
            disabled={predictMutation.isPending}
            className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white font-semibold"
          >
            {predictMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Generate ETA Prediction
              </>
            )}
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* ETA Display */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/10 border border-violet-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Estimated Arrival</span>
                <Badge className={`${getConfidenceColor(prediction.confidence)} bg-transparent border-current`}>
                  {prediction.confidence}% Confidence
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-400" />
                <span className="text-2xl font-bold text-white">
                  {prediction.eta_hours?.toFixed(1)} hours
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(prediction.eta_timestamp).toLocaleString()}
              </p>
            </div>

            {/* Delay Probability */}
            {prediction.delay_probability !== undefined && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                <span className="text-sm text-slate-400">Delay Risk</span>
                <span className={`text-sm font-semibold ${getDelayColor(prediction.delay_probability)}`}>
                  {prediction.delay_probability}%
                </span>
              </div>
            )}

            {/* Risk Factors */}
            {prediction.risk_factors && prediction.risk_factors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Risk Factors
                </div>
                <div className="space-y-1">
                  {prediction.risk_factors.map((risk, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-slate-400 pl-6 py-1"
                    >
                      • {risk}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {prediction.recommendations && prediction.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Recommendations
                </div>
                <div className="space-y-1">
                  {prediction.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-slate-400 pl-6 py-1"
                    >
                      • {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPrediction(null);
                predictMutation.mutate();
              }}
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Refresh Prediction
            </Button>
          </motion.div>
        )}

        {predictMutation.isError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            Failed to generate prediction. Please try again.
          </div>
        )}
      </CardContent>
    </Card>
  );
}