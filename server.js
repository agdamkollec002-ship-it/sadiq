// server.js - CORS ilə
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

// CORS Konfiqurasiyası - GitHub Pages üçün
const allowedOrigins = [
    'https://yourusername.github.io', // GitHub Pages domain-ini yaz
    'http://localhost:3000',
    'http://localhost:5500'
];

app.use(cors({
    origin: function (origin, callback) {
        // Postman və ya origin olmayan sorğulara icazə ver
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'CORS siyasəti bu origin-ə icazə vermir';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

// Middleware
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Data qovluğunu yoxla/yarat
const dataPath = path.join(__dirname, 'data');
const uploadsPath = path.join(__dirname, 'uploads');

[dataPath, uploadsPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ ${dir} qovluğu yaradıldı`);
    }
});

// JSON fayllarının yolları
const filesJsonPath = path.join(dataPath, 'files.json');
const teachersJsonPath = path.join(dataPath, 'teachers.json');
const modulesJsonPath = path.join(dataPath, 'modules.json');

// JSON fayllarını oxuyan/yazan funksiyalar
function readJSON(filePath, defaultValue = {}) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (error) {
        console.error(`❌ ${filePath} oxuma xətası:`, error);
    }
    writeJSON(filePath, defaultValue);
    return defaultValue;
}

function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`❌ ${filePath} yazma xətası:`, error);
        return false;
    }
}

// İlkin məlumatları yoxla/yarat
async function initializeData() {
    const filesData = readJSON(filesJsonPath, {
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
    });

    const teachersData = readJSON(teachersJsonPath, {});
    if (Object.keys(teachersData).length === 0) {
        const hashedPassword = await bcrypt.hash('pass1234', 10);
        const initialTeachers = {
            'Nəqliyyat': { password: hashedPassword, subject: 'transport' },
            'Kompyuter sistemləri': { password: hashedPassword, subject: 'computer' },
            'Riyaziyyat': { password: hashedPassword, subject: 'math' },
            'İqtisadiyyat': { password: hashedPassword, subject: 'economics' },
            'Azərbaycan dili': { password: hashedPassword, subject: 'azerbaijani' },
            'Ingilis dili': { password: hashedPassword, subject: 'english' },
            'Fiziki tərbiyə': { password: hashedPassword, subject: 'physical' },
            'Pedaqogika': { password: hashedPassword, subject: 'pedagogy' },
            'Kənd təsərrüfatı': { password: hashedPassword, subject: 'agriculture' },
            'Tarix': { password: hashedPassword, subject: 'history' }
        };
        writeJSON(teachersJsonPath, initialTeachers);
    }

    const modulesData = readJSON(modulesJsonPath, {});
    if (Object.keys(modulesData).length === 0) {
        const hashedPassword = await bcrypt.hash('pass1234', 10);
        const initialModules = {
            'transport': { username: 'neqliyyat', password: hashedPassword },
            'computer': { username: 'kompyuter', password: hashedPassword },
            'math': { username: 'riyaziyyat', password: hashedPassword },
            'economics': { username: 'iqtisadiyyat', password: hashedPassword },
            'azerbaijani': { username: 'azdili', password: hashedPassword },
            'english': { username: 'ingilisdili', password: hashedPassword },
            'physical': { username: 'fiziki', password: hashedPassword },
            'pedagogy': { username: 'pedagogiya', password: hashedPassword },
            'agriculture': { username: 'kend', password: hashedPassword },
            'history': { username: 'tarix', password: hashedPassword }
        };
        writeJSON(modulesJsonPath, initialModules);
    }

    console.log('✅ İlkin məlumatlar yoxlanıldı');
}

// File upload konfiqurasiyası
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
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
        cb(null, allowedTypes.includes(fileExt));
    },
    limits: { fileSize: 10 * 1024 * 1024 }
});

// API Routes
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'Server işləyir', 
        timestamp: new Date().toISOString(),
        cors: 'GitHub Pages üçün konfiqurasiya edilib'
    });
});

app.get('/api/data', (req, res) => {
    res.json(readJSON(filesJsonPath));
});

app.get('/api/teachers', (req, res) => {
    res.json(readJSON(teachersJsonPath));
});

app.get('/api/modules', (req, res) => {
    res.json(readJSON(modulesJsonPath));
});

app.get('/api/files/:subject/:module', (req, res) => {
    const { subject, module } = req.params;
    const filesData = readJSON(filesJsonPath);
    res.json(filesData[subject]?.[module] || []);
});

app.get('/api/teacher-files/:subject', (req, res) => {
    const { subject } = req.params;
    const filesData = readJSON(filesJsonPath);
    res.json(filesData[subject] || { lecture: [], colloquium: [], seminar: [] });
});

app.post('/api/module-login', async (req, res) => {
    const { subject, username, password } = req.body;
    const modulesData = readJSON(modulesJsonPath);
    
    const module = modulesData[subject];
    if (!module) return res.json({ success: false, message: 'Modul tapılmadı' });
    
    const validUsername = username === module.username;
    const validPassword = await bcrypt.compare(password, module.password);
    
    if (validUsername && validPassword) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }
});

app.post('/api/teacher-login', async (req, res) => {
    const { username, password } = req.body;
    const teachersData = readJSON(teachersJsonPath);
    
    const teacher = teachersData[username];
    if (!teacher) return res.json({ success: false, message: 'Müəllim tapılmadı' });
    
    const validPassword = await bcrypt.compare(password, teacher.password);
    
    if (validPassword) {
        res.json({ 
            success: true, 
            subject: teacher.subject, 
            teacher: username 
        });
    } else {
        res.json({ success: false, message: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Fayl yüklənmədi' });
        }
        
        const { subject, module, type } = req.body;
        
        const filesData = readJSON(filesJsonPath);
        
        if (!filesData[subject]) {
            filesData[subject] = { lecture: [], colloquium: [], seminar: [] };
        }
        if (!filesData[subject][module]) {
            filesData[subject][module] = [];
        }
        
        const fileData = {
            id: uuidv4(),
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            type: type,
            uploadedAt: new Date().toISOString()
        };
        
        filesData[subject][module].push(fileData);
        writeJSON(filesJsonPath, filesData);
        
        console.log('✅ Fayl yükləndi:', fileData.originalname);
        
        res.json({ 
            success: true, 
            message: 'Fayl uğurla yükləndi',
            file: {
                id: fileData.id,
                filename: fileData.filename,
                originalname: fileData.originalname,
                type: fileData.type
            }
        });
        
    } catch (error) {
        console.error('Fayl yükləmə xətası:', error);
        res.status(500).json({ error: 'Fayl yükləmə xətası: ' + error.message });
    }
});

app.post('/api/update-password', async (req, res) => {
    try {
        const { teacher, currentPassword, newPassword } = req.body;
        const teachersData = readJSON(teachersJsonPath);
        
        if (!teachersData[teacher]) {
            return res.json({ success: false, message: 'Müəllim tapılmadı' });
        }
        
        const teacherData = teachersData[teacher];
        const validCurrentPassword = await bcrypt.compare(currentPassword, teacherData.password);
        
        if (!validCurrentPassword) {
            return res.json({ success: false, message: 'Hazırki şifrə yanlışdır' });
        }
        
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        teacherData.password = hashedNewPassword;
        
        writeJSON(teachersJsonPath, teachersData);
        
        res.json({ success: true, message: 'Şifrə uğurla yeniləndi' });
    } catch (error) {
        console.error('Şifrə yeniləmə xətası:', error);
        res.status(500).json({ error: 'Server xətası' });
    }
});

app.post('/api/update-filename', (req, res) => {
    try {
        const { fileId, module, subject, newName } = req.body;
        const filesData = readJSON(filesJsonPath);
        
        if (!filesData[subject] || !filesData[subject][module]) {
            return res.json({ success: false, message: 'Fayl tapılmadı' });
        }
        
        const fileIndex = filesData[subject][module].findIndex(file => file.id === fileId);
        
        if (fileIndex === -1) {
            return res.json({ success: false, message: 'Fayl tapılmadı' });
        }
        
        filesData[subject][module][fileIndex].originalname = newName;
        writeJSON(filesJsonPath, filesData);
        
        res.json({ success: true, message: 'Fayl adı uğurla yeniləndi' });
    } catch (error) {
        console.error('Fayl adı yeniləmə xətası:', error);
        res.status(500).json({ error: 'Server xətası' });
    }
});

app.post('/api/delete-file', (req, res) => {
    try {
        const { fileId, module, subject } = req.body;
        const filesData = readJSON(filesJsonPath);
        
        if (!filesData[subject] || !filesData[subject][module]) {
            return res.json({ success: false, message: 'Fayl tapılmadı' });
        }
        
        const fileIndex = filesData[subject][module].findIndex(file => file.id === fileId);
        
        if (fileIndex === -1) {
            return res.json({ success: false, message: 'Fayl tapılmadı' });
        }
        
        const file = filesData[subject][module][fileIndex];
        
        try {
            fs.unlinkSync(file.path);
            console.log('✅ Fiziki fayl silindi:', file.path);
        } catch (error) {
            console.log('⚠️ Fiziki fayl silinmədi:', error.message);
        }
        
        filesData[subject][module].splice(fileIndex, 1);
        writeJSON(filesJsonPath, filesData);
        
        res.json({ success: true, message: 'Fayl uğurla silindi' });
    } catch (error) {
        console.error('Fayl silmə xətası:', error);
        res.status(500).json({ error: 'Server xətası' });
    }
});

// Serveri başlat
async function startServer() {
    try {
        await initializeData();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server http://localhost:${PORT} ünvanında işləyir`);
            console.log(`🌍 CORS konfiqurasiya edilib - GitHub Pages üçün hazırdır`);
            console.log(`📁 Data qovluğu: ${dataPath}`);
        });
    } catch (error) {
        console.error('❌ Server başlatma xətası:', error);
        process.exit(1);
    }
}

startServer();
