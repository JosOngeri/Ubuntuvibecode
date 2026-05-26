import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import {
  ChevronDown, ChevronUp, BookOpen, AlertTriangle,
  CheckCircle, Info, XCircle, Loader2, HelpCircle
} from 'lucide-react';

const LEVEL_CONFIG = {
  error:   { icon: XCircle,       bg: 'bg-red-50 dark:bg-red-900/20',    border: 'border-red-200 dark:border-red-800',    text: 'text-red-700 dark:text-red-300',    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  warn:    { icon: AlertTriangle,  bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  info:    { icon: Info,           bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-200 dark:border-blue-800',   text: 'text-blue-700 dark:text-blue-300',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  success: { icon: CheckCircle,    bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
};

const StatusItem = ({ level = 'info', message, detail }) => {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.info;
  const Icon = cfg.icon;
  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-lg border', cfg.bg, cfg.border)}>
      <Icon size={16} className={cn('mt-0.5 shrink-0', cfg.text)} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', cfg.text)}>{message}</p>
        {detail && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
};

const PageInfoPanel = ({
  title,
  description,
  steps = [],
  faqs = [],
  fetchStatus = null,
  className = '',
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState('help');
  const [statusItems, setStatusItems] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);

  useEffect(() => {
    if (open && activeTab === 'status' && !statusLoaded && fetchStatus) {
      loadStatus();
    }
  }, [open, activeTab]);

  const loadStatus = async () => {
    if (!fetchStatus) return;
    setStatusLoading(true);
    try {
      const items = await fetchStatus();
      setStatusItems(Array.isArray(items) ? items : []);
    } catch {
      setStatusItems([{ level: 'error', message: 'Failed to load status information.' }]);
    } finally {
      setStatusLoading(false);
      setStatusLoaded(true);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'status' && !statusLoaded && fetchStatus) {
      loadStatus();
    }
  };

  const errorCount  = statusItems.filter(i => i.level === 'error').length;
  const warnCount   = statusItems.filter(i => i.level === 'warn').length;
  const hasBadge    = (errorCount + warnCount) > 0;

  return (
    <div className={cn('mt-6 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden', className)}>
      {/* Header toggle */}
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={16} className="text-orange-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {title ? `About: ${title}` : 'Page Guide'}
          </span>
          {description && (
            <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">— {description}</span>
          )}
          {hasBadge && (
            <span className={cn(
              'ml-2 text-xs font-bold rounded-full px-2 py-0.5',
              errorCount > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            )}>
              {errorCount > 0 ? `${errorCount} error${errorCount > 1 ? 's' : ''}` : `${warnCount} warning${warnCount > 1 ? 's' : ''}`}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {/* Panel body */}
      {open && (
        <div className="bg-white dark:bg-slate-900">
          {/* Tab bar */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 px-5">
            <button
              onClick={() => handleTabChange('help')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === 'help'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              <BookOpen size={14} />
              How to Use
            </button>
            {fetchStatus && (
              <button
                onClick={() => handleTabChange('status')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === 'status'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                )}
              >
                <AlertTriangle size={14} />
                Status &amp; Issues
                {hasBadge && statusLoaded && (
                  <span className={cn(
                    'ml-1 text-xs font-bold rounded-full px-1.5 py-0.5',
                    errorCount > 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                  )}>
                    {errorCount + warnCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {/* ── How to Use Tab ── */}
            {activeTab === 'help' && (
              <div className="grid md:grid-cols-2 gap-6">
                {steps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Step-by-Step Guide</h4>
                    <ol className="space-y-2">
                      {steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {faqs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Common Questions</h4>
                    <div className="space-y-3">
                      {faqs.map((faq, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Q: {faq.q}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">A: {faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {steps.length === 0 && faqs.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 col-span-2">No guide content configured for this page.</p>
                )}
              </div>
            )}

            {/* ── Status Tab ── */}
            {activeTab === 'status' && fetchStatus && (
              <div>
                {statusLoading ? (
                  <div className="flex items-center gap-2 py-4 text-slate-500 dark:text-slate-400">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Checking system status…</span>
                  </div>
                ) : statusItems.length === 0 ? (
                  <div className="flex items-center gap-2 py-4 text-green-600 dark:text-green-400">
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">Everything looks good — no issues detected.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      {statusItems.length} item{statusItems.length > 1 ? 's' : ''} need{statusItems.length === 1 ? 's' : ''} attention
                    </p>
                    {statusItems.map((item, i) => (
                      <StatusItem key={i} {...item} />
                    ))}
                  </div>
                )}
                {statusLoaded && (
                  <button
                    onClick={() => { setStatusLoaded(false); loadStatus(); }}
                    className="mt-3 text-xs text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                  >
                    ↻ Refresh status
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PageInfoPanel;
