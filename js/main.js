/* =========================================================
   Shared interactions for the personal website
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Mobile navigation toggle ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Close the menu after tapping a link
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll-reveal animations ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Projects filter ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var projectCards = document.querySelectorAll(".project-card");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var cat = btn.getAttribute("data-filter");
      projectCards.forEach(function (card) {
        var show = cat === "all" || card.getAttribute("data-category") === cat;
        card.classList.toggle("hidden", !show);
      });
    });
  });

  /* ---------- Contact form -> Supabase contacts table + email notification ---------- */
  var SUPABASE_URL = "https://siecxnnbrrzuucryalan.supabase.co";
  var SUPABASE_KEY = "sb_publishable_s12B5gVpKVk76_IoCBgyVQ_Bu7_E0DQ";
  var CONTACTS_URL = SUPABASE_URL + "/rest/v1/contacts";

  // Email notification via Web3Forms (free, browser-side).
  // Get your access key at https://web3forms.com — it takes 1 minute.
  // The email will be delivered to the address you verify with Web3Forms.
  var WEB3FORMS_ACCESS_KEY = "YOUR_WEB3FORMS_ACCESS_KEY";

  function contactHeaders() {
    return {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    };
  }

  // Save the message to the Supabase contacts table.
  function saveToSupabase(name, email, message) {
    return fetch(CONTACTS_URL, {
      method: "POST",
      headers: contactHeaders(),
      body: JSON.stringify({ name: name, email: email, message: message })
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) { throw new Error("Supabase: " + (t || res.statusText)); });
      }
    });
  }

  // Send an email notification to the site owner via Web3Forms.
  function sendEmailNotification(name, email, message) {
    if (WEB3FORMS_ACCESS_KEY === "YOUR_WEB3FORMS_ACCESS_KEY") {
      // No key configured yet — skip silently so the form still works.
      return Promise.resolve();
    }
    var formData = new FormData();
    formData.append("access_key", WEB3FORMS_ACCESS_KEY);
    formData.append("subject", "New message from " + name + " (via your website)");
    formData.append("from_name", name);
    formData.append("email", email);
    formData.append("message", message);
    return fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) { throw new Error("Web3Forms: " + (t || res.statusText)); });
      }
    });
  }

  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("cf-name").value.trim();
      var email = document.getElementById("cf-email").value.trim();
      var message = document.getElementById("cf-message").value.trim();
      var note = document.getElementById("form-note");
      var submitBtn = form.querySelector('button[type="submit"]');

      if (!name || !email || !message) {
        note.textContent = "Please fill in all fields before sending. 🙂";
        note.classList.remove("ok");
        return;
      }

      note.textContent = "Sending…";
      note.classList.remove("ok");
      if (submitBtn) submitBtn.disabled = true;

      // Run both in parallel: save to DB and email the owner.
      Promise.all([
        saveToSupabase(name, email, message),
        sendEmailNotification(name, email, message)
      ]).then(function () {
        note.textContent = "Thanks, " + name + "! Your message has been sent. I'll get back to you soon. ✉️";
        note.classList.add("ok");
        form.reset();
      }).catch(function (err) {
        console.error("Contact form error:", err);
        note.textContent = "Something went wrong sending your message. Please email me directly.";
        note.classList.remove("ok");
      }).then(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

  /* ---------- Print / save resume as PDF ---------- */
  var printBtn = document.getElementById("print-resume");
  if (printBtn) {
    printBtn.addEventListener("click", function () { window.print(); });
  }

  /* ---------- Friendly SVG fallback if an image cannot load ---------- */
  function fallbackSVG(label, bg) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + bg[0] + '"/>' +
      '<stop offset="1" stop-color="' + bg[1] + '"/></linearGradient></defs>' +
      '<rect width="600" height="600" fill="url(#g)"/>' +
      '<text x="50%" y="50%" font-size="72" text-anchor="middle" ' +
      'dominant-baseline="central" fill="#ffffff" font-family="sans-serif">' +
      label + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  document.querySelectorAll("img[data-fallback]").forEach(function (img) {
    img.addEventListener("error", function handler() {
      img.removeEventListener("error", handler);
      img.src = fallbackSVG(img.getAttribute("data-fallback"),
        img.getAttribute("data-fallback-colors").split(","));
    });
  });

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }
})();
