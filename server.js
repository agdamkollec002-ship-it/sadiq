const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: [
        'https://agdamkollec002-ship-it.github.io',
        'https://agdamkollec002-ship-it.github.io/sadiq',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload qovluğunu yoxla/yarat
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Fayl saxlama konfiqurasiyası
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Fayl adındakı Azərbaycanca və ya digər qeyri-latın simvolları "_" ilə əvəz etmək üçün daha sərt məntiq
        const sanitizedOriginalName = file.originalname.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, uniqueSuffix + '-' + sanitizedOriginalName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.zip', '.rar'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Yalnız PDF, Word, PowerPoint, Excel, text və arxiv fayllarına icazə verilir!'));
        }
    },
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Məlumat faylları
const DATA_FILE = 'data.json';
const TEACHERS_FILE = 'teachers.json';
const MODULES_FILE = 'modules.json';

// Məlumat fayllarını yoxla/yarat
function initializeDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        const defaultData = {
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
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
        console.log('✅ Data faylı yaradıldı');
    }
}

function initializeTeachersFile() {
    if (!fs.existsSync(TEACHERS_FILE)) {
        const defaultTeachers = {
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
        fs.writeFileSync(TEACHERS_FILE, JSON.stringify(defaultTeachers, null, 2));
        console.log('✅ Teachers faylı yaradıldı');
    }
}

function initializeModulesFile() {
    if (!fs.existsSync(MODULES_FILE)) {
        const defaultModules = {
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
        fs.writeFileSync(MODULES_FILE, JSON.stringify(defaultModules, null, 2));
        console.log('✅ Modules faylı yaradıldı');
    }
}

// İlkin məlumatları yüklə
initializeDataFile();
initializeTeachersFile();
initializeModulesFile();

// ==================== API ROUTES ====================

// Server status endpoint
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'Server is running', 
        timestamp: new Date().toISOString()
    });
});

// Bütün məlumatları getir
app.get('/api/data', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Data yükləmə xətası:', error);
        res.status(500).json({ 
            success: false,
            error: 'Məlumatlar yüklənərkən xəta baş verdi' 
        });
    }
});

// Müəllim məlumatlarını getir
app.get('/api/teachers', (req, res) => {
    try {
        const teachers = JSON.parse(fs.readFileSync(TEACHERS_FILE, 'utf8'));
        
        // Şifrələri gizlət
        const teachersWithoutPasswords = {};
        Object.keys(teachers).forEach(key => {
            teachersWithoutPasswords[key] = { ...teachers[key] };
            delete teachersWithoutPasswords[key].password;
        });
        
        res.json({
            success: true,
            teachers: teachersWithoutPasswords
        });
    } catch (error) {
        console.error('Teachers yükləmə xətası:', error);
        res.status(500).json({ 
            success: false,
            error: 'Müəllim məlumatları yüklənərkən xəta baş verdi' 
        });
    }
});

// Modul məlumatlarını getir
app.get('/api/modules', (req, res) => {
    try {
        const modules = JSON.parse(fs.readFileSync(MODULES_FILE, 'utf8'));
        res.json({
            success: true,
            modules: modules
        });
    } catch (error) {
        console.error('Modules yükləmə xətası:', error);
        res.status(500).json({ 
            success: false,
            error: 'Modul məlumatları yüklənərkən xəta baş verdi' 
        });
    }
});

// Müəyyən fənn və modulun fayllarını getir
app.get('/api/files/:subject/:module', (req, res) => {
    try {
        const { subject, module } = req.params;
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        
        if (data[subject] && data[subject][module]) {
            res.json({
                success: true,
                files: data[subject][module]
            });
        } else {
            res.json({
                success: true,
                files: []
            });
        }
    } catch (error) {
        console.error('Fayllar yükləmə xətası:', error);
        res.status(500).json({ 
            success: false,
            error: 'Fayllar yüklənərkən xəta baş verdi' 
        });
    }
});

// Müəllim giriş endpointində kiçik düzəliş
app.post('/api/teacher-login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log(`\n=================================`);
        console.log(`🔎 YENİ GİRİŞ CƏHDİ`);
        console.log(`🔎 Req.Body:`, req.body);
        console.log(`🔎 Yoxlanılan: "${username}", Şifrə: "${password}"`);
        
        if (!username || !password) {
            return res.json({
                success: false,
                message: 'Fənn adı və şifrə tələb olunur'
            });
        }
        
        const teachers = JSON.parse(fs.readFileSync(TEACHERS_FILE, 'utf8'));
        
        // Daha ağıllı axtarış
        let foundTeacherEntry = Object.entries(teachers).find(([teacherName, data]) => {
            // 1. Fənnin tam adı ilə yoxla (məsələn, "Nəqliyyat")
            const isNameMatch = teacherName === username;
            
            // 2. Fənnin kodu ilə yoxla (məsələn, "transport") 
            const isSubjectCodeMatch = data.subject === username;
            
            // 3. Axtarışı asanlaşdırmaq üçün
            const normalizedTeacherName = teacherName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
            const isNormalizedMatch = normalizedTeacherName.includes(normalizedUsername) || 
                                     normalizedUsername.includes(normalizedTeacherName);
            
            return isNameMatch || isSubjectCodeMatch || isNormalizedMatch;
        });

        if (foundTeacherEntry) {
            const [teacherName, foundTeacher] = foundTeacherEntry;

            if (foundTeacher.password === password) {
                console.log(`✅ Müəllim girişi UĞURLU: ${teacherName} -> ${foundTeacher.subject}`);
                
                res.json({ 
                    success: true, 
                    subject: foundTeacher.subject,
                    teacherName: teacherName,
                    message: 'Uğurlu giriş'
                });
            } else {
                console.log(`❌ Uğursuz giriş cəhdi: ${teacherName} (Yanlış Şifrə)`);
                
                res.json({ 
                    success: false, 
                    message: 'Fənn adı və ya şifrə yanlışdır' 
                });
            }
        } else {
            console.log(`❌ Uğursuz giriş cəhdi: "${username}" (Fənn Adı Tapılmadı)`);
            console.log(`📋 Mövcud fənnlər:`, Object.keys(teachers));
            
            res.json({ 
                success: false, 
                message: 'Fənn adı və ya şifrə yanlışdır' 
            });
        }
    } catch (error) {
        console.error('Teacher login xətası:', error);
        res.status(500).json({ 
            success: false,
            error: 'Giriş zamanı xəta baş verdi' 
        });
    }
});

// Fayl yüklə
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'Fayl yüklənmədi' 
            });
        }

        const { subject, module, type } = req.body;
        
        if (!subject || !module) {
            // Faylı silin, çünki meta-məlumat yoxdur
            fs.unlinkSync(`uploads/${req.file.filename}`); 
            return res.status(400).json({ 
                success: false,
                error: 'Fənn və modul tələb olunur' 
            });
        }

        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        
        if (!data[subject]) {
            data[subject] = { lecture: [], colloquium: [], seminar: [] };
        }

        const newFile = {
            id: Date.now(),
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: `/uploads/${req.file.filename}`,
            type: type || 'other',
            uploadedAt: new Date().toISOString(),
            size: req.file.size
        };

        // Modul mövcudluğunu yoxla
        if (!data[subject][module]) {
            // Qeyri-mümkün modul növü gəlibsə
            fs.unlinkSync(`uploads/${req.file.filename}`);
            return res.status(400).json({
                success: false,
                error: 'Yanlış modul növü (lecture, colloquium, seminar olmalıdır)'
            });
        }


        data[subject][module].push(newFile);
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

        console.log(`📁 Yeni fayl yükləndi: ${req.file.originalname} -> ${subject}/${module}`);

        res.json({
            success: true,
            message: 'Fayl uğurla yükləndi',
            file: newFile
        });

    } catch (error) {
        console.error('Fayl yükləmə xətası:', error);
        // Multer xətasını idarə et
        if (error.code === 'LIMIT_FILE_SIZE') {
             return res.status(400).json({ 
                success: false,
                error: 'Fayl limiti aşıldı (Max 100MB)'
            });
        }
        res.status(500).json({ 
            success: false,
            error: 'Fayl yüklənərkən xəta baş verdi: ' + error.message 
        });
    }
});

// Müəllimin fayllarını getir
app.get('/api/teacher-files/:subject', (req, res) => {
    try {
        const { subject } = req.params;
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        
        if (data[subject]) {
            res.json({
                success: true,
                files: data[subject]
            });
        } else {
            res.json({
                success: true,
                files: { lecture: [], colloquium: [], seminar: [] }
            });
        }
    } catch (error) {
        console.error('Teacher files yükləmə xətası:', error);
        res.status(500).json({ 
            success: false,
            error: 'Fayllar yüklənərkən xəta baş verdi' 
        });
    }
});

// Şifrə yenilə
app.post('/api/update-password', (req, res) => {
    try {
        const { teacher, currentPassword, newPassword } = req.body;
        
        if (!teacher || !currentPassword || !newPassword) {
            return res.json({
                success: false,
                message: 'Bütün sahələr tələb olunur'
            });
        }

        const teachers = JSON.parse(fs.readFileSync(TEACHERS_FILE, 'utf8'));
        
        // Frontend subject key-lərini backend teacher adlarına çevir
        const subjectToTeacherMapping = {
            'transport': 'Nəqliyyat', 'computer': 'Kompyuter sistemləri',
            'math': 'Riyaziyyat', 'economics': 'İqtisadiyyat',
            'azerbaijani': 'Azərbaycan dili', 'english': 'İngilis dili',
            'physical': 'Fiziki tərbiyə', 'pedagogy': 'Pedaqogika',
            'agriculture': 'Kənd təsərrüfatı', 'history': 'Tarix'
        };
        
        const teacherName = subjectToTeacherMapping[teacher]; // Yalnız kodla axtarırıq
        
        if (teacherName && teachers[teacherName] && teachers[teacherName].password === currentPassword) {
            teachers[teacherName].password = newPassword;
            
            fs.writeFileSync(TEACHERS_FILE, JSON.stringify(teachers, null, 2));
            
            console.log(`🔑 Şifrə yeniləndi: ${teacherName}`);
            
            res.json({ 
                success: true, 
                message: 'Şifrə uğurla yeniləndi' 
            });
        } else {
            res.json({ 
                success: false, 
                message: 'Hazırki şifrə yanlışdır' 
            });
        }
    } catch (error) {
        console.error('Şifrə yeniləmə xətası:', error);
        res.status(500).json({ 
            success: false,
            error: 'Şifrə yenilənərkən xəta baş verdi' 
        });
    }
});

// Fayl adını yenilə
app.post('/api/update-filename', (req, res) => {
    try {
        const { fileId, module, subject, newName } = req.body;
        
        if (!fileId || !module || !subject || !newName) {
            return res.json({
                success: false,
                message: 'Bütün sahələr tələb olunur'
            });
        }

        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        
        if (data[subject] && data[subject][module]) {
            const fileIndex = data[subject][module].findIndex(f => f.id == fileId);
            if (fileIndex !== -1) {
                data[subject][module][fileIndex].originalname = newName;
                
                fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
                
                console.log(`✏️ Fayl adı yeniləndi: ${subject}/${module} -> ${newName}`);
                
                res.json({ 
                    success: true, 
                    message: 'Fayl adı uğurla yeniləndi'
                });
            } else {
                res.json({ 
                    success: false, 
                    message: 'Fayl tapılmadı' 
                });
            }
        } else {
            res.json({ 
                success: false, 
                message: 'Fənn və ya modul tapılmadı' 
            });
        }
    } catch (error) {
        console.error('Fayl adı yeniləmə xətası:', error);
        res.status(500).json({ 
            success: false,
            error: 'Fayl adı yenilənərkən xəta baş verdi' 
        });
    }
});

// Faylı sil
app.post('/api/delete-file', (req, res) => {
    try {
        const { fileId, module, subject } = req.body;
        
        if (!fileId || !module || !subject) {
            return res.json({
                success: false,
                message: 'Bütün sahələr tələb olunur'
            });
        }

        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        
        if (data[subject] && data[subject][module]) {
            const fileIndex = data[subject][module].findIndex(f => f.id == fileId);
            if (fileIndex !== -1) {
                const deletedFile = data[subject][module].splice(fileIndex, 1)[0];
                
                // Faylı fiziki olaraq sil
                if (fs.existsSync(`uploads/${deletedFile.filename}`)) {
                    fs.unlinkSync(`uploads/${deletedFile.filename}`);
                }
                
                fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
                
                console.log(`🗑️ Fayl silindi: ${subject}/${module} -> ${deletedFile.originalname}`);
                
                res.json({ 
                    success: true, 
                    message: 'Fayl uğurla silindi'
                });
            } else {
                res.json({ 
                    success: false, 
                    message: 'Fayl tapılmadı' 
                });
            }
        } else {
            res.json({ 
                success: false, 
                message: 'Fənn və ya modul tapılmadı' 
            });
        }
    } catch (error) {
        console.error('Fayl silmə xətası:', error);
        res.status(500).json({ 
            success: false,
            error: 'Fayl silinərkən xəta baş verdi' 
        });
    }
});

// Əsas səhifə
app.get('/', (req, res) => {
    res.json({ 
        message: 'Ağdam Dövlət Sosial-İqtisadi Kolleci Fayl Serveri',
        version: '2.3.0 (Login Fix)'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint tapılmadı'
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server xətası:', error);
    res.status(500).json({
        success: false,
        error: 'Daxili server xətası'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================`);
    console.log(`🚀 Server Render üzərində PORT ${PORT} ünvanında işləyir`);
    console.log(`🌐 URL: https://your-app-name.onrender.com`);
    console.log(`📁 Uploads qovluğu: ${path.join(__dirname, 'uploads')}`);
    console.log(`🕒 Başlama vaxtı: ${new Date().toLocaleString('az-AZ')}`);
    console.log(`✅ Render üçün hazırdır!`);
    console.log(`=================================`);
});

