const pool = require('../config/db');

const mapRow = (r) => ({
  id: r.id,
  userId: r.user_id,
  bio: r.bio,
  avatarUrl: r.avatar_url,
  skills: r.skills,
  certifications: r.certifications,
  workHistory: r.work_history,
  socialLinks: r.social_links,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const findByUserId = async (userId) => {
  const { rows } = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
  return rows[0] ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const { rows } = await pool.query(
    `INSERT INTO profiles (user_id, bio, avatar_url, skills, certifications, work_history, social_links)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [data.userId, data.bio || null, data.avatarUrl || null, data.skills ? JSON.stringify(data.skills) : '[]',
     data.certifications ? JSON.stringify(data.certifications) : '[]', data.workHistory ? JSON.stringify(data.workHistory) : '[]',
     data.socialLinks ? JSON.stringify(data.socialLinks) : '{}']
  );
  return mapRow(rows[0]);
};

const update = async (id, data) => {
  const allowed = ['bio','avatar_url','skills','certifications','work_history','social_links'];
  const updates = [];
  const params = [];
  for (const f of allowed) {
    if (data[f] !== undefined) {
      params.push(typeof data[f] === 'object' && data[f] !== null ? JSON.stringify(data[f]) : data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  }
  if (!updates.length) return findByUserId(id);
  params.push(new Date(), id);
  updates.push(`updated_at = $${params.length - 1}`);
  const { rows } = await pool.query(`UPDATE profiles SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] ? mapRow(rows[0]) : null;
};

module.exports = { findByUserId, create, update };
