import { useEffect, useState } from 'react'
import PdfUpload from './components/PdfUpload'
import SelectedFileCard from './components/SelectedFileCard'
import { validatePdfFile } from './utils/pdfFile'
import { convertPdfToWord, getConversionOptions } from './services/conversionApi'
import type { ConversionMode, ConversionOptions } from './types/conversion'

export default function App() {
  // App owns the selected file so other features can use it later.
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<ConversionOptions | null>(null)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [mode, setMode] = useState<ConversionMode>('editable')
  const [isConverting, setIsConverting] = useState(false)
  const [download, setDownload] = useState<{ url: string; fileName: string } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    getConversionOptions(controller.signal)
      .then(setOptions)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setOptionsError(cause instanceof Error ? cause.message : 'Không thể kết nối máy chủ.')
        }
      })
    return () => controller.abort()
  }, [])

  useEffect(() => () => {
    if (download) URL.revokeObjectURL(download.url)
  }, [download])

  function handleFilesSelected(files: File[]) {
    // An empty selection means the user cancelled the file picker.
    if (files.length === 0) return

    setError(null)
    setSelectedFile(null)

    if (files.length !== 1) {
      setError('Vui lòng chọn một file PDF mỗi lần.')
      return
    }

    const file = files[0]
    const validationError = validatePdfFile(file, options?.maxFileSizeMb)

    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setDownload((current) => {
      if (current) URL.revokeObjectURL(current.url)
      return null
    })
  }

  function handleRemoveFile() {
    setSelectedFile(null)
    setError(null)
    setDownload((current) => {
      if (current) URL.revokeObjectURL(current.url)
      return null
    })
  }

  async function handleConvert() {
    if (!selectedFile || isConverting) return
    setError(null)
    setDownload((current) => {
      if (current) URL.revokeObjectURL(current.url)
      return null
    })
    setIsConverting(true)
    try {
      const result = await convertPdfToWord(selectedFile, mode)
      setDownload({ url: URL.createObjectURL(result.blob), fileName: result.fileName })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Đã xảy ra lỗi khi chuyển đổi.')
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          PDF → Word
        </span>

        <h1 className="mt-5 text-4xl font-bold text-slate-900">FoConvert</h1>

        <p className="mt-4 leading-relaxed text-slate-600">
          Chuyển tài liệu PDF thành file Word có thể chỉnh sửa.
        </p>

        <div className="mt-8">
          <PdfUpload
            onFilesSelected={handleFilesSelected}
            maxFileSizeMb={options?.maxFileSizeMb}
            disabled={isConverting}
          />
        </div>

        {optionsError && (
          <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {optionsError} Hãy khởi động backend rồi tải lại trang.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700"
          >
            {error}
          </p>
        )}

        <div aria-live="polite" aria-atomic="true">
          {selectedFile && (
            <SelectedFileCard
              file={selectedFile}
              onRemove={handleRemoveFile}
            />
          )}
        </div>

        {selectedFile && (
          <fieldset disabled={isConverting} className="mt-5 space-y-2 disabled:opacity-60">
            <legend className="mb-2 text-sm font-semibold text-slate-800">Ưu tiên khi chuyển đổi</legend>
            <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
              <input type="radio" name="mode" value="editable" checked={mode === 'editable'} onChange={() => setMode('editable')} className="mt-1 accent-blue-600" />
              <span><span className="block text-sm font-medium text-slate-800">Dễ chỉnh sửa</span><span className="text-xs text-slate-500">Ưu tiên văn bản và luồng nội dung.</span></span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
              <input type="radio" name="mode" value="layout" checked={mode === 'layout'} onChange={() => setMode('layout')} className="mt-1 accent-blue-600" />
              <span><span className="block text-sm font-medium text-slate-800">Giữ bố cục</span><span className="text-xs text-slate-500">Ưu tiên vị trí các thành phần trên trang.</span></span>
            </label>
          </fieldset>
        )}

        {options?.isTrial && (
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Bản dùng thử xử lý tối đa {options.maxPages} trang và có thể thêm watermark. OCR: {options.supportsOcr ? 'có' : 'chưa hỗ trợ'}.
          </p>
        )}

        {selectedFile && (
          <button type="button" onClick={handleConvert} disabled={isConverting || !options}
            className="mt-5 flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400">
            {isConverting ? 'Đang chuyển đổi…' : 'Chuyển đổi sang Word'}
          </button>
        )}

        {download && (
          <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">Chuyển đổi thành công</p>
            <a href={download.url} download={download.fileName} className="mt-2 inline-block text-sm font-semibold text-emerald-800 underline underline-offset-2">Tải {download.fileName}</a>
          </div>
        )}

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
          File chỉ được gửi lên backend khi bạn nhấn nút chuyển đổi.
        </p>
      </section>
    </main>
  )
}
