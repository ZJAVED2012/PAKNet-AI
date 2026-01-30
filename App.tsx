
import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  FileText, 
  Download, 
  Printer, 
  History, 
  Search,
  ChevronRight,
  Zap,
  LayoutDashboard,
  Settings,
  AlertCircle,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { generateBlueprint } from './geminiService';
import { Blueprint } from './types';

// Improved component for Markdown rendering with code block support
const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentCodeBlock: string[] = [];
  let isCodeBlock = false;

  lines.forEach((line, i) => {
    // Handle code block start/end
    if (line.trim().startsWith('```')) {
      if (isCodeBlock) {
        // Closing the code block
        elements.push(
          <div key={`code-container-${i}`} className="relative group my-6">
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded">CLI / SCRIPT</span>
            </div>
            <pre className="bg-slate-900 text-blue-50 p-6 font-mono text-sm rounded-xl border border-slate-700 overflow-x-auto shadow-2xl leading-relaxed whitespace-pre">
              {currentCodeBlock.join('\n')}
            </pre>
          </div>
        );
        currentCodeBlock = [];
        isCodeBlock = false;
      } else {
        // Starting a new code block
        isCodeBlock = true;
      }
      return;
    }

    if (isCodeBlock) {
      currentCodeBlock.push(line);
      return;
    }

    // Standard markdown element handling
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-3xl font-bold text-slate-900 border-b-2 border-slate-100 pb-4 mb-8 mt-12 first:mt-0">{line.substring(2)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-2xl font-bold text-slate-800 mt-10 mb-6 flex items-center gap-3"><div className="w-2 h-8 bg-blue-600 rounded-full"></div>{line.substring(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-xl font-semibold text-slate-800 mt-8 mb-4 border-l-4 border-blue-200 pl-4">{line.substring(4)}</h3>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={i} className="ml-6 list-disc marker:text-blue-500 py-1.5 text-slate-700 leading-relaxed">{line.substring(2)}</li>);
    } else if (line.match(/^\d+\./)) {
      elements.push(<li key={i} className="ml-6 list-decimal marker:text-blue-500 py-1.5 text-slate-700 leading-relaxed font-medium">{line.replace(/^\d+\.\s+/, '')}</li>);
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-4"></div>);
    } else {
      // Basic paragraph with bold support
      const formattedText = line.split(/(\*\*.*?\*\*)/).map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      elements.push(<p key={i} className="leading-relaxed mb-4 text-slate-700 text-base">{formattedText}</p>);
    }
  });

  return <div className="prose prose-slate max-w-none">{elements}</div>;
};

const App: React.FC = () => {
  const [deviceModel, setDeviceModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentBlueprint, setCurrentBlueprint] = useState<Blueprint | null>(null);
  const [history, setHistory] = useState<Blueprint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('paknet_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  const saveToHistory = (blueprint: Blueprint) => {
    const newHistory = [blueprint, ...history.filter(h => h.deviceModel !== blueprint.deviceModel).slice(0, 9)];
    setHistory(newHistory);
    localStorage.setItem('paknet_history', JSON.stringify(newHistory));
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!deviceModel.trim()) return;

    setLoading(true);
    setError(null);
    setCurrentBlueprint(null);

    try {
      const content = await generateBlueprint(deviceModel);
      const newBlueprint: Blueprint = {
        id: crypto.randomUUID(),
        deviceModel: deviceModel,
        content: content,
        timestamp: Date.now()
      };
      setCurrentBlueprint(newBlueprint);
      saveToHistory(newBlueprint);
      
      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (currentBlueprint) {
      navigator.clipboard.writeText(currentBlueprint.content);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 no-print">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-inner">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">PakNet AI Orchestrator</h1>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Enterprise Deployment Engine</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-6 text-sm font-medium">
            <button onClick={() => { setCurrentBlueprint(null); setDeviceModel(''); }} className="text-blue-400 border-b-2 border-blue-400 pb-1">Blueprint Generator</button>
            <a href="#" className="hover:text-blue-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Compliance</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
                SA
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero / Input Section */}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        <section className="mb-12 no-print">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-2xl">
                <Server className="w-10 h-10 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900">Strategic Infrastructure Planning</h2>
                <p className="text-slate-500 mt-1">Input your device model below to generate a vendor-certified, security-hardened deployment blueprint.</p>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  placeholder="e.g. Cisco Catalyst 9200, Fortigate 100F, Palo Alto PA-440..." 
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm font-medium"
                />
              </div>
              <button 
                type="submit"
                disabled={loading || !deviceModel.trim()}
                className={`px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                  loading || !deviceModel.trim() 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Orchestrating...
                  </>
                ) : (
                  <>
                    Generate Blueprint
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold">System Error</p>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Loading State Skeleton */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200 animate-pulse no-print">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6"></div>
              <div className="h-32 bg-slate-100 rounded w-full mt-8"></div>
              <div className="h-4 bg-slate-100 rounded w-2/3"></div>
            </div>
            <div className="mt-12 text-center text-slate-400 text-sm">
              Analyzing model capabilities and aligning with NIST frameworks...
            </div>
          </div>
        )}

        {/* Blueprint Result View */}
        {currentBlueprint && !loading && (
          <div ref={resultsRef} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <History className="w-4 h-4" />
                <span>Generated {new Date(currentBlueprint.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleCopy}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium text-sm"
                >
                  {copying ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copying ? 'Copied' : 'Copy MD'}
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium text-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print / PDF
                </button>
                <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm">
                  <Download className="w-4 h-4" />
                  Export Blueprint
                </button>
              </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              <div className="bg-slate-900 px-8 py-6 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600/20 rounded-xl">
                    <ShieldCheck className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">{currentBlueprint.deviceModel}</h3>
                    <p className="text-slate-400 text-sm font-mono uppercase tracking-widest">Blueprint Rev 2.0</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 text-xs font-bold uppercase tracking-widest">
                  Validated Blueprint
                </div>
              </div>
              <div className="p-8 md:p-12 bg-white">
                <MarkdownContent content={currentBlueprint.content} />
              </div>
            </div>
            
            {/* Footer / Disclaimer */}
            <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 text-slate-500 text-sm text-center">
              <p>This document is an AI-generated professional consultancy report by PakNet AI Orchestrator. Final configuration verification by a certified human engineer is mandatory before production deployment.</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest">Compliance: ISO 27001, NIST SP 800-53, GDPR-PK.</p>
            </div>
          </div>
        )}

        {/* Recent Activity Sidebar / Section */}
        {!currentBlueprint && !loading && history.length > 0 && (
          <section className="mt-12 no-print">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              Recent Orchestrations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => {
                    setCurrentBlueprint(item);
                    setDeviceModel(item.deviceModel);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{item.deviceModel}</h4>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2">Complete enterprise deployment blueprint including security hardening and automation scripts.</p>
                  <div className="mt-4 flex items-center text-blue-600 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    View Blueprint <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!currentBlueprint && !loading && history.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
              <LayoutDashboard className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Your Orchestration Hub is Empty</h3>
            <p className="text-slate-500 max-w-md mx-auto mt-2">Enter a device model above to generate your first professional deployment blueprint and configuration report.</p>
          </div>
        )}
      </main>

      {/* App Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 no-print">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="max-w-sm">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-lg text-slate-900">PakNet AI</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Empowering network engineering in Pakistan through advanced AI-driven infrastructure automation and strategic security hardening services.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
              <div>
                <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Solutions</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="#" className="hover:text-blue-600">Enterprise Core</a></li>
                  <li><a href="#" className="hover:text-blue-600">SD-WAN Design</a></li>
                  <li><a href="#" className="hover:text-blue-600">Security Audit</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Frameworks</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="#" className="hover:text-blue-600">NIST 800-53</a></li>
                  <li><a href="#" className="hover:text-blue-600">ISO 27001</a></li>
                  <li><a href="#" className="hover:text-blue-600">CIS Benchmarks</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Support</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="#" className="hover:text-blue-600">Help Center</a></li>
                  <li><a href="#" className="hover:text-blue-600">API Docs</a></li>
                  <li><a href="#" className="hover:text-blue-600">Legal</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-medium">
            <p>© {new Date().getFullYear()} PakNet AI Orchestrator. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-slate-600">Terms of Service</a>
              <a href="#" className="hover:text-slate-600">Privacy Policy</a>
              <a href="#" className="hover:text-slate-600">SLA</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
