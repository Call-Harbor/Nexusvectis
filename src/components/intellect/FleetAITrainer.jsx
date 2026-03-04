import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, Code, Play, Save, Plus, Trash2, Eye, Settings, Download, Copy, CheckCircle, Link2, FileUp, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';

export default function FleetAITrainer({ onClose }) {
  const [activeTab, setActiveTab] = useState('training');
  const [models, setModels] = useState([
    { id: 1, name: 'Fleet Optimizer v1.0', accuracy: 94.2, trained: true, version: '1.0' },
    { id: 2, name: 'Route Predictor v1.1', accuracy: 91.8, trained: true, version: '1.1' },
  ]);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [apiKeys, setApiKeys] = useState([
    { id: 1, key: 'fai_prod_****', created: '2026-02-01', lastUsed: '2026-03-04', calls: 1234 },
  ]);
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

  const trainingData = [
    { epoch: 1, loss: 0.85, accuracy: 78 },
    { epoch: 2, loss: 0.72, accuracy: 82 },
    { epoch: 3, loss: 0.61, accuracy: 86 },
    { epoch: 4, loss: 0.48, accuracy: 89 },
    { epoch: 5, loss: 0.35, accuracy: 92 },
  ];

  const performanceData = [
    { metric: 'Accuracy', value: selectedModel.accuracy },
    { metric: 'Precision', value: 89.5 },
    { metric: 'Recall', value: 87.3 },
    { metric: 'F1-Score', value: 88.3 },
  ];

  const startTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          return 100;
        }
        return prev + Math.random() * 25;
      });
    }, 1000);
  };

  const generateAPIKey = () => {
    const newKey = {
      id: apiKeys.length + 1,
      key: `fai_prod_${Math.random().toString(36).substring(2, 15)}`,
      created: new Date().toLocaleDateString('da-DK'),
      lastUsed: '-',
      calls: 0,
    };
    setApiKeys([...apiKeys, newKey]);
  };

  const createNewModel = () => {
    if (newModelName.trim()) {
      const newModel = {
        id: models.length + 1,
        name: newModelName,
        accuracy: 0,
        trained: false,
        version: '1.0',
      };
      setModels([...models, newModel]);
      setSelectedModel(newModel);
      setNewModelName('');
      setShowNewModel(false);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Fleet AI Trainer</h2>
              <p className="text-xs text-slate-400">Train & Deploy Custom Models</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-b border-slate-700/50">
            <TabsTrigger value="training" className="data-[state=active]:bg-cyan-500/20">Training</TabsTrigger>
            <TabsTrigger value="models" className="data-[state=active]:bg-cyan-500/20">Models</TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-cyan-500/20">API Keys</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-500/20">Settings</TabsTrigger>
          </TabsList>

          {/* Training Tab */}
          <TabsContent value="training" className="flex-1 overflow-auto p-4 space-y-4">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Play className="w-4 h-4 text-cyan-400" />
                Training Control
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={startTraining}
                    disabled={isTraining || !selectedModel.trained}
                    className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300"
                  >
                    {isTraining ? 'Training...' : 'Start Training'}
                  </Button>
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    Load Data
                  </Button>
                </div>
                {isTraining && (
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-300">Progress</span>
                      <span className="text-cyan-400">{Math.round(trainingProgress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${trainingProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Training Charts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-white mb-3">Loss over Epochs</p>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={trainingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.2)" />
                    <XAxis dataKey="epoch" stroke="rgba(148,163,184,0.5)" height={20} tick={{ fontSize: 12 }} />
                    <YAxis stroke="rgba(148,163,184,0.5)" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569' }} />
                    <Line type="monotone" dataKey="loss" stroke="#06b6d4" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-white mb-3">Accuracy over Epochs</p>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={trainingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.2)" />
                    <XAxis dataKey="epoch" stroke="rgba(148,163,184,0.5)" height={20} tick={{ fontSize: 12 }} />
                    <YAxis stroke="rgba(148,163,184,0.5)" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569' }} />
                    <Line type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-white mb-3">Current Model Performance</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.2)" />
                  <XAxis dataKey="metric" stroke="rgba(148,163,184,0.5)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(148,163,184,0.5)" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569' }} />
                  <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="flex-1 overflow-auto p-4">
            <div className="space-y-3">
              <Button
                onClick={() => setShowNewModel(true)}
                className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300"
              >
                <Plus className="w-4 h-4 mr-2" /> New Model
              </Button>

              <AnimatePresence>
                {showNewModel && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Model name (e.g., Route Optimizer v2.0)"
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-white text-sm placeholder-slate-500"
                    />
                    <div className="flex gap-2">
                      <Button onClick={createNewModel} className="flex-1 bg-cyan-500 hover:bg-cyan-600" size="sm">Create</Button>
                      <Button onClick={() => setShowNewModel(false)} variant="outline" className="flex-1 border-slate-600" size="sm">Cancel</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {models.map((model) => (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedModel.id === model.id
                      ? 'bg-cyan-500/20 border-cyan-500/50'
                      : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-semibold text-white">{model.name}</span>
                    </div>
                    {model.trained && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Accuracy: {model.accuracy}%</span>
                    <span>v{model.version}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api" className="flex-1 overflow-auto p-4">
            <div className="space-y-3">
              <Button
                onClick={generateAPIKey}
                className="w-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-300"
              >
                <Plus className="w-4 h-4 mr-2" /> Generate API Key
              </Button>

              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="text-xs text-cyan-300 bg-slate-900/50 px-2 py-1 rounded font-mono">{apiKey.key}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 text-slate-400 hover:text-cyan-300"
                      onClick={() => navigator.clipboard.writeText(apiKey.key)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                    <div>Created: {apiKey.created}</div>
                    <div>Last Used: {apiKey.lastUsed}</div>
                    <div>Calls: {apiKey.calls}</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Training Parameters
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Learning Rate</span>
                    <input type="text" defaultValue="0.001" className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 w-24 text-white text-xs" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Batch Size</span>
                    <input type="text" defaultValue="32" className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 w-24 text-white text-xs" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Epochs</span>
                    <input type="text" defaultValue="50" className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 w-24 text-white text-xs" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Validation Split</span>
                    <input type="text" defaultValue="0.2" className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 w-24 text-white text-xs" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export & Deploy
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 border-slate-600 text-slate-300" size="sm">
                    <Download className="w-4 h-4 mr-2" /> Export Model
                  </Button>
                  <Button variant="outline" className="flex-1 border-slate-600 text-slate-300" size="sm">
                    <Code className="w-4 h-4 mr-2" /> Deploy
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}