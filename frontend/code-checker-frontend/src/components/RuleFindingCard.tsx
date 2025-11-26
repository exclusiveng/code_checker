import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

export interface RuleFinding {
  ruleId?: string;
  severity: 'info' | 'warning' | 'error' | 'critical' | string;
  message: string;
  locations?: { file: string; line?: number; excerpt?: string }[];
  file?: string; // legacy support
}

interface RuleFindingCardProps {
  finding: RuleFinding;
}

const severityColors: Record<string, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  critical: 'bg-red-100 border-red-300 text-red-900 font-semibold',
  default: 'bg-gray-50 border-gray-200 text-gray-700',
};

const severityIcons: Record<string, JSX.Element> = {
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  critical: <XCircle className="w-5 h-5 text-red-600" />,
  default: <CheckCircle className="w-5 h-5 text-gray-500" />,
};

export const RuleFindingCard: React.FC<RuleFindingCardProps> = ({ finding }) => {
  const { severity, message, file, ruleId, locations } = finding;
  const normalized = severity.toLowerCase();

  // Combine legacy 'file' with new 'locations' array
  const allLocations = locations || (file ? [{ file }] : []);

  return (
    <div
      className={clsx(
        'flex items-start gap-3 border rounded-xl p-4 shadow-sm transition-all hover:shadow-md bg-white',
        severityColors[normalized] || severityColors.default
      )}
    >
      <div className="mt-1 flex-shrink-0">
        {severityIcons[normalized] || severityIcons.default}
      </div>
      <div className="flex flex-col text-sm flex-1 min-w-0">
        <div className="flex justify-between items-start gap-4">
          <p className="font-semibold text-base">{message}</p>
          {ruleId && (
            <span className="text-xs text-gray-400 font-mono whitespace-nowrap bg-gray-100 px-2 py-1 rounded">
              {ruleId}
            </span>
          )}
        </div>

        {allLocations.length > 0 && (
          <div className="mt-3 space-y-2">
            {allLocations.map((loc, idx) => (
              <div key={idx} className="bg-white/50 rounded-lg border border-black/5 p-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <span className="font-semibold text-gray-700">File:</span>
                  <span className="break-all">{loc.file}</span>
                  {loc.line && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="font-semibold text-gray-700">Line:</span>
                      <span>{loc.line}</span>
                    </>
                  )}
                </div>
                {loc.excerpt && (
                  <div className="mt-1 bg-gray-50 p-2 rounded border border-gray-100 text-gray-600 overflow-x-auto">
                    <code>{loc.excerpt.trim()}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
