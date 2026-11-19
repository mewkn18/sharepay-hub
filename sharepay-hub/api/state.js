// API lưu trạng thái demo theo "phòng" vào Upstash Redis (Vercel Marketplace).
// GET  /api/state?phong=abc&ver=3  -> {ver, state?}  (state chỉ trả khi có bản mới hơn ver)
// POST /api/state?phong=abc  body {ver, state} -> {ok, ver} hoặc {conflict, ver, state}
const TTL = 60 * 60 * 24 * 30; // giữ dữ liệu 30 ngày
const MAX = 900 * 1024;         // giới hạn kích thước trạng thái

function cfg() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}
async function redis(c, cmd) {
  const r = await fetch(c.url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + c.token, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
function roomOf(q) {
  return String(q || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const c = cfg();
  const room = roomOf(req.query && req.query.phong);
  if (!room) return res.status(200).json({ ok: true, db: !!c });
  if (!c) return res.status(503).json({ error: 'Chưa kết nối cơ sở dữ liệu' });
  const key = 'sharepay:phong:' + room;
  try {
    if (req.method === 'GET') {
      const raw = await redis(c, ['GET', key]);
      if (!raw) return res.status(200).json({ ver: 0 });
      const cur = JSON.parse(raw);
      const have = Number(req.query.ver || 0);
      if (have >= cur.ver) return res.status(200).json({ ver: cur.ver });
      return res.status(200).json({ ver: cur.ver, state: cur.state });
    }
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body || '{}');
      if (!body || typeof body.state !== 'object' || !body.state || !body.state.funds)
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
      const text = JSON.stringify(body.state);
      if (text.length > MAX) return res.status(413).json({ error: 'Dữ liệu quá lớn' });
      const raw = await redis(c, ['GET', key]);
      const cur = raw ? JSON.parse(raw) : null;
      const base = Number(body.ver || 0);
      if (cur && cur.ver > base) return res.status(200).json({ conflict: true, ver: cur.ver, state: cur.state });
      const ver = (cur ? cur.ver : 0) + 1;
      await redis(c, ['SET', key, JSON.stringify({ ver, state: body.state, t: Date.now() }), 'EX', TTL]);
      return res.status(200).json({ ok: true, ver });
    }
    if (req.method === 'DELETE') {
      await redis(c, ['DEL', key]);
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'Lỗi cơ sở dữ liệu', detail: String(e.message || e) });
  }
};
