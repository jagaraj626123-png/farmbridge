(function () {
  const sessionKey = "farmbridge.session";
  const adminSessionKey = "farmbridge.adminSession";
  const adminEmail = "admin@farmbridge.com";
  const adminPassword = "Admin@123";
  function current() {
    try { return JSON.parse(sessionStorage.getItem(sessionKey) || "null"); }
    catch (error) { console.error("Could not read the current session.", error); return null; }
  }
  function signIn(user) {
    const session = { id: user.id, name: user.name, email: user.email, role: user.role, location: user.location || "" };
    sessionStorage.removeItem(adminSessionKey);
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
    sessionStorage.setItem("farmbridge.activeCart", JSON.stringify(window.FarmBridgeStore.read("cart")));
    return session;
  }
  function signOut() {
    sessionStorage.removeItem(sessionKey);
    sessionStorage.removeItem(adminSessionKey);
    sessionStorage.removeItem("farmbridge.activeCart");
    location.href = "index.html";
  }
  function adminCurrent() {
    try {
      const session = JSON.parse(sessionStorage.getItem(adminSessionKey) || "null");
      return session && session.role === "admin" && session.email === adminEmail ? session : null;
    } catch (error) {
      console.error("Could not read the admin session.", error);
      return null;
    }
  }
  function adminSignIn(email, password) {
    if (String(email).trim().toLowerCase() !== adminEmail || password !== adminPassword) return false;
    sessionStorage.setItem(adminSessionKey, JSON.stringify({ role: "admin", email: adminEmail, signedInAt: new Date().toISOString() }));
    sessionStorage.removeItem(sessionKey);
    return true;
  }
  function adminSignOut() {
    sessionStorage.removeItem(adminSessionKey);
    sessionStorage.removeItem(sessionKey);
    sessionStorage.removeItem("farmbridge.activeCart");
    location.href = "admin-login.html";
  }
  function dashboard(role) {
    return ({ farmer: "farmer-dashboard.html", customer: "customer-dashboard.html", admin: "admin-login.html" })[role] || "login.html";
  }
  window.FarmBridgeAuth = { current, signIn, signOut, dashboard, adminCurrent, adminSignIn, adminSignOut };
})();
