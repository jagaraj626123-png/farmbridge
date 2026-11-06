(function () {
  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/; SameSite=Lax";
  }
  function getCookie(name) {
    const part = document.cookie.split("; ").find(item => item.startsWith(name + "="));
    return part ? decodeURIComponent(part.slice(name.length + 1)) : "";
  }
  window.FarmBridgeCookies = { set: setCookie, get: getCookie };
})();
