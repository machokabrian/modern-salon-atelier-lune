(function () {
  "use strict";
  var CATS = ["hair", "barber", "nails", "spa"], root = document.getElementById("sections"), msg = document.getElementById("msg");
  var cfg, gh = { owner: "", repo: "", branch: "main", token: "", remember: false };

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  gh.owner = store("gh_owner") || ""; gh.repo = store("gh_repo") || ""; gh.branch = store("gh_branch") || "main";
  gh.token = store("gh_token") || ""; gh.remember = !!gh.token;

  var PROPS = { value: 1, checked: 1, text: 1, className: 1, disabled: 1, htmlFor: 1 };
  function h(tag, props, kids) {
    var e = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (k === "text") e.textContent = v;
      else if (PROPS[k] || typeof v === "function") e[k] = v;
      else e.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) { e.append(c); });
    return e;
  }
  function say(t, cls) { msg.textContent = t; msg.className = cls || ""; }

  function field(label, obj, key, o) {
    o = o || {};
    var inp = h(o.area ? "textarea" : "input", { type: o.type || "text", value: obj[key] == null ? "" : obj[key] });
    inp.oninput = function () { obj[key] = o.type === "number" ? +inp.value : inp.value; if (o.after) o.after(inp.value); };
    if (o.list) inp.setAttribute("list", o.list);
    if (o.ph) inp.placeholder = o.ph;
    if (o.type === "number") { inp.min = o.min; if (o.max != null) inp.max = o.max; inp.step = o.step || 1; inp.inputMode = "decimal"; }
    return h("label", { className: "f" }, [h("span", { text: label }), inp, o.hint ? h("small", { text: o.hint }) : ""]);
  }
  function check(label, obj, key, after) {
    var c = h("input", { type: "checkbox", checked: !!obj[key] });
    c.onchange = function () { obj[key] = c.checked; if (after) after(); };
    return h("label", { className: "chk" }, [c, label]);
  }
  function catSelect(obj, key) {
    var s = h("select");
    CATS.forEach(function (c) { var o = h("option", { value: c, text: cfg.studios[c].name }); s.appendChild(o); });
    s.value = obj[key];
    s.onchange = function () { obj[key] = s.value; };
    return h("label", { className: "f" }, [h("span", { text: "Studio" }), s]);
  }
  function section(title, kids) { return h("details", { open: "" }, [h("summary", { text: title })].concat(kids)); }
  function listBlock(arr, make, blank, addLabel) {
    var wrap = h("div");
    function draw() {
      wrap.textContent = "";
      arr.forEach(function (item, i) {
        var row = h("div", { className: "row" }, make(item));
        row.appendChild(h("button", { type: "button", className: "x", text: "Remove", onclick: function () { arr.splice(i, 1); draw(); } }));
        wrap.appendChild(row);
      });
      wrap.appendChild(h("button", { type: "button", text: addLabel, onclick: function () { arr.push(blank()); draw(); } }));
    }
    draw();
    return wrap;
  }
  function datalist(id, type) {
    var d = h("datalist", { id: id });
    try { Intl.supportedValuesOf(type).forEach(function (v) { d.appendChild(h("option", { value: v })); }); } catch (e) {}
    return d;
  }

  function build() {
    root.textContent = "";
    var b = cfg.business;
    var tzBtn = h("button", { type: "button", className: "x", text: "Use this device’s time zone", onclick: function () {
      b.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; build();
    } });

    root.append(
      section("Business and location", [
        field("Business name", b, "name"),
        field("Address shown on the site", b, "address"),
        field("Map search (address or lat,lng)", b, "mapQuery", { hint: "What Google Maps should show and give directions to, for example “Westlands, Nairobi, Kenya” or “-1.2634,36.8008”." }),
        h("div", { className: "grid" }, [
          field("Phone shown on the site", b, "phone"),
          field("WhatsApp number", b, "whatsapp", { type: "tel", hint: "Country code first, digits only. Kenya 0110 922 252 becomes 254110922252." })
        ]),
        field("Time zone", b, "timezone", { list: "tz", ph: "Africa/Nairobi", hint: "Controls “Open now” and the booking times." }), tzBtn,
        h("div", { className: "grid" }, [
          field("Currency code", b, "currency", { list: "cur", ph: "KES", hint: "KES, USD, EUR, GBP, NGN…" }),
          field("Language / region", b, "locale", { ph: "en-KE", hint: "Sets number and date style: en-US, en-GB, fr-FR…" })
        ]),
        datalist("tz", "timeZone"), datalist("cur", "currency")
      ]),
      section("Homepage text", [
        field("Small label above the title", b, "pill"),
        field("Title line 1", b, "line1"), field("Title line 2 (italic)", b, "line2"), field("Title line 3", b, "line3"),
        field("Intro paragraph", b, "intro", { area: true }),
        field("Note above the price list", b, "servicesNote", { area: true })
      ]),
      section("Numbers under the title", [listBlock(cfg.stats, function (s) {
        return [h("div", { className: "grid" }, [field("Number", s, "v"), field("Label", s, "l")])];
      }, function () { return { v: "", l: "" }; }, "Add a number")]),
      section("Photos (paste image links)", ["hero", "hair", "barber", "nails", "spa"].map(function (k) {
        var pv = h("img", { className: "pv", src: cfg.images[k], alt: "" });
        var f = field(k === "hero" ? "Main photo" : cfg.studios[k].name + " photo", cfg.images, k, { after: function (v) { pv.src = v; } });
        f.appendChild(pv);
        return f;
      })),
      section("Studios", CATS.map(function (c) {
        return h("div", { className: "row" }, [field("Studio name", cfg.studios[c], "name"), field("Description", cfg.studios[c], "desc", { area: true })]);
      })),
      section("Services and prices", [listBlock(cfg.services, function (s) {
        return [field("Service", s, "n"),
          h("div", { className: "grid" }, [field("Length", s, "d", { hint: "45 min, 2 hr, 1 hr 30 min" }), field("Starting price", s, "p", { type: "number", min: 0, step: "any" })]),
          catSelect(s, "c")];
      }, function () { return { n: "", d: "60 min", p: 0, c: "hair" }; }, "Add a service")]),
      section("Opening hours (24-hour clock)", cfg.hours.map(function (d) {
        return h("div", { className: "row" }, [h("strong", { text: d.day }), check("Closed", d, "closed"),
          h("div", { className: "grid" }, [field("Opens at (hour)", d, "open", { type: "number", min: 0, max: 23 }), field("Closes at (hour)", d, "close", { type: "number", min: 1, max: 24 })])]);
      })),
      section("Team", [listBlock(cfg.team, function (t) {
        return [field("Name", t, "name"), field("Role or specialty", t, "role"), catSelect(t, "cat")];
      }, function () { return { name: "", role: "", cat: "hair" }; }, "Add a team member")]),
      section("Colors", [h("div", { className: "grid" }, [field("Main color", b, "accent", { type: "color", hint: "Buttons and the booking band. Pick a darker color." }), field("Gold accent", b, "brass", { type: "color" })])]),
      section("Publishing (GitHub)", [
        h("p", { className: "muted", text: "Create a fine-grained token at github.com/settings/tokens, limited to this one repository with Contents set to Read and write. Never share it." }),
        h("div", { className: "grid" }, [field("GitHub username", gh, "owner", { after: persist }), field("Repository", gh, "repo", { after: persist })]),
        field("Branch", gh, "branch", { after: persist }),
        field("Token", gh, "token", { type: "password" }),
        check("Remember the token on this device", gh, "remember")
      ])
    );
  }
  function persist() { store("gh_owner", gh.owner); store("gh_repo", gh.repo); store("gh_branch", gh.branch); }

  function problem() {
    var b = cfg.business;
    if (!b.name.trim()) return "Enter the business name.";
    if (b.whatsapp.replace(/\D/g, "").length < 9) return "The WhatsApp number needs the country code, digits only.";
    try { new Intl.DateTimeFormat("en", { timeZone: b.timezone }); } catch (e) { return "Time zone not recognised. Example: Africa/Nairobi."; }
    try { new Intl.NumberFormat(b.locale, { style: "currency", currency: b.currency }); } catch (e) { return "Currency or language code not recognised. Example: KES and en-KE."; }
    for (var i = 0; i < cfg.hours.length; i++) { var d = cfg.hours[i]; if (!d.closed && !(d.open < d.close)) return d.day + ": closing time must be after opening time."; }
    if (!cfg.services.length) return "Add at least one service.";
    return "";
  }

  function b64(s) { return btoa(unescape(encodeURIComponent(s))); }
  document.getElementById("publish").onclick = function () {
    var p = problem(); if (p) return say(p, "bad");
    if (!gh.owner || !gh.repo || !gh.token) return say("Fill in the Publishing section: username, repository and token.", "bad");
    persist(); store("gh_token", gh.remember ? gh.token : null);
    var url = "https://api.github.com/repos/" + gh.owner + "/" + gh.repo + "/contents/config.json";
    var hd = { Authorization: "Bearer " + gh.token, Accept: "application/vnd.github+json" };
    say("Publishing…");
    fetch(url + "?ref=" + encodeURIComponent(gh.branch), { headers: hd }).then(function (r) {
      if (r.ok) return r.json();
      if (r.status === 404) return {};
      throw r.status;
    }).then(function (f) {
      return fetch(url, { method: "PUT", headers: hd, body: JSON.stringify({ message: "Update site content", content: b64(JSON.stringify(cfg, null, 2)), sha: f.sha, branch: gh.branch }) });
    }).then(function (r) {
      if (!r.ok) throw r.status;
      say("Published. Your website will show the changes in about a minute.", "good");
    }).catch(function (e) {
      say(e === 401 ? "GitHub rejected the token. Check it and try again."
        : e === 403 || e === 404 ? "GitHub could not find or write to that repository. Check the username, repository name, branch, and that the token has Contents: Read and write."
        : "Could not publish. Check your internet connection and try again.", "bad");
    });
  };

  document.getElementById("download").onclick = function () {
    var a = h("a", { href: URL.createObjectURL(new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" })), download: "config.json" });
    a.click(); say("Downloaded. Upload it to your repository to replace config.json.", "good");
  };
  var file = document.getElementById("file");
  document.getElementById("import").onclick = function () { file.click(); };
  file.onchange = function () {
    var r = new FileReader();
    r.onload = function () { try { cfg = JSON.parse(r.result); build(); say("File loaded. Press Publish to save it.", "good"); } catch (e) { say("That file is not a valid config.json.", "bad"); } };
    if (file.files[0]) r.readAsText(file.files[0]);
  };

  fetch("config.json?v=" + Date.now()).then(function (r) { return r.json(); }).then(function (c) { cfg = c; build(); })
    .catch(function () { say("Could not load config.json. Open this page from your website address, or use Import file.", "bad"); });
})();
