import React, { useState, useEffect } from 'react';
import { BookTemplate, Loader2, Download, Users, Building2, AlertCircle } from 'lucide-react';
import api from '../api/api';

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category?: string;
  usageCount: number;
  isPublic: boolean;
  generatedRules: any[];
  metadata?: {
    tags?: string[];
    language?: string;
  };
}

interface AITemplateBrowserProps {
  onApplyTemplate: (templateId: string, template: RuleTemplate) => void;
  projectId?: string;
}

export const AITemplateBrowser: React.FC<AITemplateBrowserProps> = ({
  onApplyTemplate,
  projectId,
}) => {
  const [templates, setTemplates] = useState<RuleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = { includePublic: true };
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      const response = await api.get('/ai/rulesets/templates', { params });
      
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch templates:', err);
      setError('Failed to load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (template: RuleTemplate) => {
    if (!projectId) {
      setError('Please select a project first');
      return;
    }

    setApplying(template.id);
    try {
      await api.post(`/ai/rulesets/templates/${template.id}/apply`, {
        projectId,
      });

      onApplyTemplate(template.id, template);
    } catch (err: any) {
      console.error('Failed to apply template:', err);
      setError(err.response?.data?.message || 'Failed to apply template');
    } finally {
      setApplying(null);
    }
  };

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'code-quality', label: 'Code Quality' },
    { value: 'dependencies', label: 'Dependencies' },
    { value: 'project-structure', label: 'Project Structure' },
    { value: 'file-organization', label: 'File Organization' },
    { value: 'general', label: 'General' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin mr-2" size={20} />
        <span className="text-gray-600">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookTemplate className="text-blue-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-700">Rule Templates</h3>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input w-auto text-sm"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <BookTemplate className="mx-auto text-gray-400 mb-2" size={48} />
          <p className="text-gray-500">No templates found in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-800">{template.name}</h4>
                    {template.isPublic ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        <Users size={12} />
                        Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                        <Building2 size={12} />
                        Private
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{template.generatedRules.length} rules</span>
                    <span>•</span>
                    <span>Used {template.usageCount} times</span>
                    {template.metadata?.tags && template.metadata.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex gap-1">
                          {template.metadata.tags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-gray-100 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleApplyTemplate(template)}
                  disabled={applying === template.id || !projectId}
                  className="btn btn-primary text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applying === template.id ? (
                    <>
                      <Loader2 className="animate-spin mr-1" size={14} />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Download className="mr-1" size={14} />
                      Apply
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!projectId && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          <AlertCircle size={16} className="inline mr-2" />
          Select a project to apply templates
        </div>
      )}
    </div>
  );
};
