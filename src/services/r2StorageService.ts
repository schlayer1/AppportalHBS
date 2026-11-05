/**
 * R2 Storage Service für das HBS App-Portal
 * Ermöglicht direkte Browser-Uploads via Presigned S3 URLs zu Cloudflare R2
 * ohne Umweg über Vercel-Serverless-Payload-Limits.
 */

export interface R2UploadResult {
  key: string;
  success: boolean;
  fileSize: number;
  mimeType: string;
}

/**
 * Holt eine signierte Upload-URL vom Serverless-Backend und lädt die Datei direkt zu Cloudflare R2 hoch.
 */
export async function uploadFileToR2(
  file: File,
  targetKey: string,
  onProgress?: (progressPercent: number) => void
): Promise<R2UploadResult> {
  // 1. Presigned Upload-URL vom Backend anfragen
  const presignRes = await fetch('/api/r2-presign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'upload',
      key: targetKey,
      contentType: file.type || 'application/octet-stream'
    })
  });

  if (!presignRes.ok) {
    const errorData = await presignRes.json().catch(() => ({}));
    throw new Error(errorData.error || `Fehler beim Vorbereiten des Uploads (Status ${presignRes.status})`);
  }

  const { uploadUrl, key } = await presignRes.json();

  // 2. Datei direkt per PUT-Request zu Cloudflare R2 hochladen (mit XMLHttpRequest für Progress-Tracking)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`R2 Upload fehlgeschlagen mit HTTP-Status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Netzwerkfehler beim Upload zu Cloudflare R2 (Bitte CORS-Einstellung prüfen).'));
    };

    xhr.send(file);
  });

  return {
    key,
    success: true,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream'
  };
}

/**
 * Holt eine zeitlich begrenzte Download-URL für eine geschützte Datei aus R2.
 */
export async function getR2DownloadUrl(key: string): Promise<string> {
  const res = await fetch('/api/r2-presign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'download',
      key
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Download-URL konnte nicht erzeugt werden (Status ${res.status})`);
  }

  const data = await res.json();
  return data.downloadUrl;
}

/**
 * Löscht ein Objekt aus Cloudflare R2 über den Vercel-Endpunkt.
 */
export async function deleteFileFromR2(key: string): Promise<void> {
  const res = await fetch('/api/r2-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ key })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Datei konnte nicht aus R2 gelöscht werden (Status ${res.status})`);
  }
}
