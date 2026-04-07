import { getAppState, isDatabaseConfigured, patchAppState, saveAppState } from '../lib/db.js';

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

    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const action = body?.action;
      const snapshot = body?.snapshot;

      if (!isValidPayload(snapshot)) {
        return res.status(400).json({
          error: 'Snapshot data tidak valid.'
        });
      }

      if (action === 'toggle-indicator') {
        const { logKey, studentId, indicatorId, value } = body;

        if (!logKey || !studentId || !indicatorId || typeof value !== 'boolean') {
          return res.status(400).json({
            error: 'Payload toggle indikator tidak valid.'
          });
        }

        const result = await patchAppState((payload) => {
          const currentLogs = payload.dailyLogs?.[logKey] || {};
          const studentLogs = currentLogs[studentId] || {};

          return {
            ...payload,
            dailyLogs: {
              ...payload.dailyLogs,
              [logKey]: {
                ...currentLogs,
                [studentId]: {
                  ...studentLogs,
                  [indicatorId]: value
                }
              }
            }
          };
        }, snapshot);

        return res.status(200).json({
          ok: true,
          updatedAt: result?.updated_at || null
        });
      }

      if (action === 'check-all-indicators') {
        const { logKey, studentId, indicatorIds } = body;

        if (!logKey || !studentId || !Array.isArray(indicatorIds) || indicatorIds.length === 0) {
          return res.status(400).json({
            error: 'Payload cek semua indikator tidak valid.'
          });
        }

        const result = await patchAppState((payload) => {
          const currentLogs = payload.dailyLogs?.[logKey] || {};
          const studentLogs = currentLogs[studentId] || {};
          const nextStudentLogs = { ...studentLogs };

          indicatorIds.forEach((indicatorId) => {
            nextStudentLogs[indicatorId] = true;
          });

          return {
            ...payload,
            dailyLogs: {
              ...payload.dailyLogs,
              [logKey]: {
                ...currentLogs,
                [studentId]: nextStudentLogs
              }
            }
          };
        }, snapshot);

        return res.status(200).json({
          ok: true,
          updatedAt: result?.updated_at || null
        });
      }

      if (action === 'save-log-entry') {
        const { logKey, logData } = body;

        if (!logKey || !logData || typeof logData !== 'object' || Array.isArray(logData)) {
          return res.status(400).json({
            error: 'Payload simpan jurnal tidak valid.'
          });
        }

        const result = await patchAppState((payload) => {
          return {
            ...payload,
            dailyLogs: {
              ...payload.dailyLogs,
              [logKey]: logData
            }
          };
        }, snapshot);

        return res.status(200).json({
          ok: true,
          updatedAt: result?.updated_at || null
        });
      }

      return res.status(400).json({
        error: 'Aksi patch tidak dikenali.'
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
