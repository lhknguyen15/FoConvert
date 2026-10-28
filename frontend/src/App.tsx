import { useEffect, useState } from 'react'
import PdfUpload from './components/PdfUpload'
import SelectedFileCard from './components/SelectedFileCard'
import ComingSoonPage from './pages/ComingSoonPage'
import { validatePdfFile } from './utils/pdfFile'
import { convertPdfToWord, getConversionOptions } from './services/conversionApi'
import type { ConversionMode, ConversionOptions } from './types/conversion'

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<ConversionOptions | null>(null)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [mode, setMode] = useState<ConversionMode>('editable')
  const [isConverting, setIsConverting] = useState(false)
  const [download, setDownload] = useState<{ url: string; fileName: string } | null>(null)
  const [isComingSoon, setIsComingSoon] = useState(false)

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

  if (isComingSoon) {
    return <ComingSoonPage onBack={() => setIsComingSoon(false)} />
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8" aria-label="Điều hướng chính">
          <a href="#top" className="flex items-center gap-3" aria-label="FoConvert trang chủ">
            <img src="/logoFoConvert.svg" alt="FoConvert" className="h-11 w-auto" />
          </a>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsComingSoon(true)} className="cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover">Đăng nhập</button>
          </div>
        </nav>
      </header>

      <main id="top">
        <section id="converter" className="relative overflow-hidden border-b border-slate-200/80 bg-slate-50">
          <div className="pointer-events-none absolute -left-40 -top-40 size-[28rem] rounded-full bg-secondary-soft/70 blur-3xl" />
          <div className="pointer-events-none absolute -right-40 top-20 size-[24rem] rounded-full bg-secondary/10 blur-3xl" />

          <div className="relative mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-primary">Công cụ chuyển đổi PDF sang Word nhanh chóng, rõ ràng và dễ chỉnh sửa ngay trên trình duyệt.</p>
            </div>

            <section className="mx-auto mt-8 w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-7" aria-labelledby="upload-title">
              <div className="mb-5"><h2 id="upload-title" className="text-2xl font-bold tracking-tight text-primary">Chọn file PDF</h2></div>
              <PdfUpload onFilesSelected={handleFilesSelected} maxFileSizeMb={options?.maxFileSizeMb} disabled={isConverting} />

              <aside id="notes" className="mt-5 rounded-2xl border border-secondary-border bg-secondary-soft/70 p-4 text-left" aria-labelledby="notes-title">
                <h3 id="notes-title" className="text-sm font-bold text-primary">Lưu ý khi chuyển đổi</h3>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-600">
                  <li>• Chỉ chọn một file PDF trong mỗi lần chuyển đổi.</li>
                  <li>• File cần nằm trong giới hạn dung lượng được hiển thị.</li>
                  <li>• Tài liệu có bố cục phức tạp có thể cần chỉnh sửa thêm sau khi tải xuống.</li>
                  {options?.isTrial && <li>• Bản dùng thử xử lý tối đa {options.maxPages} trang{options.supportsOcr ? ' và có hỗ trợ OCR.' : '.'}</li>}
                </ul>
              </aside>

              {optionsError && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">{optionsError} Hãy khởi động backend rồi tải lại trang.</p>}
              {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">{error}</p>}

              <div aria-live="polite" aria-atomic="true">{selectedFile && <SelectedFileCard file={selectedFile} onRemove={handleRemoveFile} />}</div>

              {selectedFile && <fieldset disabled={isConverting} className="mt-5 space-y-2 disabled:opacity-60"><legend className="mb-2 text-sm font-semibold text-primary">Ưu tiên khi chuyển đổi</legend><label className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${mode === 'editable' ? 'border-secondary bg-secondary-soft/60' : 'border-slate-200 hover:bg-secondary-soft/40'}`}><input type="radio" name="mode" value="editable" checked={mode === 'editable'} onChange={() => setMode('editable')} className="mt-1 accent-secondary" /><span><span className="block text-sm font-semibold text-primary">Dễ chỉnh sửa</span><span className="text-xs text-slate-500">Ưu tiên văn bản và luồng nội dung.</span></span></label><label className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${mode === 'layout' ? 'border-secondary bg-secondary-soft/60' : 'border-slate-200 hover:bg-secondary-soft/40'}`}><input type="radio" name="mode" value="layout" checked={mode === 'layout'} onChange={() => setMode('layout')} className="mt-1 accent-secondary" /><span><span className="block text-sm font-semibold text-primary">Giữ bố cục</span><span className="text-xs text-slate-500">Ưu tiên vị trí các thành phần trên trang.</span></span></label></fieldset>}

              {selectedFile && <button type="button" onClick={handleConvert} disabled={isConverting || !options} className="mt-5 flex w-full cursor-pointer items-center justify-center rounded-xl bg-primary-hover px-5 py-3.5 font-semibold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">{isConverting ? 'Đang chuyển đổi…' : 'Chuyển đổi sang Word'}</button>}
              {download && <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-900">Chuyển đổi thành công</p><a href={download.url} download={download.fileName} className="mt-2 inline-block text-sm font-semibold text-emerald-800 underline underline-offset-2">Tải {download.fileName}</a></div>}
            </section>
          </div>
        </section>

      </main>

      <footer className="bg-primary text-secondary-soft"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8"><div><div className="flex items-center gap-3"><span className="font-bold text-white">FoConvert</span></div><p className="mt-4 max-w-xs text-sm font-bold leading-relaxed text-secondary-soft/75">Công cụ chuyển đổi tài liệu đơn giản, rõ ràng và hữu ích cho công việc hằng ngày.</p></div><div><h3 className="text-sm font-semibold text-white">Sản phẩm</h3><div className="mt-4 space-y-3 text-sm text-secondary-soft/75"><a href="#converter" className="block hover:text-white">PDF sang Word</a><a href="#notes" className="block hover:text-white">Lưu ý</a></div></div><div><h3 className="text-sm font-semibold text-white">Hỗ trợ</h3><div className="mt-4 space-y-3 text-sm text-secondary-soft/75"><a href="#notes" className="block hover:text-white">Hướng dẫn</a><a href="mailto:support@foconvert.app" className="block hover:text-white">Liên hệ</a></div></div><div><h3 className="text-sm font-semibold text-white">Tài khoản</h3><div className="mt-4 space-y-3 text-sm text-secondary-soft/75"><button type="button" onClick={() => setIsComingSoon(true)} className="block cursor-pointer hover:text-white">Đăng nhập</button><button type="button" onClick={() => setIsComingSoon(true)} className="block cursor-pointer hover:text-white">Đăng ký</button></div></div></div><div className="border-t border-secondary-soft/20"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-secondary-soft/60 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>© 2026 FoConvert. All rights reserved.</span><span>Được xây dựng với React và .NET.</span></div></div></footer>
    </div>
  )
}
