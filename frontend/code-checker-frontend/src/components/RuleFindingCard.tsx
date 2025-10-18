import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

export interface RuleFinding {
  ruleId?: string;
  severity: 'info' | 'warning' | 'error' | 'critical' | string;
  message: string;
  file?: string;
}

interface RuleFindingCardProps {
  finding: RuleFinding;
}

const severityColors: Record<string, string> = {
  info: 'bg-blue-50 border-blue-300 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
  error: 'bg-red-50 border-red-300 text-red-800',
  critical: 'bg-red-100 border-red-400 text-red-900 font-semibold',
  default: 'bg-gray-50 border-gray-300 text-gray-700',
};

const severityIcons: Record<string, JSX.Element> = {
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  critical: <XCircle className="w-5 h-5 text-red-600" />,
  default: <CheckCircle className="w-5 h-5 text-gray-500" />,
};

export const RuleFindingCard: React.FC<RuleFindingCardProps> = ({ finding }) => {
  const { severity, message, file, ruleId } = finding;
  const normalized = severity.toLowerCase();

  return (
    <div
      className={clsx(
        'flex items-start gap-3 border rounded-xl p-4 shadow-sm transition-all hover:shadow-md',
        severityColors[normalized] || severityColors.default
      )}
    >
      <div className="mt-1">
        {severityIcons[normalized] || severityIcons.default}
      </div>
      <div className="flex flex-col text-sm flex-1">
        <div className="flex justify-between items-center">
          <p className="font-medium">{message}</p>
          {ruleId && (
            <span className="text-xs text-gray-500">Rule: {ruleId}</span>
          )}
        </div>

        {file && (
          <p className="mt-1 text-xs text-gray-600">
            <span className="font-semibold">File:</span> {file}
          </p>
        )}
      </div>
    </div>
  );
};
