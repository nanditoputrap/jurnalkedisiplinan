import { getDatabaseConfigStatus, isDatabaseConfigured, testDatabaseConnection } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const config = getDatabaseConfigStatus();

  if (!isDatabaseConfigured) {
    return res.status(200).json({
      ok: false,
      stage: 'config',
      config,
      message: 'Tidak ada env database yang terbaca di server.'
    });
  }

  try {
    const result = await testDatabaseConnection();

    return res.status(200).json({
      ok: true,
      stage: 'connection',
      config,
      message: 'Koneksi database berhasil.',
      serverTime: result?.now || null
    });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      stage: 'connection',
      config,
      message: 'Env terbaca, tapi koneksi database gagal.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
