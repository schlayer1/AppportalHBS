import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';

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

function sanitizeKey(k: string): string {
  return (k || '').replace(/\.\./g, '').replace(/^\/+/, '');
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
      error: 'Cloudflare R2 Umgebungsvariablen sind auf dem Server noch nicht konfiguriert.'
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

    const { key, keys } = body;

    // 1. Batch-Löschung (mehrere Dateien)
    if (Array.isArray(keys)) {
      const sanitizedKeys = keys
        .filter((k): k is string => typeof k === 'string')
        .map(sanitizeKey)
        .filter((k) => k.length > 0);

      if (sanitizedKeys.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Keine gültigen Dateien zum Löschen übergeben.',
          deletedCount: 0
        });
      }

      // S3 DeleteObjectsCommand erlaubt maximal 1000 Objekte pro Aufruf
      const CHUNK_SIZE = 1000;
      let totalDeleted = 0;

      for (let i = 0; i < sanitizedKeys.length; i += CHUNK_SIZE) {
        const chunk = sanitizedKeys.slice(i, i + CHUNK_SIZE);
        const command = new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: chunk.map((k) => ({ Key: k })),
            Quiet: true
          }
        });
        await s3.send(command);
        totalDeleted += chunk.length;
      }

      return res.status(200).json({
        success: true,
        message: `${totalDeleted} Datei(en) erfolgreich aus R2 gelöscht.`,
        deletedCount: totalDeleted
      });
    }

    // 2. Einzel-Löschung (eine Datei)
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Dateischlüssel (key oder keys) fehlt.' });
    }

    const sanitized = sanitizeKey(key);
    if (!sanitized) {
      return res.status(400).json({ error: 'Ungültiger Pfad.' });
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: sanitized
    });

    await s3.send(command);

    return res.status(200).json({
      success: true,
      message: 'Datei erfolgreich aus R2 gelöscht.',
      key: sanitized
    });
  } catch (err: any) {
    console.error('Fehler beim Löschen in R2:', err);
    return res.status(500).json({
      error: 'Fehler beim Löschen der Datei(en) in R2.',
      details: err?.message || String(err)
    });
  }
}
