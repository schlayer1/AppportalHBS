import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

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

    const { key } = body;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Dateischlüssel (key) fehlt.' });
    }

    const sanitizedKey = key.replace(/\.\./g, '').replace(/^\/+/, '');
    if (!sanitizedKey) {
      return res.status(400).json({ error: 'Ungültiger Pfad.' });
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: sanitizedKey
    });

    await s3.send(command);

    return res.status(200).json({
      success: true,
      message: 'Datei erfolgreich aus R2 gelöscht.',
      key: sanitizedKey
    });
  } catch (err: any) {
    console.error('Fehler beim Löschen in R2:', err);
    return res.status(500).json({
      error: 'Fehler beim Löschen der Datei in R2.',
      details: err?.message || String(err)
    });
  }
}
