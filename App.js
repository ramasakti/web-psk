const express = require('express');
const app = express();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const db = require('./config')
const bodyParser = require('body-parser');
const flash = require('express-flash');

//Setup View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//Access to Directory 'upload' as a public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/upload', express.static(path.join(__dirname, 'upload')));

//Setup Session
app.use(
    session({
        secret: 'rahasimen', // Ganti dengan secret key yang lebih aman
        resave: false,
        saveUninitialized: true,
    })
);

//Setup Flash Message
app.use(flash());

//Setup Body Parser for Request
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Setup Multer Upload Image
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upload'); // Menentukan direktori penyimpanan file
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Menentukan nama file
    }
});

const upload = multer({ storage: storage });

//Start Router

//Index
app.get('/', (req, res) => {
    db('barang')
        .select()
        .then((barang) => {
            res.render('index', {
                barang
            })
        })
        .catch((err) => {
            if (err) throw err
        })
});

//Login
app.get('/login', (req, res) => {
    const gagal = req.flash('fail')
    const berhasil = req.flash('success')
    res.render('login', {
        gagal,
        berhasil
    })
});

//Proses Login
app.post('/login', (req, res) => {
    const { username, password } = req.body
    db('users')
        .select()
        .where('username', username)
        .where('password', password)
        .then((user) => {
            if (user.length < 1) {
                req.flash('fail', 'Gagal Login!')
                return res.redirect('/') 
            }
            req.session.nama = user[0].nama
            return res.redirect('/dashboard')
        })
        .catch((err) => {
            if (err) throw err
        })
});

//Dashboard
app.get('/dashboard', (req, res) => {
    db('barang')
        .select()
        .then((barang) => {
            const nama = req.session.nama
            if (!nama) return res.redirect('/login')
            res.render('dashboard', {
                nama,
                barang
            })
        })
        .catch((err) => {
            if (err) throw err
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
    const { username, password, email, nama } = req.body
    const data = { username, password, email, nama }

    db('users')
        .insert(data)
        .then(() => {
            req.flash('success', 'Berhasil Register! Silahkan Login')
            return res.redirect('/')
        })
        .catch((err) => {
            if (err) throw err
            req.flash('fail', 'Gagal Register!')
            return res.redirect('/')
        })
});

//Store Barang
app.post('/barang/store', upload.single('gambar'), (req, res) => {
    // Mendapatkan data gambar yang diunggah dari form
    const file = req.file;
    const image = fs.readFileSync(file.path);
    const encodedImage = image.toString('base64');

    // Menghapus file sementara yang diunggah setelah mengambil datanya
    fs.unlinkSync(file.path);

    // Data yang akan diinsert
    const { nama_barang, harga, stok } = req.body
    const dataBarang = { nama_barang, gambar_barang: encodedImage, harga, stok }

    db('barang')
        .insert(dataBarang)
        .then(() => {
            req.flash('success', `Berhasil menambahkan data barang!`)
            res.redirect('/dashboard')
        })
        .catch((err) => {
            if (err) throw err
        })
});

//Edit Barang
app.get('/barang/edit/:id', upload.single('gambar'), (req, res) => {
    db('barang')
        .select()
        .where('id_barang', req.params.id)
        .then((barang) => {
            const nama = req.session.nama
            if (!nama) return res.redirect('/login')
            res.render('edit', {
                nama, 
                barang
            })
        })
        .catch((err) => {
            if (err) throw err
        })
})

//Update Barang
app.post('/barang/update/:id', upload.single('gambar'), (req, res) => {
    const { nama_barang, harga, stok } = req.body
    if (!req.file) {
        db('barang')
            .where('id_barang', req.params.id)
            .update({
                nama_barang,
                harga,
                stok
            })
            .then(() => {
                res.redirect('/dashboard')
            })
            .catch((err) => {
                if (err) throw err
            })
    }else{
        const gambar_barang = req.file.originalname
        db('barang')
            .where('id_barang', req.params.id)
            .update({
                nama_barang,
                gambar_barang,
                harga,
                stok
            })
            .then(() => {
                res.redirect('/dashboard')
            })
            .catch((err) => {
                if (err) throw err
            })
    }
})

//Delete Barang

//End Router

//Web Server
app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});
