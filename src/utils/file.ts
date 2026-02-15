export interface FileAttachment {
  name?: string;
  url: string;
  contentType?: string;
}

export function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'vue': return 'i-vscode-icons:file-type-vue';
    case 'ts': return 'i-vscode-icons:file-type-typescript';
    case 'tsx': return 'i-vscode-icons:file-type-typescript';
    case 'jsx': return 'i-vscode-icons:file-type-react';
    case 'js': return 'i-vscode-icons:file-type-js';
    case 'json': return 'i-vscode-icons:file-type-json';
    case 'md': return 'i-vscode-icons:file-type-markdown';
    case 'css': return 'i-vscode-icons:file-type-css';
    case 'scss': return 'i-vscode-icons:file-type-scss';
    case 'html': return 'i-vscode-icons:file-type-html';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg': return 'i-vscode-icons:file-type-image';
    case 'pdf': return 'i-vscode-icons:file-type-pdf';
    case 'java': return 'i-vscode-icons:file-type-java';
    case 'c':
    case 'h': return 'i-vscode-icons:file-type-c';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
    case 'hh':
    case 'hxx': return 'i-vscode-icons:file-type-cpp';
    default: return 'i-vscode-icons:default-file';
  }
}

export function file2DataUrl(file: File): Promise<FileAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        contentType: file.type,
        url: reader.result as string,
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Check if a MIME type represents a text file
 */
export function isTextFile(mimeType: string): boolean {
  // Include all text/ types
  if (mimeType.startsWith('text/')) {
    return true;
  }

  // Include specific application types that are text-based
  const textApplicationTypes = [
    'application/json',
    'application/xml',
    'application/x-yaml',
    'application/yaml',
    'application/javascript',
    'application/x-javascript',
    'application/typescript',
    'application/x-typescript',
    'application/x-sh',
    'application/x-shellscript',
    'application/x-python',
    'application/x-ruby',
    'application/x-perl',
    'application/x-php',
    'application/graphql',
    'application/x-toml',
    'application/toml',
  ];

  return textApplicationTypes.includes(mimeType);
}
