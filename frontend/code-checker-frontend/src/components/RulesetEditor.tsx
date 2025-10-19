import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Edit, Loader2 } from 'lucide-react';
import { RuleModal } from './RuleModal';
import { motion } from 'framer-motion';
import api from '../api/api';
// Define the RuleInput type locally for clarity, assuming it's not globally available.
// In a real app, this would come from a shared types file, e.g., `../types`.
export type RuleInput = {
  id?: string; // Use a unique ID for list keys
  type: 'filename-contains' | 'file-content-contains' | string;
  payload: string;
  severity: 'info' | 'warning' | 'error' | 'critical' | string;
  message: string;
};

interface RulesetEditorProps {
  rulesetId: string;
  rulesetName: string;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

const defaultRule: RuleInput = {
  type: 'filename-contains',
  payload: '',
  severity: 'warning',
  message: '',
};

export const RulesetEditor: React.FC<RulesetEditorProps> = ({ rulesetId, rulesetName, onSaveSuccess, onCancel }) => {
  const [rules, setRules] = useState<RuleInput[]>([]);
  const [name, setName] = useState(rulesetName);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleInput | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ensure all rules have a unique ID for React keys when the component loads.
  useEffect(() => {
    setName(rulesetName);
    const fetchRules = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/rulesets/${rulesetId}`);
        setRules(
          (response.data.rules || []).map((rule: Omit<RuleInput, 'id'>, index: number) => ({
            ...rule,
            id: `${rulesetId}-${index}-${rule.payload}`, // Create a stable ID
          }))
        );
      } catch (err) {
        console.error('Failed to fetch ruleset details', err);
        setError('Could not load rules for this ruleset.');
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, [rulesetId, rulesetName]);

  const handleAddRule = () => {
    // Set to null to signify a new rule, letting the modal handle defaults.
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleEditRule = (rule: RuleInput) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSaveRule = (ruleToSave: RuleInput) => {
    // A rule is existing if its ID is already in our rules list.
    // A new rule from the modal will have a new UUID not present in the list.
    const isExisting = ruleToSave.id ? rules.some((r) => r.id === ruleToSave.id) : false;

    if (isExisting) {
      setRules(rules.map((r) => (r.id === ruleToSave.id ? ruleToSave : r)));
    } else {
      setRules([...rules, ruleToSave]);
    }
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const rulesToSave = rules.map(({ id, ...rest }) => rest);
      await api.put(`/rulesets/${rulesetId}`, {
        name: name,
        rules: rulesToSave,
      });
      onSaveSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save ruleset.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin mr-2" /> Loading rules...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-800">
            Editing:
          </h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-xl font-semibold text-blue-600 bg-transparent border-b-2 border-transparent focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          onClick={handleAddRule}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all"
        >
          <Plus size={16} /> Add Rule
        </button>
      </div>

      {error && (
        <div className="my-4 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {rules.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-6 border border-dashed rounded-lg">
          No rules yet. Add one to get started.
        </p>
      )}

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <motion.div
            key={rule.id} // Use the guaranteed unique ID for the key
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center border rounded-lg p-3 bg-gray-50/70"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-700">{rule.message}</p>
              <p className="text-xs text-gray-500">
                <span className="font-semibold">{rule.type}:</span> {rule.payload} • <span className="capitalize">{rule.severity}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEditRule(rule)}
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleRemoveRule(index)}
                className="p-2 text-gray-500 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <RuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRule}
        rule={editingRule}
        defaultRule={defaultRule}
      />
    </div>
  );
};
