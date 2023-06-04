const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const db = require('./config')
const bodyParser = require('body-parser');
const flash = require('express-flash');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(
    session({
        secret: 'megawati', // Ganti dengan secret key yang lebih aman
        resave: false,
        saveUninitialized: true,
    })
);
app.use(flash());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Login
app.get('/', (req, res) => {
    const gagal = req.flash('fail')
    const berhasil = req.flash('success')
    res.render('login', {
        gagal,
        berhasil
    })
});

//Proses Login
app.post('/', (req, res) => {
    const { username, password } = req.body
    const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
    db.query(sql, (err, result) => {
        if (result.length < 1) {
            req.flash('fail', 'Gagal Login!')
            return res.redirect('/') 
        }
        req.session.nama = result[0].nama
        return res.redirect('/dashboard')
    })
});

//Dashboard
app.get('/dashboard', (req, res) => {
    const nama = req.session.nama
    if (!nama) return res.redirect('/')
    res.render('dashboard', {
        nama
    })
});

//Logout
app.get('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
          console.log('Gagal menghapus session:', error);
        } else {
          console.log('Session berhasil dihapus');
        }
        res.redirect('/');
    });
})

//Register
app.get('/register', (req, res) => {
    res.render('register')
});

//Proses Register
app.post('/register', (req, res) => {
    const { username, password, nama, email } = req.body
    const sql = `INSERT INTO users (username, password, nama, email) VALUES ('${username}', '${password}', '${nama}', '${email}')`
    db.query(sql, (err, result) => {
        if (err) throw err
        req.flash('success', 'Berhasil Register! Silahkan Login')
        return res.redirect('/')
    })
});

app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});
