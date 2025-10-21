import React, { useState, useCallback } from 'react';
import { RulesetList, Ruleset } from '../components/RulesetList';
import { RulesetEditor } from '../components/RulesetEditor';

export const RulesetManager: React.FC = () => {
  const [selectedRuleset, setSelectedRuleset] = useState<Ruleset | null>(null);
  const [listKey, setListKey] = useState(Date.now());

  const handleSaveSuccess = useCallback(() => {
    setSelectedRuleset(null);
    setListKey(Date.now()); 
  }, []);

  const handleCancel = () => {
    setSelectedRuleset(null);
  };

  if (selectedRuleset) {
    return (
      <RulesetEditor
        rulesetId={selectedRuleset.id}
        rulesetName={selectedRuleset.name}
        onSaveSuccess={handleSaveSuccess}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <RulesetList
      key={listKey}
      onSelectRuleset={setSelectedRuleset}
      onDeleteSuccess={handleSaveSuccess} 
    />
  );
};