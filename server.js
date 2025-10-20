const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS
app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());
app.use('/uploads', express.static('uploads', {
    setHeaders: (res, path) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// Uploads qovluğunu yoxla/yarat
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
    console.log('Uploads qovluğu yaradıldı');
}

// Fayl saxlama konfiqurasiyası
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Yalnız PDF və Word faylları icazə verilir!'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Məlumatlar üçün JSON faylı
const DATA_FILE = 'data.json';
const TEACHERS_FILE = 'teachers.json';
const MODULES_FILE = 'modules.json';

// JSON fayllarını oxumaq üçün funksiya
function readJSONFile(filename, defaultData = {}) {
    try {
        if (fs.existsSync(filename)) {
            return JSON.parse(fs.readFileSync(filename, 'utf8'));
        }
        writeJSONFile(filename, defaultData);
        return defaultData;
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return defaultData;
    }
}

// JSON fayllarına yazmaq üçün funksiya
function writeJSONFile(filename, data) {
    try {
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        return false;
    }
}

// Fayl URL-ni yaratmaq üçün funksiya - ƏSAS DƏYİŞİKLİK
function getFileUrl(filename) {
    const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://sadiq-ubml.onrender.com'
        : 'http://localhost:3000';
    return `${baseUrl}/uploads/${filename}`;
}

// Standart məlumatları inisializasiya et
const defaultFileData = {
    transport: { lecture: [], colloquium: [], seminar: [] },
    computer: { lecture: [], colloquium: [], seminar: [] },
    math: { lecture: [], colloquium: [], seminar: [] },
    economics: { lecture: [], colloquium: [], seminar: [] },
    azerbaijani: { lecture: [], colloquium: [], seminar: [] },
    english: { lecture: [], colloquium: [], seminar: [] },
    physical: { lecture: [], colloquium: [], seminar: [] },
    pedagogy: { lecture: [], colloquium: [], seminar: [] },
    agriculture: { lecture: [], colloquium: [], seminar: [] },
    history: { lecture: [], colloquium: [], seminar: [] }
};

const defaultTeacherCredentials = {
    'Nəqliyyat': { password: 'pass1234', subject: 'transport' },
    'Kompyuter sistemləri': { password: 'pass1234', subject: 'computer' },
    'Riyaziyyat': { password: 'pass1234', subject: 'math' },
    'İqtisadiyyat': { password: 'pass1234', subject: 'economics' },
    'Azərbaycan dili': { password: 'pass1234', subject: 'azerbaijani' },
    'İngilis dili': { password: 'pass1234', subject: 'english' },
    'Fiziki tərbiyə': { password: 'pass1234', subject: 'physical' },
    'Pedaqogika': { password: 'pass1234', subject: 'pedagogy' },
    'Kənd təsərrüfatı': { password: 'pass1234', subject: 'agriculture' },
    'Tarix': { password: 'pass1234', subject: 'history' }
};

const defaultModuleCredentials = {
    'transport': { username: 'neqliyyat', password: 'pass1234' },
    'computer': { username: 'kompyuter', password: 'pass1234' },
    'math': { username: 'riyaziyyat', password: 'pass1234' },
    'economics': { username: 'iqtisadiyyat', password: 'pass1234' },
    'azerbaijani': { username: 'azdili', password: 'pass1234' },
    'english': { username: 'ingilisdili', password: 'pass1234' },
    'physical': { username: 'fiziki', password: 'pass1234' },
    'pedagogy': { username: 'pedagogiya', password: 'pass1234' },
    'agriculture': { username: 'kend', password: 'pass1234' },
    'history': { username: 'tarix', password: 'pass1234' }
};

// Məlumatları yüklə
let fileData = readJSONFile(DATA_FILE, defaultFileData);
let teacherCredentials = readJSONFile(TEACHERS_FILE, defaultTeacherCredentials);
let moduleCredentials = readJSONFile(MODULES_FILE, defaultModuleCredentials);

// API Routes

// Server status endpoint
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'Server is running', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        baseUrl: process.env.NODE_ENV === 'production' ? 'https://sadiq-ubml.onrender.com' : 'http://localhost:3000'
    });
});

// Bütün məlumatları qaytaran endpoint
app.get('/api/data', (req, res) => {
    res.json(fileData);
});

// Müəllim məlumatlarını qaytaran endpoint
app.get('/api/teachers', (req, res) => {
    res.json(teacherCredentials);
});

// Modul məlumatlarını qaytaran endpoint
app.get('/api/modules', (req, res) => {
    res.json(moduleCredentials);
});

// Müəyyən fənn və modul üçün faylları qaytaran endpoint
app.get('/api/files/:subject/:module', (req, res) => {
    const { subject, module } = req.params;
    
    if (fileData[subject] && fileData[subject][module]) {
        res.json(fileData[subject][module]);
    } else {
        res.status(404).json({ error: 'Fayllar tapılmadı' });
    }
});

// Müəllim üçün bütün faylları qaytaran endpoint
app.get('/api/teacher-files/:subject', (req, res) => {
    const { subject } = req.params;
    
    if (fileData[subject]) {
        res.json(fileData[subject]);
    } else {
        res.status(404).json({ error: 'Fənn tapılmadı' });
    }
});

// Modul giriş endpoint
app.post('/api/module-login', (req, res) => {
    const { subject, username, password } = req.body;
    
    if (moduleCredentials[subject] && 
        moduleCredentials[subject].username === username && 
        moduleCredentials[subject].password === password) {
        res.json({ success: true, message: 'Giriş uğurlu' });
    } else {
        res.json({ success: false, message: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }
});

// Müəllim giriş endpoint
app.post('/api/teacher-login', (req, res) => {
    const { username, password } = req.body;
    
    if (teacherCredentials[username] && teacherCredentials[username].password === password) {
        res.json({ 
            success: true, 
            message: 'Giriş uğurlu',
            subject: teacherCredentials[username].subject 
        });
    } else {
        res.json({ success: false, message: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }
});

// Fayl yükləmə endpoint - ƏSAS DƏYİŞİKLİK
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Fayl yüklənmədi' });
        }

        const { subject, module, type } = req.body;
        
        if (!subject || !module) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Fənn və modul tələb olunur' });
        }

        // Fayl məlumatını yadda saxla - URL DÜZGÜN YARADILIR
        const fileInfo = {
            id: Date.now(),
            filename: req.file.filename,
            originalname: req.file.originalname,
            url: getFileUrl(req.file.filename), // TAM URL İSTİFADƏ EDİLİR
            path: req.file.path,
            size: req.file.size,
            type: type || (req.file.originalname.toLowerCase().endsWith('.pdf') ? 'pdf' : 'word'),
            uploadedAt: new Date().toISOString()
        };

        // Data strukturunu inisializasiya et
        if (!fileData[subject]) {
            fileData[subject] = { lecture: [], colloquium: [], seminar: [] };
        }
        if (!fileData[subject][module]) {
            fileData[subject][module] = [];
        }

        // Faylı əlavə et
        fileData[subject][module].push(fileInfo);

        // JSON faylını yenilə
        writeJSONFile(DATA_FILE, fileData);

        res.json({ 
            success: true, 
            message: 'Fayl uğurla yükləndi',
            filename: req.file.filename,
            file: fileInfo
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Fayl yüklənmədi' });
    }
});

// Şifrə yeniləmə endpoint
app.post('/api/update-password', (req, res) => {
    const { teacher, currentPassword, newPassword } = req.body;
    
    if (teacherCredentials[teacher] && teacherCredentials[teacher].password === currentPassword) {
        teacherCredentials[teacher].password = newPassword;
        
        if (writeJSONFile(TEACHERS_FILE, teacherCredentials)) {
            res.json({ success: true, message: 'Şifrə uğurla yeniləndi' });
        } else {
            res.json({ success: false, message: 'Şifrə yenilənmədi' });
        }
    } else {
        res.json({ success: false, message: 'Hazırki şifrə yanlışdır' });
    }
});

// Fayl adını yeniləmə endpoint
app.post('/api/update-filename', (req, res) => {
    const { fileId, module, subject, newName } = req.body;
    
    if (fileData[subject] && fileData[subject][module]) {
        const fileIndex = fileData[subject][module].findIndex(f => f.id == fileId);
        
        if (fileIndex !== -1) {
            fileData[subject][module][fileIndex].originalname = newName;
            
            if (writeJSONFile(DATA_FILE, fileData)) {
                res.json({ success: true, message: 'Fayl adı uğurla yeniləndi' });
            } else {
                res.json({ success: false, message: 'Fayl adı yenilənmədi' });
            }
        } else {
            res.json({ success: false, message: 'Fayl tapılmadı' });
        }
    } else {
        res.json({ success: false, message: 'Fənn və ya modul tapılmadı' });
    }
});

// Fayl silmə endpoint
app.post('/api/delete-file', (req, res) => {
    const { fileId, module, subject } = req.body;
    
    if (fileData[subject] && fileData[subject][module]) {
        const fileIndex = fileData[subject][module].findIndex(f => f.id == fileId);
        
        if (fileIndex !== -1) {
            const file = fileData[subject][module][fileIndex];
            
            // Fiziki faylı sil
            try {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (error) {
                console.error('Fayl silinmə xətası:', error);
            }
            
            // Data strukturundan sil
            fileData[subject][module].splice(fileIndex, 1);
            
            if (writeJSONFile(DATA_FILE, fileData)) {
                res.json({ success: true, message: 'Fayl uğurla silindi' });
            } else {
                res.json({ success: false, message: 'Fayl silinmədi' });
            }
        } else {
            res.json({ success: false, message: 'Fayl tapılmadı' });
        }
    } else {
        res.json({ success: false, message: 'Fənn və ya modul tapılmadı' });
    }
});

// Frontend üçün static fayllar
app.use(express.static(path.join(__dirname, 'public')));

// Əsas səhifə route-u
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Xəta idarəetmə middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Fayl həcmi çox böyükdür (maksimum 10MB)' });
        }
    }
    res.status(500).json({ error: error.message });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint tapılmadı' });
});

// Serveri başlat
app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} ünvanında işləyir`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Frontend qovluğu:', path.join(__dirname, 'public'));
    console.log('API Endpoints:');
    console.log('  GET  /api/status - Server status');
    console.log('  GET  /api/data - Bütün fayl məlumatları');
    console.log('  GET  /api/files/:subject/:module - Müəyyən fənn/modul faylları');
    console.log('  POST /api/upload - Fayl yüklə');
    console.log('  POST /api/teacher-login - Müəllim girişi');
    console.log('  POST /api/module-login - Modul girişi');
});
