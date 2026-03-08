let authToken = null;
let currentChatId = 1;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        showApp();
    } else {
        setupLogin();
    }
});

function setupLogin() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
    e.preventDefault();
    const pwd = document.getElementById('password').value;
    const err = document.getElementById('loginError');
    const btn = document.querySelector('.login-form button');
    
    err.textContent = '';
    btn.disabled = true;
    btn.textContent = 'جاري...';

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });

        const data = await res.json();
        if (res.ok && data.success) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            document.getElementById('password').value = '';
            showApp();
        } else {
            err.textContent = 'كلمة المرور غير صحيحة';
            btn.disabled = false;
            btn.textContent = 'دخول';
        }
    } catch (error) {
        err.textContent = 'خطأ في الاتصال';
        btn.disabled = false;
        btn.textContent = 'دخول';
    }
}

function showApp() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
    setupChat();
}

function setupChat() {
    document.getElementById('messageForm').addEventListener('submit', handleSendMessage);
}

async function handleSendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('messageInput');
    const msg = input.value.trim();

    if (!msg) return;

    addMessage(msg, 'user');
    input.value = '';
    input.focus();

    addStep('تحليل الأمر', 'جاري التحليل...');

    try {
        const res = await fetch('/api/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ command: msg })
        });

        if (res.ok) {
            const data = await res.json();
            completeStep(0);
            addStep('معالجة الطلب', 'تمت بنجاح');
            completeStep(1);
            addMessage(data.output, 'bot');
        } else if (res.status === 401) {
            logout();
        }
    } catch (error) {
        addMessage('خطأ في الاتصال', 'bot');
    }
}

function addMessage(text, sender) {
    const container = document.getElementById('messagesArea');
    const group = document.createElement('div');
    group.className = 'message-group';
    
    const msg = document.createElement('div');
    msg.className = `message ${sender}`;
    
    if (sender === 'bot') {
        msg.innerHTML = `
            <div class="avatar">🤖</div>
            <div class="bubble">${escapeHtml(text)}</div>
        `;
    } else {
        msg.innerHTML = `
            <div class="bubble">${escapeHtml(text)}</div>
        `;
    }
    
    group.appendChild(msg);
    container.appendChild(group);
    container.scrollTop = container.scrollHeight;
}

function addStep(name, desc) {
    const container = document.getElementById('stepsList');
    const step = document.createElement('div');
    step.className = 'step';
    step.innerHTML = `
        <div class="step-icon">⏳</div>
        <div class="step-content">
            <div class="step-title">${escapeHtml(name)}</div>
            <div class="step-desc">${escapeHtml(desc)}</div>
        </div>
    `;
    container.appendChild(step);
    container.scrollTop = container.scrollHeight;
}

function completeStep(index) {
    const steps = document.querySelectorAll('.step');
    if (steps[index]) {
        const icon = steps[index].querySelector('.step-icon');
        icon.textContent = '✓';
        icon.classList.add('done');
    }
}

function selectChat(id) {
    currentChatId = id;
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.chat-item')[id - 1].classList.add('active');
    
    const titles = ['المحادثة الأولى', 'المحادثة الثانية'];
    document.getElementById('chatTitle').textContent = titles[id - 1];
    
    document.getElementById('messagesArea').innerHTML = '';
    document.getElementById('stepsList').innerHTML = '';
}

function newTask() {
    document.getElementById('messagesArea').innerHTML = '';
    document.getElementById('stepsList').innerHTML = '';
    document.getElementById('chatTitle').textContent = 'مهمة جديدة';
    document.getElementById('messageInput').focus();
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
}

function logout() {
    authToken = null;
    localStorage.removeItem('authToken');
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('password').value = '';
    document.getElementById('loginError').textContent = '';
    setupLogin();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
