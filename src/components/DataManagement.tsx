import { useState } from 'react';
import { Download, FileUp } from 'lucide-react';
import { Statement, ExportData } from '../types';

interface DataManagementProps {
  statements: Statement[];
  onExportData: () => Promise<ExportData>;
}

export const DataManagement = ({ statements, onExportData }: DataManagementProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      const exportData = await onExportData();

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
    } catch (error) {
      alert('Error exporting data: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
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
          <p className="text-sm text-slate-600">Export data or upload statements</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleExport} 
            disabled={isProcessing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isProcessing 
                ? 'bg-slate-300 text-slate-500' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <Download size={18} />
            <span className="font-medium">{isProcessing ? 'Exporting...' : 'Export Data'}</span>
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
          {statements.map((stmt) => (
            <div key={stmt.id} className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <div className="text-sm font-medium text-slate-800">{stmt.institution} - {stmt.month}</div>
              <div className="text-xs text-slate-600">
                {stmt.actual_transaction_count || stmt.transaction_count} transactions
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
