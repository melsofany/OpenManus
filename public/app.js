// Global state
let authToken = null;
let currentConversationId = 1;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already authenticated
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
        authToken = savedToken;
        showApp();
    } else {
        setupLoginForm();
    }
});

// Setup login form
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = '';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            document.getElementById('password').value = '';
            showApp();
        } else {
            errorDiv.textContent = 'كلمة المرور غير صحيحة';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'حدث خطأ أثناء محاولة تسجيل الدخول';
    }
}

// Show app interface
function showApp() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
    document.getElementById('inputArea').style.display = 'block';
    setupCommandForm();
}

// Setup command form
function setupCommandForm() {
    const commandForm = document.getElementById('commandForm');
    commandForm.addEventListener('submit', handleCommandSubmit);
}

// Handle command submission
async function handleCommandSubmit(e) {
    e.preventDefault();
    const commandInput = document.getElementById('commandInput');
    const command = commandInput.value.trim();

    if (!command) return;

    // Add user message to chat
    addMessageToChat(command, 'user');
    commandInput.value = '';

    try {
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ command })
        });

        if (response.ok) {
            const data = await response.json();
            
            // Add agent response to chat
            addMessageToChat(data.output, 'agent');
            
            // Add logs
            if (data.logs && Array.isArray(data.logs)) {
                data.logs.forEach(log => {
                    addLog(log, 'info');
                });
            }
        } else if (response.status === 401) {
            logout();
        }
    } catch (error) {
        console.error('Command execution error:', error);
        addMessageToChat('حدث خطأ أثناء تنفيذ الأمر', 'agent');
        addLog('خطأ: ' + error.message, 'error');
    }
}

// Add message to chat
function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${escapeHtml(message)}</p>
        </div>
        <span class="message-time">${time}</span>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add log entry
function addLog(message, level = 'info') {
    const logsList = document.getElementById('logsList');
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    
    const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const levelUpper = level.toUpperCase();
    
    logItem.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-level ${level}">${levelUpper}</span>
        <span class="log-message">${escapeHtml(message)}</span>
    `;
    
    logsList.appendChild(logItem);
    logsList.scrollTop = logsList.scrollHeight;
}

// Select conversation
function selectConversation(id) {
    currentConversationId = id;
    
    // Update active state
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.conversation-item').classList.add('active');
    
    // Update chat title
    const title = event.target.closest('.conversation-item').querySelector('.conv-title').textContent;
    document.getElementById('chatTitle').textContent = title;
    
    // Clear messages and logs
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('logsList').innerHTML = '';
}

// New task
function newTask() {
    // Clear current chat
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('logsList').innerHTML = '';
    document.getElementById('chatTitle').textContent = 'مهمة جديدة';
    document.getElementById('commandInput').focus();
}

// Logout
function logout() {
    authToken = null;
    localStorage.removeItem('authToken');
    
    // Reset UI
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('inputArea').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('password').value = '';
    document.getElementById('loginError').textContent = '';
    
    setupLoginForm();
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
