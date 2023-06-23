const express = require('express');
const app = express();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const db = require('./config')
const bodyParser = require('body-parser');
const flash = require('express-flash');
const rsa = require('./rsa')

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
app.get('/', async (req, res) => {
    const barang = await db('barang').select()
    res.render('index', {
        sessionLogin: req.session.nama,
        barang
    })
});

//Login
app.get('/login', (req, res) => {
    const gagal = req.flash('fail')
    const berhasil = req.flash('success')
    res.render('login', {
        sessionLogin: req.session.nama,
        gagal,
        berhasil
    })
});

//Proses Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body
    const login = await db('users').select().where('username', username).where('password', password)

    if (login.length < 1) {
        req.flash('fail', 'Gagal Login!')
        return res.redirect('/login') 
    }

    req.session.nama = login[0].nama
    req.session.status = login[0].status
    return res.redirect('/dashboard')
});

//Dashboard
app.get('/dashboard', async (req, res) => {
    const nama = req.session.nama
    const pesanForRektor = await db('pesan').select();
    const pesanForMhs = await db('pesan').where('pengirim', nama).select();
    const barang = await db('barang').select();
    if (!req.session.nama) return res.redirect('/login');
    res.render('dashboard', {
        nama,
        status: req.session.status,
        barang,
        pesanForRektor,
        pesanForMhs
    });
});
  

//Logout
app.get('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.log('Gagal menghapus session:', error);
        } else {
            console.log('Session berhasil dihapus');
        }
        res.redirect('/login');
    });
})

//Register
app.get('/register', (req, res) => {
    res.render('register')
});

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
});

//Store Barang
app.post('/barang/store', upload.single('gambar'), async (req, res) => {
    // Cek Session Login
    if (!req.session.nama) return res.redirect('/login')

    // Mendapatkan data gambar yang diunggah dari form
    const file = req.file;
    const image = fs.readFileSync(file.path);
    const encodedImage = image.toString('base64');

    // Menghapus file sementara yang diunggah setelah mengambil datanya
    fs.unlinkSync(file.path);

    // Data yang akan diinsert
    const { nama_barang, harga, stok } = req.body
    const dataBarang = { nama_barang, gambar_barang: encodedImage, harga, stok }

    const insertBarang = await db('barang').insert(dataBarang)

    if (!insertBarang) {
        req.flash('fail', `Gagal menambahkan data barang!`)
    }

    req.flash('success', `Berhasil menambahkan data barang!`)
    res.redirect('/dashboard')
});

//Edit Barang
app.get('/barang/edit/:id', upload.single('gambar'), (req, res) => {
    if (!req.session.nama) return res.redirect('/login')
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
    if (!req.session.nama) return res.redirect('/login')
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
        // Mendapatkan data gambar yang diunggah dari form
        const file = req.file;
        const image = fs.readFileSync(file.path);
        const encodedImage = image.toString('base64');

        // Menghapus file sementara yang diunggah setelah mengambil datanya
        fs.unlinkSync(file.path);

        db('barang')
            .where('id_barang', req.params.id)
            .update({
                nama_barang,
                gambar_barang: encodedImage,
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
app.get('/barang/delete/:id', async (req, res) => {
    if (!req.session.nama) return res.redirect('/login')
    const deleteBarang = await db('barang').where('id_barang', req.params.id).del()
    
    if (deleteBarang) res.redirect('/dashboard')
})

//Store Pesan
app.post('/pesan/store', async (req, res) => {
    if (!req.session.nama) return res.redirect('/login')

    const { pengirim, pesan } = req.body
    const dataPesan = { pengirim, pesan: Buffer.from(pesan).toString('base64') }
    const insertPesan = await db('pesan').insert(dataPesan)

    if (insertPesan) {
        return res.redirect('/dashboard')
    }
})

//End Router

//Web Server
app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});
