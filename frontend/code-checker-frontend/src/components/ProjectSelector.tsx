import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Folder, Search } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  disabled?: boolean;
  disabledReason?: string;
  label?: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelect: (projectId: string) => void;
  placeholder?: string;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Project
      </label>
      
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl shadow-sm transition-all duration-200 ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-100'
            : 'border-gray-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${selectedProject ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
            <Folder className="w-5 h-5" />
          </div>
          <span className={`font-medium ${selectedProject ? 'text-gray-900' : 'text-gray-500'}`}>
            {selectedProject ? selectedProject.name : 'Choose a project...'}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Project List */}
            <div className="max-h-60 overflow-y-auto py-2">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      if (!project.disabled) {
                        onSelect(project.id);
                        setIsOpen(false);
                        setSearchQuery('');
                      }
                    }}
                    disabled={project.disabled}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-colors group text-left ${
                      project.disabled 
                        ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                        : 'hover:bg-blue-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        selectedProjectId === project.id 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-blue-500'
                      }`}>
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className={`text-sm font-medium truncate ${
                          selectedProjectId === project.id ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {project.label || project.name}
                        </span>
                        {project.disabledReason && (
                          <span className="text-xs text-red-500 truncate">
                            {project.disabledReason}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedProjectId === project.id && (
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No projects found
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 text-center">
              Showing {filteredProjects.length} projects
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
