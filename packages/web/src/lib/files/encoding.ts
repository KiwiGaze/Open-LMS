export async function fileToBase64(file: File): Promise<string> {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.addEventListener('load', () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('File could not be read as a data URL.'));
        return;
      }
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    });
    reader.addEventListener('error', () => {
      reject(reader.error ?? new Error('File read failed.'));
    });
    reader.readAsDataURL(file);
  });
}

const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

export function formatBytes(bytes: number): string {
  if (bytes < KB) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / KB).toFixed(1)} KB`;
  if (bytes < GB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${(bytes / GB).toFixed(2)} GB`;
}

export function fileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0 || dot === filename.length - 1) return '';
  return filename.slice(dot + 1).toLowerCase();
}
