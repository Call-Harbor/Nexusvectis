import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Database, Plus, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ENTITY_OPTIONS = [
  "Vehicle", "Shipment", "Route", "Alert", "Maintenance", "Resource"
];

export default function DataBindingPanel({ slide, orgId, bindings, onBindingsChange, onApply }) {
  const [entities, setEntities] = useState({});
  const [selectedEntity, setSelectedEntity] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [targetField, setTargetField] = useState("");
  const [loading, setLoading] = useState(false);
  const [entityFields, setEntityFields] = useState([]);

  // Load entity schemas
  useEffect(() => {
    const loadSchemas = async () => {
      setLoading(true);
      try {
        const schemas = {};
        for (const entity of ENTITY_OPTIONS) {
          const schema = await base44.entities[entity].schema();
          schemas[entity] = Object.keys(schema.properties || {});
        }
        setEntities(schemas);
      } catch (e) {
        console.error("Failed to load schemas", e);
      }
      setLoading(false);
    };
    loadSchemas();
  }, []);

  useEffect(() => {
    if (selectedEntity && entities[selectedEntity]) {
      setEntityFields(entities[selectedEntity]);
    }
  }, [selectedEntity, entities]);

  const addBinding = () => {
    if (!selectedEntity || !selectedField || !targetField) {
      toast.error("Select entity, field, and target");
      return;
    }

    const newBinding = {
      id: Date.now(),
      entity: selectedEntity,
      field: selectedField,
      target: targetField,
      aggregation: "first"
    };

    const updatedBindings = { ...bindings, [newBinding.id]: newBinding };
    onBindingsChange(updatedBindings);
    setSelectedEntity("");
    setSelectedField("");
    setTargetField("");
    toast.success("Binding added");
  };

  const removeBinding = (id) => {
    const updated = { ...bindings };
    delete updated[id];
    onBindingsChange(updated);
  };

  const applyDataBindings = async () => {
    if (Object.keys(bindings).length === 0) {
      toast.error("No bindings configured");
      return;
    }

    setLoading(true);
    try {
      const dataMap = {};

      for (const [id, binding] of Object.entries(bindings)) {
        const entity = base44.entities[binding.entity];
        const records = await entity.filter({ organization_id: orgId }, "-updated_date", 5);
        
        const values = records.map(r => r[binding.field]).filter(Boolean);
        dataMap[binding.target] = {
          binding: binding,
          values: values,
          aggregated: values[0] // Use first value for now
        };
      }

      // Create enriched slide data
      const enrichedData = { ...slide };
      for (const [target, data] of Object.entries(dataMap)) {
        if (target.includes("bullet")) {
          enrichedData.bullets = data.values.slice(0, 5);
        } else if (target.includes("stat")) {
          enrichedData.stats = data.values.map(v => ({ label: "Value", value: v }));
        } else {
          enrichedData[target] = data.aggregated;
        }
      }

      onApply(enrichedData);
      toast.success("Data bindings applied!");
    } catch (e) {
      toast.error("Failed to apply bindings: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-400">Bind live entity data to slide fields</div>

      {/* Add binding */}
      <div className="space-y-2 p-2 rounded border border-slate-800 bg-slate-900/30">
        <div>
          <label className="text-[10px] text-slate-600 uppercase mb-1 block">Entity</label>
          <Select value={selectedEntity} onValueChange={setSelectedEntity}>
            <SelectTrigger className="h-7 text-xs bg-slate-800/60 border-slate-700">
              <SelectValue placeholder="Select entity..." />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_OPTIONS.map(e => (
                <SelectItem key={e} value={e} className="text-xs">
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedEntity && (
          <>
            <div>
              <label className="text-[10px] text-slate-600 uppercase mb-1 block">Field to fetch</label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger className="h-7 text-xs bg-slate-800/60 border-slate-700">
                  <SelectValue placeholder="Select field..." />
                </SelectTrigger>
                <SelectContent>
                  {entityFields.map(f => (
                    <SelectItem key={f} value={f} className="text-xs">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] text-slate-600 uppercase mb-1 block">Map to slide field</label>
              <Select value={targetField} onValueChange={setTargetField}>
                <SelectTrigger className="h-7 text-xs bg-slate-800/60 border-slate-700">
                  <SelectValue placeholder="Select target..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title" className="text-xs">Title</SelectItem>
                  <SelectItem value="body" className="text-xs">Body</SelectItem>
                  <SelectItem value="bullets" className="text-xs">Bullets</SelectItem>
                  <SelectItem value="metric" className="text-xs">Metric</SelectItem>
                  <SelectItem value="stats" className="text-xs">Stats</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={addBinding}
              size="sm"
              className="w-full h-7 bg-violet-600/80 hover:bg-violet-600 border-0 text-xs gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Binding
            </Button>
          </>
        )}
      </div>

      {/* Active bindings */}
      {Object.entries(bindings).length > 0 && (
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Bindings</label>
          {Object.entries(bindings).map(([id, binding]) => (
            <div key={id} className="flex items-center justify-between p-2 rounded bg-violet-500/10 border border-violet-500/30 text-xs text-violet-300">
              <div>
                <div className="font-mono">{binding.entity}.{binding.field}</div>
                <div className="text-[10px] text-violet-400">→ {binding.target}</div>
              </div>
              <button
                onClick={() => removeBinding(id)}
                className="text-violet-400 hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={applyDataBindings}
        disabled={loading || Object.keys(bindings).length === 0}
        className="w-full h-8 bg-cyan-600/80 hover:bg-cyan-600 border-0 text-xs gap-2"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
        {loading ? "Fetching..." : "Apply Bindings"}
      </Button>

      <div className="text-[10px] text-slate-600 pt-2 border-t border-slate-800">
        Data is fetched from your organization on demand. Bindings sync to the slide when applied.
      </div>
    </div>
  );
}