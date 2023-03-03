// PostgreSQL 연결 Config

const pgInit = {
    "user": process.env.PG_USER,
    "host": process.env.PG_HOST,
    "database": process.env.PG_DATABASE,
    "password": process.env.PG_PASSWORD,
    "port": process.env.PG_PROT
}

module.exports = pgInit