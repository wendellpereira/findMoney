import { useState } from 'react'
import { X, Edit2, AlertCircle, CheckCircle } from 'lucide-react'

interface DescriptionEditModalProps {
  isOpen: boolean
  currentDescription: string
  onClose: () => void
  onSave: (oldDescription: string, newDescription: string) => Promise<void>
}

export const DescriptionEditModal = ({
  isOpen,
  currentDescription,
  onClose,
  onSave
}: DescriptionEditModalProps) => {
  const [newDescription, setNewDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newDescription.trim()) {
      setError('Description cannot be empty')
      return
    }

    if (newDescription.trim() === currentDescription.trim()) {
      setError('New description must be different from current')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)

      await onSave(currentDescription, newDescription.trim())

      setSuccess('Description updated successfully!')

      // Close modal after short delay
      setTimeout(() => {
        setNewDescription('')
        setSuccess(null)
        onClose()
      }, 1500)
    } catch (err) {
      setError((err as Error).message || 'Failed to update description')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setNewDescription('')
      setError(null)
      setSuccess(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Edit2 className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-slate-800">Edit Description</h2>
              <p className="text-sm text-slate-600 mt-1">Update all transactions with this description</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 items-start">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-green-800 text-sm">{success}</div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Current Description
            </label>
            <div className="px-4 py-3 bg-slate-100 rounded-lg border border-slate-200 text-slate-600 text-sm">
              {currentDescription}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="newDescription" className="block text-sm font-semibold text-slate-700 mb-2">
              New Description <span className="text-red-500">*</span>
            </label>
            <input
              id="newDescription"
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder={currentDescription}
              disabled={isSubmitting || !!success}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-2">
              This will update all transactions with the current description to the new one.
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting || !!success}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!success || !newDescription.trim()}
              className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
            >
              <Edit2 size={16} />
              {isSubmitting ? 'Updating...' : 'Update All'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
