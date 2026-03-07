// Global state
let authToken = null;
let currentConversationId = 1;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
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
    const passwordInput = document.getElementById('password');
    
    loginForm.addEventListener('submit', handleLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    });
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    const loginBtn = document.querySelector('.login-btn');
    
    errorDiv.textContent = '';
    loginBtn.disabled = true;
    loginBtn.textContent = 'جاري التحقق...';

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
            loginBtn.disabled = false;
            loginBtn.textContent = 'دخول';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'حدث خطأ أثناء محاولة تسجيل الدخول';
        loginBtn.disabled = false;
        loginBtn.textContent = 'دخول';
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
    const commandInput = document.getElementById('commandInput');
    
    commandForm.addEventListener('submit', handleCommandSubmit);
    commandInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCommandSubmit(e);
        }
    });
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
    commandInput.focus();

    // Add execution steps
    addExecutionStep('تحليل الأمر', 'جاري تحليل الأمر...');

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
            
            // Update execution step
            completeExecutionStep(0);
            addExecutionStep('معالجة الطلب', 'تم معالجة الطلب بنجاح');
            completeExecutionStep(1);
            
            // Add agent response to chat
            addMessageToChat(data.output, 'agent');
            
        } else if (response.status === 401) {
            logout();
        } else {
            addMessageToChat('حدث خطأ أثناء تنفيذ الأمر', 'agent');
        }
    } catch (error) {
        console.error('Command execution error:', error);
        addMessageToChat('حدث خطأ في الاتصال بالخادم', 'agent');
    }
}

// Add message to chat
function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageGroup = document.createElement('div');
    messageGroup.className = 'message-group';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    if (sender === 'agent') {
        messageDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }
    
    messageGroup.appendChild(messageDiv);
    chatMessages.appendChild(messageGroup);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add execution step
function addExecutionStep(title, description) {
    const stepsList = document.getElementById('executionSteps');
    const stepItem = document.createElement('div');
    stepItem.className = 'step-item';
    
    stepItem.innerHTML = `
        <div class="step-number">⏳</div>
        <div class="step-content">
            <div class="step-title">${escapeHtml(title)}</div>
            <div class="step-description">${escapeHtml(description)}</div>
        </div>
    `;
    
    stepsList.appendChild(stepItem);
    document.getElementById('executionSteps').scrollTop = document.getElementById('executionSteps').scrollHeight;
}

// Complete execution step
function completeExecutionStep(index) {
    const steps = document.querySelectorAll('.step-item');
    if (steps[index]) {
        steps[index].classList.add('completed');
        steps[index].querySelector('.step-number').textContent = '✓';
    }
}

// Select conversation
function selectConversation(id) {
    currentConversationId = id;
    
    // Update active state
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const items = document.querySelectorAll('.conversation-item');
    if (items[id - 1]) {
        items[id - 1].classList.add('active');
    }
    
    // Update chat title
    const titles = ['المحادثة الأولى', 'المحادثة الثانية'];
    document.getElementById('chatTitle').textContent = titles[id - 1] || 'محادثة جديدة';
    
    // Clear messages and steps
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('executionSteps').innerHTML = '';
}

// New task
function newTask() {
    // Clear current chat
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('executionSteps').innerHTML = '';
    document.getElementById('chatTitle').textContent = 'مهمة جديدة';
    document.getElementById('commandInput').focus();
    
    // Remove active state from conversations
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
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
