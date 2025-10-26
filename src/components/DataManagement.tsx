import { useState } from 'react'
import { Download, FileUp, Zap, Brain } from 'lucide-react'
import { Statement, ExportData } from '../types'
import { DeduplicationModal } from './DeduplicationModal'
import { MLDeduplicationModal } from './MLDeduplicationModal'

interface DataManagementProps {
  statements: Statement[];
  onExportData: () => Promise<ExportData>;
  onStatementsUpdated?: () => void;
}

interface UploadProgress {
  current: number
  total: number
  fileName: string
  status: 'uploading' | 'success' | 'error'
  message?: string
}

export const DataManagement = ({ statements, onExportData, onStatementsUpdated }: DataManagementProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [isDeduplicationModalOpen, setIsDeduplicationModalOpen] = useState(false)
  const [isMLDeduplicationModalOpen, setIsMLDeduplicationModalOpen] = useState(false)

  const handleExport = async () => {
    try {
      setIsProcessing(true)
      const exportData = await onExportData()

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'spending-data-' + exportData.exportDate + '.json'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Error exporting data: ' + (error as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      setIsProcessing(true)
      setUploadMessage(null)
      setUploadProgress(null)

      const fileArray = Array.from(files)
      let successCount = 0
      let errorCount = 0
      let totalTransactions = 0
      const errors: string[] = []

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]

        // Update progress
        setUploadProgress({
          current: i + 1,
          total: fileArray.length,
          fileName: file.name,
          status: 'uploading'
        })

        try {
          // Create FormData and append the PDF file
          const formData = new FormData()
          formData.append('file', file)

          // Send to backend API
          const response = await fetch('/api/pdf-upload', {
            method: 'POST',
            body: formData
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(`${data.error}${data.details ? ' - ' + data.details : ''}` || 'Failed to upload PDF')
          }

          // Track success
          successCount++
          totalTransactions += data.statement.transactionCount

          // Update progress to success
          setUploadProgress({
            current: i + 1,
            total: fileArray.length,
            fileName: file.name,
            status: 'success',
            message: `${data.statement.transactionCount} transactions`
          })
        } catch (error) {
          errorCount++
          const errorMsg = (error as Error).message
          errors.push(`${file.name}: ${errorMsg}`)

          // Update progress to error
          setUploadProgress({
            current: i + 1,
            total: fileArray.length,
            fileName: file.name,
            status: 'error',
            message: errorMsg
          })
        }

        // Small delay between uploads to avoid overwhelming the server
        if (i < fileArray.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      // Show final summary message
      if (errorCount === 0) {
        setUploadMessage({
          type: 'success',
          text: `✓ Successfully uploaded ${successCount} file${successCount !== 1 ? 's' : ''} (${totalTransactions} total transactions imported)`
        })
      } else if (successCount === 0) {
        setUploadMessage({
          type: 'error',
          text: `✕ Failed to upload ${errorCount} file${errorCount !== 1 ? 's' : ''}`
        })
      } else {
        setUploadMessage({
          type: 'error',
          text: `⚠️ Uploaded ${successCount} file${successCount !== 1 ? 's' : ''} (${totalTransactions} transactions), but ${errorCount} file${errorCount !== 1 ? 's' : ''} failed`
        })
      }

      // Refresh statements list
      if (onStatementsUpdated) {
        onStatementsUpdated()
      }

      // Clear progress and message after a few seconds
      setTimeout(() => {
        setUploadProgress(null)
        setUploadMessage(null)
      }, 5000)
    } catch (error) {
      setUploadMessage({
        type: 'error',
        text: `Error: ${(error as Error).message}`
      })
    } finally {
      setIsProcessing(false)
      event.target.value = ''
    }
  }

  const handleDeduplication = async (fixes: Array<{ groupId: string; canonicalMerchant: string; transactionIds: string[] }>) => {
    try {
      const response = await fetch('/api/admin/deduplicate-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fix',
          fixes
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deduplicate')
      }

      setUploadMessage({
        type: 'success',
        text: `✓ Deduplicated ${data.summary.transactionsDeleted} transactions`
      })

      // Refresh statements list
      if (onStatementsUpdated) {
        onStatementsUpdated()
      }

      // Clear message after 5 seconds
      setTimeout(() => setUploadMessage(null), 5000)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

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

          <button
            onClick={() => setIsDeduplicationModalOpen(true)}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isProcessing
                ? 'bg-slate-300 text-slate-500'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            }`}
          >
            <Zap size={18} />
            <span className="font-medium">Deduplicate</span>
          </button>

          <button
            onClick={() => setIsMLDeduplicationModalOpen(true)}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isProcessing
                ? 'bg-slate-300 text-slate-500'
                : 'bg-indigo-500 text-white hover:bg-indigo-600'
            }`}
          >
            <Brain size={18} />
            <span className="font-medium">ML Dedup</span>
          </button>

          <label className="cursor-pointer">
            <input type="file" accept=".pdf" multiple onChange={handlePDFUpload} className="hidden" disabled={isProcessing} />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isProcessing ? 'bg-slate-300 text-slate-500' : 'bg-purple-500 text-white hover:bg-purple-600'}`}>
              <FileUp size={18} />
              <span className="font-medium">{isProcessing ? 'Processing...' : 'Upload PDFs'}</span>
            </div>
          </label>
        </div>
      </div>

      {uploadProgress && (
        <div className={`mb-4 p-4 rounded-lg border ${
          uploadProgress.status === 'uploading'
            ? 'bg-blue-50 border-blue-200'
            : uploadProgress.status === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`text-sm font-semibold ${
              uploadProgress.status === 'uploading'
                ? 'text-blue-800'
                : uploadProgress.status === 'success'
                  ? 'text-green-800'
                  : 'text-red-800'
            }`}>
              {uploadProgress.status === 'uploading' ? '⟳' : uploadProgress.status === 'success' ? '✓' : '✕'}
              <span className="ml-2">{uploadProgress.current}/{uploadProgress.total}</span>
            </div>
            <div className="flex-1 text-sm text-slate-700">
              <span className="font-medium">{uploadProgress.fileName}</span>
              {uploadProgress.message && <span className="text-slate-600"> ({uploadProgress.message})</span>}
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                uploadProgress.status === 'uploading'
                  ? 'bg-blue-500'
                  : uploadProgress.status === 'success'
                    ? 'bg-green-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {uploadMessage && (
        <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
          uploadMessage.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span className="text-lg flex-shrink-0">{uploadMessage.type === 'success' ? '✓' : '✕'}</span>
          <span className="text-sm">{uploadMessage.text}</span>
        </div>
      )}

      <div className="pt-4 border-t border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Uploaded Statements</h3>
        <div className="flex flex-wrap gap-2">
          {statements.length === 0 ? (
            <p className="text-sm text-slate-500">No statements uploaded yet. Upload a PDF to get started.</p>
          ) : (
            statements.map((stmt) => (
              <div key={stmt.id} className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <div className="text-sm font-medium text-slate-800">{stmt.institution} - {stmt.month} {stmt.revision_number !== 0 ? ` - v${stmt.revision_number}` : null}</div>
                <div className="text-xs text-slate-600">
                  {stmt.actual_transaction_count || stmt.transaction_count} transactions
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <DeduplicationModal
        isOpen={isDeduplicationModalOpen}
        onClose={() => setIsDeduplicationModalOpen(false)}
        onDeduplicate={handleDeduplication}
      />

      <MLDeduplicationModal
        isOpen={isMLDeduplicationModalOpen}
        onClose={() => setIsMLDeduplicationModalOpen(false)}
      />
    </div>
  )
}
