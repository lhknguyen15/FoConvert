import { formatFileSize } from '../utils/pdfFile'

type SelectedFileCardProps = {
  file: File
  onRemove: () => void
}

export default function SelectedFileCard({
  file,
  onRemove,
}: SelectedFileCardProps) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-red-600">
        PDF
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800" title={file.name}>
          {file.name}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {formatFileSize(file.size)} · Đã chọn
        </p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label="Bỏ file đã chọn"
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-blue-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="size-5"
          aria-hidden="true"
        >
          <path d="m6 6 12 12M6 18 18 6" />
        </svg>
      </button>
    </div>
  )
}
