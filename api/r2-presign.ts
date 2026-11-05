import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getS3Client() {
  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST-Anfragen sind zulässig.' });
  }

  const s3 = getS3Client();
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!s3 || !bucketName) {
    return res.status(500).json({
      error: 'Cloudflare R2 Umgebungsvariablen sind auf dem Server noch nicht konfiguriert (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME).'
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Ungültiger JSON-Body.' });
      }
    }
    body = body || {};

    const { action = 'upload', key, contentType = 'application/octet-stream' } = body;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Dateischlüssel (key) fehlt oder ist ungültig.' });
    }

    // Sicherheitsprüfung: Pfad-Traversal verhindern
    const sanitizedKey = key.replace(/\.\./g, '').replace(/^\/+/, '');
    if (!sanitizedKey) {
      return res.status(400).json({ error: 'Ungültiger Pfad.' });
    }

    if (action === 'upload') {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: sanitizedKey,
        ContentType: contentType
      });

      // 15 Minuten Gültigkeit für den Upload
      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

      return res.status(200).json({
        success: true,
        action: 'upload',
        key: sanitizedKey,
        uploadUrl,
        expiresInSeconds: 900
      });
    } else if (action === 'download') {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: sanitizedKey
      });

      // 60 Minuten Gültigkeit für das Herunterladen / Anschauen
      const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

      return res.status(200).json({
        success: true,
        action: 'download',
        key: sanitizedKey,
        downloadUrl,
        expiresInSeconds: 3600
      });
    } else {
      return res.status(400).json({ error: 'Unbekannte Aktion. Erlaubt: upload, download.' });
    }
  } catch (err: any) {
    console.error('Fehler bei R2 Presigned URL:', err);
    return res.status(500).json({
      error: 'Fehler beim Erzeugen der signierten R2-URL.',
      details: err?.message || String(err)
    });
  }
}
