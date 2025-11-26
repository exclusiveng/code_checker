import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface DropdownOption {
  id: string;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  disabledReason?: string;
}

interface DropdownProps {
  label?: string;
  options: DropdownOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  placeholder?: string;
  searchable?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedId,
  onSelect,
  placeholder = 'Select an option...',
  searchable = true,
  loading = false,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === selectedId);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
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
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        onClick={() => !loading && setIsOpen(!isOpen)}
        disabled={loading}
        className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl shadow-sm transition-all duration-200 ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-100'
            : 'border-gray-200 hover:border-blue-300'
        } ${loading ? 'opacity-70 cursor-wait' : ''}`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {icon && (
            <div className={`p-2 rounded-lg flex-shrink-0 ${selectedOption ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
              {icon}
            </div>
          )}
          <span className={`font-medium truncate ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
            {loading ? 'Loading...' : (selectedOption ? selectedOption.label : placeholder)}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
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
            {searchable && (
              <div className="p-3 border-b border-gray-100 bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto py-2">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (!option.disabled) {
                        onSelect(option.id);
                        setIsOpen(false);
                        setSearchQuery('');
                      }
                    }}
                    disabled={option.disabled}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-colors group text-left ${
                      option.disabled 
                        ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                        : 'hover:bg-blue-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {option.icon && (
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          selectedId === option.id 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-blue-500'
                        }`}>
                          {option.icon}
                        </div>
                      )}
                      <div className="flex flex-col overflow-hidden">
                        <span className={`text-sm font-medium truncate ${
                          selectedId === option.id ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {option.label}
                        </span>
                        {option.subLabel && (
                          <span className="text-xs text-gray-500 truncate">
                            {option.subLabel}
                          </span>
                        )}
                        {option.disabledReason && (
                          <span className="text-xs text-red-500 truncate mt-0.5">
                            {option.disabledReason}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedId === option.id && (
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No options found
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 text-center">
              Showing {filteredOptions.length} options
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
