'use client'

type DeleteJobModalProps = {
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteJobModal({ isDeleting, onCancel, onConfirm }: DeleteJobModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Delete Job</h2>
        <p className="text-sm text-slate-500 mt-2">Are you sure you want to delete this job?</p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="text-sm font-medium px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
