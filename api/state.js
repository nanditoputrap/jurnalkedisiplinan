import { getAppState, isDatabaseConfigured, saveAppState } from '../lib/db.js';

const isValidPayload = (payload) => {
  return Boolean(
    payload &&
    Array.isArray(payload.teachers) &&
    Array.isArray(payload.classes) &&
    Array.isArray(payload.students) &&
    payload.dailyLogs &&
    typeof payload.dailyLogs === 'object' &&
    !Array.isArray(payload.dailyLogs)
  );
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!isDatabaseConfigured) {
    return res.status(503).json({
      error: 'Neon belum dikonfigurasi di Vercel.',
      hint: 'Pastikan DATABASE_URL atau POSTGRES_URL tersedia dari integrasi Neon.'
    });
  }

  try {
    if (req.method === 'GET') {
      const record = await getAppState();

      return res.status(200).json({
        data: record?.payload || null,
        updatedAt: record?.updated_at || null
      });
    }

    if (req.method === 'PUT') {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (!isValidPayload(payload)) {
        return res.status(400).json({
          error: 'Payload data tidak valid.'
        });
      }

      const result = await saveAppState(payload);

      return res.status(200).json({
        ok: true,
        updatedAt: result?.updated_at || null
      });
    }

    return res.status(405).json({
      error: 'Method tidak didukung.'
    });
  } catch (error) {
    console.error('Database API error', error);
    return res.status(500).json({
      error: 'Terjadi kesalahan saat mengakses database.'
    });
  }
}
