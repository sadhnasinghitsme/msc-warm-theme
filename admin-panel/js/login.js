if (Auth.getToken()) {
  window.location.href = 'dashboard.html';
}

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    Auth.setSession(data.token, data.admin);
    window.location.href = 'dashboard.html';
  } catch (err) {
    loginError.textContent = err.message;
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Log In';
  }
});
