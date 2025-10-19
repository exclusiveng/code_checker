import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileJson, FileText } from 'lucide-react';
import { RuleInput } from './RulesetEditor';

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: RuleInput) => void;
  rule: RuleInput | null;
  defaultRule: RuleInput;
}

export const RuleModal: React.FC<RuleModalProps> = ({ isOpen, onClose, onSave, rule, defaultRule }) => {
  const [currentRule, setCurrentRule] = useState<RuleInput | null>(null);
  const isNewRule = !rule;

  useEffect(() => {
    if (isOpen) {
      // When the modal opens, initialize its state.
      // If we are editing, use the passed rule.
      // If we are adding, use the default rule.
      if (isNewRule) {
        setCurrentRule({ ...defaultRule });
      } else {
        setCurrentRule({ ...rule });
      }
    }
  }, [isOpen, rule, isNewRule, defaultRule]);

  const handleChange = (field: keyof Omit<RuleInput, 'id'>, value: string) => {
    if (currentRule) {
      setCurrentRule({ ...currentRule, [field]: value });
    }
  };

  const handleSave = () => {
    if (currentRule) {
      // If it's a new rule, generate a UUID upon saving.
      const ruleToSave = isNewRule ? { ...currentRule, id: crypto.randomUUID() } : currentRule;
      onSave(ruleToSave);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {isNewRule ? 'Add New Rule' : 'Edit Rule'}
              </h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>

            {currentRule && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
                    <div className="flex gap-2">
                      <button onClick={() => handleChange('type', 'filename-contains')} className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded-lg text-sm transition-all ${currentRule.type === 'filename-contains' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        <FileJson size={14} /> Filename
                      </button>
                      <button onClick={() => handleChange('type', 'file-content-contains')} className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded-lg text-sm transition-all ${currentRule.type === 'file-content-contains' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        <FileText size={14} /> Content
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Severity</label>
                    <select
                      value={currentRule.severity}
                      onChange={(e) => handleChange('severity', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Payload</label>
                  <input
                    type="text"
                    value={currentRule.payload}
                    onChange={(e) => handleChange('payload', e.target.value)}
                    placeholder="e.g. config.json or 'console.log'"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Message</label>
                  <input
                    type="text"
                    value={currentRule.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder="Description of the rule's purpose"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save Rule</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};