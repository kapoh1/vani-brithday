(() => {
const C = window.SITE_CONFIG, $ = s => document.querySelector(s);
const VIEWS = ["home","playlist","letter","memories"];
const ICONS = {
  playlist:'<svg viewBox="0 0 24 24"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg>',
  letter:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  memories:'<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="1.5"/><rect x="6.5" y="5.5" width="11" height="9"/><circle cx="12" cy="10" r="2.4"/></svg>'
};
const PLAY='<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z"/></svg>',
PAUSE='<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>',
PREV='<svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zm3 7 10-7v14z"/></svg>',
NEXT='<svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM5 5l10 7L5 19z"/></svg>';

/* Generated placeholder art (no external images needed) */
const place = (seed, label="\u2665") => {
  const h = 335 + (seed * 11) % 30;
  return "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${h},75%,${14+seed%4*3}%)'/><stop offset='1' stop-color='#0B090C'/></linearGradient></defs><rect width='300' height='300' fill='url(#g)'/><text x='150' y='180' font-size='90' text-anchor='middle' fill='#C58A9F' opacity='.55' font-family='Georgia'>${label}</text></svg>`);
};
const mmss = t => isFinite(t) ? Math.floor(t/60)+":"+String(Math.floor(t%60)).padStart(2,"0") : "0:00";
const fill = el => el.style.setProperty("--p", (el.value-el.min)/(el.max-el.min)*100+"%");

/* ---------- Router ---------- */
function show(name) {
  if (!VIEWS.includes(name)) name = "home";
  VIEWS.forEach(v => $("#"+v).hidden = v !== name);
  $("#topbar").hidden = name === "home";
  window.scrollTo(0,0);
  const h = $("#"+name+" h1, #"+name+" h2"); if (h) h.focus({preventScroll:true});
}
const go = n => location.hash.slice(1) === n ? show(n) : (location.hash = n === "home" ? "" : n);
window.addEventListener("hashchange", () => show(location.hash.slice(1) || "home"));
document.addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) go(b.dataset.go); });

/* ---------- Home ---------- */
document.title = C.title + (C.name ? " \u2014 " + C.name : "");
$("#homeTitle").setAttribute("aria-label", C.title);
$("#homeTitle").innerHTML = [...C.title].map((c,i)=>`<span aria-hidden="true" style="animation-delay:${.3+i*.06}s">${c===" "?"&nbsp;":c}</span>`).join("");
$("#homeSub").textContent = C.subtitle;
$("#homeGreet").textContent = C.greeting;
$("#footer").textContent = C.footer;
$("#bloom").innerHTML = [0,72,144,216,288].map(a=>`<path transform="rotate(${a} 50 50)" d="M50 50C36 38 38 14 50 10c12 4 14 28 0 40z" fill="#9E1B3D" fill-opacity=".85" stroke="#C58A9F" stroke-width=".8"/>`).join("")+`<circle cx="50" cy="50" r="5" fill="#F4E9EC"/>`;
$("#cards").innerHTML = ["playlist","letter","memories"].map(k=>`<button class="card" data-go="${k}">${ICONS[k]}<b>${C.cards[k].title}</b><span>${C.cards[k].sub}</span></button>`).join("");

/* ---------- Playlist ---------- */
const P = C.playlist, tracks = P.tracks, audio = new Audio(); audio.preload = "metadata";
let cur = 0;
$("#plTitle").textContent = P.title; $("#plSub").textContent = P.subtitle;
$("#plCover").src = P.cover || place(3,"\u266B");
if (P.spotifyUrl) { const a = $("#plSpotify"); a.href = P.spotifyUrl; a.hidden = false; }
$("#prev").innerHTML = PREV; $("#next").innerHTML = NEXT; $("#play").innerHTML = PLAY;
const art = (t,i) => t.art || place(i+5);
$("#tracks").innerHTML = tracks.map((t,i)=>`<li><button class="track" data-i="${i}" aria-label="Play ${t.title} by ${t.artist}"><img src="${art(t,i)}" alt="" loading="lazy"><span class="t"><b></b><i></i></span><span class="ic">${PLAY}</span></button></li>`).join("");
document.querySelectorAll(".track").forEach((b,i)=>{ b.querySelector("b").textContent = tracks[i].title; b.querySelector("i").textContent = tracks[i].artist; });
function load(i, autoplay) {
  cur = (i + tracks.length) % tracks.length;
  const t = tracks[cur]; audio.src = t.src; $("#audioMsg").textContent = "";
  $("#npTitle").textContent = t.title; $("#npArtist").textContent = t.artist; $("#npArt").src = art(t,cur);
  $("#seek").value = 0; fill($("#seek")); $("#cur").textContent = "0:00"; $("#dur").textContent = "0:00";
  if (autoplay) audio.play().catch(()=>{});
  sync();
}
function sync() {
  $("#play").innerHTML = audio.paused ? PLAY : PAUSE;
  $("#play").setAttribute("aria-label", audio.paused ? "Play" : "Pause");
  document.querySelectorAll(".track").forEach((b,i)=>{ const on = i===cur; b.classList.toggle("on", on); b.querySelector(".ic").innerHTML = on && !audio.paused ? PAUSE : PLAY; });
}
$("#play").onclick = () => audio.paused ? audio.play().catch(()=>{}) : audio.pause();
$("#prev").onclick = () => load(cur-1, true);
$("#next").onclick = () => load(cur+1, true);
$("#tracks").onclick = e => { const b = e.target.closest(".track"); if (!b) return; const i = +b.dataset.i; i===cur && audio.src ? $("#play").onclick() : load(i, true); };
$("#seek").oninput = e => { if (audio.duration) audio.currentTime = e.target.value/100*audio.duration; fill(e.target); };
$("#vol").oninput = e => { audio.volume = +e.target.value; fill(e.target); };
audio.volume = .8; fill($("#vol"));
audio.onplay = audio.onpause = sync;
audio.onended = () => load(cur+1, true);
audio.onloadedmetadata = () => $("#dur").textContent = mmss(audio.duration);
audio.ontimeupdate = () => { if (!audio.duration) return; const s=$("#seek"); s.value = audio.currentTime/audio.duration*100; fill(s); $("#cur").textContent = mmss(audio.currentTime); };
audio.onerror = () => $("#audioMsg").textContent = "This track can't be played. Check its audio URL in js/config.js.";
if (tracks.length) load(0, false); else $("#audioMsg").textContent = "Add tracks in js/config.js to start the playlist.";

/* ---------- Letter ---------- */
const paras = C.letter.text.trim().split(/\n\s*\n/);
$("#paper").innerHTML = paras.map(()=>"<p></p>").join("");
$("#paper").querySelectorAll("p").forEach((p,i)=>p.textContent = paras[i].trim());
$("#envelope").onclick = function () {
  this.classList.add("open"); this.setAttribute("aria-expanded","true");
  $("#envHint").hidden = true;
  setTimeout(() => { $("#paper").hidden = false; $("#paper").scrollIntoView({behavior:"smooth",block:"center"}); }, 650);
};

/* ---------- Gallery + lightbox ---------- */
const photos = C.photos, lb = $("#lightbox"); let pi = 0;
if (photos.length !== 10) console.warn("SITE_CONFIG.photos should contain exactly 10 items.");
const src = (p,i) => p.src || place(i+1);
$("#gallery").innerHTML = photos.map((p,i)=>`<button class="polaroid" data-i="${i}"><img src="${src(p,i)}" alt="" loading="lazy" decoding="async"><b></b><small></small></button>`).join("");
document.querySelectorAll(".polaroid").forEach((b,i)=>{
  b.querySelector("b").textContent = photos[i].caption; b.querySelector("small").textContent = photos[i].date || "";
  b.querySelector("img").alt = photos[i].caption; b.setAttribute("aria-label","Open photo: "+photos[i].caption);
});
function lbShow(i) {
  pi = (i + photos.length) % photos.length; const p = photos[pi];
  $("#lbImg").src = src(p,pi); $("#lbImg").alt = p.caption;
  $("#lbCap").textContent = p.caption + (p.date ? " \u2014 " + p.date : "");
}
$("#gallery").onclick = e => { const b = e.target.closest(".polaroid"); if (b) { lbShow(+b.dataset.i); lb.showModal(); } };
lb.querySelector(".lb-close").onclick = () => lb.close();
lb.querySelector(".l").onclick = () => lbShow(pi-1);
lb.querySelector(".r").onclick = () => lbShow(pi+1);
lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });
lb.addEventListener("keydown", e => { if (e.key==="ArrowLeft") lbShow(pi-1); if (e.key==="ArrowRight") lbShow(pi+1); });

/* ---------- Falling petals ---------- */
const cv = $("#petals"), cx = cv.getContext("2d");
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let W, H; const size = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; }; size(); addEventListener("resize", size);
  const ps = Array.from({length:22}, () => ({x:Math.random()*W,y:Math.random()*H,r:3+Math.random()*5,v:.25+Math.random()*.5,s:Math.random()*6,a:.15+Math.random()*.3}));
  (function tick() {
    cx.clearRect(0,0,W,H);
    for (const p of ps) {
      p.y += p.v; p.s += .01; p.x += Math.sin(p.s)*.5; if (p.y > H+10) { p.y = -10; p.x = Math.random()*W; }
      cx.save(); cx.translate(p.x,p.y); cx.rotate(p.s); cx.globalAlpha = p.a; cx.fillStyle = "#C58A9F";
      cx.beginPath(); cx.ellipse(0,0,p.r,p.r*.55,0,0,7); cx.fill(); cx.restore();
    }
    requestAnimationFrame(tick);
  })();
}

show(location.hash.slice(1) || "home");
})();
