import React, { useState } from 'react';
import { 
  Code2, Copy, Check, FileCode 
} from 'lucide-react';
import { SOURCE_FILES } from '../data/sourceCodeSnippets';

export const SourceCodeViewer: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>('pso_hybrid');
  const [copied, setCopied] = useState<boolean>(false);

  const currentFile = SOURCE_FILES.find(f => f.id === selectedFileId) || SOURCE_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="source-code" className="py-16 px-4 relative border-t border-[#1C3150]/60 bg-[#050912]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1.5 shadow-sm shadow-cyan-500/10">
            <Code2 className="w-3.5 h-3.5" />
            Repository Algorithm Implementation
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-3 font-mono tracking-tight">
            Source Code &amp; Module Explorer
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Inspect the underlying Python simulation modules, neural network classifiers, and metaheuristic optimization algorithms without modifying source code.
          </p>
        </div>

        <div className="bg-[#0D1626] rounded-3xl border border-[#1C3150] shadow-2xl shadow-cyan-950/20 overflow-hidden font-mono">
          <div className="bg-[#070B14] p-3 sm:p-4 border-b border-[#1C3150] flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap gap-1.5 overflow-x-auto">
              {SOURCE_FILES.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition-all ${
                    selectedFileId === file.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#0B1220] border border-transparent'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{file.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-[#0B1220] hover:bg-cyan-500/15 text-slate-300 hover:text-cyan-300 border border-[#1C3150] hover:border-cyan-500/40 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>
          </div>

          <div className="bg-[#090F1C] px-5 py-3 border-b border-[#1C3150]/60 flex flex-wrap justify-between items-center text-xs text-slate-400 gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-cyan-400 font-bold">Path:</span>
              <span className="text-slate-200">{currentFile.path}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                {currentFile.category}
              </span>
              <span className="text-slate-500">Python 3.10+</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-[#060A14] overflow-x-auto max-h-[520px] text-xs leading-relaxed">
            <pre className="text-slate-300 font-mono">
              <code>
                {currentFile.code.split('\n').map((line, idx) => (
                  <div key={idx} className="table-row hover:bg-cyan-500/5">
                    <span className="table-cell pr-6 text-slate-600 select-none text-right font-mono text-[11px] w-8">
                      {idx + 1}
                    </span>
                    <span className="table-cell">{line || ' '}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};
