fetch("config.json?v=" + Date.now()).then(function (r) { return r.json(); }).then(boot).catch(function () {
  document.body.insertAdjacentHTML("afterbegin", '<p style="padding:1rem;text-align:center">Could not load config.json. Open the site from its web address, not as a file.</p>');
});

function boot(cfg) {
  "use strict";
  var B = cfg.business, WHATSAPP = B.whatsapp.replace(/\D/g, ""), DEST = B.mapQuery;
  var CATS = ["hair", "barber", "nails", "spa"], studios = {}, specialists = {};
  CATS.forEach(function (c) {
    studios[c] = cfg.studios[c].name;
    specialists[c] = cfg.team.filter(function (t) { return t.cat === c; }).map(function (t) { return t.name; });
  });
  var services = cfg.services;
  var hours = cfg.hours.map(function (h) { return [h.day, h.closed ? null : [h.open, h.close]]; });

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function money(n) {
    try { return new Intl.NumberFormat(B.locale, { style: "currency", currency: B.currency, maximumFractionDigits: 0 }).format(n); }
    catch (e) { return B.currency + " " + n; }
  }
  function fmtHour(h) { return ((h + 11) % 12 + 1) + (h >= 12 ? "pm" : "am"); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function isoDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function nakuruNow() {   // the salon’s own local time, whatever the visitor’s device says
    try { return new Date(new Date().toLocaleString("en-US", { timeZone: B.timezone })); } catch (e) { return new Date(); }
  }


  function applyContent() {
    var mk = function (t, txt) { var e = document.createElement(t); if (txt != null) e.textContent = txt; return e; };
    document.title = B.name;
    var words = B.name.trim().split(" "), last = words.pop(), logo = $(".logo");
    logo.textContent = words.length ? words.join(" ") + " " : "";
    logo.appendChild(mk("b", last));
    $(".pill").textContent = B.pill;
    var h1 = $(".hero h1"); h1.textContent = B.line1;
    h1.append(mk("br"), mk("span", B.line2), mk("br"), B.line3);
    $(".hero-copy>p").textContent = B.intro;
    $("#services .lead").textContent = B.servicesNote;
    var st = $(".stats"); st.textContent = "";
    cfg.stats.forEach(function (x) { var d = mk("div"); d.append(mk("b", x.v), mk("span", x.l)); st.appendChild(d); });
    $(".mirror img").src = cfg.images.hero;
    $(".mini span").forEach(function (m, i) { m.textContent = studios[CATS[i]].split(" ")[0]; });
    $(".house-card").forEach(function (c) {
      var k = c.dataset.cat;
      $("img", c).src = cfg.images[k]; $("h3", c).textContent = studios[k]; $("p", c).textContent = cfg.studios[k].desc;
    });
    $(".tab").forEach(function (t) {
      var k = t.dataset.cat;
      if (k === "all") return;
      t.textContent = studios[k];
      if (!services.some(function (s) { return s.c === k; })) t.style.display = "none";
    });
    var tm = $(".team"); tm.textContent = "";
    cfg.team.forEach(function (p) {
      var d = mk("div"); d.className = "person"; d.dataset.cat = p.cat;
      var av = mk("div", p.name.charAt(0).toUpperCase()); av.className = "avatar";
      d.append(av, mk("h3", p.name), mk("p", p.role)); tm.appendChild(d);
    });
    $("#addr").textContent = B.address;
    var ph = $("#phoneLink"); ph.textContent = B.phone; ph.href = "tel:+" + WHATSAPP;
    $("#waBtn").href = "https://wa.me/" + WHATSAPP;
    $(".map").src = "https://www.google.com/maps?q=" + encodeURIComponent(B.mapQuery) + "&z=15&output=embed";
    $("footer .wrap span").textContent = "© " + new Date().getFullYear() + " " + B.name;
    var css = document.createElement("style");
    css.textContent = ":root{--accent:" + B.accent + ";--brass:" + B.brass + "}";
    document.head.appendChild(css);
  }
  applyContent();

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
    buildTimes();
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
    var any = services.some(function (s) { return s.c === cat; });
    if (!any) { card.style.display = "none"; return; }
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
  var dateEl = $("#date"), timeEl = $("#time"), err = $("#err"), form = $("#form"), ok = $("#ok");
  dateEl.min = isoDate(now);

  // service length in minutes, from text like "45 min", "2 hr" or "1 hr 30 min"
  function minutesOf(text) {
    var h = /(\d+)\s*hr/.exec(text), m = /(\d+)\s*min/.exec(text);
    return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0);
  }
  function fmtTime(total) {
    var h = Math.floor(total / 60), m = total % 60;
    return ((h + 11) % 12 + 1) + ":" + pad(m) + (h >= 12 ? "pm" : "am");
  }
  function timeOption(value, label) {
    var o = document.createElement("option");
    o.value = value;
    o.textContent = label;
    timeEl.appendChild(o);
  }
  // half-hour start times that fit the service before closing; today’s past times are hidden
  function buildTimes() {
    var prev = timeEl.value, date = dateEl.value;
    timeEl.innerHTML = "";
    timeEl.disabled = true;
    if (!date) { timeOption("", "Choose a date first"); return; }
    var w = hours[new Date(date + "T12:00:00").getDay()][1];
    if (!w) { timeOption("", "Closed on this day"); return; }
    var n = nakuruNow(), earliest = date === isoDate(n) ? n.getHours() * 60 + n.getMinutes() + 30 : 0;
    var last = w[1] * 60 - minutesOf(services[select.value].d), count = 0;
    timeOption("", "Select a time");
    for (var m = w[0] * 60; m <= last; m += 30) {
      if (m < earliest) continue;
      timeOption(m, fmtTime(m));
      count++;
    }
    if (!count) { timeEl.innerHTML = ""; timeOption("", "No times left. Pick another day"); return; }
    timeEl.disabled = false;
    if (prev && $$("option", timeEl).some(function (o) { return o.value === prev; })) timeEl.value = prev;
  }
  dateEl.addEventListener("change", buildTimes);
  select.addEventListener("change", buildTimes);

  $("#submit").onclick = function () {
    var name = $("#name").value.trim(), phone = $("#phone").value.trim(), date = dateEl.value;
    if (!date) { err.textContent = "Choose a date for your visit."; dateEl.focus(); return; }
    var day = new Date(date + "T12:00:00").getDay();
    if (!hours[day][1]) { err.textContent = "We are closed on " + hours[day][0] + "s. Choose another date."; dateEl.focus(); return; }
    if (!timeEl.value) { err.textContent = "Choose a time for your visit."; timeEl.focus(); return; }
    if (!name) { err.textContent = "Enter your name."; $("#name").focus(); return; }
    if (phone.replace(/\D/g, "").length < 9) { err.textContent = "Enter a phone number we can reach on WhatsApp."; $("#phone").focus(); return; }
    err.textContent = "";

    var s = services[select.value], who = stylist.value;
    var when = new Date(date + "T12:00:00").toLocaleDateString(B.locale, { weekday: "long", day: "numeric", month: "long" });
    var at = timeEl.options[timeEl.selectedIndex].textContent;
    var msg = "Hello Atelier Lune, I would like to book " + s.n + " (" + studios[s.c] + ", from " + money(s.p) + ") with " +
      (who === "Any specialist" ? "the first available specialist" : who) + " on " + when + " at " + at + ". Name: " + name + ". Phone: " + phone + ".";

    $("#okText").textContent = "Thanks, " + name + ". Your request for " + s.n.toLowerCase() + " on " + when + " at " + at +
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
}
