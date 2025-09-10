// Create cookie
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

// Delete cookie
function deleteCookie(cname) {
  const d = new Date();
  d.setTime(d.getTime() - 24 * 60 * 60 * 1000);
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=;" + expires + ";path=/";
}

// Read cookie
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

// Set cookie consent
function acceptCookieConsent() {
  deleteCookie("user_cookie_consent");
  setCookie("user_cookie_consent", 1, 30);

  const cookieNotice = document.getElementById("cookieNotice");
  if (cookieNotice) {
    cookieNotice.style.display = "none";
  }
}

// Wait for DOM to be fully loaded before accessing elements
document.addEventListener("DOMContentLoaded", function () {
  // Set visibility of the cookie consent popup
  let cookie_consent = getCookie("user_cookie_consent");

  const cookieNotice = document.getElementById("cookieNotice");
  const acceptNoti = document.getElementById("acceptNoti");

  if (cookieNotice) {
    cookieNotice.style.display = cookie_consent != "" ? "none" : "block";
  }

  if (acceptNoti) {
    acceptNoti.style.display = cookie_consent != "" ? "block" : "none";
  }
});