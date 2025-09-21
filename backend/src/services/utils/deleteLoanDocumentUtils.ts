export function extractStoragePathFromUrl(
  fileUrl: string,
  bucketName: string = 'loan-documents'
) {
  if (!fileUrl) return null;

  const urlPatterns = [
    // Standard public URL: https://xxx.supabase.co/storage/v1/object/public/loan-documents/filename.pdf
    {
      pattern: `/storage/v1/object/public/${bucketName}/`,
      name: 'Public URL',
    },
    // Alternative public format: https://xxx.supabase.co/object/public/loan-documents/filename.pdf
    {
      pattern: `/object/public/${bucketName}/`,
      name: 'Short Public URL',
    },
    // Signed URL: https://xxx.supabase.co/storage/v1/object/sign/loan-documents/filename.pdf?token=xxx
    {
      pattern: `/object/sign/${bucketName}/`,
      name: 'Signed URL',
    },
  ];

  for (const { pattern, name } of urlPatterns) {
    if (fileUrl.includes(pattern)) {
      const pathPart = fileUrl.split(pattern)[1];
      if (typeof pathPart === 'string') {
        const cleanPath = pathPart.split('?')[0]; // Remove query parameters
        console.log(`✅ Extracted path using ${name} pattern:`, cleanPath);
        return cleanPath;
      }
    }
  }

  console.warn('⚠️ Could not extract storage path from URL:', fileUrl);
  return null;
}

/**
 * Fallback: Try to use the file_name field as storage path
 */
function tryFileNameAsStoragePath(fileName: string): string | null {
  if (!fileName) return null;

  // If file_name doesn't contain HTTP and looks like a file path, use it
  if (!fileName.startsWith('http') && fileName.includes('.')) {
    console.log('✅ Using file_name as storage path:', fileName);
    return fileName;
  }

  return null;
}

/**
 * Gets the storage file path for deletion from database record
 */
export function getStoragePathForDeletion(document: {
  file_url: string;
  file_name: string;
}): string | null {
  console.log('🔍 Determining storage path for deletion...');
  console.log('File URL:', document.file_url);
  console.log('File Name:', document.file_name);

  // Method 1: Extract from URL
  const pathFromUrl = extractStoragePathFromUrl(document.file_url);
  if (pathFromUrl) {
    return pathFromUrl;
  }

  // Method 2: Try using file_name as storage path
  const pathFromFileName = tryFileNameAsStoragePath(document.file_name);
  if (pathFromFileName) {
    return pathFromFileName;
  }

  console.error('❌ Could not determine storage path for deletion');
  return null;
}
