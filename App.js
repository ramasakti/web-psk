const express = require('express')
const app = express()
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const session = require('express-session')
const db = require('./config')
const bodyParser = require('body-parser')
const flash = require('express-flash')
const rsa = require('./rsa')

//Setup View Engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

//Access to Directory 'upload' as a public directory
app.use(express.static(path.join(__dirname, 'public')))
app.use('/upload', express.static(path.join(__dirname, 'upload')))

//Setup Session
app.use(
    session({
        secret: 'rahasimen', // Ganti dengan secret key yang lebih aman
        resave: false,
        saveUninitialized: true,
    })
)

//Setup Flash Message
app.use(flash())

//Setup Body Parser for Request
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//Setup Multer Upload Image
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upload') // Menentukan direktori penyimpanan file
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname) // Menentukan nama file
    }
})

const upload = multer({ storage: storage })

//Start Router

//Index
app.get('/', async (req, res) => {
    const barang = await db('barang').select()
    res.render('index', {
        sessionLogin: req.session.nama,
        barang
    })
})

//Login
app.get('/login', (req, res) => {
    const gagal = req.flash('fail')
    const berhasil = req.flash('success')
    res.render('login', {
        sessionLogin: req.session.nama,
        gagal,
        berhasil
    })
})

//Proses Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body
    const login = await db('users').select().where('username', username).where('password', password)

    if (login.length < 1) {
        req.flash('fail', 'Gagal Login!')
        return res.redirect('/login') 
    }

    req.session.username = login[0].username
    req.session.nama = login[0].nama
    req.session.status = login[0].status
    return res.redirect('/dashboard')
})

//Dashboard
app.get('/dashboard', async (req, res) => {
    if (!req.session.username) return res.redirect('/login')
    const nama = req.session.nama
    const username = req.session.username

    const calonPenerima = await db('users').where('nama', '!=', nama).where('status', 'Dosen').orWhere('status', 'Rektor').select()
    const semuaPesan = await db('pesan').select()
    const pesanDiterima = await db('pesan').where('penerima', username).select()
    const pesanDikirim = await db('pesan').where('pengirim', username).select()

    res.render('dashboard', {
        nama,
        username,
        status: req.session.status,
        calonPenerima,
        pesanDiterima,
        pesanDikirim,
        semuaPesan
    })
})
  

//Logout
app.get('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.log('Gagal menghapus session:', error)
        } else {
            console.log('Session berhasil dihapus')
        }
        res.redirect('/login')
    })
})

//Register
app.get('/register', (req, res) => {
    res.render('register')
})

//Proses Register
app.post('/register', async (req, res) => {
    const { username, password, email, nama } = req.body
    const data = { username, password, status: 'mahasiswa', email, nama }

    const insertRegisterUser = await db('users').insert(data)

    if (!insertRegisterUser) {
        req.flash('fail', 'Gagal Register!')
        return res.redirect('/login')
    }
    
    req.flash('success', 'Berhasil Register! Silahkan Login')
    return res.redirect('/login')
})

//Store Pesan
app.post('/pesan/store', async (req, res) => {
    if (!req.session.nama) return res.redirect('/login')

    const { pengirim, penerima, pesan } = req.body
    const dataPesan = { pengirim, penerima, pesan: Buffer.from(pesan).toString('base64') }
    const insertPesan = await db('pesan').insert(dataPesan)

    if (insertPesan) {
        return res.redirect('/dashboard')
    }
})

app.post('/pesan/balasan', async (req, res) => {
    const { id_pesan, balasan } = req.body
    const balasPesan = await db('pesan')
                        .where('id_pesan', id_pesan)
                        .update({
                            balasan: Buffer.from(balasan).toString('base64')
                        })

    if (balasPesan) {
        return res.redirect('/dashboard')
    }
})

//End Router

//Web Server
app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000')
})
