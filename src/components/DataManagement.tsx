import { useState } from 'react';
import { Upload, Download, FileUp } from 'lucide-react';
import { Statement, ExportData } from '../types';

interface DataManagementProps {
  statements: Statement[];
  categoryRules: Record<string, string>;
  transactions: any[];
  onImportRules: (rules: Record<string, string>) => void;
}

export const DataManagement = ({ statements, categoryRules, transactions, onImportRules }: DataManagementProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = () => {
    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString().split('T')[0],
      categoryRules,
      transactions,
      statements
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'spending-data-' + exportData.exportDate + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportRules = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') return;
        
        const importedData = JSON.parse(result);
        
        if (importedData.categoryRules) {
          onImportRules(importedData.categoryRules);
          alert('Category rules imported successfully!');
        }
      } catch (error) {
        alert('Error importing file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handlePDFUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    setTimeout(() => {
      alert('PDF upload ready! Use Import Rules to load saved data for now.');
      setIsProcessing(false);
      event.target.value = '';
    }, 500);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Data Management</h2>
          <p className="text-sm text-slate-600">Import rules, export data, or upload statements</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="cursor-pointer">
            <input type="file" accept=".json" onChange={handleImportRules} className="hidden" />
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              <Upload size={18} />
              <span className="font-medium">Import Rules</span>
            </div>
          </label>
          
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <Download size={18} />
            <span className="font-medium">Export Data</span>
          </button>
          
          <label className="cursor-pointer">
            <input type="file" accept=".pdf" onChange={handlePDFUpload} className="hidden" disabled={isProcessing} />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isProcessing ? 'bg-slate-300 text-slate-500' : 'bg-purple-500 text-white hover:bg-purple-600'}`}>
              <FileUp size={18} />
              <span className="font-medium">{isProcessing ? 'Processing...' : 'Upload PDF'}</span>
            </div>
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Uploaded Statements</h3>
        <div className="flex flex-wrap gap-2">
          {statements.map((stmt, idx) => (
            <div key={idx} className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <div className="text-sm font-medium text-slate-800">{stmt.institution} - {stmt.month}</div>
              <div className="text-xs text-slate-600">{stmt.transactionCount} transactions</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
