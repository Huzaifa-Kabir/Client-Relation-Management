/* auth.js
   Client-side stand-in for the server session from the full-stack version.
   Credentials are hardcoded per spec. Since this is a static site with no
   server, this offers no real security boundary (anyone can read this file) -
   it gates navigation within the app only, matching the required login flow.
*/

const HD_USERNAME = 'Huzaifa';
const HD_PASSWORD = 'Huzaifakabir@123';
const HD_SESSION_KEY = 'hd_crm_logged_in';

function hdIsLoggedIn() {
  return sessionStorage.getItem(HD_SESSION_KEY) === 'true';
}

function hdRequireLogin() {
  if (!hdIsLoggedIn()) {
    window.location.href = 'index.html';
  }
}

function hdAttemptLogin(username, password) {
  if (username === HD_USERNAME && password === HD_PASSWORD) {
    sessionStorage.setItem(HD_SESSION_KEY, 'true');
    return true;
  }
  return false;
}

function hdLogout() {
  sessionStorage.removeItem(HD_SESSION_KEY);
}
