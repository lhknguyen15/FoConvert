export type ConversionMode = 'editable' | 'layout'

export type ConversionOptions = {
  maxFileSizeMb: number
  inputExtension: string
  outputExtension: string
  engine: string
  isTrial: boolean
  maxPages: number
  supportsOcr: boolean
}

export type ConversionResult = { blob: Blob; fileName: string }
