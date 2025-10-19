import React, { useState, useCallback } from 'react';
import { RulesetList, Ruleset } from '../components/RulesetList';
import { RulesetEditor } from '../components/RulesetEditor';

export const RulesetManager: React.FC = () => {
  const [selectedRuleset, setSelectedRuleset] = useState<Ruleset | null>(null);
  // Add a key to force RulesetList to re-fetch data when a ruleset is saved or deleted.
  const [listKey, setListKey] = useState(Date.now());

  // Called after a ruleset is successfully saved
  const handleSaveSuccess = useCallback(() => {
    setSelectedRuleset(null);
    setListKey(Date.now()); // Trigger a re-render and re-fetch in RulesetList
  }, []);

  // Called when user cancels editing
  const handleCancel = () => {
    setSelectedRuleset(null);
  };

  // If a ruleset is selected, show the editor
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

  // Otherwise, show the list of rulesets
  return (
    <RulesetList
      key={listKey}
      onSelectRuleset={setSelectedRuleset}
      onDeleteSuccess={handleSaveSuccess} // This now correctly matches the props interface
    />
  );
};