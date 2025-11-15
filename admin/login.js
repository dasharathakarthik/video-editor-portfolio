// admin/login.js

// Redirect authenticated admins away from login to dashboard
auth.onAuthStateChanged(function (user) {
  if (user) {
    // Already authenticated → go to dashboard (relative path)
    window.location.href = "index.html";
  }
});

var loginForm = document.getElementById("login-form");
var statusEl = document.getElementById("login-status");
var loginBtn = document.getElementById("login-btn");

function setStatus(message, type) {
  statusEl.textContent = message || "";
  statusEl.className = "status" + (type ? " " + type : "");
}

if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("");
    loginBtn.disabled = true;
    loginBtn.textContent = "Authenticating…";

    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;

    auth
      .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(function () {
        return auth.signInWithEmailAndPassword(email, password);
      })
      .then(function () {
        setStatus("Success. Redirecting…", "success");
        // Use relative navigation so it works from file:// and simple static hosting
        window.location.href = "index.html";
      })
      .catch(function (error) {
        console.error(error);
        setStatus("Invalid credentials. Access denied.", "error");
      })
      .finally(function () {
        loginBtn.disabled = false;
        loginBtn.textContent = "Authenticate";
      });
  });
}
