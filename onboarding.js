(() => {
  "use strict";

  const NAME_KEY = "bloom_user_name";

  let savedName = "";
  try {
    savedName = (localStorage.getItem(NAME_KEY) || "").trim();
  } catch (error) {
    // Continue to show onboarding if browser storage cannot be read.
  }

  let userName = savedName;

  function turkishPossessive(name) {
    const clean = (name || "").trim();
    if (!clean) return "";
    const lower = clean.toLocaleLowerCase("tr-TR");
    const vowels = lower.match(/[aeıioöuü]/g);
    const lastVowel = vowels ? vowels[vowels.length - 1] : "a";
    const endsWithVowel = /[aeıioöuü]$/.test(lower);
    let suffix = "in";
    if (lastVowel === "a" || lastVowel === "ı") suffix = "ın";
    else if (lastVowel === "e" || lastVowel === "i") suffix = "in";
    else if (lastVowel === "o" || lastVowel === "u") suffix = "un";
    else if (lastVowel === "ö" || lastVowel === "ü") suffix = "ün";
    return `${clean}'${endsWithVowel ? "n" : ""}${suffix}`;
  }

  function replaceName(text) {
    if (!userName || !text) return text;
    return text
      .replace(/(?:Tuğba|Tugba)'n[ıi]n/g, () => turkishPossessive(userName))
      .replace(/Tuğba|Tugba/g, userName);
  }

  function personalizeTextNode(node) {
    if (!userName || node.nodeType !== Node.TEXT_NODE) return;

    const parent = node.parentElement;
    if (parent && /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT)$/i.test(parent.tagName)) return;

    const personalizedText = replaceName(node.nodeValue);
    if (personalizedText !== node.nodeValue) node.nodeValue = personalizedText;
  }

  function personalizeTitle() {
    if (!userName) return;
    const personalizedTitle = replaceName(document.title);
    if (personalizedTitle !== document.title) document.title = personalizedTitle;
  }

  function personalizeSubtree(root) {
    if (!userName || !root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      personalizeTextNode(root);
      return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) personalizeTextNode(node);
  }

  function personalizePage() {
    if (!userName) return;
    personalizeSubtree(document.body);
    personalizeTitle();
  }

  const observer = new MutationObserver((mutations) => {
    if (!userName) return;
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        personalizeTextNode(mutation.target);
      } else {
        mutation.addedNodes.forEach(personalizeSubtree);
      }
    }
    personalizeTitle();
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }
  personalizePage();

  function showOnboardingModal(allowCancel = false) {
    const existing = document.querySelector(".bloom-onboarding");
    if (existing) existing.remove();

    const styles = document.createElement("style");
    styles.textContent = `
      .bloom-onboarding {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: grid;
        place-items: center;
        padding: 24px;
        background: radial-gradient(800px 600px at 20% 10%, #fde9f1, transparent 70%),
                    radial-gradient(700px 600px at 90% 90%, #efe6f8, transparent 70%),
                    linear-gradient(160deg, #fff8fa, #fdf1f5 50%, #f6f1fa);
        font-family: 'Quicksand', 'Nunito', 'Segoe UI', system-ui, sans-serif;
        color: #5b4450;
      }
      .bloom-onboarding__card {
        width: min(100%, 440px);
        padding: 36px 30px;
        text-align: center;
        background: rgba(255, 255, 255, .86);
        border: 1px solid rgba(232, 191, 209, .6);
        border-radius: 28px;
        box-shadow: 0 20px 60px rgba(91, 68, 80, .14);
      }
      .bloom-onboarding__flower { font-size: 42px; line-height: 1; }
      .bloom-onboarding h1 {
        margin: 14px 0 8px;
        color: #6a4659;
        font: 600 32px/1.2 'Fraunces', Georgia, serif;
      }
      .bloom-onboarding p { margin: 0 0 24px; color: #8a5f75; line-height: 1.65; }
      .bloom-onboarding label {
        display: block;
        margin-bottom: 7px;
        text-align: left;
        color: #8a5f75;
        font-size: 13px;
        font-weight: 700;
      }
      .bloom-onboarding input {
        width: 100%;
        padding: 13px 15px;
        border: 1.5px solid #f5dce8;
        border-radius: 14px;
        outline: none;
        background: #fffdf8;
        color: #5b4450;
        font: inherit;
        font-size: 16px;
      }
      .bloom-onboarding input:focus {
        border-color: #d68baa;
        box-shadow: 0 0 0 4px rgba(214, 139, 170, .15);
      }
      .bloom-onboarding__error {
        min-height: 20px;
        margin: 7px 0 12px;
        text-align: left;
        color: #b34e67;
        font-size: 13px;
      }
      .bloom-onboarding button {
        width: 100%;
        padding: 13px 20px;
        border: 0;
        border-radius: 999px;
        background: linear-gradient(135deg, #ebadc6, #d68baa);
        box-shadow: 0 4px 14px rgba(214, 139, 170, .3);
        color: #fff;
        font: inherit;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
      }
      .bloom-onboarding button:hover { filter: brightness(1.03); }
      @media (max-width: 480px) {
        .bloom-onboarding__card { padding: 30px 22px; }
        .bloom-onboarding h1 { font-size: 28px; }
      }
    `;
    document.head.appendChild(styles);

    const screen = document.createElement("section");
    screen.className = "bloom-onboarding";
    screen.setAttribute("role", "dialog");
    screen.setAttribute("aria-modal", "true");
    screen.setAttribute("aria-labelledby", "bloom-onboarding-title");
    screen.innerHTML = `
      <div class="bloom-onboarding__card">
        <div class="bloom-onboarding__flower" aria-hidden="true">🌷</div>
        <h1 id="bloom-onboarding-title">Bloom'a hoş geldin</h1>
        <p>Bu küçük dünyayı senin için kişiselleştirelim. Sana nasıl hitap edelim?</p>
        <form novalidate>
          <label for="bloom-onboarding-name">Adın</label>
          <input id="bloom-onboarding-name" name="name" type="text" autocomplete="given-name" maxlength="80" value="${(userName || "").replace(/"/g, "&quot;")}" required>
          <div class="bloom-onboarding__error" id="bloom-onboarding-error" aria-live="polite"></div>
          <button type="submit">Devam Et</button>
        </form>
      </div>
    `;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.appendChild(screen);

    const form = screen.querySelector("form");
    const input = screen.querySelector("#bloom-onboarding-name");
    const error = screen.querySelector("#bloom-onboarding-error");
    input.focus();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = input.value.trim();
      if (!name) {
        error.textContent = "Lütfen adını gir.";
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }

      try {
        localStorage.setItem(NAME_KEY, name);
      } catch (storageError) {
        error.textContent = "Adın kaydedilemedi. Lütfen tekrar dene.";
        return;
      }

      userName = name;
      document.body.style.overflow = previousOverflow;
      screen.remove();
      styles.remove();
      if (typeof window.render === "function") {
        try { window.render(); } catch (e) {}
      }
      personalizePage();
    });
  }

  window.__bloomOpenOnboarding = () => showOnboardingModal(true);

  if (savedName) return;
  showOnboardingModal(false);
})();
