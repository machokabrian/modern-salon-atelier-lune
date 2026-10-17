(function () {
  "use strict";

  /* ---------- settings: edit these ---------- */
  var WHATSAPP = "254110922252";           // 0110 922 252 in international format, no + or spaces
  var DEST = "Nakuru Town, Kenya";         // exact address or "lat,lng" for directions

  var studios = { hair: "Hair Studio", barber: "Barber Atelier", nails: "Nail Lab", spa: "Spa & Skin" };
  var specialists = { hair: ["Maya", "Jonas", "Amara"], barber: ["Leo"], nails: ["Nia"], spa: ["Sana"] };

  var services = [
    { n: "Women’s cut and style",          d: "60 min",  p: 2500, c: "hair" },
    { n: "Wash, blow-dry and style",       d: "45 min",  p: 3000, c: "hair" },
    { n: "Gloss and tone",                 d: "45 min",  p: 3500, c: "hair" },
    { n: "Deep conditioning treatment",    d: "30 min",  p: 3000, c: "hair" },
    { n: "Box or knotless braids",         d: "4 hr",    p: 5000, c: "hair" },
    { n: "Full color",                     d: "2 hr",    p: 6000, c: "hair" },
    { n: "Highlights or balayage",         d: "3 hr",    p: 9000, c: "hair" },

    { n: "Classic cut and fade",           d: "40 min",  p: 1500, c: "barber" },
    { n: "Kids’ cut",                      d: "30 min",  p: 1500, c: "barber" },
    { n: "Beard sculpt and hot towel",     d: "30 min",  p: 1500, c: "barber" },
    { n: "Scissor cut",                    d: "50 min",  p: 2000, c: "barber" },
    { n: "Cut and beard together",         d: "70 min",  p: 3000, c: "barber" },

    { n: "Gel manicure",                   d: "45 min",  p: 1800, c: "nails" },
    { n: "Nail art, per set",              d: "30 min",  p: 2000, c: "nails" },
    { n: "Gel pedicure",                   d: "60 min",  p: 2500, c: "nails" },
    { n: "BIAB overlay",                   d: "75 min",  p: 2800, c: "nails" },
    { n: "Extensions, full set",           d: "2 hr",    p: 3500, c: "nails" },

    { n: "Swedish massage",                d: "60 min",  p: 3000, c: "spa" },
    { n: "Full leg wax",                   d: "40 min",  p: 3500, c: "spa" },
    { n: "Hydrating facial",               d: "60 min",  p: 4000, c: "spa" },
    { n: "Deep tissue massage",            d: "90 min",  p: 4500, c: "spa" },
    { n: "Body scrub ritual",              d: "75 min",  p: 5500, c: "spa" }
  ];

  var hours = [
    ["Sunday", [9, 20]], ["Monday", [9, 20]], ["Tuesday", [9, 20]], ["Wednesday", [9, 20]],
    ["Thursday", [9, 20]], ["Friday", [9, 20]], ["Saturday", [9, 20]]
  ];

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function money(n) { return "KSh " + n.toLocaleString("en-KE"); }
  function fmtHour(h) { return ((h + 11) % 12 + 1) + (h >= 12 ? "pm" : "am"); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function isoDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  // Nakuru time (EAT), whatever the visitor’s device clock says
  function nakuruNow() { return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })); }

  /* ---------- service list, tabs, booking select ---------- */
  var list = $("#serviceList"), select = $("#service"), stylist = $("#stylist");
  var currentCat = "all";

  Object.keys(studios).forEach(function (cat) {
    var g = document.createElement("optgroup");
    g.label = studios[cat];
    services.forEach(function (s, i) {
      if (s.c !== cat) return;
      var o = document.createElement("option");
      o.value = i;
      o.textContent = s.n + " (from " + money(s.p) + ")";
      g.appendChild(o);
    });
    select.appendChild(g);
  });

  function fillSpecialists() {
    var cat = services[select.value].c, prev = stylist.value;
    stylist.innerHTML = "";
    ["Any specialist"].concat(specialists[cat]).forEach(function (name) {
      var o = document.createElement("option");
      o.textContent = name;
      stylist.appendChild(o);
    });
    if ($$("option", stylist).some(function (o) { return o.textContent === prev; })) stylist.value = prev;
  }
  select.addEventListener("change", fillSpecialists);
  fillSpecialists();

  function bookService(i) {
    select.value = i;
    fillSpecialists();
    $("#book").scrollIntoView();
    select.focus({ preventScroll: true });
  }

  function renderServices(cat) {
    currentCat = cat;
    list.innerHTML = "";
    $$(".tab").forEach(function (t) {
      var on = t.dataset.cat === cat;
      t.classList.toggle("active", on);
      t.setAttribute("aria-pressed", on);
    });
    services.forEach(function (s, i) {
      if (cat !== "all" && s.c !== cat) return;
      var r = document.createElement("div");
      r.className = "row";
      r.innerHTML = '<div><b></b><small></small></div><span class="price"></span><button class="link" type="button">Book</button>';
      $("b", r).textContent = s.n;
      $("small", r).textContent = studios[s.c] + ", " + s.d;
      $(".price", r).textContent = money(s.p);
      var btn = $(".link", r);
      btn.setAttribute("aria-label", "Book " + s.n);
      btn.onclick = function () { bookService(i); };
      list.appendChild(r);
    });
  }
  $$(".tab").forEach(function (t) {
    t.setAttribute("aria-pressed", t.classList.contains("active"));
    t.onclick = function () { renderServices(t.dataset.cat); };
  });
  renderServices("all");

  /* house cards: show the real starting price, and open that studio’s menu */
  $$(".house-card").forEach(function (card) {
    var cat = card.dataset.cat;
    var min = Math.min.apply(null, services.filter(function (s) { return s.c === cat; }).map(function (s) { return s.p; }));
    $("span", card).textContent = "From " + money(min);
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    function open() { renderServices(cat); $("#services").scrollIntoView(); }
    card.onclick = open;
    card.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
  });

  /* ---------- opening hours and open-now status ---------- */
  var now = nakuruNow(), today = now.getDay(), tbl = $("#hours");
  hours.forEach(function (h, i) {
    var tr = document.createElement("tr");
    if (i === today) tr.className = "today";
    tr.innerHTML = "<td></td><td></td>";
    tr.children[0].textContent = h[0];
    tr.children[1].textContent = h[1] ? fmtHour(h[1][0]) + " to " + fmtHour(h[1][1]) : "Closed";
    tbl.appendChild(tr);
  });

  (function status() {
    var dot = $(".dot"), txt = $("#statusText");
    var hr = now.getHours() + now.getMinutes() / 60, t = hours[today][1];
    if (t && hr >= t[0] && hr < t[1]) {
      dot.classList.add("on");
      txt.textContent = "Open now until " + fmtHour(t[1]);
      return;
    }
    for (var k = 0; k < 8; k++) {
      var d = (today + k) % 7, w = hours[d][1];
      if (!w || (k === 0 && hr >= w[0])) continue;
      txt.textContent = "Closed now. Opens " + (k === 0 ? "today" : k === 1 ? "tomorrow" : hours[d][0]) + " at " + fmtHour(w[0]);
      return;
    }
    txt.textContent = "Closed now";
  })();

  /* ---------- booking form (sends the request on WhatsApp) ---------- */
  var dateEl = $("#date"), err = $("#err"), form = $("#form"), ok = $("#ok");
  dateEl.min = isoDate(now);

  $("#submit").onclick = function () {
    var name = $("#name").value.trim(), phone = $("#phone").value.trim(), date = dateEl.value;
    if (!date) { err.textContent = "Choose a date for your visit."; dateEl.focus(); return; }
    var day = new Date(date + "T12:00:00").getDay();
    if (!hours[day][1]) { err.textContent = "We are closed on " + hours[day][0] + "s. Choose another date."; dateEl.focus(); return; }
    if (!name) { err.textContent = "Enter your name."; $("#name").focus(); return; }
    if (phone.replace(/\D/g, "").length < 9) { err.textContent = "Enter a phone number we can reach on WhatsApp."; $("#phone").focus(); return; }
    err.textContent = "";

    var s = services[select.value], who = stylist.value;
    var when = new Date(date + "T12:00:00").toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" });
    var msg = "Hello Atelier Lune, I would like to book " + s.n + " (" + studios[s.c] + ", from " + money(s.p) + ") with " +
      (who === "Any specialist" ? "the first available specialist" : who) + " on " + when + ". Name: " + name + ". Phone: " + phone + ".";

    $("#okText").textContent = "Thanks, " + name + ". Your request for " + s.n.toLowerCase() + " on " + when +
      " is ready. Send it on WhatsApp and we will confirm within 1 hour.";
    var a = $("#waLink");
    if (!a) {
      a = document.createElement("a");
      a.id = "waLink";
      a.className = "btn";
      a.target = "_blank";
      a.rel = "noopener";
      $("#okText").insertAdjacentElement("afterend", a);
    }
    a.textContent = "Send on WhatsApp";
    a.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg);

    form.style.display = "none";
    ok.style.display = "block";
  };
  $("#again").onclick = function () { form.style.display = "block"; ok.style.display = "none"; };

  /* ---------- directions from the visitor’s live location ---------- */
  var dirBtn = $("#dirBtn"), dirMsg = $("#dirMsg");
  var base = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(DEST);
  dirBtn.onclick = function () {
    if (!navigator.geolocation) { window.open(base, "_blank", "noopener"); return; }
    dirMsg.textContent = "Finding your location…";
    navigator.geolocation.getCurrentPosition(function (p) {
      dirMsg.textContent = "";
      window.open(base + "&origin=" + p.coords.latitude + "," + p.coords.longitude, "_blank", "noopener");
    }, function () {
      dirMsg.textContent = "Location is off. Opening directions without it.";
      window.open(base, "_blank", "noopener");
    }, { timeout: 8000 });
  };

  /* ---------- mobile menu and theme ---------- */
  var drawer = $("#drawer"), menuBtn = $("#menuBtn");
  menuBtn.onclick = function () {
    var open = drawer.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  drawer.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      drawer.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });
  $("#themeBtn").onclick = function () {
    var r = document.documentElement, dark = matchMedia("(prefers-color-scheme: dark)").matches;
    var cur = r.getAttribute("data-theme") || (dark ? "dark" : "light");
    r.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
  };
})();
     
