/* ============================================================
   ПИКСЕЛЬНОЕ ПОЗДРАВЛЕНИЕ  ♥
   Всё, что можно менять — в блоке CONFIG ниже.
   ============================================================ */

const CONFIG = {

  /* сколько фоток / сердечек */
  photoCount: 19,

  /* папка с фотками. Файлы называть: 01, 02, ... 19
     Расширение любое из списка ниже — скрипт сам найдёт нужное. */
  photoDir: "photos/",
  photoExts: ["jpg", "jpeg", "png", "webp", "JPG", "JPEG", "PNG"],

  /* подписи к фоткам — 19 штук, меняй как хочешь */
  captions: [
    "с этого всё начиналось ♥",
    "мой любимый человек",
    "твоя улыбка — лучшее, что есть",
    "помнишь этот день?",
    "с тобой даже обычное — особенное",
    "самая красивая",
    "моё спокойствие",
    "тут ты особенно классная",
    "наши маленькие моменты",
    "смотрю и улыбаюсь",
    "с тобой тепло",
    "моя радость",
    "эти глаза ♥",
    "самая умная и добрая",
    "хочу таких дней побольше",
    "ты — моё везение",
    "рядом с тобой всё правильно",
    "люблю тебя",
    "и это только начало ♥"
  ],

  /* финальное поздравление */
  message: "Дорогая Машуля, поздравляю тебя с днем рождения! С каждым днем ты радуешь меня все больше чем бы я только мог подумать. Твоя красота очаровывает все больше и больше с каждым мгновением. Ты лучший человек, которого я встречал, дорожу тобой очень и очень сильно, спасибо тебе! Оставайся такой же замечательной, умной и заботливой, развивайся и достигай поставленных целей. Люблю тебя очень и очень!",

  signature: "— Диня —"
};

/* ============================================================
   ПИКСЕЛЬНОЕ СЕРДЦЕ (12 x 10)
   ============================================================ */
const HEART_MAP = [
  "001100001100",
  "011110011110",
  "111111111111",
  "111111111111",
  "111111111111",
  "011111111110",
  "001111111100",
  "000111111000",
  "000011110000",
  "000001100000"
];
const HIGHLIGHT = new Set(["2,1", "3,1", "2,2", "3,2"]); /* блик-квадратик */

function heartSVG() {
  let base = "", hl = "";
  HEART_MAP.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== "1") continue;
      const rect = `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      if (HIGHLIGHT.has(x + "," + y)) hl += rect; else base += rect;
    }
  });
  return `<svg viewBox="0 0 12 10" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
    <g fill="currentColor">${base}</g><g class="hl">${hl}</g></svg>`;
}

/* ============================================================
   ЗВУК (8-бит, без файлов)
   ============================================================ */
let audioCtx = null, muted = false;

function beep(freq, dur = 0.11, type = "square", vol = 0.07) {
  if (muted) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + dur);
  } catch (e) { /* звук не критичен */ }
}

function melody(notes) {
  notes.forEach(([f, at, d]) => setTimeout(() => beep(f, d || 0.16, "square", 0.06), at));
}

/* ============================================================
   СОСТОЯНИЕ
   ============================================================ */
const state = {
  collected: new Array(CONFIG.photoCount).fill(false),
  count: 0,
  finaleStarted: false,
  sections: []
};

const $ = (id) => document.getElementById(id);

/* ============================================================
   СТАРТ
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  buildBackground();
  buildHUD();
  buildSections();
  $("introHeart").innerHTML = heartSVG();
  bindControls();
  observe();
});

/* ---------- фон: звёзды + парящие сердечки ---------- */
function buildBackground() {
  const layer = $("bgLayer");
  let html = "";
  for (let i = 0; i < 70; i++) {
    html += `<i class="star" style="left:${rnd(0, 100)}%;top:${rnd(0, 100)}%;
      animation-delay:${rnd(0, 3).toFixed(2)}s"></i>`;
  }
  for (let i = 0; i < 12; i++) {
    html += `<span class="float-heart" style="left:${rnd(2, 96)}%;
      animation-duration:${rnd(16, 32).toFixed(1)}s;
      animation-delay:-${rnd(0, 25).toFixed(1)}s;
      width:${rnd(10, 22) | 0}px">${heartSVG()}</span>`;
  }
  layer.innerHTML = html;
}

/* ---------- панель сердечек ---------- */
function buildHUD() {
  const slots = $("hudSlots");
  $("hudTotal").textContent = CONFIG.photoCount;
  for (let i = 0; i < CONFIG.photoCount; i++) {
    const s = document.createElement("div");
    s.className = "slot";
    s.dataset.i = i;
    s.innerHTML = heartSVG();
    slots.appendChild(s);
  }
}

/* ---------- секции с фотками ---------- */
function buildSections() {
  const main = $("scroller");
  const finalSec = $("final");
  const total = String(CONFIG.photoCount).padStart(2, "0");

  for (let i = 0; i < CONFIG.photoCount; i++) {
    const n = String(i + 1).padStart(2, "0");

    const sec = document.createElement("section");
    sec.className = "sec sec-photo";
    sec.dataset.index = i;

    sec.innerHTML = `
      <div class="card">
        <div class="frame">
          <img alt="фото ${n}" decoding="async"${i > 1 ? ' loading="lazy"' : ""}>
          <div class="placeholder">
            <span class="ph-heart">${heartSVG()}</span>
            <span>ФОТО ${n}<br>положи сюда<br>photos/${n}.jpg</span>
          </div>
        </div>
        <p class="caption">${CONFIG.captions[i] || ""}</p>
        <div class="num">${n} / ${total}</div>
      </div>`;

    main.insertBefore(sec, finalSec);
    loadPhoto(sec.querySelector("img"), n);
  }

  $("bigHeart").innerHTML = heartSVG();
  $("sign").textContent = CONFIG.signature;
}

/* пробуем расширения по очереди, если ничего нет — плейсхолдер */
function loadPhoto(img, n) {
  let k = 0;
  const frame = img.closest(".frame");
  const tryNext = () => {
    if (k >= CONFIG.photoExts.length) { frame.classList.add("empty"); return; }
    img.src = CONFIG.photoDir + n + "." + CONFIG.photoExts[k++];
  };
  img.addEventListener("error", tryNext);
  img.addEventListener("load", () => {
    frame.classList.remove("empty");
    /* рамка принимает пропорции фотки — вертикальные и горизонтальные не режутся */
    if (img.naturalWidth && img.naturalHeight) {
      frame.style.setProperty("--ar", (img.naturalWidth / img.naturalHeight).toFixed(4));
    }
  });
  tryNext();
}

/* ---------- кнопки ---------- */
function bindControls() {
  $("startBtn").addEventListener("click", () => {
    beep(880, 0.12);
    const first = document.querySelector(".sec-photo");
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  $("soundBtn").addEventListener("click", (e) => {
    muted = !muted;
    e.currentTarget.classList.toggle("off", muted);
    e.currentTarget.textContent = muted ? "✕" : "♪";
    if (!muted) beep(660, 0.1);
  });

  /* «ещё раз» — полностью перезапускаем историю */
  $("againBtn").addEventListener("click", () => {
    window.scrollTo(0, 0);
    location.reload();
  });
}

/* ---------- наблюдение за прокруткой ----------
   Появление карточки — через IntersectionObserver,
   а сбор сердечек — через положение секций при скролле:
   так ни одно сердечко не потеряется, даже если листать рывками.  */
function observe() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      if (en.target.id === "final") { runFinale(); return; }
      en.target.querySelector(".card").classList.add("show");
    });
  }, { threshold: 0.35 });

  state.sections = [...document.querySelectorAll(".sec-photo")];
  state.sections.forEach((s) => io.observe(s));
  io.observe($("final"));

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; syncCollected(); });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  syncCollected();
}

/* какие секции уже проехали середину экрана — те и собраны */
function syncCollected() {
  if (state.finaleStarted) return;

  const line = window.innerHeight * 0.55;
  let last = -1;
  for (let i = 0; i < state.sections.length; i++) {
    if (state.sections[i].getBoundingClientRect().top < line) last = i; else break;
  }

  let delay = 0;
  for (let i = 0; i <= last; i++) {
    if (state.collected[i]) continue;
    state.collected[i] = true;
    const idx = i, d = delay;
    delay += 90;                       /* если пропустили несколько — летят очередью */
    if (d === 0) launchHeart(idx); else setTimeout(() => launchHeart(idx), d);
  }
}

/* ---------- сердечко летит с фотки в панель ---------- */
function launchHeart(i) {
  if (state.finaleStarted) return;
  const sec = state.sections[i];
  const slot = document.querySelector(`.slot[data-i="${i}"]`);
  if (!sec || !slot || slot.classList.contains("filled")) return;

  const from = sec.querySelector(".frame").getBoundingClientRect();
  const to = slot.getBoundingClientRect();

  /* если фотка уже улетела за экран — запускаем сердечко с края, а не из ниоткуда */
  const x = clamp(from.left + from.width / 2, 30, window.innerWidth - 30);
  const y = clamp(from.top + from.height / 2, 60, window.innerHeight - 30);

  const fly = document.createElement("div");
  fly.className = "fly";
  fly.innerHTML = heartSVG();
  fly.style.left = x + "px";
  fly.style.top = y + "px";
  $("fxLayer").appendChild(fly);

  requestAnimationFrame(() => {
    fly.style.left = (to.left + to.width / 2) + "px";
    fly.style.top = (to.top + to.height / 2) + "px";
    fly.style.width = to.width + "px";
    fly.style.height = to.height + "px";
  });

  beep(520 + i * 28, 0.1);

  setTimeout(() => {
    fly.remove();
    if (slot.classList.contains("filled")) return;
    slot.classList.add("filled");
    state.count++;
    $("hudCount").textContent = state.count;
    beep(760 + i * 30, 0.08, "triangle", 0.05);
  }, 860);
}

function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }

/* ---------- ФИНАЛ: сердечки слетаются в одно ---------- */
function runFinale() {
  if (state.finaleStarted) return;
  state.finaleStarted = true;

  /* если что-то всё-таки не успело долететь — досчитываем сразу, чтобы было 19/19 */
  const slots = [...document.querySelectorAll(".slot")];
  slots.forEach((s) => s.classList.add("filled"));
  document.querySelectorAll(".fly").forEach((f) => f.remove());
  state.count = CONFIG.photoCount;
  $("hudCount").textContent = state.count;

  const wrap = $("bigHeartWrap").getBoundingClientRect();
  const cx = wrap.left + wrap.width / 2;
  const cy = wrap.top + wrap.height / 2;

  slots.forEach((slot, i) => {
    const r = slot.getBoundingClientRect();
    const fly = document.createElement("div");
    fly.className = "fly";
    fly.innerHTML = heartSVG();
    fly.style.left = (r.left + r.width / 2) + "px";
    fly.style.top = (r.top + r.height / 2) + "px";
    fly.style.width = Math.max(r.width, 18) + "px";
    fly.style.height = Math.max(r.height, 15) + "px";
    fly.style.transitionDuration = "1s";
    $("fxLayer").appendChild(fly);

    setTimeout(() => {
      fly.style.left = cx + "px";
      fly.style.top = cy + "px";
      fly.style.width = "40px";
      fly.style.height = "34px";
      beep(400 + i * 22, 0.07, "square", 0.04);
    }, 120 + i * 55);

    setTimeout(() => fly.remove(), 120 + i * 55 + 1000);
  });

  $("hud").classList.add("hidden");

  const mergeAt = 120 + (slots.length - 1) * 55 + 1000;

  setTimeout(() => {
    $("flash").classList.add("go");
    $("bigHeart").classList.add("on");
    melody([[523, 0], [659, 140], [784, 280], [1046, 420, 0.35]]);
    confetti(28);
  }, mergeAt);

  setTimeout(() => revealLetter(), mergeAt + 700);
}

/* ---------- письмо по словам ---------- */
function revealLetter() {
  const box = $("letter");
  const text = $("letterText");
  box.classList.add("on");

  const words = CONFIG.message.split(" ");
  text.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
  const spans = [...text.querySelectorAll(".w")];

  spans.forEach((s, i) => setTimeout(() => s.classList.add("in"), i * 55));

  const done = spans.length * 55 + 300;
  setTimeout(() => {
    $("sign").classList.add("on");
    beep(880, 0.2, "triangle", 0.05);
    confetti(20);
  }, done);
  setTimeout(() => $("againBtn").classList.add("on"), done + 900);
}

/* ---------- конфетти ---------- */
function confetti(n) {
  for (let i = 0; i < n; i++) {
    const c = document.createElement("span");
    c.className = "confetti";
    c.innerHTML = heartSVG();
    c.style.left = rnd(0, 100) + "%";
    c.style.width = (rnd(10, 22) | 0) + "px";
    c.style.animationDuration = rnd(2.4, 5).toFixed(2) + "s";
    c.style.animationDelay = rnd(0, 1.2).toFixed(2) + "s";
    c.style.color = ["#ff4d6d", "#ff90a8", "#ffd166"][i % 3];
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 7000);
  }
}

function rnd(a, b) { return a + Math.random() * (b - a); }
