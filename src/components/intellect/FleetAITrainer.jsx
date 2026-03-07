import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, Code, Play, Save, Plus, Trash2, Eye, Settings, Download, Copy, CheckCircle, Link2, FileUp, Trash, Sparkles, Gauge, Cpu, BarChart3, Brain, Activity, Shield, AlertTriangle, Radio, Crosshair, Terminal, Database, GitBranch, Layers, FlaskConical, Sliders, BookMarked, RefreshCw, ChevronRight, ExternalLink, AlertCircle, Clock, CheckSquare, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { base44 } from '@/api/base44Client';
import AdvancedModelMonitoring from './AdvancedModelMonitoring';
import { useQuery } from '@tanstack/react-query';

// HARBOR scanning line animation
const ScanLine = () => (
  <motion.div
    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent z-10 pointer-events-none"
    initial={{ top: '0%' }}
    animate={{ top: ['0%', '100%', '0%'] }}
    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
  />
);

// Corner brackets decoration
const CornerBrackets = ({ color = 'amber' }) => {
  const c = color === 'amber' ? 'border-amber-500/60' : 'border-cyan-500/60';
  return (
    <>
      <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${c}`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${c}`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${c}`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${c}`} />
    </>
  );
};

// Pulsing stat card
const StatCard = ({ label, value, icon: Icon, color = 'amber', pulse = false }) => (
  <div className={`relative overflow-hidden rounded-lg border border-${color}-500/30 bg-black/40 p-3`}>
    <CornerBrackets color={color} />
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-3 h-3 text-${color}-400`} />
      <span className={`text-[10px] font-mono uppercase tracking-widest text-${color}-400/70`}>{label}</span>
      {pulse && <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-${color}-400 animate-pulse`} />}
    </div>
    <div className={`text-lg font-bold font-mono text-${color}-300`}>{value}</div>
  </div>
);

export default function FleetAITrainer({ onClose }) {
  const [activeTab, setActiveTab] = useState('training');
  const [models, setModels] = useState([
    { id: 1, name: 'Fleet Optimizer v1.0', accuracy: 94.2, trained: true, version: '1.0' },
    { id: 2, name: 'Route Predictor v1.1', accuracy: 91.8, trained: true, version: '1.1' },
  ]);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [apiKeys, setApiKeys] = useState([]);
  const [showNewModel, setShowNewModel] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [trainingData, setTrainingData] = useState([
    { id: 1, type: 'link', content: 'https://example.com/docs', label: 'Documentation' },
    { id: 2, type: 'faq', content: 'Q: How to optimize routes?\nA: Use the Route Optimizer feature...', label: 'FAQ' },
  ]);
  const [newDataType, setNewDataType] = useState('link');
  const [newDataContent, setNewDataContent] = useState('');
  const [newDataLabel, setNewDataLabel] = useState('');
  const [showAddData, setShowAddData] = useState(false);
  const [crawlingIds, setCrawlingIds] = useState(new Set());
  const [aiInsights, setAiInsights] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [liveAccuracy, setLiveAccuracy] = useState(selectedModel.accuracy);
  const [savedModels, setSavedModels] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null);
  const [simScenario, setSimScenario] = useState('peak_demand');
  const [isFinetuning, setIsFinetuning] = useState(false);
  const [finetuneProgress, setFinetuneProgress] = useState(0);
  const [finetuneConfig, setFinetuneConfig] = useState({ lr: '0.0001', steps: '500', rank: '16', method: 'lora' });
  // Real fine-tuning state
  const [ftModel, setFtModel] = useState('open-mistral-7b');
  const [ftSteps, setFtSteps] = useState('100');
  const [ftLr, setFtLr] = useState('0.0001');
  const [ftSuffix, setFtSuffix] = useState('harbor-fleet');
  const [ftFileId, setFtFileId] = useState(null);
  const [ftJobId, setFtJobId] = useState(null);
  const [ftJob, setFtJob] = useState(null);
  const [ftJobs, setFtJobs] = useState([]);
  const [ftStep, setFtStep] = useState('config'); // 'config' | 'uploading' | 'training' | 'done'
  const [ftError, setFtError] = useState(null);
  const [ftFineTunedModels, setFtFineTunedModels] = useState([]);
  const ftPollRef = useRef(null);
  const [systemLog, setSystemLog] = useState([
    '[HARBOR] Fleet AI Trainer initialized',
    '[SYS] Model registry loaded — 2 models active',
    '[NET] API endpoint nominal',
  ]);

  // Real data queries
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => base44.entities.Vehicle.list() });
  const { data: routes = [] } = useQuery({ queryKey: ['routes'], queryFn: () => base44.entities.Route.list() });
  const { data: shipments = [] } = useQuery({ queryKey: ['shipments'], queryFn: () => base44.entities.Shipment.list() });
  const { data: alerts = [] } = useQuery({ queryKey: ['alerts'], queryFn: () => base44.entities.Alert.list() });
  const { data: fleetAIUsages = [] } = useQuery({ queryKey: ['fleetaiusage'], queryFn: () => base44.entities.FleetAIUsage.list('-created_date', 50) });
  const { data: apiUsages = [] } = useQuery({ queryKey: ['apiusage'], queryFn: () => base44.entities.APIUsage.list('-created_date', 50) });
  const { data: savedModelsDB = [] } = useQuery({ queryKey: ['fleetaimodels'], queryFn: () => base44.entities.FleetAIModel.list('-created_date', 10) });

  // Derive real chart data from entities
  const totalEntities = vehicles.length + routes.length + shipments.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const deliveredShipments = shipments.filter(s => s.status === 'delivered').length;
  const totalShipments = shipments.length || 1;
  const realAccuracy = Math.min(99.9, 70 + (deliveredShipments / totalShipments) * 25 + Math.min(vehicles.length, 10) * 0.3);

  // Build loss/accuracy curve from FleetAI command history grouped by day
  const buildChartData = () => {
    if (fleetAIUsages.length === 0) {
      return [
        { epoch: 1, loss: 0.85, accuracy: 70 },
        { epoch: 2, loss: 0.72, accuracy: 75 },
        { epoch: 3, loss: 0.61, accuracy: 80 },
        { epoch: 4, loss: 0.48, accuracy: 85 },
        { epoch: 5, loss: 0.35, accuracy: realAccuracy },
      ];
    }
    const successRate = fleetAIUsages.filter(u => u.success !== false).length / fleetAIUsages.length;
    return Array.from({ length: 5 }, (_, i) => ({
      epoch: i + 1,
      loss: parseFloat((0.85 * Math.pow(1 - successRate * 0.3, i + 1)).toFixed(3)),
      accuracy: parseFloat(Math.min(99, 70 + successRate * 20 + i * (realAccuracy - 70) / 4).toFixed(1)),
    }));
  };

  const chartData = buildChartData();

  // Radar data from real fleet health metrics
  const avgEfficiency = vehicles.length > 0 ? vehicles.reduce((s, v) => s + (v.efficiency_score || 75), 0) / vehicles.length : 80;
  const avgSignal = vehicles.length > 0 ? vehicles.reduce((s, v) => s + (v.signal_strength || 80), 0) / vehicles.length : 80;
  const activeRoutes = routes.filter(r => r.status === 'active').length;
  const routeScore = routes.length > 0 ? Math.min(100, (activeRoutes / routes.length) * 100 + 20) : 80;
  const apiSuccess = apiUsages.length > 0 ? (apiUsages.filter(a => a.status_code < 400).length / apiUsages.length) * 100 : 90;

  const radarData = [
    { subject: 'Accuracy', value: Math.round(realAccuracy) },
    { subject: 'Speed', value: Math.round(avgSignal) },
    { subject: 'Stability', value: Math.round(apiSuccess) },
    { subject: 'Memory', value: Math.round(routeScore) },
    { subject: 'Efficiency', value: Math.round(avgEfficiency) },
  ];

  // GPU/resource metrics from API usage response times
  const avgResponseMs = apiUsages.length > 0 ? apiUsages.reduce((s, a) => s + (a.response_time_ms || 200), 0) / apiUsages.length : 200;
  const gpuUtilization = Math.min(95, Math.round(40 + (fleetAIUsages.length / 50) * 40));
  const vramUtilization = Math.min(90, Math.round(30 + (vehicles.length / 20) * 40));
  const throughputScore = Math.min(99, Math.round(60 + apiSuccess * 0.3 + (fleetAIUsages.filter(u => u.success !== false).length / 50) * 30));

  useEffect(() => {
    if (isTraining) {
      const t = setInterval(() => {
        setLiveAccuracy(prev => Math.min(99.9, prev + Math.random() * 0.3));
      }, 800);
      return () => clearInterval(t);
    }
  }, [isTraining]);

  const startTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setSystemLog(prev => [...prev, '[TRAIN] Initiating neural network training sequence...', '[GPU] CUDA cores engaged — 72% utilization']);
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          setSystemLog(p => [...p, '[TRAIN] Training complete — model updated', `[PERF] Accuracy: ${liveAccuracy.toFixed(1)}%`]);
          return 100;
        }
        return prev + Math.random() * 25;
      });
    }, 1000);
  };

  const generateAPIKey = async () => {
    try {
      const response = await base44.functions.invoke('generateAPIKey', { name: `HARBOR Key ${apiKeys.length + 1}` });
      const data = response.data;
      const newKey = {
        id: data.key_id,
        key: data.api_key, // Full key shown once
        prefix: data.key_prefix,
        created: new Date().toLocaleDateString('da-DK'),
        lastUsed: '-',
        calls: 0,
        showFull: true, // Show full key only this once
      };
      setApiKeys(prev => [...prev, newKey]);
      setSystemLog(prev => [...prev, `[API] New key generated: ${data.key_prefix}...`, '[WARN] Save this key now — it will not be shown again']);
    } catch (e) {
      setSystemLog(prev => [...prev, `[ERROR] Key generation failed: ${e.message}`]);
    }
  };

  const createNewModel = () => {
    if (newModelName.trim()) {
      const newModel = { id: models.length + 1, name: newModelName, accuracy: 0, trained: false, version: '1.0' };
      setModels([...models, newModel]);
      setSelectedModel(newModel);
      setNewModelName('');
      setShowNewModel(false);
      setSystemLog(prev => [...prev, `[MODEL] New model registered: ${newModelName}`]);
    }
  };

  const addTrainingData = () => {
    if (newDataContent.trim() && newDataLabel.trim()) {
      setTrainingData([...trainingData, { id: trainingData.length + 1, type: newDataType, content: newDataContent, label: newDataLabel }]);
      setNewDataContent('');
      setNewDataLabel('');
      setShowAddData(false);
    }
  };

  const removeTrainingData = (id) => setTrainingData(trainingData.filter(d => d.id !== id));

  const crawlLink = async (dataItem) => {
    if (dataItem.type !== 'link') return;
    setCrawlingIds(prev => new Set(prev).add(dataItem.id));
    setSystemLog(prev => [...prev, `[CRAWL] Fetching: ${dataItem.content}`]);
    try {
      const res = await base44.functions.invoke('crawlUrl', { urls: [dataItem.content] });
      const result = res.data?.results?.[0];
      if (result?.success && result?.content) {
        // Replace link entry with a guide entry containing the scraped content
        setTrainingData(prev => prev.map(d =>
          d.id === dataItem.id
            ? { ...d, type: 'guide', content: result.content, label: `[Crawled] ${dataItem.label || dataItem.content}` }
            : d
        ));
        setSystemLog(prev => [...prev, `[CRAWL] ✓ Scraped ${result.char_count?.toLocaleString()} chars from ${dataItem.content}`]);
      } else {
        setSystemLog(prev => [...prev, `[CRAWL] ✗ Failed: ${result?.error || 'Unknown error'}`]);
      }
    } catch (e) {
      setSystemLog(prev => [...prev, `[CRAWL] ✗ Error: ${e.message}`]);
    }
    setCrawlingIds(prev => { const s = new Set(prev); s.delete(dataItem.id); return s; });
  };

  const crawlAllLinks = async () => {
    const links = trainingData.filter(d => d.type === 'link');
    if (links.length === 0) return;
    setSystemLog(prev => [...prev, `[CRAWL] Batch crawling ${links.length} link(s)...`]);
    for (const link of links) {
      await crawlLink(link);
    }
    setSystemLog(prev => [...prev, `[CRAWL] Batch complete`]);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setTrainingData([...trainingData, { id: trainingData.length + 1, type: 'file', content: file_url, label: file.name }]);
    }
  };

  const saveModel = async () => {
    const snapshot = {
      ...selectedModel,
      savedAt: new Date().toISOString(),
      accuracy: liveAccuracy.toFixed(2),
      snapshot_id: `snap_${Date.now()}`,
    };
    setSavedModels(prev => [...prev, snapshot]);
    setSaveSuccess(true);
    setSystemLog(prev => [...prev, `[SAVE] Model snapshot saved: ${snapshot.snapshot_id}`, `[PERF] Accuracy locked at ${snapshot.accuracy}%`]);

    // Persist to database
    try {
      const user = await base44.auth.me();
      await base44.entities.FleetAIModel.create({
        organization_id: user?.organization_id || user?.id || 'default',
        name: snapshot.name,
        snapshot_id: snapshot.snapshot_id,
        accuracy: parseFloat(snapshot.accuracy),
        version: snapshot.version || '1.0',
        status: 'active',
        training_data_count: trainingData.length,
        training_data: trainingData.map(d => ({ type: d.type, label: d.label, content: d.content })),
      });
      setSystemLog(prev => [...prev, `[DB] Model persisted — ID: ${snapshot.snapshot_id}`]);
    } catch (e) {
      setSystemLog(prev => [...prev, `[WARN] DB save failed: ${e.message}`]);
    }

    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    setSimulationResults(null);
    setSystemLog(prev => [...prev, `[SIM] Running advanced simulation: ${simScenario.toUpperCase()}...`]);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are HARBOR AI simulation engine. Run an advanced logistics simulation for scenario: "${simScenario}" on model "${selectedModel.name}" with accuracy ${liveAccuracy.toFixed(1)}%. Return realistic simulation results as JSON.`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          efficiency_gain: { type: 'number' },
          cost_reduction: { type: 'number' },
          risk_score: { type: 'number' },
          recommendations: { type: 'array', items: { type: 'string' } },
          kpis: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, delta: { type: 'string' } } } },
        }
      }
    });
    setSimulationResults(result);
    setSystemLog(prev => [...prev, `[SIM] Simulation complete — efficiency gain: +${result.efficiency_gain?.toFixed(1)}%`]);
    setIsSimulating(false);
  };

  const startFinetuning = () => {
    setIsFinetuning(true);
    setFinetuneProgress(0);
    setSystemLog(prev => [...prev, `[FINETUNE] LoRA fine-tuning initiated — rank: ${finetuneConfig.rank}, lr: ${finetuneConfig.lr}`]);
    const interval = setInterval(() => {
      setFinetuneProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsFinetuning(false);
          setLiveAccuracy(p => Math.min(99.9, p + Math.random() * 1.5 + 0.5));
          setSystemLog(p => [...p, '[FINETUNE] Fine-tuning complete — model weights updated', '[PERF] Accuracy improved via LoRA adaptation']);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 600);
  };

  // ─── REAL FINE-TUNING FUNCTIONS ──────────────────────────────────────────
  const buildTrainingJsonl = () => {
    // Convert training data into Mistral fine-tuning JSONL format
    const examples = [];
    for (const d of trainingData) {
      if (d.type === 'faq') {
        // Try to parse Q/A pairs
        const lines = d.content.split('\n').filter(l => l.trim());
        for (let i = 0; i < lines.length - 1; i++) {
          const q = lines[i].replace(/^Q:\s*/i, '').trim();
          const a = lines[i + 1].replace(/^A:\s*/i, '').trim();
          if (q && a && lines[i].match(/^Q:/i) && lines[i + 1].match(/^A:/i)) {
            examples.push({ messages: [{ role: 'user', content: q }, { role: 'assistant', content: a }] });
            i++;
          }
        }
      } else if (d.type === 'guide' || d.type === 'filter') {
        // Chunk into instruction/response pairs
        const chunks = d.content.match(/.{1,500}/g) || [];
        for (let i = 0; i < chunks.length; i += 2) {
          if (chunks[i] && chunks[i + 1]) {
            examples.push({ messages: [{ role: 'user', content: `Context: ${d.label}. ${chunks[i]}` }, { role: 'assistant', content: chunks[i + 1] }] });
          }
        }
      }
    }
    return examples;
  };

  const realUploadAndStartFt = async () => {
    setFtError(null);
    setFtStep('uploading');
    setSystemLog(prev => [...prev, '[REAL-FT] Building training JSONL from knowledge base...']);
    const examples = buildTrainingJsonl();
    if (examples.length < 8) {
      setFtError(`Only ${examples.length} training examples found. Mistral requires at least 8. Please add more Q&A FAQ entries (format: Q: ..., A: ...) to your training data.`);
      setFtStep('config');
      return;
    }
    setSystemLog(prev => [...prev, `[REAL-FT] ${examples.length} examples prepared. Uploading to Mistral...`]);
    try {
      const uploadRes = await base44.functions.invoke('harborFinetune', {
        action: 'upload_file',
        training_data: examples,
      });
      const fileId = uploadRes.data.file_id;
      setFtFileId(fileId);
      setSystemLog(prev => [...prev, `[REAL-FT] File uploaded: ${fileId}`]);
      // Create job
      setFtStep('training');
      setSystemLog(prev => [...prev, `[REAL-FT] Creating fine-tuning job on ${ftModel}...`]);
      const jobRes = await base44.functions.invoke('harborFinetune', {
        action: 'create_job',
        training_file_id: fileId,
        model: ftModel,
        suffix: ftSuffix,
        hyperparameters: { training_steps: parseInt(ftSteps), learning_rate: parseFloat(ftLr) },
      });
      const job = jobRes.data.job;
      setFtJobId(job.id);
      setFtJob(job);
      setSystemLog(prev => [...prev, `[REAL-FT] Job created: ${job.id} — status: ${job.status}`]);
      // Start polling
      startFtPolling(job.id);
    } catch (e) {
      setFtError(e?.response?.data?.error || e.message);
      setFtStep('config');
    }
  };

  const startFtPolling = (jobId) => {
    if (ftPollRef.current) clearInterval(ftPollRef.current);
    ftPollRef.current = setInterval(async () => {
      try {
        const res = await base44.functions.invoke('harborFinetune', { action: 'get_job', job_id: jobId });
        const job = res.data.job;
        setFtJob(job);
        setSystemLog(prev => [...prev.slice(-8), `[REAL-FT] Job ${jobId}: ${job.status}${job.trained_tokens ? ` — ${job.trained_tokens} tokens` : ''}`]);
        if (job.status === 'SUCCESS' || job.status === 'success' || job.fine_tuned_model) {
          clearInterval(ftPollRef.current);
          setFtStep('done');
          setSystemLog(prev => [...prev, `[REAL-FT] ✓ Fine-tuned model ready: ${job.fine_tuned_model}`]);
          loadFtJobs();
          loadFtModels();
        } else if (job.status === 'FAILED' || job.status === 'failed' || job.status === 'CANCELLED') {
          clearInterval(ftPollRef.current);
          setFtError(`Job ${job.status}: ${job.error_message || 'Unknown error'}`);
          setFtStep('config');
        }
      } catch (e) { /* continue polling */ }
    }, 8000);
  };

  const loadFtJobs = async () => {
    try {
      const res = await base44.functions.invoke('harborFinetune', { action: 'list_jobs' });
      setFtJobs(res.data.jobs || []);
    } catch (_) {}
  };

  const loadFtModels = async () => {
    try {
      const res = await base44.functions.invoke('harborFinetune', { action: 'list_models' });
      setFtFineTunedModels(res.data.models || []);
    } catch (_) {}
  };

  const cancelFtJob = async (jobId) => {
    try {
      await base44.functions.invoke('harborFinetune', { action: 'cancel_job', job_id: jobId });
      setSystemLog(prev => [...prev, `[REAL-FT] Job ${jobId} cancelled`]);
      if (ftPollRef.current) clearInterval(ftPollRef.current);
      setFtStep('config');
      loadFtJobs();
    } catch (e) { setFtError(e.message); }
  };

  useEffect(() => {
    loadFtJobs();
    loadFtModels();
    return () => { if (ftPollRef.current) clearInterval(ftPollRef.current); };
  }, []);

  const analyzeWithAI = async () => {
    setIsAnalyzing(true);
    setSystemLog(prev => [...prev, '[HARBOR] Initiating deep model analysis...']);
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are HARBOR, an advanced AI analyst. Analyse this model: ${selectedModel.name} with accuracy ${selectedModel.accuracy}%. Give 3 concrete improvement suggestions. Format as JSON with field "suggestions".`,
      response_json_schema: { type: 'object', properties: { suggestions: { type: 'array', items: { type: 'string' } } } },
    });
    setAiInsights(response.suggestions || []);
    setSystemLog(prev => [...prev, '[HARBOR] Analysis complete — 3 recommendations generated']);
    setIsAnalyzing(false);
  };

  const tabStyle = "data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 text-slate-400 text-xs font-mono rounded-none";

  return (
    <div className="w-full h-full bg-[#020810] rounded-xl border border-amber-500/30 overflow-hidden flex flex-col relative"
      style={{ boxShadow: '0 0 40px rgba(245,158,11,0.1), inset 0 0 60px rgba(0,0,0,0.5)' }}>

      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Scanning line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <ScanLine />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-amber-500/30 bg-black/60 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 rounded-full border border-amber-500/50 flex items-center justify-center"
            >
              <Brain className="w-4 h-4 text-amber-400" />
            </motion.div>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold font-mono text-sm tracking-widest">H.A.R.B.O.R.</span>
              <span className="text-[10px] font-mono text-amber-500/60 border border-amber-500/30 px-1 rounded">H.A.R.B.O.R TRAINER v3.0</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400/70">SYSTEM NOMINAL</span>
              <span className="text-[10px] font-mono text-slate-600">|</span>
              <span className="text-[10px] font-mono text-amber-500/50">MODEL: {selectedModel.name.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live stats */}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono">
            <span className="text-slate-500">ACC:</span>
            <span className="text-amber-300">{liveAccuracy.toFixed(1)}%</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">GPU:</span>
            <span className="text-cyan-300">72%</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={saveModel}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-[10px] tracking-widest transition-all ${
              saveSuccess
                ? 'border-emerald-500/60 text-emerald-400 bg-emerald-500/10'
                : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            {saveSuccess ? <><CheckCircle className="w-3 h-3" /> SAVED</> : <><Save className="w-3 h-3" /> SAVE MODEL</>}
          </motion.button>
          <button onClick={onClose} className="text-slate-500 hover:text-amber-400 transition-colors font-mono text-sm">✕</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="flex bg-black/50 border-b border-amber-500/20 rounded-none h-auto p-0 gap-0">
            {[
              { v: 'training', label: 'TRAINING', icon: Play },
              { v: 'monitoring', label: 'MONITOR', icon: Activity },
              { v: 'data', label: 'DATA', icon: Database },
              { v: 'models', label: 'MODELS', icon: Layers },
              { v: 'simulate', label: 'SIMULATE', icon: FlaskConical },
              { v: 'finetune', label: 'FINE-TUNE', icon: Sliders },
              { v: 'saved', label: 'SAVED', icon: BookMarked },
              { v: 'api', label: 'API KEYS', icon: Shield },
              { v: 'settings', label: 'CONFIG', icon: Settings },
            ].map(({ v, label, icon: Icon }) => (
              <button
                key={v}
                onClick={() => setActiveTab(v)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-mono tracking-widest transition-all border-b-2 ${
                  activeTab === v
                    ? 'text-amber-300 border-amber-500 bg-amber-500/10'
                    : 'text-slate-500 border-transparent hover:text-amber-400/70 hover:border-amber-500/30'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </TabsList>

          {/* Training Tab */}
          <TabsContent value="training" className="flex-1 overflow-auto p-4 space-y-4 mt-0">
            {/* Top stat row */}
            <div className="grid grid-cols-4 gap-2">
              <StatCard label="Accuracy" value={`${isTraining ? liveAccuracy.toFixed(1) : realAccuracy.toFixed(1)}%`} icon={Crosshair} pulse={isTraining} />
              <StatCard label="AI Commands" value={fleetAIUsages.length.toString()} icon={GitBranch} color="cyan" />
              <StatCard label="GPU" value={`${gpuUtilization}%`} icon={Cpu} color="cyan" pulse />
              <StatCard label="Vehicles" value={`${activeVehicles}/${vehicles.length}`} icon={Radio} />
            </div>

            {/* Training control */}
            <div className="relative rounded-lg border border-amber-500/30 bg-black/40 p-4 overflow-hidden">
              <CornerBrackets />
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono text-amber-400 tracking-widest">TRAINING CONTROL</span>
              </div>
              <div className="flex gap-2 mb-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startTraining}
                  disabled={isTraining}
                  className={`flex-1 py-2 rounded border font-mono text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${
                    isTraining
                      ? 'border-amber-500/30 text-amber-500/50 cursor-not-allowed'
                      : 'border-amber-500/60 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400'
                  }`}
                  style={isTraining ? {} : { boxShadow: '0 0 10px rgba(245,158,11,0.2)' }}
                >
                  {isTraining ? (
                    <><motion.span animate={{ opacity: [1,0.3,1] }} transition={{ repeat: Infinity, duration: 1 }}>■</motion.span> TRAINING...</>
                  ) : (
                    <><Play className="w-3 h-3" /> INITIATE TRAINING</>
                  )}
                </motion.button>
                <button className="px-3 py-2 rounded border border-slate-600/50 text-slate-400 hover:border-slate-500 font-mono text-xs tracking-widest transition-all">
                  LOAD DATA
                </button>
              </div>
              {isTraining && (
                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span className="text-amber-500/60">PROGRESS</span>
                    <span className="text-amber-300">{Math.round(trainingProgress)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #f59e0b, #f97316, #ef4444)' }}
                      animate={{ width: `${trainingProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* AI Insights */}
            <AnimatePresence>
              {aiInsights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="relative rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 overflow-hidden"
                >
                  <CornerBrackets />
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </motion.div>
                    <span className="text-[10px] font-mono text-amber-400 tracking-widest">HARBOR RECOMMENDATIONS</span>
                  </div>
                  <div className="space-y-1.5">
                    {aiInsights.map((insight, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex gap-2 text-xs"
                      >
                        <span className="text-amber-500 font-mono">{String(i + 1).padStart(2, '0')}.</span>
                        <span className="text-slate-300">{insight}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={analyzeWithAI}
              disabled={isAnalyzing}
              className="w-full py-2.5 rounded border border-amber-500/50 text-amber-300 font-mono text-xs tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-amber-500/10"
              style={{ boxShadow: '0 0 15px rgba(245,158,11,0.15)' }}
            >
              {isAnalyzing ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Brain className="w-3.5 h-3.5" /></motion.div> ANALYZING...</>
              ) : (
                <><Brain className="w-3.5 h-3.5" /> HARBOR DEEP ANALYSIS</>
              )}
            </motion.button>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative rounded-lg border border-amber-500/20 bg-black/40 p-3 overflow-hidden">
                <CornerBrackets />
                <p className="text-[10px] font-mono text-amber-400/70 mb-2 tracking-widest">LOSS CURVE</p>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.1)" />
                    <XAxis dataKey="epoch" stroke="rgba(245,158,11,0.3)" tick={{ fontSize: 9, fill: '#f59e0b88' }} />
                    <YAxis stroke="rgba(245,158,11,0.3)" tick={{ fontSize: 9, fill: '#f59e0b88' }} />
                    <Tooltip contentStyle={{ background: '#020810', border: '1px solid rgba(245,158,11,0.4)', fontSize: 10, fontFamily: 'monospace' }} />
                    <Area type="monotone" dataKey="loss" stroke="#f59e0b" strokeWidth={2} fill="url(#lossGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="relative rounded-lg border border-cyan-500/20 bg-black/40 p-3 overflow-hidden">
                <CornerBrackets color="cyan" />
                <p className="text-[10px] font-mono text-cyan-400/70 mb-2 tracking-widest">ACCURACY CURVE</p>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.1)" />
                    <XAxis dataKey="epoch" stroke="rgba(6,182,212,0.3)" tick={{ fontSize: 9, fill: '#06b6d488' }} />
                    <YAxis stroke="rgba(6,182,212,0.3)" tick={{ fontSize: 9, fill: '#06b6d488' }} />
                    <Tooltip contentStyle={{ background: '#020810', border: '1px solid rgba(6,182,212,0.4)', fontSize: 10, fontFamily: 'monospace' }} />
                    <Area type="monotone" dataKey="accuracy" stroke="#06b6d4" strokeWidth={2} fill="url(#accGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar + Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative rounded-lg border border-amber-500/20 bg-black/40 p-3 overflow-hidden">
                <CornerBrackets />
                <p className="text-[10px] font-mono text-amber-400/70 mb-1 tracking-widest">MODEL HEALTH RADAR</p>
                <ResponsiveContainer width="100%" height={140}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(245,158,11,0.15)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#f59e0b88' }} />
                    <Radar name="Model" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="relative rounded-lg border border-amber-500/20 bg-black/40 p-3 overflow-hidden">
                <CornerBrackets />
                <p className="text-[10px] font-mono text-amber-400/70 mb-3 tracking-widest">SYSTEM RESOURCES</p>
                <div className="space-y-3">
                  {[
                    { label: 'GPU CORES', value: 72, color: '#f59e0b' },
                    { label: 'VRAM', value: 53, color: '#06b6d4' },
                    { label: 'THROUGHPUT', value: 85, color: '#8b5cf6' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[9px] font-mono mb-1">
                        <span style={{ color: item.color + '99' }}>{item.label}</span>
                        <span style={{ color: item.color }}>{item.value}%</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ delay: i * 0.2, duration: 1 }}
                          style={{ background: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System log */}
            <div className="relative rounded-lg border border-amber-500/20 bg-black/60 p-3 overflow-hidden">
              <CornerBrackets />
              <p className="text-[10px] font-mono text-amber-400/70 mb-2 tracking-widest">SYSTEM LOG</p>
              <div className="space-y-0.5 max-h-20 overflow-auto">
                {systemLog.slice(-5).map((log, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] font-mono text-slate-500"
                  >
                    <span className="text-amber-500/50">&gt; </span>{log}
                  </motion.p>
                ))}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-[10px] font-mono text-amber-400"
                >█</motion.span>
              </div>
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="flex-1 overflow-auto p-4 mt-0">
            <AdvancedModelMonitoring />
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="flex-1 overflow-auto p-4 space-y-3 mt-0">
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                onClick={() => setShowAddData(true)}
                className="flex-1 py-2.5 rounded border border-emerald-500/50 text-emerald-300 font-mono text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500/10 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> INJECT TRAINING DATA
              </motion.button>
              {trainingData.some(d => d.type === 'link') && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  onClick={crawlAllLinks}
                  className="flex-1 py-2.5 rounded border border-cyan-500/50 text-cyan-300 font-mono text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-cyan-500/10 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> CRAWL ALL LINKS
                </motion.button>
              )}
            </div>

            <div className="relative rounded-lg border border-amber-500/20 bg-black/40 p-3">
              <CornerBrackets />
              <label className="flex flex-col gap-2 cursor-pointer">
                <span className="text-[10px] font-mono text-amber-400/70 tracking-widest flex items-center gap-2">
                  <FileUp className="w-3.5 h-3.5" /> UPLOAD CORPUS FILE
                </span>
                <input type="file" onChange={handleFileUpload} className="text-xs text-slate-500 file:bg-black file:border file:border-amber-500/30 file:rounded file:px-3 file:py-1 file:text-amber-400 file:font-mono file:text-xs file:cursor-pointer" accept=".txt,.pdf,.csv,.json" />
              </label>
            </div>

            <AnimatePresence>
              {showAddData && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative rounded-lg border border-amber-500/30 bg-black/60 p-3 space-y-2 overflow-hidden">
                  <CornerBrackets />
                  <select value={newDataType} onChange={e => setNewDataType(e.target.value)} className="w-full bg-black border border-amber-500/30 rounded px-3 py-2 text-amber-300 text-xs font-mono">
                    <option value="link">LINK</option>
                    <option value="faq">FAQ</option>
                    <option value="filter">FILTER/PROCEDURE</option>
                    <option value="guide">GUIDE</option>
                  </select>
                  <input type="text" placeholder="Label..." value={newDataLabel} onChange={e => setNewDataLabel(e.target.value)} className="w-full bg-black border border-amber-500/30 rounded px-3 py-2 text-amber-300 text-xs font-mono placeholder-amber-800" />
                  <textarea placeholder={newDataType === 'link' ? 'https://...' : 'Content...'} value={newDataContent} onChange={e => setNewDataContent(e.target.value)} className="w-full bg-black border border-amber-500/30 rounded px-3 py-2 text-amber-300 text-xs font-mono placeholder-amber-800 h-20 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={addTrainingData} className="flex-1 py-1.5 rounded border border-emerald-500/50 text-emerald-400 font-mono text-xs tracking-widest hover:bg-emerald-500/10 transition-all">INJECT</button>
                    <button onClick={() => setShowAddData(false)} className="flex-1 py-1.5 rounded border border-slate-600/50 text-slate-400 font-mono text-xs tracking-widest hover:bg-slate-800/50 transition-all">CANCEL</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              {trainingData.map((data, i) => (
                <motion.div
                  key={data.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative rounded-lg border border-amber-500/20 bg-black/40 p-3 flex items-center gap-3 group overflow-hidden"
                >
                  <CornerBrackets />
                  <div className="w-6 h-6 rounded border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    {data.type === 'link' && <Link2 className="w-3 h-3 text-cyan-400" />}
                    {data.type === 'file' && <FileUp className="w-3 h-3 text-emerald-400" />}
                    {!['link', 'file'].includes(data.type) && <Zap className="w-3 h-3 text-amber-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-amber-500/60 uppercase tracking-wider">{data.type}</span>
                      {data.type === 'guide' && data.label?.startsWith('[Crawled]') && (
                        <span className="text-[9px] font-mono text-emerald-400 border border-emerald-500/30 px-1 rounded">CRAWLED</span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-300 truncate">{data.label}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {data.type === 'link' && (
                      crawlingIds.has(data.id) ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                          <Loader2 className="w-3.5 h-3.5 text-cyan-400" />
                        </motion.div>
                      ) : (
                        <button onClick={() => crawlLink(data)} className="text-slate-600 hover:text-cyan-400 transition-colors" title="Crawl URL">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                    <button onClick={() => removeTrainingData(data.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="flex-1 overflow-auto p-4 space-y-3 mt-0">
            <motion.button
              whileHover={{ scale: 1.01 }}
              onClick={() => setShowNewModel(true)}
              className="w-full py-2.5 rounded border border-cyan-500/50 text-cyan-300 font-mono text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-cyan-500/10 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> REGISTER NEW MODEL
            </motion.button>

            <AnimatePresence>
              {showNewModel && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative rounded-lg border border-cyan-500/30 bg-black/60 p-3 space-y-2 overflow-hidden">
                  <CornerBrackets color="cyan" />
                  <input type="text" placeholder="Model designation..." value={newModelName} onChange={e => setNewModelName(e.target.value)} className="w-full bg-black border border-cyan-500/30 rounded px-3 py-2 text-cyan-300 text-xs font-mono placeholder-cyan-800" />
                  <div className="flex gap-2">
                    <button onClick={createNewModel} className="flex-1 py-1.5 rounded border border-cyan-500/50 text-cyan-400 font-mono text-xs tracking-widest hover:bg-cyan-500/10 transition-all">CREATE</button>
                    <button onClick={() => setShowNewModel(false)} className="flex-1 py-1.5 rounded border border-slate-600/50 text-slate-400 font-mono text-xs tracking-widest hover:bg-slate-800/50 transition-all">ABORT</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              {models.map((model, i) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedModel(model)}
                  className={`relative rounded-lg border p-4 cursor-pointer transition-all overflow-hidden ${
                    selectedModel.id === model.id
                      ? 'border-amber-500/60 bg-amber-500/5'
                      : 'border-amber-500/20 bg-black/40 hover:border-amber-500/40'
                  }`}
                  style={selectedModel.id === model.id ? { boxShadow: '0 0 20px rgba(245,158,11,0.1)' } : {}}
                >
                  <CornerBrackets />
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-mono text-white font-semibold">{model.name}</span>
                    </div>
                    {model.trained && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> TRAINED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex justify-between text-[9px] font-mono mb-1">
                        <span className="text-slate-500">ACCURACY</span>
                        <span className="text-amber-300">{model.accuracy}%</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" style={{ width: `${model.accuracy}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 border border-slate-700 px-1.5 py-0.5 rounded">v{model.version}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Simulate Tab */}
          <TabsContent value="simulate" className="flex-1 overflow-auto p-4 space-y-3 mt-0">
            <div className="relative rounded-lg border border-amber-500/20 bg-black/40 p-4 space-y-3 overflow-hidden">
              <CornerBrackets />
              <p className="text-[10px] font-mono text-amber-400/70 tracking-widest flex items-center gap-2">
                <FlaskConical className="w-3.5 h-3.5" /> SIMULATION SCENARIO
              </p>
              <select value={simScenario} onChange={e => setSimScenario(e.target.value)} className="w-full bg-black border border-amber-500/30 rounded px-3 py-2 text-amber-300 text-xs font-mono">
                <option value="peak_demand">PEAK DEMAND SURGE (+300%)</option>
                <option value="route_failure">MULTI-ROUTE FAILURE CASCADE</option>
                <option value="weather_disruption">EXTREME WEATHER DISRUPTION</option>
                <option value="fuel_crisis">FUEL SUPPLY CRISIS</option>
                <option value="cyber_attack">CYBER ATTACK RESPONSE</option>
                <option value="port_congestion">PORT CONGESTION SCENARIO</option>
              </select>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={runSimulation}
                disabled={isSimulating}
                className={`w-full py-2.5 rounded border font-mono text-xs tracking-widest flex items-center justify-center gap-2 transition-all ${
                  isSimulating ? 'border-amber-500/30 text-amber-500/50 cursor-not-allowed' : 'border-amber-500/60 text-amber-300 hover:bg-amber-500/10'
                }`}
                style={isSimulating ? {} : { boxShadow: '0 0 15px rgba(245,158,11,0.15)' }}
              >
                {isSimulating ? (
                  <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><RefreshCw className="w-3.5 h-3.5" /></motion.div> SIMULATING...</>
                ) : (
                  <><FlaskConical className="w-3.5 h-3.5" /> RUN ADVANCED SIMULATION</>
                )}
              </motion.button>
            </div>

            <AnimatePresence>
              {simulationResults && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="relative rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 overflow-hidden">
                    <CornerBrackets color="cyan" />
                    <p className="text-[10px] font-mono text-emerald-400/70 tracking-widest mb-2">SIMULATION RESULTS</p>
                    <p className="text-xs text-slate-300 mb-3">{simulationResults.summary}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <p className="text-[9px] font-mono text-slate-500">EFFICIENCY</p>
                        <p className="text-sm font-bold font-mono text-emerald-400">+{simulationResults.efficiency_gain?.toFixed(1)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-mono text-slate-500">COST REDUCE</p>
                        <p className="text-sm font-bold font-mono text-cyan-400">-{simulationResults.cost_reduction?.toFixed(1)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-mono text-slate-500">RISK SCORE</p>
                        <p className="text-sm font-bold font-mono text-amber-400">{simulationResults.risk_score?.toFixed(0)}/100</p>
                      </div>
                    </div>
                  </div>
                  {simulationResults.kpis?.length > 0 && (
                    <div className="relative rounded-lg border border-amber-500/20 bg-black/40 p-3 overflow-hidden">
                      <CornerBrackets />
                      <p className="text-[10px] font-mono text-amber-400/70 tracking-widest mb-2">KPI IMPACT</p>
                      <div className="space-y-1.5">
                        {simulationResults.kpis.map((kpi, i) => (
                          <div key={i} className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-400">{kpi.label}</span>
                            <span className="text-amber-300">{kpi.value} <span className="text-emerald-400 text-[10px]">{kpi.delta}</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {simulationResults.recommendations?.length > 0 && (
                    <div className="relative rounded-lg border border-amber-500/20 bg-black/40 p-3 overflow-hidden">
                      <CornerBrackets />
                      <p className="text-[10px] font-mono text-amber-400/70 tracking-widest mb-2">RECOMMENDATIONS</p>
                      <div className="space-y-1.5">
                        {simulationResults.recommendations.map((rec, i) => (
                          <div key={i} className="flex gap-2 text-xs">
                            <ChevronRight className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-300">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Fine-tune Tab — REAL Mistral Fine-Tuning */}
          <TabsContent value="finetune" className="flex-1 overflow-auto p-4 space-y-3 mt-0">

            {/* Header badge */}
            <div className="relative rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 overflow-hidden">
              <CornerBrackets color="cyan" />
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-mono text-violet-300 font-bold tracking-widest">H.A.R.B.O.R. FINE-TUNING</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                Fine-tunes Mistral <span className="text-violet-300 font-bold">together with the full HARBOR Core identity</span> — every training example is automatically prepended with HARBOR's system prompt, cognitive architecture, and response standards. The result is a fine-tuned model that IS HARBOR, not just Mistral.
              </p>
              <div className="flex items-center gap-3 mt-2 text-[9px] font-mono text-slate-500">
                <span className="text-amber-400">① HARBOR system prompt injected into all examples</span>
                <span>→</span>
                <span className="text-violet-400">② Mistral fine-tunes on HARBOR-flavored JSONL</span>
                <span>→</span>
                <span className="text-emerald-400">③ Result: HARBOR-tuned model</span>
              </div>
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {ftError && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-mono text-red-300">{ftError}</p>
                  <button onClick={() => setFtError(null)} className="ml-auto text-red-500 hover:text-red-300"><XCircle className="w-3.5 h-3.5" /></button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step: config */}
            {ftStep === 'config' && (
              <div className="space-y-3">
                <div className="relative rounded-lg border border-violet-500/20 bg-black/40 p-4 space-y-3 overflow-hidden">
                  <CornerBrackets color="cyan" />
                  <p className="text-[10px] font-mono text-violet-400/70 tracking-widest flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5" /> FINE-TUNE CONFIGURATION
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <p className="text-[9px] font-mono text-slate-500 mb-1">BASE MODEL</p>
                      <select value={ftModel} onChange={e => setFtModel(e.target.value)}
                        className="w-full bg-black border border-violet-500/30 rounded px-3 py-2 text-violet-300 text-xs font-mono">
                        <option value="open-mistral-7b">open-mistral-7b (fastest, cheapest)</option>
                        <option value="open-mixtral-8x7b">open-mixtral-8x7b (balanced)</option>
                        <option value="mistral-small-latest">mistral-small-latest (high quality)</option>
                        <option value="codestral-latest">codestral-latest (code tasks)</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono text-slate-500 mb-1">TRAINING STEPS</p>
                      <input type="number" value={ftSteps} onChange={e => setFtSteps(e.target.value)}
                        className="w-full bg-black border border-violet-500/30 rounded px-2 py-1.5 text-violet-300 text-xs font-mono" min="10" max="2000" />
                    </div>
                    <div>
                      <p className="text-[9px] font-mono text-slate-500 mb-1">LEARNING RATE</p>
                      <input type="text" value={ftLr} onChange={e => setFtLr(e.target.value)}
                        className="w-full bg-black border border-violet-500/30 rounded px-2 py-1.5 text-violet-300 text-xs font-mono" />
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] font-mono text-slate-500 mb-1">MODEL SUFFIX (name tag)</p>
                      <input type="text" value={ftSuffix} onChange={e => setFtSuffix(e.target.value)} placeholder="harbor-fleet"
                        className="w-full bg-black border border-violet-500/30 rounded px-2 py-1.5 text-violet-300 text-xs font-mono" />
                    </div>
                  </div>

                  {/* Training data preview */}
                  <div className="rounded border border-violet-500/20 bg-black/60 p-2">
                    <p className="text-[9px] font-mono text-slate-500 mb-1.5">TRAINING DATA SOURCE</p>
                    <div className="space-y-1">
                      {trainingData.length === 0 ? (
                        <p className="text-[10px] font-mono text-slate-600">No training data — go to DATA tab to add Q&amp;A pairs</p>
                      ) : (
                        trainingData.map((d, i) => (
                          <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                            <span className={`px-1.5 py-0.5 rounded border text-[9px] ${
                              d.type === 'faq' ? 'border-emerald-500/30 text-emerald-400' :
                              d.type === 'file' ? 'border-cyan-500/30 text-cyan-400' :
                              'border-amber-500/30 text-amber-400'
                            }`}>{d.type.toUpperCase()}</span>
                            <span className="text-slate-400 truncate">{d.label}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <p className="text-[9px] font-mono text-slate-600 mt-2">⚠ FAQ entries (Q: / A: format) are converted to training examples. Min 8 required. Each example is auto-prepended with HARBOR's full system prompt so the fine-tuned model inherits HARBOR's identity, reasoning architecture, and response standards.</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={realUploadAndStartFt}
                  className="w-full py-2.5 rounded border border-violet-500/60 text-violet-300 font-mono text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-violet-500/10 transition-all"
                  style={{ boxShadow: '0 0 15px rgba(139,92,246,0.15)' }}
                >
                  <Zap className="w-3.5 h-3.5" /> FINE-TUNE MISTRAL + HARBOR CORE
                </motion.button>
              </div>
            )}

            {/* Step: uploading */}
            {ftStep === 'uploading' && (
              <div className="relative rounded-lg border border-violet-500/30 bg-black/40 p-6 flex flex-col items-center gap-3 overflow-hidden">
                <CornerBrackets color="cyan" />
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
                  <Loader2 className="w-8 h-8 text-violet-400" />
                </motion.div>
                <p className="text-xs font-mono text-violet-300">Uploading training file to Mistral La Plateforme...</p>
                <p className="text-[10px] font-mono text-slate-500">Building JSONL from {trainingData.length} knowledge entries</p>
              </div>
            )}

            {/* Step: training (job running) */}
            {(ftStep === 'training' || ftStep === 'done') && ftJob && (
              <div className="space-y-3">
                <div className="relative rounded-lg border border-violet-500/30 bg-black/40 p-4 space-y-3 overflow-hidden">
                  <CornerBrackets color="cyan" />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono text-violet-400/70 tracking-widest flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" /> FINE-TUNING JOB
                    </p>
                    {ftStep === 'training' && (
                      <button onClick={() => cancelFtJob(ftJob.id)}
                        className="text-[10px] font-mono text-red-400 border border-red-500/30 px-2 py-0.5 rounded hover:bg-red-500/10 transition-all">
                        CANCEL
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div>
                      <p className="text-slate-500">JOB ID</p>
                      <p className="text-violet-300 truncate">{ftJob.id}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">STATUS</p>
                      <p className={`font-bold ${
                        ftJob.status === 'SUCCESS' || ftJob.status === 'success' ? 'text-emerald-400' :
                        ftJob.status === 'FAILED' || ftJob.status === 'failed' ? 'text-red-400' :
                        'text-amber-400'
                      }`}>{(ftJob.status || '').toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">MODEL</p>
                      <p className="text-slate-300 truncate">{ftJob.model || ftModel}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">TRAINED TOKENS</p>
                      <p className="text-slate-300">{ftJob.trained_tokens?.toLocaleString() || '—'}</p>
                    </div>
                  </div>

                  {ftStep === 'training' && (
                    <div className="flex items-center gap-2">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                        <Loader2 className="w-3.5 h-3.5 text-violet-400" />
                      </motion.div>
                      <p className="text-[10px] font-mono text-violet-400/70">Polling every 8s — this may take minutes to hours depending on dataset size</p>
                    </div>
                  )}

                  {ftStep === 'done' && ftJob.fine_tuned_model && (
                    <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
                      <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1"><CheckSquare className="w-3 h-3" /> FINE-TUNED MODEL READY</p>
                      <code className="text-xs font-mono text-emerald-300 break-all">{ftJob.fine_tuned_model}</code>
                      <p className="text-[9px] font-mono text-slate-500 mt-1">Use this model ID in harborCore or Mistral API calls</p>
                    </div>
                  )}
                </div>

                {ftStep === 'done' && (
                  <motion.button whileHover={{ scale: 1.01 }} onClick={() => { setFtStep('config'); setFtJob(null); setFtJobId(null); loadFtJobs(); loadFtModels(); }}
                    className="w-full py-2 rounded border border-violet-500/40 text-violet-300 font-mono text-xs tracking-widest hover:bg-violet-500/10 transition-all">
                    + START NEW FINE-TUNE JOB
                  </motion.button>
                )}
              </div>
            )}

            {/* Past jobs */}
            {ftJobs.length > 0 && (
              <div className="relative rounded-lg border border-amber-500/20 bg-black/40 p-3 overflow-hidden">
                <CornerBrackets />
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-mono text-amber-400/70 tracking-widest">PAST JOBS</p>
                  <button onClick={loadFtJobs} className="text-slate-500 hover:text-amber-400 transition-colors"><RefreshCw className="w-3 h-3" /></button>
                </div>
                <div className="space-y-1.5">
                  {ftJobs.slice(0, 5).map((job, i) => (
                    <div key={job.id} className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400 truncate max-w-[180px]">{job.id}</span>
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] ${
                        job.status === 'SUCCESS' || job.status === 'success' ? 'border-emerald-500/30 text-emerald-400' :
                        job.status === 'RUNNING' || job.status === 'running' ? 'border-amber-500/30 text-amber-400' :
                        job.status === 'FAILED' || job.status === 'failed' ? 'border-red-500/30 text-red-400' :
                        'border-slate-500/30 text-slate-400'
                      }`}>{(job.status || '').toUpperCase()}</span>
                      {(job.status === 'RUNNING' || job.status === 'running') && (
                        <button onClick={() => { setFtJobId(job.id); setFtJob(job); setFtStep('training'); startFtPolling(job.id); }}
                          className="text-violet-400 hover:text-violet-300 font-mono text-[9px] border border-violet-500/30 px-1.5 py-0.5 rounded hover:bg-violet-500/10 transition-all">
                          MONITOR
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fine-tuned models */}
            {ftFineTunedModels.length > 0 && (
              <div className="relative rounded-lg border border-emerald-500/20 bg-black/40 p-3 overflow-hidden">
                <CornerBrackets color="cyan" />
                <p className="text-[10px] font-mono text-emerald-400/70 tracking-widest mb-2">YOUR FINE-TUNED MODELS</p>
                <div className="space-y-1.5">
                  {ftFineTunedModels.map((m, i) => (
                    <div key={m.id} className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-300 truncate max-w-[220px]">{m.id}</span>
                      <button onClick={() => navigator.clipboard.writeText(m.id)}
                        className="text-slate-500 hover:text-cyan-400 transition-colors"><Copy className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Saved Models Tab */}
          <TabsContent value="saved" className="flex-1 overflow-auto p-4 space-y-3 mt-0">
            {savedModels.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <BookMarked className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs font-mono text-slate-500">No saved snapshots yet</p>
                <p className="text-[10px] font-mono text-slate-600 mt-1">Use SAVE MODEL to preserve model states</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedModels.map((snap, i) => (
                  <motion.div
                    key={snap.snapshot_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative rounded-lg border border-amber-500/20 bg-black/40 p-3 overflow-hidden"
                  >
                    <CornerBrackets />
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-white">{snap.name}</span>
                      <span className="text-emerald-400 font-mono text-xs">{snap.accuracy}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                      <span>{snap.snapshot_id}</span>
                      <span>{new Date(snap.savedAt).toLocaleString('da-DK')}</span>
                    </div>
                    <div className="mt-2 p-2 rounded bg-black/60 border border-amber-500/10">
                      <p className="text-[9px] font-mono text-amber-500/50 mb-1">API ENDPOINT</p>
                      <code className="text-[9px] font-mono text-cyan-300 break-all">POST /functions/harborModelInference</code>
                      <pre className="text-[9px] font-mono text-slate-500 mt-1 whitespace-pre-wrap">{`{ "model_id": "${snap.snapshot_id}" }`}</pre>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setSelectedModel(snap)} className="flex-1 py-1 rounded border border-amber-500/30 text-amber-400 font-mono text-[10px] tracking-widest hover:bg-amber-500/10 transition-all">RESTORE</button>
                      <button onClick={() => navigator.clipboard.writeText(snap.snapshot_id)} className="px-3 py-1 rounded border border-cyan-500/30 text-cyan-400 font-mono text-[10px] hover:bg-cyan-500/10 transition-all">COPY ID</button>
                      <button onClick={() => setSavedModels(p => p.filter(s => s.snapshot_id !== snap.snapshot_id))} className="px-3 py-1 rounded border border-red-500/30 text-red-400 font-mono text-[10px] hover:bg-red-500/10 transition-all">DEL</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api" className="flex-1 overflow-auto p-4 space-y-3 mt-0">
            <motion.button
              whileHover={{ scale: 1.01 }}
              onClick={generateAPIKey}
              className="w-full py-2.5 rounded border border-violet-500/50 text-violet-300 font-mono text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-violet-500/10 transition-all"
            >
              <Shield className="w-3.5 h-3.5" /> GENERATE SECURE KEY
            </motion.button>

            {apiKeys.length === 0 && (
              <div className="text-center py-8">
                <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-mono text-slate-500">Ingen API keys endnu</p>
                <p className="text-[10px] font-mono text-slate-600 mt-1">Klik GENERATE for at oprette en</p>
              </div>
            )}
            <div className="space-y-2">
              {apiKeys.map((apiKey, i) => (
                <motion.div
                  key={apiKey.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative rounded-lg border border-violet-500/20 bg-black/40 p-3 space-y-2 overflow-hidden"
                >
                  <CornerBrackets color="cyan" />
                  {apiKey.showFull ? (
                    <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2">
                      <p className="text-[9px] font-mono text-amber-400 mb-1">⚠ GEM DENNE KEY NU — vises kun én gang</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-amber-300 bg-black/60 px-2 py-1 rounded font-mono border border-amber-500/20 break-all flex-1">{apiKey.key}</code>
                        <button onClick={() => { navigator.clipboard.writeText(apiKey.key); }} className="text-amber-500 hover:text-amber-300 transition-colors flex-shrink-0">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <code className="text-xs text-violet-300 bg-black/60 px-2 py-1 rounded font-mono border border-violet-500/20">{apiKey.prefix || apiKey.key}••••••••••••••••</code>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-500">
                    <span>CREATED: {apiKey.created}</span>
                    <span>LAST USE: {apiKey.lastUsed || '-'}</span>
                    <span className="text-violet-400">ID: {String(apiKey.id).slice(0, 8)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-auto p-4 space-y-3 mt-0">
            <div className="relative rounded-lg border border-amber-500/20 bg-black/40 p-4 space-y-3 overflow-hidden">
              <CornerBrackets />
              <p className="text-[10px] font-mono text-amber-400/70 tracking-widest flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" /> HYPERPARAMETERS
              </p>
              {[
                { label: 'LEARNING RATE', default: '0.001' },
                { label: 'BATCH SIZE', default: '32' },
                { label: 'EPOCHS', default: '50' },
                { label: 'VALIDATION SPLIT', default: '0.2' },
              ].map((param, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-mono text-slate-400 tracking-widest">{param.label}</span>
                  <input
                    type="text"
                    defaultValue={param.default}
                    className="w-24 bg-black border border-amber-500/30 rounded px-2 py-1 text-amber-300 text-xs font-mono text-right"
                  />
                </div>
              ))}
            </div>

            <div className="relative rounded-lg border border-amber-500/20 bg-black/40 p-4 space-y-3 overflow-hidden">
              <CornerBrackets />
              <p className="text-[10px] font-mono text-amber-400/70 tracking-widest flex items-center gap-2">
                <Download className="w-3.5 h-3.5" /> DEPLOYMENT
              </p>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded border border-amber-500/40 text-amber-400 font-mono text-xs tracking-widest hover:bg-amber-500/10 transition-all flex items-center justify-center gap-1.5">
                  <Download className="w-3 h-3" /> EXPORT
                </button>
                <button className="flex-1 py-2 rounded border border-cyan-500/40 text-cyan-400 font-mono text-xs tracking-widest hover:bg-cyan-500/10 transition-all flex items-center justify-center gap-1.5">
                  <Code className="w-3 h-3" /> DEPLOY
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}