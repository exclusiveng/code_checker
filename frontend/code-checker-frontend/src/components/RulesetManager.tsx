import React, { useState, useCallback, useEffect } from 'react';
import { RulesetList, Ruleset } from '../components/RulesetList';
import { RulesetEditor } from '../components/RulesetEditor';
import { AIRulesetGenerator } from '../components/AIRulesetGenerator';
import { AITemplateBrowser } from '../components/AITemplateBrowser';
import { AIRuleSuggestions } from '../components/AIRuleSuggestions';
import { Sparkles, BookTemplate, Lightbulb, List, FolderGit2 } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../hooks/useAuth';
import { ProjectSelector } from './ProjectSelector';

type ViewMode = 'list' | 'edit' | 'ai-generate' | 'templates' | 'suggestions';

export const RulesetManager: React.FC = () => {
  const { user } = useAuth();
  const [selectedRuleset, setSelectedRuleset] = useState<Ruleset | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [listKey, setListKey] = useState(Date.now());
  const [projectId, setProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch projects on mount
  useEffect(() => {
    if (user?.companyId) {
      api.get(`/companies/${user.companyId}/projects`)
        .then(res => {
          setProjects(res.data.data || []);
          // Default to first project if available
          if (res.data.data && res.data.data.length > 0) {
            setProjectId(res.data.data[0].id);
          }
        })
        .catch(err => console.error('Failed to fetch projects', err));
    }
  }, [user?.companyId]);

  const handleSaveSuccess = useCallback(() => {
    setSelectedRuleset(null);
    setViewMode('list');
    setListKey(Date.now());
  }, []);

  const handleCancel = () => {
    setSelectedRuleset(null);
    setViewMode('list');
  };

  const handleSelectRuleset = (ruleset: Ruleset) => {
    setSelectedRuleset(ruleset);
    setViewMode('edit');
  };

  const handleRulesetGenerated = (ruleset: any, templateId?: string) => {
    // Convert AI-generated ruleset to Ruleset format
    const convertedRules = (ruleset.rules || []).map((aiRule: any, index: number) => ({
      id: `ai-generated-${index}-${Date.now()}`,
      type: aiRule.type,
      payload: aiRule.payload,
      severity: aiRule.severity,
      message: aiRule.message,
    }));

    const newRuleset: Ruleset = {
      id: 'new',
      name: ruleset.name,
      description: ruleset.description,
      rules: convertedRules,
    };
    
    setSelectedRuleset(newRuleset);
    setViewMode('edit');
  };

  const handleApplyTemplate = (templateId: string, template: any) => {
    // Template applied, refresh list
    setListKey(Date.now());
    setViewMode('list');
  };

  const handleApplySuggestions = (rules: any[]) => {
    const convertedRules = rules.map((aiRule: any, index: number) => ({
      id: `ai-suggested-${index}-${Date.now()}`,
      type: aiRule.type,
      payload: aiRule.payload,
      severity: aiRule.severity,
      message: aiRule.message,
    }));

    const newRuleset: Ruleset = {
      id: 'new',
      name: 'AI Suggested Rules',
      description: 'Rules suggested based on submission history',
      rules: convertedRules,
    };
    setSelectedRuleset(newRuleset);
    setViewMode('edit');
  };

  // Render navigation tabs
  const renderTabs = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-200 pb-2">
      <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
            viewMode === 'list'
              ? 'border-blue-600 text-blue-600 font-medium'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <List size={18} />
          My Rulesets
        </button>
        <button
          onClick={() => setViewMode('ai-generate')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
            viewMode === 'ai-generate'
              ? 'border-blue-600 text-blue-600 font-medium'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <Sparkles size={18} />
          Generate with AI
        </button>
        <button
          onClick={() => setViewMode('templates')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
            viewMode === 'templates'
              ? 'border-blue-600 text-blue-600 font-medium'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <BookTemplate size={18} />
          Templates
        </button>
        <button
          onClick={() => setViewMode('suggestions')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
            viewMode === 'suggestions'
              ? 'border-blue-600 text-blue-600 font-medium'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <Lightbulb size={18} />
          AI Suggestions
        </button>
      </div>

      {/* Project Selector */}
      <div className="w-full md:w-64">
        <ProjectSelector
          projects={projects}
          selectedProjectId={projectId || null}
          onSelect={(id) => setProjectId(id)}
          placeholder="Select Active Project..."
        />
      </div>
    </div>
  );

  // If editing a ruleset, show the editor
  if (viewMode === 'edit' && selectedRuleset) {
    return (
      <RulesetEditor
        rulesetId={selectedRuleset.id}
        rulesetName={selectedRuleset.name}
        initialRules={selectedRuleset.rules}
        onSaveSuccess={handleSaveSuccess}
        onCancel={handleCancel}
      />
    );
  }

  // Otherwise, show the selected view with tabs
  return (
    <div className="space-y-4">
      {renderTabs()}

      {viewMode === 'list' && (
        <RulesetList
          key={listKey}
          onSelectRuleset={handleSelectRuleset}
          onDeleteSuccess={handleSaveSuccess}
        />
      )}

      {viewMode === 'ai-generate' && (
        <div className="card">
          <AIRulesetGenerator
            onRulesetGenerated={handleRulesetGenerated}
            projectId={projectId}
          />
        </div>
      )}

      {viewMode === 'templates' && (
        <div className="card">
          <AITemplateBrowser
            onApplyTemplate={handleApplyTemplate}
            projectId={projectId}
          />
        </div>
      )}

      {viewMode === 'suggestions' && (
        <div className="card">
          {projectId ? (
            <AIRuleSuggestions
              projectId={projectId}
              onApplySuggestions={handleApplySuggestions}
            />
          ) : (
            <div className="text-center p-8">
              <Lightbulb className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-600 font-medium mb-2">Select a Project First</p>
              <p className="text-sm text-gray-500">
                AI suggestions are based on your project's submission history.
                <br />
                Please select a project to get personalized rule suggestions.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};