// db.js
const { Pool } = require('pg');
require('dotenv').config();


const pool = new Pool({
connectionString: process.env.DATABASE_URL,
// For Neon or other hosts which require SSL, set rejectUnauthorized false if needed
ssl: { rejectUnauthorized: false }
});


module.exports = {
query: (text, params) => pool.query(text, params),
getClient: () => pool.connect()
};
