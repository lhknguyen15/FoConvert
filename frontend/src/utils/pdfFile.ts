export const DEFAULT_MAX_PDF_SIZE_MB = 20

// These checks improve the user experience. The backend must validate uploads too.
export function validatePdfFile(file: File, maxSizeMb = DEFAULT_MAX_PDF_SIZE_MB): string | null {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return 'Chỉ hỗ trợ file có đuôi .pdf. Vui lòng chọn lại.'
  }

  if (file.size === 0) {
    return 'File đang trống. Vui lòng chọn một file PDF khác.'
  }

  if (file.size > maxSizeMb * 1024 * 1024) {
    return `File vượt quá ${maxSizeMb} MB. Vui lòng chọn file nhỏ hơn.`
  }

  return null
}

export function formatFileSize(bytes: number): string {
  const numberFormat = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 1,
  })

  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${numberFormat.format(bytes / 1024)} KB`

  return `${numberFormat.format(bytes / (1024 * 1024))} MB`
}
