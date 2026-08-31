document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';

  if (hdAttemptLogin(username, password)) {
    window.location.href = 'dashboard.html';
  } else {
    errEl.textContent = 'Invalid username or password.';
    errEl.style.display = 'block';
  }
});

// If already logged in this session, skip straight to the dashboard
if (hdIsLoggedIn()) {
  window.location.href = 'dashboard.html';
}
