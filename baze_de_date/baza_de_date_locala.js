
const Pool = require("pg").Pool;
require("dotenv").config();

const pool = new Pool({
    user:"postgres",
    password:process.env.PAROLA,
    database:"AplicatieWeb",
    port:"5432"
});

module.exports = pool;