require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Frontend qovluğunun yolunu təyin et
const frontendPath = path.join(__dirname, '../frontend');

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());
app.use(express.static(frontendPath));
app.use('/uploads', express.static('uploads', {
    setHeaders: (res, path) => {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.set('Access-Control-Allow-Origin', '*');
    }
}));

// Bütün request-ləri log-la
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Upload qovluğunu yoxla/yarat
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
    console.log('Uploads qovluğu yaradıldı');
}

// Fayl yaddaşı konfiqurasiyası
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
            cb(new Error('Yalnız PDF və Word faylları yükləyə bilərsiniz!'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

// Məlumatların saxlanması
let data = {
    files: {
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
    },
    teachers: {
        'Nəqliyyat': { password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', subject: 'transport' },
        'Kompyuter sistemləri': { password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', subject: 'computer' },
        'Riyaziyyat': { password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', subject: 'math' },
        'İqtisadiyyat': { password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', subject: 'economics' },
        'Azərbaycan dili': { password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', subject: 'azerbaijani' },
        'İngilis dili': { password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', subject: 'english' },
        'Fiziki tərbiyə': { password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', subject: 'physical' },
        'Pedaqogika': { password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', subject: 'pedagogy' },
        'Kənd təsərrüfatı': { password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', subject: 'agriculture' },
        'Tarix': { password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', subject: 'history' }
    },
    modules: {
        'transport': { username: 'neqliyyat', password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' },
        'computer': { username: 'kompyuter', password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' },
        'math': { username: 'riyaziyyat', password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' },
        'economics': { username: 'iqtisadiyyat', password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' },
        'azerbaijani': { username: 'azdili', password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' },
        'english': { username: 'ingilisdili', password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' },
        'physical': { username: 'fiziki', password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' },
        'pedagogy': { username: 'pedagogiya', password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' },
        'agriculture': { username: 'kend', password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' },
        'history': { username: 'tarix', password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' }
    }
};

// Bütün şifrələri bcrypt ilə hash et
async function hashPasswords() {
    const hashedPassword = await bcrypt.hash('pass1234', 10);
    Object.keys(data.teachers).forEach(teacher => {
        data.teachers[teacher].password = hashedPassword;
    });
    Object.keys(data.modules).forEach(module => {
        data.modules[module].password = hashedPassword;
    });
}

// Fayl URL-ni yaratmaq üçün funksiya
function getFileUrl(filename) {
    const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://sadiq-ubml.onrender.com'
        : 'http://localhost:3000';
    return `${baseUrl}/uploads/${filename}`;
}

// API Routes

// Server status
app.get('/api/status', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({ 
        status: 'Server işləyir', 
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        baseUrl: process.env.NODE_ENV === 'production' ? 'https://sadiq-ubml.onrender.com' : 'http://localhost:3000'
    });
});

// Ana səhifə - index.html faylını göndər
app.get('/', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Ana səhifə tapılmadı');
    }
});

// Bütün məlumatları gətir
app.get('/api/data', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json(data.files);
});

// Müəllim məlumatlarını gətir
app.get('/api/teachers', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json(data.teachers);
});

// Modul məlumatlarını gətir
app.get('/api/modules', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json(data.modules);
});

// Müəyyən fənn və modulun fayllarını gətir
app.get('/api/files/:subject/:module', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { subject, module } = req.params;
    
    if (data.files[subject] && data.files[subject][module]) {
        res.json(data.files[subject][module]);
    } else {
        res.status(404).json({ error: 'Fayllar tapılmadı' });
    }
});

// Müəllimin bütün fayllarını gətir
app.get('/api/teacher-files/:subject', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { subject } = req.params;
    
    if (data.files[subject]) {
        res.json(data.files[subject]);
    } else {
        res.status(404).json({ error: 'Fayllar tapılmadı' });
    }
});

// Modul girişi
app.post('/api/module-login', async (req, res) => {
    const { subject, username, password } = req.body;
    
    if (!data.modules[subject]) {
        return res.json({ success: false, message: 'Modul tapılmadı' });
    }
    
    const module = data.modules[subject];
    const validUsername = username === module.username;
    const validPassword = await bcrypt.compare(password, module.password);
    
    if (validUsername && validPassword) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }
});

// Müəllim girişi
app.post('/api/teacher-login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!data.teachers[username]) {
        return res.json({ success: false, message: 'Müəllim tapılmadı' });
    }
    
    const teacher = data.teachers[username];
    const validPassword = await bcrypt.compare(password, teacher.password);
    
    if (validPassword) {
        res.json({ success: true, subject: teacher.subject, teacher: username });
    } else {
        res.json({ success: false, message: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }
});

// Fayl yüklə - YENİ VERSİYA
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        console.log('Fayl yükləmə sorğusu alındı');
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        
        if (!req.file) {
            console.log('Fayl yüklənmədi');
            return res.status(400).json({ error: 'Fayl yüklənmədi' });
        }
        
        const { subject, module, type } = req.body;
        console.log('Fənn:', subject, 'Modul:', module, 'Tip:', type);
        
        if (!subject || !module) {
            console.log('Fənn və ya modul təyin edilməyib');
            return res.status(400).json({ error: 'Fənn və modul tələb olunur' });
        }
        
        // Əgər fənn və ya modul yoxdursa, yarat
        if (!data.files[subject]) {
            data.files[subject] = { lecture: [], colloquium: [], seminar: [] };
        }
        if (!data.files[subject][module]) {
            data.files[subject][module] = [];
        }
        
        const fileData = {
            id: uuidv4(),
            filename: req.file.filename,
            originalname: req.file.originalname,
            url: getFileUrl(req.file.filename), // TAM URL İSTİFADƏSİ
            path: req.file.path,
            size: req.file.size,
            type: type || (req.file.originalname.toLowerCase().endsWith('.pdf') ? 'pdf' : 'word'),
            uploadedAt: new Date().toISOString()
        };
        
        data.files[subject][module].push(fileData);
        console.log('Fayl uğurla əlavə edildi:', fileData);
        
        res.json({ 
            success: true, 
            message: 'Fayl uğurla yükləndi',
            file: fileData
        });
        
    } catch (error) {
        console.error('Fayl yükləmə xətası:', error);
        res.status(500).json({ error: 'Fayl yükləmə xətası: ' + error.message });
    }
});

// Şifrə yenilə
app.post('/api/update-password', async (req, res) => {
    const { teacher, currentPassword, newPassword } = req.body;
    
    if (!data.teachers[teacher]) {
        return res.json({ success: false, message: 'Müəllim tapılmadı' });
    }
    
    const teacherData = data.teachers[teacher];
    const validCurrentPassword = await bcrypt.compare(currentPassword, teacherData.password);
    
    if (!validCurrentPassword) {
        return res.json({ success: false, message: 'Hazırki şifrə yanlışdır' });
    }
    
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    teacherData.password = hashedNewPassword;
    
    res.json({ success: true, message: 'Şifrə uğurla yeniləndi' });
});

// Fayl adını yenilə
app.post('/api/update-filename', (req, res) => {
    const { fileId, module, subject, newName } = req.body;
    
    if (!data.files[subject] || !data.files[subject][module]) {
        return res.json({ success: false, message: 'Fayl tapılmadı' });
    }
    
    const fileIndex = data.files[subject][module].findIndex(file => file.id === fileId);
    
    if (fileIndex === -1) {
        return res.json({ success: false, message: 'Fayl tapılmadı' });
    }
    
    data.files[subject][module][fileIndex].originalname = newName;
    
    res.json({ success: true, message: 'Fayl adı uğurla yeniləndi' });
});

// Faylı sil
app.post('/api/delete-file', (req, res) => {
    const { fileId, module, subject } = req.body;
    
    if (!data.files[subject] || !data.files[subject][module]) {
        return res.json({ success: false, message: 'Fayl tapılmadı' });
    }
    
    const fileIndex = data.files[subject][module].findIndex(file => file.id === fileId);
    
    if (fileIndex === -1) {
        return res.json({ success: false, message: 'Fayl tapılmadı' });
    }
    
    const file = data.files[subject][module][fileIndex];
    
    try {
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log('Fiziki fayl silindi:', file.path);
        }
    } catch (error) {
        console.log('Fiziki fayl silinmədi:', error.message);
    }
    
    data.files[subject][module].splice(fileIndex, 1);
    
    res.json({ success: true, message: 'Fayl uğurla silindi' });
});

// Bütün digər route-lar üçün frontend göndər
app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Səhifə tapılmadı');
    }
});

// Xəta idarəetmə
app.use((error, req, res, next) => {
    console.error('Server xətası:', error);
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Fayl həcmi çox böyükdür (maksimum 10MB)' });
        }
    }
    res.status(500).json({ error: 'Server xətası: ' + error.message });
});

// Serveri başlat
app.listen(PORT, async () => {
    await hashPasswords();
    console.log(`Server http://localhost:${PORT} ünvanında işləyir`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend qovluğu: ${frontendPath}`);
    console.log('API Endpoints:');
    console.log('  GET  /api/status - Server status');
    console.log('  GET  /api/data - Bütün fayl məlumatları');
    console.log('  GET  /api/files/:subject/:module - Müəyyən fənn/modul faylları');
    console.log('  POST /api/upload - Fayl yüklə');
    console.log('  POST /api/teacher-login - Müəllim girişi');
    console.log('  POST /api/module-login - Modul girişi');
});
