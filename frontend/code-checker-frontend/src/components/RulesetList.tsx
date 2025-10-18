import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../hooks/useAuth';
import { Loader2, ShieldCheck } from 'lucide-react';

export interface Ruleset {
  id: string;
  name: string;
  rules: any[];
}

interface RulesetListProps {
  onSelectRuleset: (ruleset: Ruleset) => void;
}

export const RulesetList: React.FC<RulesetListProps> = ({ onSelectRuleset }) => {
  const { user } = useAuth();
  const [rulesets, setRulesets] = useState<Ruleset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin mr-2" /> Loading rulesets...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Select a Ruleset to Edit</h3>
      {rulesets.map((ruleset) => (
        <button
          key={ruleset.id}
          onClick={() => onSelectRuleset(ruleset)}
          className="w-full text-left flex items-center gap-3 p-3 border rounded-lg hover:bg-blue-50 transition-colors"
        >
          <ShieldCheck className="text-blue-500" />
          <span className="font-medium text-gray-800">{ruleset.name}</span>
        </button>
      ))}
    </div>
  );
};