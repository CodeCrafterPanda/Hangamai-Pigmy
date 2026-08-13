import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

let cachedFontCss: string | null = null;

async function fontFaceCss(
  moduleId: number,
  family: string,
  weight: number,
): Promise<string | null> {
  try {
    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri) {
      return null;
    }

    const base64 = await new File(uri).base64();
    return `@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${base64}) format('truetype');font-weight:${weight};font-style:normal;}`;
  } catch {
    return null;
  }
}

/**
 * Embeds bundled Roboto for Latin, then falls back to OS Devanagari fonts so
 * Marathi renders in the print WebView without a network request.
 */
export async function getPdfFontCss(): Promise<string> {
  if (cachedFontCss) {
    return cachedFontCss;
  }

  const [regular, bold] = await Promise.all([
    fontFaceCss(require('@/assets/fonts/Roboto-Regular.ttf'), 'PdfSans', 400),
    fontFaceCss(require('@/assets/fonts/Roboto-Bold.ttf'), 'PdfSans', 700),
  ]);

  cachedFontCss = `${regular ?? ''}${bold ?? ''}`;
  return cachedFontCss;
}

export const PDF_FONT_FAMILY =
  "'Kohinoor Devanagari','Devanagari Sangam MN','Noto Sans Devanagari','NotoSansDevanagari-Regular','Nirmala UI','Mangal','PdfSans',sans-serif";
