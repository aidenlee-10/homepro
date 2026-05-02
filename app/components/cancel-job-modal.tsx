'use client'

type CancelJobModalProps = {
  isCancelling: boolean
  onDismiss: () => void
  onConfirmCancel: () => void
}

export function CancelJobModal({ isCancelling, onDismiss, onConfirmCancel }: CancelJobModalProps) {
  return (
    <div className="hp-animate-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-[2px]">
      <div className="hp-animate-modal-panel w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Cancel job</h2>
        <p className="mt-2 text-sm font-medium text-slate-400 transition-colors duration-200">
          Are you sure you want to cancel this job?
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onDismiss}
            disabled={isCancelling}
            className="hp-btn-secondary rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50"
          >
            Keep Job
          </button>
          <button
            type="button"
            onClick={onConfirmCancel}
            disabled={isCancelling}
            className="hp-btn-danger rounded-xl px-4 py-2 text-sm transition-[transform,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-50"
          >
            {isCancelling ? 'Cancelling…' : 'Cancel Job'}
          </button>
        </div>
      </div>
    </div>
  )
}
