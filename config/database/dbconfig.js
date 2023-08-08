const mysql = require('mysql')
const dbconfig = {
    hostname: 'localhost',
    user: 'root',
    password: 'grantedin0987',
    database: 'accounts'
}
const db = mysql.createConnection(dbconfig)
module.exports = db