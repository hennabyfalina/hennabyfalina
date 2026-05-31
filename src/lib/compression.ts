// src/lib/compression.ts

import imageCompression from 'browser-image-compression'

export async function compressArtwork(file: File): Promise<{ file: File; size: number }> {
  // Instantly bypass PDF or non-image files
  if (!file.type.startsWith('image/')) {
    return { file, size: file.size }
  }
  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 2, 
      maxWidthOrHeight: 2048, 
      useWebWorker: true,
      preserveExif: false 
    })
    if (compressedFile.size < file.size) {
      return { file: new File([compressedFile], file.name, { type: compressedFile.type }), size: compressedFile.size }
    }
  } catch (error) {
    console.warn('Compression skipped:', error)
  }
  return { file, size: file.size }
}