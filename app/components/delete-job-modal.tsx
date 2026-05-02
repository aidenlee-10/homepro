'use client'

type DeleteJobModalProps = {
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteJobModal({ isDeleting, onCancel, onConfirm }: DeleteJobModalProps) {
  return (
    <div className="hp-animate-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-[2px]">
      <div className="hp-animate-modal-panel w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-900">Delete job</h2>
        <p className="mt-2 text-sm font-medium text-slate-400">Are you sure you want to delete this job? This cannot be undone.</p>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="hp-btn-secondary text-sm font-medium px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="hp-btn-danger rounded-xl px-4 py-2 text-sm"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
