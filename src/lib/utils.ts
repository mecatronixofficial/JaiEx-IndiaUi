export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export function formatRelative(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (secs < 60) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getFileIcon(mime: string, ext: string): string {
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.startsWith('video/')) return '🎬';
  if (mime.startsWith('audio/')) return '🎵';
  if (mime === 'application/pdf') return '📄';
  if (mime.includes('word') || ext === 'doc' || ext === 'docx') return '📝';
  if (mime.includes('excel') || ext === 'xls' || ext === 'xlsx') return '📊';
  if (mime.includes('powerpoint') || ext === 'ppt' || ext === 'pptx') return '📋';
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar')) return '📦';
  if (mime.includes('text/') || ['js','ts','jsx','tsx','py','go','rs','java','cpp','c','html','css','json'].includes(ext)) return '💻';
  return '📁';
}

export function getFileColorClass(mime: string): string {
  if (mime.startsWith('image/')) return 'ft-image';
  if (mime.startsWith('video/')) return 'ft-video';
  if (mime.startsWith('audio/')) return 'ft-audio';
  if (mime === 'application/pdf') return 'ft-pdf';
  if (mime.includes('zip') || mime.includes('rar')) return 'ft-zip';
  if (mime.includes('text/') || mime.includes('javascript') || mime.includes('json')) return 'ft-code';
  return 'ft-default';
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  const ext = str.lastIndexOf('.');
  if (ext > 0 && str.length - ext <= 6) {
    const name = str.slice(0, ext);
    const extension = str.slice(ext);
    return name.slice(0, maxLen - extension.length - 3) + '...' + extension;
  }
  return str.slice(0, maxLen - 3) + '...';
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
