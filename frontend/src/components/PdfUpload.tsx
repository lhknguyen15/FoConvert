import { useId, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { DEFAULT_MAX_PDF_SIZE_MB } from '../utils/pdfFile'

type PdfUploadProps = {
  onFilesSelected: (files: File[]) => void
  maxFileSizeMb?: number
  disabled?: boolean
}

export default function PdfUpload({
  onFilesSelected,
  maxFileSizeMb = DEFAULT_MAX_PDF_SIZE_MB,
  disabled = false,
}: PdfUploadProps) {
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onFilesSelected(Array.from(event.currentTarget.files ?? []))
    // Allow the same file to be selected again after removal or an error.
    event.currentTarget.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    // Prevent the browser from navigating to the dropped PDF.
    event.preventDefault()
    setIsDragging(false)
    if (disabled) return
    onFilesSelected(Array.from(event.dataTransfer.files))
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return
    }
    setIsDragging(false)
  }

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault()
        if (!disabled && event.dataTransfer.types.includes('Files')) setIsDragging(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = disabled ? 'none' : 'copy'
      }}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl border-2 border-dashed transition-colors focus-within:ring-2 focus-within:ring-secondary focus-within:ring-offset-4 ${
        isDragging
          ? 'border-secondary bg-secondary-soft'
          : 'border-slate-300 bg-slate-50 hover:border-secondary hover:bg-secondary-soft/50'
      }`}
    >
      <input
        id={inputId}
        type="file"
        accept=".pdf,application/pdf"
        aria-label="Chọn file PDF"
        className="sr-only"
        disabled={disabled}
        onChange={handleChange}
      />

      <label
        htmlFor={inputId}
        className={`flex flex-col items-center px-4 py-8 text-center sm:px-6 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-secondary-soft text-secondary">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
            aria-hidden="true"
          >
            <path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4" />
          </svg>
        </span>

        <span className="font-semibold text-slate-800">
          {isDragging ? 'Thả file PDF vào đây' : 'Kéo thả file PDF vào đây'}
        </span>
        <span className="mt-2 text-sm text-slate-500">
          hoặc chọn tài liệu từ máy tính của bạn
        </span>
        <span className="mt-5 rounded-lg bg-primary-hover px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary">
          Chọn file PDF
        </span>
        <span className="mt-4 text-xs text-slate-500">
          Một file PDF · Tối đa {maxFileSizeMb} MB
        </span>
      </label>
    </div>
  )
}
