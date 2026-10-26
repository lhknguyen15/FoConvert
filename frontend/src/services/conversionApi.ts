import type { ConversionMode, ConversionOptions, ConversionResult } from '../types/conversion'

type ProblemDetails = { detail?: string; title?: string }

export async function getConversionOptions(signal?: AbortSignal): Promise<ConversionOptions> {
  const response = await fetch('/api/conversion-options', { signal })
  if (!response.ok) throw new Error('Không thể tải cấu hình chuyển đổi từ máy chủ.')
  return (await response.json()) as ConversionOptions
}

export async function convertPdfToWord(
  file: File,
  mode: ConversionMode,
  signal?: AbortSignal,
): Promise<ConversionResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('mode', mode)
  // fetch tự thêm multipart boundary; đặt Content-Type thủ công sẽ làm hỏng upload.
  const response = await fetch('/api/convert/pdf-to-word', { method: 'POST', body: form, signal })
  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as ProblemDetails
    throw new Error(problem.detail ?? problem.title ?? 'Không thể chuyển đổi file PDF.')
  }
  return {
    blob: await response.blob(),
    fileName: getDownloadFileName(response.headers.get('Content-Disposition'), file.name),
  }
}

function getDownloadFileName(contentDisposition: string | null, sourceName: string): string {
  const utf8Name = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const quotedName = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1]
  const encoded = utf8Name ?? quotedName
  if (encoded) {
    try { return decodeURIComponent(encoded) } catch { return encoded }
  }
  return `${sourceName.replace(/\.pdf$/i, '')}.docx`
}
