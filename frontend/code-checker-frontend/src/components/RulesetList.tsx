import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../hooks/useAuth';
import { Loader2, ShieldCheck, Trash2, Plus } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

export interface Ruleset {
  id: string;
  name: string;
  rules: any[];
  description?: string;
}

interface RulesetListProps {
  onSelectRuleset: (ruleset: Ruleset) => void;
  onDeleteSuccess?: () => void;
}

export const RulesetList: React.FC<RulesetListProps> = ({ onSelectRuleset, onDeleteSuccess }) => {
  const { user } = useAuth();
  const [rulesets, setRulesets] = useState<Ruleset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rulesetToDelete, setRulesetToDelete] = useState<Ruleset | null>(null);

  useEffect(() => {
    if (!user?.companyId) return;

    const fetchRulesets = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/rulesets`);
        setRulesets(response.data);
      } catch (err) {
        console.error('Failed to fetch rulesets', err);
        setError('Could not load your rulesets. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRulesets();
  }, [user?.companyId]);

  const openDeleteConfirmation = (e: React.MouseEvent, ruleset: Ruleset) => {
    e.stopPropagation(); 
    setRulesetToDelete(ruleset);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!rulesetToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/rulesets/${rulesetToDelete.id}`);
      onDeleteSuccess?.();
    } catch (err) {
      setError(`Failed to delete ruleset.`);
    } finally {
      setIsDeleting(false);
      setIsModalOpen(false);
      setRulesetToDelete(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin mr-2" /> Loading rulesets...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Select a Ruleset to Edit</h3>
          <button
            onClick={() => onSelectRuleset({ id: 'new', name: 'New Ruleset', rules: [], description: '' })}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all"
          >
            <Plus size={16} /> Create New
          </button>
        </div>
        {rulesets.length > 0 ? (
          rulesets.map((ruleset) => (
          <div
            key={ruleset.id}
            onClick={() => onSelectRuleset(ruleset)}
            className="w-full text-left flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-blue-500" />
              <span className="font-medium text-gray-800">{ruleset.name}</span>
            </div>
            <button
              onClick={(e) => openDeleteConfirmation(e, ruleset)}
              className="p-2 text-gray-400 hover:text-red-600 rounded-md transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))
        ) : (
          <p className="text-gray-500 text-sm text-center py-6 border border-dashed rounded-lg">
            No rulesets found. Create one to get started.
          </p>
        )}
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Ruleset"
        message={`Are you sure you want to delete the ruleset "${rulesetToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isConfirming={isDeleting}
      />
    </>
  );
};