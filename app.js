// app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

/*
Data model quick reminder:
- experiences(id) -> rounds(experience_id)
- rounds(id) -> coding_problems(round_id), technical_questions(round_id)
*/

// Helper: fetch full experience with nested rounds, problems, questions
async function fetchExperienceFull(id) {
  const experienceRes = await db.query('SELECT * FROM experiences WHERE id = $1', [id]);
  if (experienceRes.rowCount === 0) return null;
  const exp = experienceRes.rows[0];

  const roundsRes = await db.query('SELECT * FROM rounds WHERE experience_id = $1 ORDER BY round_order', [id]);
  const rounds = roundsRes.rows;

  for (let r of rounds) {
    const problemsRes = await db.query('SELECT * FROM coding_problems WHERE round_id = $1', [r.id]);
    const questionsRes = await db.query('SELECT * FROM technical_questions WHERE round_id = $1', [r.id]);
    r.coding_problems = problemsRes.rows;
    r.technical_questions = questionsRes.rows;
  }

  exp.rounds = rounds;
  return exp;
}

// Create experience with nested rounds (and nested problems/questions)
app.post('/api/experiences', async (req, res) => {
  /*
  Expected body structure:
  {
    title, company_name, package_ctc, role, job_type, difficulty_level,
    rounds: [ { round_order, round_name, description, coding_problems: [...], technical_questions: [...] }, ... ]
  }
  */
  const client = await db.getClient();
  try {
    const { title, company_name, package_ctc, role, job_type, difficulty_level, rounds = [] } = req.body;
    if (!title || !company_name) return res.status(400).json({ error: 'title and company_name required' });

    await client.query('BEGIN');
    const insertExp = await client.query(
      `INSERT INTO experiences(title, company_name, package_ctc, role, job_type, difficulty_level, rounds_count)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, company_name, package_ctc || null, role || null, job_type || null, difficulty_level || null, rounds.length]
    );
    const exp = insertExp.rows[0];

    for (const r of rounds) {
      const { round_order, round_name, description, coding_problems = [], technical_questions = [] } = r;
      const roundInsert = await client.query(
        `INSERT INTO rounds(experience_id, round_order, round_name, description)
         VALUES($1,$2,$3,$4) RETURNING *`,
        [exp.id, round_order || 0, round_name || null, description || null]
      );
      const round = roundInsert.rows[0];

      for (const p of coding_problems) {
        const { title, link, description, constraints, sample_testcases } = p;
        await client.query(
          `INSERT INTO coding_problems(round_id, title, link, description, constraints, sample_testcases)
           VALUES($1,$2,$3,$4,$5,$6)`,
          [round.id, title || null, link || null, description || null, constraints || null, sample_testcases ? JSON.stringify(sample_testcases) : null]
        );
      }

      for (const q of technical_questions) {
        const { question_text, answer_text } = q;
        await client.query(
          `INSERT INTO technical_questions(round_id, question_text, answer_text)
           VALUES($1,$2,$3)`,
          [round.id, question_text, answer_text || null]
        );
      }
    }

    await client.query('COMMIT');

    const full = await fetchExperienceFull(exp.id);
    return res.status(201).json(full);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get list of experiences (with lightweight pagination)
app.get('/api/experiences', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  try {
    const q = await db.query(`SELECT * FROM experiences ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    return res.json({ items: q.rows, limit, offset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get full experience by id
app.get('/api/experiences/:id', async (req, res) => {
  try {
    const full = await fetchExperienceFull(req.params.id);
    if (!full) return res.status(404).json({ error: 'Not found' });
    return res.json(full);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update whole experience (replace rounds with provided rounds)
app.put('/api/experiences/:id', async (req, res) => {
  const client = await db.getClient();
  try {
    const id = req.params.id;
    const exists = await client.query('SELECT * FROM experiences WHERE id = $1', [id]);
    if (exists.rowCount === 0) return res.status(404).json({ error: 'Not found' });

    const { title, company_name, package_ctc, role, job_type, difficulty_level, rounds = [] } = req.body;
    await client.query('BEGIN');

    await client.query(
      `UPDATE experiences SET title=$1, company_name=$2, package_ctc=$3, role=$4, job_type=$5, difficulty_level=$6, rounds_count=$7 WHERE id=$8`,
      [title || exists.rows[0].title, company_name || exists.rows[0].company_name, package_ctc || null, role || null, job_type || null, difficulty_level || null, rounds.length, id]
    );

    // Delete existing rounds (cascades to problems/questions)
    await client.query('DELETE FROM rounds WHERE experience_id = $1', [id]);

    // Insert new rounds
    for (const r of rounds) {
      const { round_order, round_name, description, coding_problems = [], technical_questions = [] } = r;
      const roundInsert = await client.query(
        `INSERT INTO rounds(experience_id, round_order, round_name, description)
         VALUES($1,$2,$3,$4) RETURNING *`,
        [id, round_order || 0, round_name || null, description || null]
      );
      const round = roundInsert.rows[0];

      for (const p of coding_problems) {
        const { title, link, description, constraints, sample_testcases } = p;
        await client.query(
          `INSERT INTO coding_problems(round_id, title, link, description, constraints, sample_testcases)
           VALUES($1,$2,$3,$4,$5,$6)`,
          [round.id, title || null, link || null, description || null, constraints || null, sample_testcases ? JSON.stringify(sample_testcases) : null]
        );
      }

      for (const q of technical_questions) {
        const { question_text, answer_text } = q;
        await client.query(
          `INSERT INTO technical_questions(round_id, question_text, answer_text)
           VALUES($1,$2,$3)`,
          [round.id, question_text, answer_text || null]
        );
      }
    }

    await client.query('COMMIT');
    const full = await fetchExperienceFull(id);
    return res.json(full);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Delete experience
app.delete('/api/experiences/:id', async (req, res) => {
  try {
    const del = await db.query('DELETE FROM experiences WHERE id = $1 RETURNING *', [req.params.id]);
    if (del.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* Additional endpoints for manipulating rounds/problems/questions directly */

// Add round to an experience
app.post('/api/experiences/:id/rounds', async (req, res) => {
  try {
    const expId = req.params.id;
    const { round_order, round_name, description } = req.body;
    const exp = await db.query('SELECT * FROM experiences WHERE id = $1', [expId]);
    if (exp.rowCount === 0) return res.status(404).json({ error: 'experience not found' });

    const r = await db.query(
      `INSERT INTO rounds(experience_id, round_order, round_name, description) VALUES($1,$2,$3,$4) RETURNING *`,
      [expId, round_order || 0, round_name || null, description || null]
    );

    // update rounds_count
    await db.query('UPDATE experiences SET rounds_count = rounds_count + 1 WHERE id = $1', [expId]);

    return res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update round
app.put('/api/rounds/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { round_order, round_name, description } = req.body;
    const r = await db.query(
      `UPDATE rounds SET round_order=$1, round_name=$2, description=$3 WHERE id=$4 RETURNING *`,
      [round_order || 0, round_name || null, description || null, id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'round not found' });
    return res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete round (cascades)
app.delete('/api/rounds/:id', async (req, res) => {
  try {
    // get experience_id to decrement rounds_count
    const r = await db.query('SELECT experience_id FROM rounds WHERE id = $1', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'round not found' });
    const expId = r.rows[0].experience_id;

    await db.query('DELETE FROM rounds WHERE id = $1', [req.params.id]);
    await db.query('UPDATE experiences SET rounds_count = GREATEST(0, rounds_count - 1) WHERE id = $1', [expId]);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Add coding problem to round
app.post('/api/rounds/:id/problems', async (req, res) => {
  try {
    const roundId = req.params.id;
    const { title, link, description, constraints, sample_testcases } = req.body;
    const r = await db.query('SELECT * FROM rounds WHERE id = $1', [roundId]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'round not found' });

    const p = await db.query(
      `INSERT INTO coding_problems(round_id, title, link, description, constraints, sample_testcases)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [roundId, title || null, link || null, description || null, constraints || null, sample_testcases ? JSON.stringify(sample_testcases) : null]
    );
    return res.status(201).json(p.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Add technical question to round
app.post('/api/rounds/:id/questions', async (req, res) => {
  try {
    const roundId = req.params.id;
    const { question_text, answer_text } = req.body;
    const r = await db.query('SELECT * FROM rounds WHERE id = $1', [roundId]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'round not found' });

    const q = await db.query(
      `INSERT INTO technical_questions(round_id, question_text, answer_text) VALUES($1,$2,$3) RETURNING *`,
      [roundId, question_text, answer_text || null]
    );
    return res.status(201).json(q.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));