// Global state
let authToken = null;
let currentChatId = 1;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
        authToken = savedToken;
        showApp();
    } else {
        setupLogin();
    }
});

// Setup login
function setupLogin() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', handleLogin);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    const button = document.querySelector('.login-form button');
    
    errorDiv.textContent = '';
    button.disabled = true;
    button.textContent = 'جاري التحقق...';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            button.disabled = false;
            button.textContent = 'دخول';
        }
    } catch (error) {
        errorDiv.textContent = 'خطأ في الاتصال';
        button.disabled = false;
        button.textContent = 'دخول';
    }
}

// Show app
function showApp() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
    setupChat();
}

// Setup chat
function setupChat() {
    const form = document.getElementById('chatForm');
    form.addEventListener('submit', handleSendMessage);
}

// Handle send message
async function handleSendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    input.value = '';
    input.focus();

    // Add step
    addStep('تحليل الأمر', 'جاري التحليل...');

    try {
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ command: message })
        });

        if (response.ok) {
            const data = await response.json();
            
            // Update steps
            completeStep(0);
            addStep('معالجة الطلب', 'تمت المعالجة بنجاح');
            completeStep(1);
            
            // Add bot response
            addMessage(data.output, 'bot');
        } else if (response.status === 401) {
            logout();
        }
    } catch (error) {
        addMessage('حدث خطأ في الاتصال', 'bot');
    }
}

// Add message
function addMessage(text, sender) {
    const container = document.getElementById('messagesContainer');
    const group = document.createElement('div');
    group.className = 'message-group';
    
    const msg = document.createElement('div');
    msg.className = `message ${sender}-message`;
    
    if (sender === 'bot') {
        msg.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-bubble">
                <p>${escapeHtml(text)}</p>
            </div>
        `;
    } else {
        msg.innerHTML = `
            <div class="message-bubble">
                <p>${escapeHtml(text)}</p>
            </div>
        `;
    }
    
    group.appendChild(msg);
    container.appendChild(group);
    container.scrollTop = container.scrollHeight;
}

// Add step
function addStep(name, desc) {
    const container = document.getElementById('stepsContainer');
    const step = document.createElement('div');
    step.className = 'step-item';
    step.innerHTML = `
        <div class="step-icon">⏳</div>
        <div class="step-info">
            <div class="step-name">${escapeHtml(name)}</div>
            <div class="step-desc">${escapeHtml(desc)}</div>
        </div>
    `;
    container.appendChild(step);
    container.scrollTop = container.scrollHeight;
}

// Complete step
function completeStep(index) {
    const steps = document.querySelectorAll('.step-item');
    if (steps[index]) {
        steps[index].querySelector('.step-icon').textContent = '✓';
        steps[index].querySelector('.step-icon').classList.add('completed');
    }
}

// Select chat
function selectChat(id) {
    currentChatId = id;
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelectorAll('.chat-item')[id - 1].classList.add('active');
    
    const titles = ['المحادثة الأولى', 'المحادثة الثانية'];
    document.getElementById('chatTitle').textContent = titles[id - 1];
    
    document.getElementById('messagesContainer').innerHTML = '';
    document.getElementById('stepsContainer').innerHTML = '';
}

// New chat
function newChat() {
    document.getElementById('messagesContainer').innerHTML = '';
    document.getElementById('stepsContainer').innerHTML = '';
    document.getElementById('chatTitle').textContent = 'مهمة جديدة';
    document.getElementById('messageInput').focus();
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
}

// Logout
function logout() {
    authToken = null;
    localStorage.removeItem('authToken');
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('password').value = '';
    document.getElementById('loginError').textContent = '';
    setupLogin();
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
