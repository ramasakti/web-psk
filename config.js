const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_psk'
});

connection.connect((error) => {
    if (error) {
        console.error('Koneksi database gagal: ', error);
    } else {
        console.log('Terhubung ke database MySQL');
    }
});

module.exports = connection