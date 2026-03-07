import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MultiPageAppBuilder({ pages, onPagesChange, entities = [], integrations = [] }) {
  const [expandedPages, setExpandedPages] = useState({});
  const [newPageName, setNewPageName] = useState("");

  const addPage = () => {
    if (!newPageName.trim()) return;
    const newPage = {
      id: Date.now(),
      name: newPageName,
      route: `/${newPageName.toLowerCase().replace(/\s+/g, "-")}`,
      title: newPageName,
      description: "",
      type: "dashboard", // dashboard, form, list, detail
      entities: [],
      integrations: [],
      layout: "default"
    };
    onPagesChange([...pages, newPage]);
    setNewPageName("");
  };

  const deletePage = (id) => {
    onPagesChange(pages.filter(p => p.id !== id));
  };

  const updatePage = (id, updates) => {
    onPagesChange(pages.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const toggleEntity = (pageId, entityId) => {
    const page = pages.find(p => p.id === pageId);
    const updated = page.entities.includes(entityId)
      ? page.entities.filter(e => e !== entityId)
      : [...page.entities, entityId];
    updatePage(pageId, { entities: updated });
  };

  const toggleIntegration = (pageId, integrationId) => {
    const page = pages.find(p => p.id === pageId);
    const updated = page.integrations.includes(integrationId)
      ? page.integrations.filter(i => i !== integrationId)
      : [...page.integrations, integrationId];
    updatePage(pageId, { integrations: updated });
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-hidden bg-slate-950">
      {/* Add page */}
      <div className="flex gap-2">
        <input
          value={newPageName}
          onChange={e => setNewPageName(e.target.value)}
          placeholder="Page name (e.g., Dashboard, Users)"
          className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          onKeyDown={e => e.key === 'Enter' && addPage()}
        />
        <Button onClick={addPage} size="sm" className="bg-emerald-600 hover:bg-emerald-500 border-0 text-white">
          <Plus className="w-3 h-3 mr-1" /> Page
        </Button>
      </div>

      {/* Pages list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500 gap-2">
            <LayoutGrid className="w-8 h-8 opacity-40" />
            <p className="text-xs">No pages yet. Build your app structure.</p>
          </div>
        ) : (
          pages.map(page => (
            <motion.div
              key={page.id}
              className="border border-slate-700/50 bg-slate-900/60 hover:border-slate-600 rounded-lg overflow-hidden transition-all"
            >
              <button
                onClick={() => setExpandedPages(prev => ({ ...prev, [page.id]: !prev[page.id] }))}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <LayoutGrid className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{page.name}</p>
                    <p className="text-[10px] text-slate-500">{page.route}</p>
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0 ${expandedPages[page.id] ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {expandedPages[page.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-700/50 bg-slate-950/80 p-3 space-y-3"
                  >
                    {/* Route & Title */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Route</label>
                        <input
                          value={page.route}
                          onChange={e => updatePage(page.id, { route: e.target.value })}
                          className="w-full mt-1 bg-slate-800/60 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Page Type</label>
                        <select
                          value={page.type}
                          onChange={e => updatePage(page.id, { type: e.target.value })}
                          className="w-full mt-1 bg-slate-800/60 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                        >
                          <option value="dashboard">Dashboard</option>
                          <option value="form">Form</option>
                          <option value="list">List</option>
                          <option value="detail">Detail</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider">Description</label>
                      <textarea
                        value={page.description}
                        onChange={e => updatePage(page.id, { description: e.target.value })}
                        placeholder="What does this page do?"
                        rows={2}
                        className="w-full mt-1 bg-slate-800/60 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>

                    {/* Entities */}
                    {entities.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Data Entities</p>
                        <div className="space-y-1">
                          {entities.map(entity => (
                            <label key={entity.id} className="flex items-center gap-2 text-[10px] text-slate-300 cursor-pointer hover:bg-slate-800/40 p-1.5 rounded">
                              <input
                                type="checkbox"
                                checked={page.entities.includes(entity.id)}
                                onChange={() => toggleEntity(page.id, entity.id)}
                                className="w-3 h-3"
                              />
                              <span>{entity.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Integrations */}
                    {integrations.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">API Integrations</p>
                        <div className="space-y-1">
                          {integrations.map(integration => (
                            <label key={integration.id} className="flex items-center gap-2 text-[10px] text-slate-300 cursor-pointer hover:bg-slate-800/40 p-1.5 rounded">
                              <input
                                type="checkbox"
                                checked={page.integrations.includes(integration.id)}
                                onChange={() => toggleIntegration(page.id, integration.id)}
                                className="w-3 h-3"
                              />
                              <span>{integration.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => deletePage(page.id)}
                      className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 pt-2 border-t border-slate-700/50 w-full"
                    >
                      <Trash2 className="w-3 h-3" /> Delete page
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