// Initialize IndexedDB
let db;
const DB_NAME = 'KnuDormitoryDB';
const DB_VERSION = 1;

// Open or create IndexedDB
const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onerror = function(event) {
    console.error('Database error:', event.target.error);
};

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    
    // Create object store for users
    const usersStore = db.createObjectStore('users', { keyPath: 'login' });
    usersStore.createIndex('approved', 'approved', { unique: false });
    
    // Create object store for pending users
    const pendingStore = db.createObjectStore('pendingUsers', { keyPath: 'login' });
    
    // Create object store for passes
    const passesStore = db.createObjectStore('passes', { autoIncrement: true });
    passesStore.createIndex('login', 'login', { unique: false });
    
    // Create object store for admins
    const adminsStore = db.createObjectStore('admins', { keyPath: 'login' });
    
    // Add default admin
    adminsStore.add({
        login: 'admin',
        password: 'admin123',
        name: 'Головний адміністратор'
    });
    
    // Add test user
    usersStore.add({
        login: 'student1',
        password: 'pass123',
        fullName: 'Петренко Іван Олександрович',
        studentId: 'КН-12345678',
        dormitory: 'Гуртожиток №2',
        room: '315',
        approved: true,
        photoData: '',
        studentIdPhotoData: ''
    });
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log('Database initialized');
    
    // Check if we need to add test data
    checkAndAddTestData();
};

function checkAndAddTestData() {
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get('student1');
    
    request.onsuccess = function() {
        if (!request.result) {
            addTestData();
        }
    };
}

function addTestData() {
    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    
    store.add({
        login: 'student1',
        password: 'pass123',
        fullName: 'Петренко Іван Олександрович',
        studentId: 'КН-12345678',
        dormitory: 'Гуртожиток №2',
        room: '315',
        approved: true,
        photoData: '',
        studentIdPhotoData: ''
    });
}

// DOM Elements
const switchToAdminBtn = document.getElementById('switchToAdminBtn');
const switchToStudentBtn = document.getElementById('switchToStudentBtn');
const adminAuthScreen = document.getElementById('adminAuthScreen');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminDashboardScreen = document.getElementById('adminDashboardScreen');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const pendingUsersContainer = document.getElementById('pendingUsersContainer');
const authScreen = document.getElementById('authScreen');
const registerScreen = document.getElementById('registerScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const registerBtn = document.getElementById('registerBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const generatePassBtn = document.getElementById('generatePassBtn');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const qrCodeCanvas = document.getElementById('qrCodeCanvas');
const userInfo = document.getElementById('userInfo');
const passHistory = document.getElementById('passHistory');
const photoInput = document.getElementById('photo');
const photoPreview = document.getElementById('photoPreview');

// Current user
let currentUser = null;

// Event Listeners
switchToAdminBtn.addEventListener('click', () => {
    authScreen.classList.add('hidden');
    adminAuthScreen.classList.remove('hidden');
    switchToAdminBtn.classList.add('hidden');
    switchToStudentBtn.classList.remove('hidden');
});

switchToStudentBtn.addEventListener('click', () => {
    authScreen.classList.remove('hidden');
    adminAuthScreen.classList.add('hidden');
    switchToAdminBtn.classList.remove('hidden');
    switchToStudentBtn.classList.add('hidden');
});

adminLoginForm.addEventListener('submit', handleAdminLogin);
adminLogoutBtn.addEventListener('click', adminLogout);
registerBtn.addEventListener('click', showRegisterScreen);
backToLoginBtn.addEventListener('click', showLoginScreen);
logoutBtn.addEventListener('click', logout);
generatePassBtn.addEventListener('click', generatePass);
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
document.getElementById('backToLoginBtnAdmin').addEventListener('click', () => {
    adminAuthScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
});

// Photo preview for registration form
photoInput.addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            photoPreview.src = event.target.result;
            photoPreview.style.display = 'block';
        };
        
        reader.readAsDataURL(file);
    }
});

// Functions
function handleAdminLogin(e) {
    e.preventDefault();
    
    const login = document.getElementById('adminLogin').value;
    const password = document.getElementById('adminPassword').value;
    
    const transaction = db.transaction(['admins'], 'readonly');
    const store = transaction.objectStore('admins');
    const request = store.get(login);
    
    request.onsuccess = function() {
        const admin = request.result;
        if (admin && admin.password === password) {
            showAdminDashboard();
        } else {
            showError('Невірний логін або пароль адміністратора');
        }
    };
}

function showAdminDashboard() {
    adminAuthScreen.classList.add('hidden');
    adminDashboardScreen.classList.remove('hidden');
    loadPendingUsers();
}

function adminLogout() {
    adminDashboardScreen.classList.add('hidden');
    adminAuthScreen.classList.remove('hidden');
    document.getElementById('adminLoginForm').reset();
}

function loadPendingUsers() {
    const transaction = db.transaction(['pendingUsers'], 'readonly');
    const store = transaction.objectStore('pendingUsers');
    const request = store.getAll();
    
    request.onsuccess = function() {
        const pendingUsers = request.result;
        
        pendingUsersContainer.innerHTML = pendingUsers.map((user, index) => `
            <div class="border border-gray-200 rounded-lg p-3 sm:p-4">
                <p class="font-medium text-sm sm:text-base">${user.fullName}</p>
                <p class="text-xs sm:text-sm text-gray-600">Студ. квиток: ${user.studentId}</p>
                <p class="text-xs sm:text-sm text-gray-600">Гуртожиток: ${user.dormitory}, Кімната: ${user.room}</p>
                <div class="flex items-center justify-between mt-3 sm:mt-4">
                    <div class="flex space-x-2">
                        <img src="${user.photoData}" class="w-12 sm:w-16 h-15 sm:h-20 object-cover border rounded">
                        <img src="${user.studentIdPhotoData}" class="w-12 sm:w-16 h-15 sm:h-20 object-cover border rounded">
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="approveUser('${user.login}')" class="text-white bg-green-500 hover:bg-green-600 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm">
                            <i class="fas fa-check mr-1"></i> Підтвердити
                        </button>
                        <button onclick="rejectUser('${user.login}')" class="text-white bg-red-500 hover:bg-red-600 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm">
                            <i class="fas fa-times mr-1"></i> Відхилити
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        if (pendingUsers.length === 0) {
            pendingUsersContainer.innerHTML = `
                <p class="text-gray-500 text-center text-sm sm:text-base">Немає заявок на реєстрацію</p>
            `;
        }
    };
}

function approveUser(login) {
    const transaction1 = db.transaction(['pendingUsers'], 'readwrite');
    const pendingStore = transaction1.objectStore('pendingUsers');
    const getRequest = pendingStore.get(login);
    
    getRequest.onsuccess = function() {
        const user = getRequest.result;
        if (user) {
            user.approved = true;
            
            const transaction2 = db.transaction(['users'], 'readwrite');
            const usersStore = transaction2.objectStore('users');
            usersStore.add(user);
            
            const transaction3 = db.transaction(['pendingUsers'], 'readwrite');
            const pendingStoreDelete = transaction3.objectStore('pendingUsers');
            pendingStoreDelete.delete(login);
            
            loadPendingUsers();
            alert('Користувача успішно підтверджено!');
        }
    };
}

function rejectUser(login) {
    const transaction = db.transaction(['pendingUsers'], 'readwrite');
    const store = transaction.objectStore('pendingUsers');
    const request = store.delete(login);
    
    request.onsuccess = function() {
        loadPendingUsers();
        alert('Користувача успішно відхилено!');
    };
}

function showRegisterScreen() {
    authScreen.classList.add('hidden');
    registerScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
}

function showLoginScreen() {
    authScreen.classList.remove('hidden');
    registerScreen.classList.add('hidden');
    dashboardScreen.classList.add('hidden');
}

function showDashboardScreen() {
    authScreen.classList.add('hidden');
    registerScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    loadUserData();
}

function handleLogin(e) {
    e.preventDefault();
    
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;
    
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(login);
    
    request.onsuccess = function() {
        const user = request.result;
        if (user && user.password === password && user.approved) {
            currentUser = user;
            showDashboardScreen();
        } else {
            showError('Невірний логін, пароль або акаунт ще не підтверджено');
        }
    };
}

async function handleRegister(e) {
    e.preventDefault();
    
    const login = document.getElementById('regLogin').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const fullName = document.getElementById('fullName').value;
    const studentId = document.getElementById('studentId').value;
    const dormitory = document.getElementById('dormitory').value;
    const room = document.getElementById('room').value;
    
    // Validation
    if (password !== confirmPassword) {
        showError('Паролі не співпадають', 'regPassword');
        showError('Паролі не співпадають', 'regConfirmPassword');
        return;
    }
    
    // Check if login already exists in users or pendingUsers
    const transaction1 = db.transaction(['users'], 'readonly');
    const usersStore = transaction1.objectStore('users');
    const userRequest = usersStore.get(login);
    
    const transaction2 = db.transaction(['pendingUsers'], 'readonly');
    const pendingStore = transaction2.objectStore('pendingUsers');
    const pendingRequest = pendingStore.get(login);
    
    Promise.all([
        new Promise((resolve) => {
            userRequest.onsuccess = () => resolve(userRequest.result);
        }),
        new Promise((resolve) => {
            pendingRequest.onsuccess = () => resolve(pendingRequest.result);
        })
    ]).then(([user, pendingUser]) => {
        if (user || pendingUser) {
            showError('Такий логін вже існує', 'regLogin');
            return;
        }
        
        // Create new user
        // Read photos as data URLs
        const photoFile = document.getElementById('photo').files[0];
        const studentIdPhotoFile = document.getElementById('studentIdPhoto').files[0];
        
        if (!photoFile || !studentIdPhotoFile) {
            showError('Будь ласка, завантажте обидві фотографії');
            return;
        }
        
        const getBase64 = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        Promise.all([
            getBase64(photoFile),
            getBase64(studentIdPhotoFile)
        ]).then(([photoData, studentIdPhotoData]) => {
            const newUser = {
                login,
                password,
                fullName,
                studentId,
                dormitory,
                room,
                photoData,
                studentIdPhotoData,
                approved: false
            };
            
            const transaction = db.transaction(['pendingUsers'], 'readwrite');
            const store = transaction.objectStore('pendingUsers');
            store.add(newUser);
            
            // Clear form
            registerForm.reset();
            photoPreview.style.display = 'none';
            
            // Show success message and go to login
            alert('Реєстрація успішна! Тепер ви можете увійти.');
            showLoginScreen();
        }).catch(error => {
            console.error('Error reading files:', error);
            showError('Помилка при завантаженні фотографій');
        });
    });
}

function logout() {
    currentUser = null;
    showLoginScreen();
    qrCodeContainer.classList.add('hidden');
}

function loadUserData() {
    if (!currentUser) return;
    
    userInfo.innerHTML = `
        <p><span class="font-medium">ПІБ:</span> ${currentUser.fullName}</p>
        <p><span class="font-medium">Студентський квиток:</span> ${currentUser.studentId}</p>
        <p><span class="font-medium">Гуртожиток:</span> ${currentUser.dormitory}</p>
        <p><span class="font-medium">Кімната:</span> ${currentUser.room}</p>
    `;
    
    if (currentUser.photoData) {
        document.getElementById('userPhotoPreview').src = currentUser.photoData;
    }
    if (currentUser.studentIdPhotoData) {
        document.getElementById('studentIdPhotoPreview').src = currentUser.studentIdPhotoData;
    }
    
    // Load pass history
    loadPassHistory();
}

function loadPassHistory() {
    if (!currentUser) return;
    
    const transaction = db.transaction(['passes'], 'readonly');
    const store = transaction.objectStore('passes');
    const index = store.index('login');
    const request = index.getAll(currentUser.login);
    
    request.onsuccess = function() {
        const userPasses = request.result
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10); // show only last 10 passes
        
        passHistory.innerHTML = userPasses.map(pass => `
            <tr class="border-t border-gray-200">
                <td class="py-1 px-1 sm:px-2 text-xs">${new Date(pass.date).toLocaleString()}</td>
                <td class="py-1 px-1 sm:px-2 text-xs">${pass.used ? 'Використано' : 'Активний'}</td>
            </tr>
        `).join('');
        
        if (userPasses.length === 0) {
            passHistory.innerHTML = `
                <tr class="border-t border-gray-200">
                    <td colspan="2" class="py-2 px-2 text-center text-gray-500 text-xs">Історія відсутня</td>
                </tr>
            `;
        }
    };
}

function generatePass() {
    if (!currentUser) return;
    
    // Generate unique pass ID
    const passId = 'PASS-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    
    // Get current date
    const now = new Date();
    
    // Create QR code
    const qr = new QRious({
        element: qrCodeCanvas,
        value: passId,
        size: document.documentElement.clientWidth < 640 ? 150 : 200,
        level: 'H'
    });
    
    // Save pass to database
    const transaction = db.transaction(['passes'], 'readwrite');
    const store = transaction.objectStore('passes');
    store.add({
        id: passId,
        login: currentUser.login,
        date: now.toISOString(),
        used: false
    });
    
    // Show QR code
    qrCodeContainer.classList.remove('hidden');
    
    // Update history
    loadPassHistory();
}

function showError(message, elementId = null) {
    // Simple error notification
    alert(message);
    
    // If element ID is provided, add error class
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('input-error', 'shake');
            setTimeout(() => {
                element.classList.remove('shake');
            }, 500);
        }
    }
}

// For demo purposes:
console.log('Тестовий логін: student1, пароль: pass123');
console.log('Тестовий адмін: admin, пароль: admin123');