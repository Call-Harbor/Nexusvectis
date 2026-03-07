import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, Globe, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const INTEGRATION_TEMPLATES = [
  { id: "rest", name: "REST API", description: "Generic HTTP REST endpoint", color: "cyan" },
  { id: "stripe", name: "Stripe", description: "Payment processing", color: "violet" },
  { id: "sendgrid", name: "SendGrid", description: "Email service", color: "emerald" },
  { id: "twilio", name: "Twilio", description: "SMS & Voice", color: "blue" },
  { id: "slack", name: "Slack", description: "Team messaging", color: "indigo" },
  { id: "github", name: "GitHub", description: "Version control & API", color: "slate" },
];

export default function APIIntegrationsPanel({ integrations, onIntegrationsChange }) {
  const [expandedIntegrations, setExpandedIntegrations] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);

  const addIntegration = (template) => {
    const newIntegration = {
      id: Date.now(),
      type: template.id,
      name: `${template.name} Integration`,
      baseUrl: "",
      authType: "none",
      apiKey: "",
      methods: []
    };
    onIntegrationsChange([...integrations, newIntegration]);
    setShowTemplates(false);
  };

  const deleteIntegration = (id) => {
    onIntegrationsChange(integrations.filter(i => i.id !== id));
  };

  const updateIntegration = (id, updates) => {
    onIntegrationsChange(integrations.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const addMethod = (integrationId) => {
    const integration = integrations.find(i => i.id === integrationId);
    const updatedIntegration = {
      ...integration,
      methods: [...integration.methods, { id: Date.now(), name: "endpoint", method: "GET", path: "/" }]
    };
    onIntegrationsChange(integrations.map(i => i.id === integrationId ? updatedIntegration : i));
  };

  const updateMethod = (integrationId, methodId, updates) => {
    const integration = integrations.find(i => i.id === integrationId);
    const updatedIntegration = {
      ...integration,
      methods: integration.methods.map(m => m.id === methodId ? { ...m, ...updates } : m)
    };
    onIntegrationsChange(integrations.map(i => i.id === integrationId ? updatedIntegration : i));
  };

  const deleteMethod = (integrationId, methodId) => {
    const integration = integrations.find(i => i.id === integrationId);
    const updatedIntegration = {
      ...integration,
      methods: integration.methods.filter(m => m.id !== methodId)
    };
    onIntegrationsChange(integrations.map(i => i.id === integrationId ? updatedIntegration : i));
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-hidden bg-slate-950">
      {/* Add integration button */}
      <Button
        onClick={() => setShowTemplates(!showTemplates)}
        className="bg-violet-600 hover:bg-violet-500 border-0 text-white w-full"
      >
        <Plus className="w-3 h-3 mr-1" /> Add Integration
      </Button>

      {/* Templates dropdown */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-2"
          >
            {INTEGRATION_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => addIntegration(template)}
                className={`p-2 rounded-lg border border-${template.color}-500/30 bg-${template.color}-500/10 hover:bg-${template.color}-500/20 text-left transition-all`}
              >
                <p className="text-xs font-semibold text-white">{template.name}</p>
                <p className="text-[10px] text-slate-400">{template.description}</p>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Integrations list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {integrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500 gap-2">
            <Globe className="w-8 h-8 opacity-40" />
            <p className="text-xs">No integrations yet. Connect external services.</p>
          </div>
        ) : (
          integrations.map(integration => (
            <motion.div
              key={integration.id}
              className="border border-slate-700/50 bg-slate-900/60 hover:border-slate-600 rounded-lg overflow-hidden transition-all"
            >
              <button
                onClick={() => setExpandedIntegrations(prev => ({ ...prev, [integration.id]: !prev[integration.id] }))}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Globe className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-white truncate">{integration.name}</span>
                  <span className="text-[10px] text-slate-500">{integration.methods.length} methods</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0 ${expandedIntegrations[integration.id] ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {expandedIntegrations[integration.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-700/50 bg-slate-950/80 p-3 space-y-3"
                  >
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider">Base URL</label>
                      <input
                        value={integration.baseUrl}
                        onChange={e => updateIntegration(integration.id, { baseUrl: e.target.value })}
                        placeholder="https://api.example.com"
                        className="w-full mt-1 bg-slate-800/60 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Auth Type</label>
                        <select
                          value={integration.authType}
                          onChange={e => updateIntegration(integration.id, { authType: e.target.value })}
                          className="w-full mt-1 bg-slate-800/60 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
                        >
                          <option value="none">None</option>
                          <option value="bearer">Bearer Token</option>
                          <option value="basic">Basic Auth</option>
                          <option value="apikey">API Key</option>
                        </select>
                      </div>
                      {integration.authType !== "none" && (
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> API Key
                          </label>
                          <input
                            value={integration.apiKey}
                            onChange={e => updateIntegration(integration.id, { apiKey: e.target.value })}
                            type="password"
                            placeholder="Enter API key"
                            className="w-full mt-1 bg-slate-800/60 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                          />
                        </div>
                      )}
                    </div>

                    {/* Methods */}
                    <div className="border-t border-slate-700/50 pt-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Endpoints</p>
                      {integration.methods.map(method => (
                        <div key={method.id} className="flex gap-1.5 items-end text-[10px] mb-2">
                          <select
                            value={method.method}
                            onChange={e => updateMethod(integration.id, method.id, { method: e.target.value })}
                            className="bg-slate-800/60 border border-slate-700 rounded px-1.5 py-1 text-white focus:outline-none focus:border-violet-500/50"
                          >
                            {["GET", "POST", "PUT", "DELETE", "PATCH"].map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <input
                            value={method.path}
                            onChange={e => updateMethod(integration.id, method.id, { path: e.target.value })}
                            placeholder="/path"
                            className="flex-1 bg-slate-800/60 border border-slate-700 rounded px-2 py-1 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                          />
                          <input
                            value={method.name}
                            onChange={e => updateMethod(integration.id, method.id, { name: e.target.value })}
                            placeholder="name"
                            className="flex-1 bg-slate-800/60 border border-slate-700 rounded px-2 py-1 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                          />
                          <button
                            onClick={() => deleteMethod(integration.id, method.id)}
                            className="p-1 hover:bg-red-500/20 rounded text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addMethod(integration.id)}
                        className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 mt-2"
                      >
                        <Plus className="w-3 h-3" /> Add endpoint
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteIntegration(integration.id)}
                      className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 pt-2 border-t border-slate-700/50 w-full"
                    >
                      <Trash2 className="w-3 h-3" /> Delete integration
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}