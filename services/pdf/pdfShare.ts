import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Directory, File } from 'expo-file-system';
import { isAndroid, isWeb } from '@/utils/deviceInfo';
import { PdfShareUnavailableError, type GeneratedPdf, type SavePdfResult } from './pdfTypes';

function stripPdfExtension(fileName: string): string {
  return fileName.replace(/\.pdf$/i, '');
}

export async function previewPdf(pdf: GeneratedPdf): Promise<void> {
  if (!pdf.uri) {
    return;
  }

  try {
    await Print.printAsync({ uri: pdf.uri });
  } catch {
    // iOS rejects when the preview is dismissed without printing.
  }
}

export async function sharePdf(pdf: GeneratedPdf, dialogTitle: string): Promise<void> {
  if (!pdf.uri) {
    throw new PdfShareUnavailableError(dialogTitle);
  }

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new PdfShareUnavailableError(dialogTitle);
  }

  await Sharing.shareAsync(pdf.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle,
  });
}

/**
 * Lets the user pick a folder (Storage Access Framework on Android, Files on iOS)
 * and copies the already-generated PDF there. Does not request broad storage
 * permissions.
 */
export async function savePdf(pdf: GeneratedPdf): Promise<SavePdfResult> {
  if (isWeb || !pdf.uri) {
    throw new Error('PDF_SAVE_UNAVAILABLE');
  }

  let directory: Directory;
  try {
    const picked = await Directory.pickDirectoryAsync();
    directory = new Directory(picked.uri);
  } catch {
    return 'cancelled';
  }

  const source = new File(pdf.uri);
  if (!source.exists) {
    throw new Error('PDF_SOURCE_MISSING');
  }

  const uniqueName = nextAvailableName(directory, pdf.fileName);
  const destination = new File(directory, uniqueName);

  try {
    source.copy(destination);
    return 'saved';
  } catch {
    // SAF content directories sometimes reject File.copy; write base64 instead.
    const created = isAndroid
      ? directory.createFile(stripPdfExtension(uniqueName), 'application/pdf')
      : destination;

    if (!created.exists) {
      created.create({ overwrite: true, intermediates: true });
    }

    created.write(await source.base64(), { encoding: 'base64' });
    return 'saved';
  }
}

function nextAvailableName(directory: Directory, fileName: string): string {
  const candidate = new File(directory, fileName);
  if (!candidate.exists) {
    return fileName;
  }

  const stem = stripPdfExtension(fileName);
  let attempt = 2;
  while (attempt < 50) {
    const nextName = `${stem}_${attempt}.pdf`;
    if (!new File(directory, nextName).exists) {
      return nextName;
    }
    attempt += 1;
  }

  return `${stem}_${Date.now()}.pdf`;
}
