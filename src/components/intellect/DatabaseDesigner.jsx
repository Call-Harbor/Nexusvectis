import React, { useState } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Copy, ChevronDown, Database, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FIELD_TYPES = ["string", "number", "boolean", "date", "array", "object", "email"];

export default function DatabaseDesigner({ entities, onEntitiesChange }) {
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [newEntityName, setNewEntityName] = useState("");
  const [expandedEntities, setExpandedEntities] = useState({});

  const addEntity = () => {
    if (!newEntityName.trim()) return;
    const newEntity = {
      id: Date.now(),
      name: newEntityName,
      fields: [{ id: 1, name: "id", type: "string", required: true }]
    };
    onEntitiesChange([...entities, newEntity]);
    setNewEntityName("");
  };

  const deleteEntity = (id) => {
    onEntitiesChange(entities.filter(e => e.id !== id));
    if (selectedEntity?.id === id) setSelectedEntity(null);
  };

  const addField = (entityId) => {
    const entity = entities.find(e => e.id === entityId);
    if (!entity) return;
    const updatedEntity = {
      ...entity,
      fields: [...(entity.fields || []), { id: Date.now(), name: "field", type: "string", required: false }]
    };
    onEntitiesChange(entities.map(e => e.id === entityId ? updatedEntity : e));
  };

  const updateField = (entityId, fieldId, updates) => {
    const entity = entities.find(e => e.id === entityId);
    if (!entity) return;
    const updatedEntity = {
      ...entity,
      fields: (entity.fields || []).map(f => f.id === fieldId ? { ...f, ...updates } : f)
    };
    onEntitiesChange(entities.map(e => e.id === entityId ? updatedEntity : e));
  };

  const deleteField = (entityId, fieldId) => {
    const entity = entities.find(e => e.id === entityId);
    if (!entity) return;
    const updatedEntity = {
      ...entity,
      fields: (entity.fields || []).filter(f => f.id !== fieldId)
    };
    onEntitiesChange(entities.map(e => e.id === entityId ? updatedEntity : e));
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-hidden bg-slate-950">
      {/* Add new entity */}
      <div className="flex gap-2">
        <input
          value={newEntityName}
          onChange={e => setNewEntityName(e.target.value)}
          placeholder="Entity name (e.g., User, Product)"
          className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          onKeyDown={e => e.key === 'Enter' && addEntity()}
        />
        <Button onClick={addEntity} size="sm" className="bg-cyan-600 hover:bg-cyan-500 border-0 text-white">
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>

      {/* Entities list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {entities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500 gap-2">
            <Database className="w-8 h-8 opacity-40" />
            <p className="text-xs">No entities yet. Add your first data model.</p>
          </div>
        ) : (
          entities.map(entity => (
            <motion.div
              key={entity.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                selectedEntity?.id === entity.id
                  ? "border-cyan-500/50 bg-cyan-500/10"
                  : "border-slate-700/50 bg-slate-900/60 hover:border-slate-600"
              }`}
            >
              <button
                onClick={() => {
                  setSelectedEntity(entity);
                  setExpandedEntities(prev => ({ ...prev, [entity.id]: !prev[entity.id] }));
                }}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Database className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-white truncate">{entity.name}</span>
                  <span className="text-[10px] text-slate-500">{entity.fields.length} fields</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedEntities[entity.id] ? "rotate-180" : ""}`} />
                </div>
              </button>

              <AnimatePresence>
                {expandedEntities[entity.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-700/50 bg-slate-950/80 p-3 space-y-2"
                  >
                    {/* Fields */}
                    {entity.fields.map(field => (
                      <div key={field.id} className="flex gap-2 items-end text-xs">
                        <input
                          value={field.name}
                          onChange={e => updateField(entity.id, field.id, { name: e.target.value })}
                          className="flex-1 bg-slate-800/60 border border-slate-700 rounded px-2 py-1 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                          placeholder="Field name"
                        />
                        <select
                          value={field.type}
                          onChange={e => updateField(entity.id, field.id, { type: e.target.value })}
                          className="bg-slate-800/60 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-cyan-500/50 text-xs"
                        >
                          {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <label className="flex items-center gap-1 text-slate-400">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={e => updateField(entity.id, field.id, { required: e.target.checked })}
                            className="w-3 h-3"
                          />
                          <span className="text-[10px]">Required</span>
                        </label>
                        <button
                          onClick={() => deleteField(entity.id, field.id)}
                          className="p-1 hover:bg-red-500/20 rounded text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Add field button */}
                    <button
                      onClick={() => addField(entity.id)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-2"
                    >
                      <Plus className="w-3 h-3" /> Add field
                    </button>

                    {/* Delete entity button */}
                    <button
                      onClick={() => deleteEntity(entity.id)}
                      className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 mt-3 pt-2 border-t border-slate-700/50"
                    >
                      <Trash2 className="w-3 h-3" /> Delete entity
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