/* ============================================================
   minigames 共通モジュール
   ------------------------------------------------------------
   ・戻るボタン（全ゲーム共通のデザイン／プレイ中は確認）
   ・カメラ取得の一本化
       - ページ内では stream をシングルトンで使い回す（2回目のプロンプトを出さない）
       - 許可された事実を localStorage に残す（同一オリジンなので他のゲームからも読める）
   ・カメラが使えないときの Safari 設定手順の案内
   すべてのゲームは <script type="module"> なので import して使う。
============================================================ */

const HOME_URL   = '../';
const LS_CAMERA  = 'minigames.camera';   // 'granted' を記録（オリジン共有）

/* ---------- スタイル（1度だけ注入） ---------- */
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const css = `
  .mg-home{
    position:fixed; z-index:9000; display:inline-flex; align-items:center; gap:6px;
    font-family:'Zen Maru Gothic','M PLUS Rounded 1c',system-ui,sans-serif; font-weight:800;
    font-size:14px; line-height:1; color:#43361f; text-decoration:none; cursor:pointer;
    background:rgba(255,248,232,.92); border:3px solid #fff; border-radius:999px;
    padding:9px 15px 9px 12px; box-shadow:0 4px 0 rgba(120,90,40,.18), 0 6px 16px rgba(0,0,0,.22);
    -webkit-tap-highlight-color:transparent; -webkit-user-select:none; user-select:none;
    touch-action:manipulation;
  }
  .mg-home:active{ transform:translateY(3px); box-shadow:0 1px 0 rgba(120,90,40,.18); }
  .mg-home--top-left{ top:calc(10px + env(safe-area-inset-top)); left:calc(10px + env(safe-area-inset-left)); }
  .mg-home--top-right{ top:calc(10px + env(safe-area-inset-top)); right:calc(10px + env(safe-area-inset-right)); }
  .mg-home--bottom-left{ bottom:calc(10px + env(safe-area-inset-bottom)); left:calc(10px + env(safe-area-inset-left)); }
  .mg-home--bottom-right{ bottom:calc(10px + env(safe-area-inset-bottom)); right:calc(10px + env(safe-area-inset-right)); }
  .mg-home--quiet{ opacity:.55; }
  .mg-home--quiet:hover{ opacity:1; }

  .mg-sheet{
    position:fixed; inset:0; z-index:9500; display:flex; align-items:center; justify-content:center;
    padding:20px; background:rgba(12,10,26,.72); -webkit-backdrop-filter:blur(3px); backdrop-filter:blur(3px);
    font-family:'Zen Maru Gothic','M PLUS Rounded 1c',system-ui,sans-serif; color:#43361f;
    overflow-y:auto; -webkit-overflow-scrolling:touch;
  }
  .mg-card{
    background:#fff8e8; border:4px solid #fff; border-radius:22px; padding:20px 20px 18px;
    max-width:460px; width:100%; max-height:86vh; overflow-y:auto; text-align:center;
    box-shadow:0 14px 34px rgba(0,0,0,.35);
  }
  .mg-card h3{ margin:0 0 10px; font-size:19px; color:#5aa01f; }
  .mg-card p{ margin:0 0 10px; font-size:14px; line-height:1.8; }
  .mg-card ol{ margin:0 0 12px; padding-left:1.3em; text-align:left; font-size:14px; line-height:1.9; }
  .mg-card .mg-note{ font-size:12px; color:#8a795a; line-height:1.7; }
  .mg-row{ display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:12px; }
  .mg-btn{
    font-family:inherit; font-weight:800; font-size:15px; cursor:pointer;
    color:#fff; background:linear-gradient(180deg,#8ed44a,#5aa01f); border:none; border-radius:999px;
    padding:12px 26px; box-shadow:0 4px 0 #3f7314; -webkit-tap-highlight-color:transparent;
  }
  .mg-btn:active{ transform:translateY(3px); box-shadow:0 1px 0 #3f7314; }
  .mg-btn--alt{ background:linear-gradient(180deg,#fff,#ece0c4); color:#6c5a3a; box-shadow:0 4px 0 #c9b791; }
  .mg-btn--alt:active{ box-shadow:0 1px 0 #c9b791; }
  .mg-link{
    display:inline-block; font-family:inherit; font-size:12px; font-weight:700; cursor:pointer;
    color:inherit; opacity:.85; background:none; border:none; padding:6px 2px; text-decoration:underline;
    -webkit-tap-highlight-color:transparent;
  }
  .mg-link:active{ opacity:1; }
  `;
  const el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
}

/* ============================================================
   カメラ
============================================================ */
const DEFAULT_CONSTRAINTS = {
  video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
  audio: false
};

let currentStream = null;
let pending = null;

function rememberGranted() {
  try { localStorage.setItem(LS_CAMERA, 'granted'); } catch (e) {}
}
function forgetGranted() {
  try { localStorage.removeItem(LS_CAMERA); } catch (e) {}
}

/** 過去にこのオリジンでカメラを許可したことがあるか（同期・ヒント用） */
export function cameraKnownGranted() {
  try { return localStorage.getItem(LS_CAMERA) === 'granted'; } catch (e) { return false; }
}

/** Permissions API での現在の状態。未対応環境は 'unknown' */
export async function cameraState() {
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const st = await navigator.permissions.query({ name: 'camera' });
      if (st && st.state) return st.state;             // granted / denied / prompt
    }
  } catch (e) { /* Safari 15 以前などは throw する */ }
  return cameraKnownGranted() ? 'granted' : 'unknown';
}

/**
 * カメラを取得する。ページ内では 1 本の stream を使い回すので、
 * 同じページから何度呼んでも許可を聞かれるのは最初の 1 回だけ。
 */
export function requestCamera(constraints = DEFAULT_CONSTRAINTS) {
  if (currentStream && currentStream.getTracks().some(t => t.readyState === 'live')) {
    return Promise.resolve(currentStream);
  }
  if (pending) return pending;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const err = new Error('この環境ではカメラAPIがつかえません');
    err.unsupported = true;
    return Promise.reject(err);
  }

  pending = navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      currentStream = stream;
      rememberGranted();
      return stream;
    })
    .catch(err => {
      if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        forgetGranted();
        err.denied = true;
      }
      throw err;
    })
    .finally(() => { pending = null; });

  return pending;
}

/** 取得済みの stream を止める（画面を離れるときなど） */
export function releaseCamera() {
  if (!currentStream) return;
  try { currentStream.getTracks().forEach(t => t.stop()); } catch (e) {}
  currentStream = null;
}

// ページを離れるときはカメラを止める（撮影中インジケータをすぐ消す）。
// ただし bfcache から復帰したときは stream が死んでいるので読み直す。
let releasedOnHide = false;
window.addEventListener('pagehide', () => {
  if (currentStream) { releasedOnHide = true; releaseCamera(); }
});
window.addEventListener('pageshow', (e) => {
  if (e.persisted && releasedOnHide) location.reload();
});

/* ---------- カメラ設定の案内 ---------- */
export function showCameraHelp() {
  injectStyles();
  const sheet = document.createElement('div');
  sheet.className = 'mg-sheet';
  sheet.innerHTML = `
    <div class="mg-card">
      <h3>📷 カメラの せってい</h3>
      <p>Safari で <b>毎回きかれる</b>／<b>使えない</b> ときは、この設定で1回きりにできるよ。</p>
      <ol>
        <li>アドレスバーの <b>「あア」</b>（または鍵アイコン）をタップ</li>
        <li><b>「ウェブサイトの設定」</b> をひらく</li>
        <li><b>カメラ</b> を <b>「許可」</b> にする</li>
        <li>ページを 再よみこみ（かならず1回）</li>
      </ol>
      <p class="mg-note">
        ぜんぶ拒否になっているときは、iPad/iPhone の <b>設定 → Safari → カメラ</b> も「確認」または「許可」にしてね。<br>
        ホーム画面に追加したアプリでは、<b>1回 許可すれば そのアプリの中の ぜんぶのゲームで共通</b>になるよ。
        （一覧のページをホーム画面に追加するのがおすすめ）
      </p>
      <div class="mg-row"><button class="mg-btn" type="button">とじる</button></div>
    </div>`;
  const close = () => sheet.remove();
  sheet.querySelector('.mg-btn').addEventListener('click', close);
  sheet.addEventListener('click', e => { if (e.target === sheet) close(); });
  document.body.appendChild(sheet);
  return sheet;
}

/** 「毎回きかれるときは」の小さなリンク要素を返す */
export function cameraHelpLink(text = '📷 毎回きかれるときは…') {
  injectStyles();
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'mg-link';
  b.textContent = text;
  b.addEventListener('click', e => { e.preventDefault(); showCameraHelp(); });
  return b;
}

/* ============================================================
   戻るボタン
============================================================ */
function confirmLeave() {
  injectStyles();
  return new Promise(resolve => {
    const sheet = document.createElement('div');
    sheet.className = 'mg-sheet';
    sheet.innerHTML = `
      <div class="mg-card">
        <h3>ゲームを やめる？</h3>
        <p>いまのゲームを おわりにして、ゲーム一覧に もどるよ。</p>
        <div class="mg-row">
          <button class="mg-btn mg-btn--alt" type="button" data-act="stay">つづける</button>
          <button class="mg-btn" type="button" data-act="leave">🏠 もどる</button>
        </div>
      </div>`;
    const done = v => { sheet.remove(); resolve(v); };
    sheet.querySelector('[data-act="stay"]').addEventListener('click', () => done(false));
    sheet.querySelector('[data-act="leave"]').addEventListener('click', () => done(true));
    sheet.addEventListener('click', e => { if (e.target === sheet) done(false); });
    document.body.appendChild(sheet);
  });
}

/**
 * 戻るボタンを設置する。
 * @param {object} opts
 * @param {Element} [opts.mount]   既存の要素を戻るボタンとして使う（ゲーム側の意匠に合わせたいとき）
 * @param {Element} [opts.parent]  生成したボタンの追加先（既定: document.body）
 * @param {string}  [opts.corner]  'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
 * @param {string}  [opts.label]   ボタンの文言
 * @param {string}  [opts.href]    行き先（既定: '../'）
 * @param {boolean} [opts.quiet]   すこし透けさせる
 * @param {() => boolean} [opts.confirmWhile] true を返す間だけ確認をはさむ
 */
export function mountHomeButton(opts = {}) {
  injectStyles();
  const href = opts.href || HOME_URL;
  const confirmWhile = typeof opts.confirmWhile === 'function' ? opts.confirmWhile : () => false;

  let el = opts.mount;
  if (!el) {
    el = document.createElement('a');
    el.className = 'mg-home mg-home--' + (opts.corner || 'top-left') + (opts.quiet ? ' mg-home--quiet' : '');
    el.href = href;
    el.innerHTML = '<span aria-hidden="true">🏠</span><span>' + (opts.label || 'ゲーム一覧') + '</span>';
    (opts.parent || document.body).appendChild(el);
  }
  el.setAttribute('aria-label', 'ゲーム一覧にもどる');
  if (!el.title) el.title = 'ゲーム一覧にもどる';

  const go = () => { releaseCamera(); location.href = href; };

  el.addEventListener('click', async (e) => {
    e.preventDefault();
    if (confirmWhile()) {
      if (await confirmLeave()) go();
    } else {
      go();
    }
  });
  return el;
}
