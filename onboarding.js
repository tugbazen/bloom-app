(() => {
  "use strict";

  const NAME_KEY = "bloom_user_name";
  const PROFILE_KEY = "bloom_user_profile";

  let savedName = "";
  let savedProfile = null;
  try {
    savedName = (localStorage.getItem(NAME_KEY) || "").trim();
    const rawProf = localStorage.getItem(PROFILE_KEY);
    if (rawProf) savedProfile = JSON.parse(rawProf);
  } catch (error) {
    // Continue to show onboarding if browser storage cannot be read.
  }

  let userName = (savedProfile && savedProfile.name) || savedName || "";
  if (userName && !savedName) {
    try { localStorage.setItem(NAME_KEY, userName); } catch (e) {}
  }

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

  // Yaş ve cinsiyete göre önerilen sabah/akşam rutinleri ve hızlı öneri havuzu
  function getRecommendedRoutines(ageNum, gender) {
    const age = Math.max(10, Math.min(99, Number(ageNum) || 21));
    const g = gender || "female";
    const isFemale = g === "female";
    const isMale = g === "male";

    let groupLabel = "18–24 Yaş · Üniversite & Genç Yetişkin";
    let morning = [];
    let evening = [];
    let morningSuggestions = [];
    let eveningSuggestions = [];

    if (age < 18) {
      groupLabel = `${age} Yaş · Genç & Lise Rutini`;
      morning = [
        { text: "Uyan", time: "07:00", lvl: 1 },
        { text: "Yatağımı düzelt", time: "", lvl: 2 },
        { text: "Yüzümü yıka & dişlerimi fırçala", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (Nemlendirici & SPF)" : isMale ? "Yüz nemlendirici & güneş koruyucu sür" : "Cilt bakımımı yap", time: "", lvl: 3 },
        { text: "1 bardak su iç", time: "", lvl: 1 },
        { text: "Dengeli kahvaltı yap", time: "", lvl: 1 },
        { text: "Okul çantamı ve ders programımı kontrol et", time: "", lvl: 2 },
        { text: "Günün hedeflerini belirle", time: "", lvl: 3 }
      ];
      evening = [
        { text: "Ödev ve ders tekrarlarını tamamla", time: "20:00", lvl: 2 },
        { text: "Su tüketimini kontrol et", time: "", lvl: 2 },
        { text: "Yarınki okul çantamı ve kıyafetimi hazırla", time: "", lvl: 2 },
        { text: "Odamı 5 dakika toparla", time: "", lvl: 3 },
        { text: "Dişlerimi fırçala", time: "", lvl: 1 },
        { text: "Cilt bakımımı yap (Yüz temizliği)", time: "", lvl: 2 },
        { text: "Ekranları kapat & kitap oku", time: "", lvl: 3 },
        { text: "Uykuya hazırlan", time: "22:30", lvl: 1 }
      ];
      morningSuggestions = ["10 dk sabah esnemesi", "Vitaminimi al", "Saç bakımımı yap", "Günün mottosunu oku"];
      eveningSuggestions = ["20 soru çöz", "Günlük değerlendirme yaz", "Bitki çayı / süt iç", "15 dk odamı düzenle"];
    } else if (age <= 24) {
      groupLabel = `${age} Yaş · Üniversite & Genç Yetişkin Rutini`;
      morning = [
        { text: "Uyan", time: "07:30", lvl: 1 },
        { text: "Yatağımı düzelt", time: "", lvl: 2 },
        { text: "Yüzümü yıka", time: "", lvl: 1 },
        { text: "Dişlerimi fırçala", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (Tonik, Serum & SPF)" : isMale ? "Cilt bakımımı yap (Temizlik & Nemlendirici/SPF)" : "Cilt bakımımı yap", time: "", lvl: 3 },
        { text: "Su iç", time: "", lvl: 1 },
        { text: "Proteinli dengeli kahvaltı yap", time: "", lvl: 1 },
        { text: "Ders / çalışma programını kontrol et", time: "", lvl: 2 },
        { text: "Çantamı hazırla", time: "", lvl: 2 },
        { text: "Günün 3 önceliğini belirle", time: "", lvl: 3 }
      ];
      evening = [
        { text: "Günlük görevleri kontrol et", time: "21:00", lvl: 2 },
        { text: "Beslenme kayıtlarını tamamla", time: "", lvl: 3 },
        { text: "Su tüketimini kontrol et", time: "", lvl: 2 },
        { text: "Yarınki dersleri & slaytları kontrol et", time: "", lvl: 2 },
        { text: isFemale ? "Çantamı ve yarınki kombinimi hazırla" : "Çantamı ve yarınki eşyalarımı hazırla", time: "", lvl: 3 },
        { text: "Odamı 5 dakika toparla", time: "", lvl: 3 },
        { text: "Dişlerimi fırçala", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (Çift aşamalı temizlik & nemlendirici)" : "Cilt bakımımı yap", time: "", lvl: 2 },
        { text: "Günlük değerlendirme yaz", time: "", lvl: 3 },
        { text: "Uykuya hazırlan", time: "23:00", lvl: 1 }
      ];
      morningSuggestions = ["15 dk sabah yürüyüşü / pilates", "Vitamin / takviye al", "5 dk nefes egzersizi", "Evden çıkmaya hazırlan"];
      eveningSuggestions = ["25 dk slayt tekrarı", "Bitki çayı iç", "10 sayfa kitap oku", "Telefonu uzaklaştır"];
    } else if (age <= 39) {
      groupLabel = `${age} Yaş · Kariyer & Aktif Yaşam Rutini`;
      morning = [
        { text: "Uyan", time: "07:00", lvl: 1 },
        { text: "1 büyük bardak ılık su iç", time: "", lvl: 1 },
        { text: "Yatağımı düzelt", time: "", lvl: 2 },
        { text: "Yüzümü yıka & dişlerimi fırçala", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (C Vitamini Serum, Nemlendirici & SPF)" : isMale ? "Cilt bakımımı yap (Yüz yıkama, Nemlendirici & SPF)" : "Cilt bakımımı yap", time: "", lvl: 2 },
        { text: "10 dk sabah esnemesi & mobilite", time: "", lvl: 3 },
        { text: "Dengeli kahvaltı yap", time: "", lvl: 1 },
        { text: "Günün 3 ana hedefini ve takvimimi planla", time: "", lvl: 2 }
      ];
      evening = [
        { text: "İş / ekran kapanışı yap", time: "20:30", lvl: 2 },
        { text: "Beslenme ve su hedefimi kontrol et", time: "", lvl: 2 },
        { text: "Yarınki planımı ve kıyafetimi hazırla", time: "", lvl: 3 },
        { text: "Yaşam alanımı 10 dakika toparla", time: "", lvl: 3 },
        { text: "Dişlerimi fırçala", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (Makyaj/SPF temizliği & gece serumu)" : "Cilt bakımımı yap (Gece temizliği & nemlendirici)", time: "", lvl: 2 },
        { text: "Günlük değerlendirme yaz & kitap oku", time: "", lvl: 3 },
        { text: "Uykuya hazırlan", time: "23:00", lvl: 1 }
      ];
      morningSuggestions = ["30 dk tempolu yürüyüş", "Vitamin & kolajen/takviye al", "Öğle yemeği çantamı hazırla", "5 dk meditasyon"];
      eveningSuggestions = ["20 dk yoga & sırt esnetme", "Bitki çayı iç", "Magnezyum al", "Kafeinsiz akşam modu"];
    } else {
      groupLabel = `${age} Yaş · Sağlıklı Yaşam, Denge & Zindelik Rutini`;
      morning = [
        { text: "Uyan & derin nefes egzersizi", time: "07:00", lvl: 1 },
        { text: "1-2 bardak oda sıcaklığında su iç", time: "", lvl: 1 },
        { text: "Yüzümü yıka & dişlerimi fırçala", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (Onarıcı nemlendirici, göz kremi & SPF)" : "Cilt bakımımı yap (Nemlendirici & güneş koruyucu)", time: "", lvl: 2 },
        { text: "15 dk eklem mobilite & sabah yürüyüşü", time: "", lvl: 2 },
        { text: "Protein ve lif dengeli kahvaltı yap", time: "", lvl: 1 },
        { text: "Günlük vitamin / ilaç takibimi kontrol et", time: "", lvl: 1 },
        { text: "Günün önceliklerini belirle", time: "", lvl: 2 }
      ];
      evening = [
        { text: "Hafif akşam yürüyüşü veya esneme", time: "20:00", lvl: 3 },
        { text: "Su ve beslenme günlüğünü tamamla", time: "", lvl: 2 },
        { text: "Yarınki programı gözden geçir", time: "", lvl: 2 },
        { text: "Dişlerimi fırçala", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (Gece kremi & göz çevresi bakımı)" : "Cilt bakımımı yap (Yüz temizliği & gece bakımı)", time: "", lvl: 2 },
        { text: "Dinlendirici okuma & günlük notu", time: "", lvl: 3 },
        { text: "Uykuya hazırlan", time: "22:30", lvl: 1 }
      ];
      morningSuggestions = ["Tansiyon / sağlık kaydı", "Yeşil çay iç", "Bahçe & çiçek bakımı", "20 dk pilates"];
      eveningSuggestions = ["Bitki çayı iç", "Ayak & bacak dinlendirme", "Şükür günlüğü yaz", "Ekranları 1 saat önce kapat"];
    }

    const genderLabel = isFemale ? "Kadın 🌸" : isMale ? "Erkek 🌿" : "Kişisel ✨";
    return {
      badge: `${groupLabel} · ${genderLabel}`,
      morning,
      evening,
      morningSuggestions,
      eveningSuggestions
    };
  }

  function escHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function showOnboardingModal(allowCancel = false) {
    const existing = document.querySelector(".bloom-onboarding");
    if (existing) existing.remove();
    const existingStyle = document.querySelector("#bloom-onboarding-styles");
    if (existingStyle) existingStyle.remove();

    let curProf = null;
    try {
      const rp = localStorage.getItem(PROFILE_KEY);
      if (rp) curProf = JSON.parse(rp);
    } catch (e) {}

    let initName = (curProf && curProf.name) || userName || "";
    let initAge = (curProf && curProf.age) ? Number(curProf.age) : 21;
    let initGender = (curProf && curProf.gender) || "female";

    // Mevcut kaydedilmiş rutinleri varsa ve kullanıcı Ayarlar'dan açtıysa onları yükle, yoksa yaş/cinsiyet önerisini yükle
    let rec = getRecommendedRoutines(initAge, initGender);
    let morningList = rec.morning.map(x => ({ ...x }));
    let eveningList = rec.evening.map(x => ({ ...x }));

    if (allowCancel && typeof window.__bloomGetRoutines === "function") {
      try {
        const curR = window.__bloomGetRoutines();
        if (curR && Array.isArray(curR.morning) && curR.morning.length) {
          morningList = curR.morning.map(x => ({ text: x.text || "", time: x.time || "", lvl: x.lvl || 2 }));
        }
        if (curR && Array.isArray(curR.evening) && curR.evening.length) {
          eveningList = curR.evening.map(x => ({ text: x.text || "", time: x.time || "", lvl: x.lvl || 2 }));
        }
      } catch (e) {}
    }

    const styles = document.createElement("style");
    styles.id = "bloom-onboarding-styles";
    styles.textContent = `
      .bloom-onboarding {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: calc(16px + env(safe-area-inset-top, 0px)) 12px calc(24px + env(safe-area-inset-bottom, 0px));
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        background: radial-gradient(800px 600px at 20% 10%, #fde9f1, transparent 70%),
                    radial-gradient(700px 600px at 90% 90%, #efe6f8, transparent 70%),
                    linear-gradient(160deg, #fff8fa, #fdf1f5 50%, #f6f1fa);
        font-family: 'Quicksand', 'Nunito', 'Segoe UI', system-ui, sans-serif;
        color: #5b4450;
      }
      .bloom-onboarding__card {
        width: min(100%, 720px);
        margin: auto;
        padding: 26px 22px;
        text-align: left;
        background: rgba(255, 255, 255, .93);
        border: 1px solid rgba(232, 191, 209, .7);
        border-radius: 28px;
        box-shadow: 0 20px 60px rgba(91, 68, 80, .16);
      }
      .bloom-onboarding__head {
        text-align: center;
        margin-bottom: 18px;
      }
      .bloom-onboarding__flower { font-size: 38px; line-height: 1; }
      .bloom-onboarding h1 {
        margin: 10px 0 6px;
        color: #6a4659;
        font: 600 28px/1.2 'Fraunces', Georgia, serif;
      }
      .bloom-onboarding__sub { margin: 0; color: #8a5f75; font-size: 14.5px; line-height: 1.5; }
      .bloom-onboarding__grid3 {
        display: grid;
        grid-template-columns: 1.4fr 0.7fr 1.5fr;
        gap: 12px;
        margin-bottom: 14px;
      }
      .bloom-onboarding label.bo-lbl {
        display: block;
        margin-bottom: 5px;
        color: #8a5f75;
        font-size: 12.5px;
        font-weight: 700;
      }
      .bloom-onboarding input.bo-inp {
        width: 100%;
        padding: 10px 13px;
        border: 1.5px solid #f5dce8;
        border-radius: 14px;
        outline: none;
        background: #fffdf8;
        color: #5b4450;
        font: inherit;
        font-size: 16px;
      }
      .bloom-onboarding input.bo-inp:focus {
        border-color: #d68baa;
        box-shadow: 0 0 0 3px rgba(214, 139, 170, .15);
      }
      .bo-gender-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }
      .bo-gender-btn {
        padding: 10px 6px;
        border-radius: 13px;
        border: 1.5px solid #f5dce8;
        background: #fffdf8;
        color: #7a5468;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        text-align: center;
        white-space: nowrap;
        transition: all .18s;
      }
      .bo-gender-btn.on {
        background: linear-gradient(135deg, #f5dce8, #f3edf8);
        border-color: #d68baa;
        color: #6a3550;
        box-shadow: 0 3px 10px rgba(214, 139, 170, .2);
      }
      .bo-rec-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 16px;
        background: linear-gradient(120deg, #fceaf1, #f3edf8);
        margin-bottom: 14px;
        font-size: 13px;
      }
      .bo-rec-bar b { color: #7a415d; }
      .bo-reset-rec {
        border: 1px solid #e8bfd1;
        background: #fff;
        color: #8a4766;
        border-radius: 999px;
        padding: 5px 12px;
        font: inherit;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
      .bo-routines-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .bo-rbox {
        background: #fff9fb;
        border: 1px solid #f2d6e3;
        border-radius: 20px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .bo-rbox h3 {
        font: 600 16.5px/1.2 'Fraunces', Georgia, serif;
        color: #6a4659;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .bo-rbox h3 span {
        font: 700 11.5px 'Quicksand', sans-serif;
        color: #9e788c;
      }
      .bo-rlist {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 245px;
        overflow-y: auto;
        padding-right: 2px;
      }
      .bo-ritem {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #fff;
        border: 1px solid #f5dce8;
        border-radius: 12px;
        padding: 5px 7px;
      }
      .bo-ritem input.bo-rtxt {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        color: #5b4450;
        font: inherit;
        font-size: 16px;
        font-weight: 600;
        padding: 3px 4px;
        outline: none;
      }
      .bo-ritem input.bo-rtime {
        width: 78px;
        border: 1px solid #f3dce7;
        border-radius: 9px;
        background: #fffdf9;
        color: #7a5468;
        font: inherit;
        font-size: 13px;
        padding: 3px 5px;
        outline: none;
      }
      .bo-rdel {
        width: 26px;
        height: 26px;
        border-radius: 8px;
        border: none;
        background: #fbe3e6;
        color: #c0566b;
        font-weight: 700;
        cursor: pointer;
        flex-shrink: 0;
      }
      .bo-add-row {
        display: flex;
        gap: 6px;
        margin-top: 2px;
      }
      .bo-add-row input {
        flex: 1;
        min-width: 0;
        padding: 8px 11px;
        border-radius: 12px;
        border: 1.5px solid #f2d6e3;
        background: #fff;
        font: inherit;
        font-size: 16px;
        outline: none;
      }
      .bo-add-btn {
        padding: 8px 13px;
        border-radius: 12px;
        border: none;
        background: #fceaf1;
        color: #8a4766;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .bo-sug-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 2px;
      }
      .bo-sug-chip {
        padding: 4px 9px;
        border-radius: 999px;
        border: 1px dashed #e3b8cb;
        background: #fff;
        color: #8a5670;
        font: inherit;
        font-size: 11.5px;
        font-weight: 700;
        cursor: pointer;
      }
      .bo-sug-chip:hover { background: #fceaf1; }
      .bloom-onboarding__error {
        min-height: 18px;
        margin: 10px 0 6px;
        text-align: center;
        color: #b34e67;
        font-size: 13px;
        font-weight: 700;
      }
      .bo-foot {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 8px;
      }
      .bo-submit {
        flex: 1;
        padding: 13px 22px;
        border: 0;
        border-radius: 999px;
        background: linear-gradient(135deg, #ebadc6, #d68baa);
        box-shadow: 0 4px 14px rgba(214, 139, 170, .32);
        color: #fff;
        font: inherit;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
      }
      .bo-cancel {
        padding: 13px 18px;
        border: 1px solid #e8bfd1;
        border-radius: 999px;
        background: #fff;
        color: #8a5670;
        font: inherit;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
      }
      @media (max-width: 680px) {
        .bloom-onboarding__card { padding: 20px 15px; border-radius: 24px; }
        .bloom-onboarding h1 { font-size: 24px; }
        .bloom-onboarding__grid3 { grid-template-columns: 1fr 96px; }
        .bloom-onboarding__grid3 > .bo-gender-field { grid-column: 1 / -1; }
        .bo-routines-grid { grid-template-columns: 1fr; }
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
        <div class="bloom-onboarding__head">
          <div class="bloom-onboarding__flower" aria-hidden="true">🌷</div>
          <h1 id="bloom-onboarding-title">Bloom'a hoş geldin</h1>
          <p class="bloom-onboarding__sub">Yaşına ve cinsiyetine göre sana özel sabah &amp; akşam rutinlerini hazırladık. İstediğin adımı düzenleyebilir, silebilir veya yeni adım ekleyebilirsin.</p>
        </div>
        <form id="bloom-onboarding-form" novalidate>
          <div class="bloom-onboarding__grid3">
            <div>
              <label class="bo-lbl" for="bloom-onboarding-name">Adın *</label>
              <input class="bo-inp" id="bloom-onboarding-name" name="name" type="text" autocomplete="given-name" maxlength="80" placeholder="Adın…" value="${escHtml(initName)}" required>
            </div>
            <div>
              <label class="bo-lbl" for="bloom-onboarding-age">Yaşın *</label>
              <input class="bo-inp" id="bloom-onboarding-age" name="age" type="number" min="10" max="99" value="${escHtml(initAge)}" required>
            </div>
            <div class="bo-gender-field">
              <label class="bo-lbl">Cinsiyet</label>
              <div class="bo-gender-row" id="boGenderRow">
                <button type="button" class="bo-gender-btn ${initGender === "female" ? "on" : ""}" data-gender="female">🌸 Kadın</button>
                <button type="button" class="bo-gender-btn ${initGender === "male" ? "on" : ""}" data-gender="male">🌿 Erkek</button>
                <button type="button" class="bo-gender-btn ${initGender === "other" ? "on" : ""}" data-gender="other">✨ Belirtme</button>
              </div>
            </div>
          </div>

          <div class="bo-rec-bar">
            <span>✨ Önerilen Profil: <b id="boProfileBadge">${escHtml(rec.badge)}</b></span>
            <button type="button" class="bo-reset-rec" id="boRefreshRecBtn">🔄 Yaşıma &amp; cinsiyetime göre rutin öner</button>
          </div>

          <div class="bo-routines-grid">
            <div class="bo-rbox">
              <h3>☀️ Sabah Rutinim <span id="boMorningCount">${morningList.length} adım</span></h3>
              <div class="bo-rlist" id="boMorningList"></div>
              <div class="bo-add-row">
                <input type="text" id="boMorningAddInp" maxlength="80" placeholder="Sabah rutinine adım ekle…">
                <button type="button" class="bo-add-btn" id="boMorningAddBtn">+ Ekle</button>
              </div>
              <div class="bo-sug-wrap" id="boMorningSugs"></div>
            </div>

            <div class="bo-rbox">
              <h3>🌙 Akşam Rutinim <span id="boEveningCount">${eveningList.length} adım</span></h3>
              <div class="bo-rlist" id="boEveningList"></div>
              <div class="bo-add-row">
                <input type="text" id="boEveningAddInp" maxlength="80" placeholder="Akşam rutinine adım ekle…">
                <button type="button" class="bo-add-btn" id="boEveningAddBtn">+ Ekle</button>
              </div>
              <div class="bo-sug-wrap" id="boEveningSugs"></div>
            </div>
          </div>

          <div class="bloom-onboarding__error" id="bloom-onboarding-error" aria-live="polite"></div>
          <div class="bo-foot">
            ${allowCancel ? `<button type="button" class="bo-cancel" id="boCancelBtn">Vazgeç</button>` : ""}
            <button type="submit" class="bo-submit">Kaydet ve Başla 🌷</button>
          </div>
        </form>
      </div>
    `;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.appendChild(screen);

    const form = screen.querySelector("#bloom-onboarding-form");
    const nameInp = screen.querySelector("#bloom-onboarding-name");
    const ageInp = screen.querySelector("#bloom-onboarding-age");
    const errorEl = screen.querySelector("#bloom-onboarding-error");
    const badgeEl = screen.querySelector("#boProfileBadge");
    const mListEl = screen.querySelector("#boMorningList");
    const eListEl = screen.querySelector("#boEveningList");
    const mCountEl = screen.querySelector("#boMorningCount");
    const eCountEl = screen.querySelector("#boEveningCount");
    const mSugsEl = screen.querySelector("#boMorningSugs");
    const eSugsEl = screen.querySelector("#boEveningSugs");
    let curGender = initGender;
    let userCustomizedRoutines = false;

    function renderRoutineLists() {
      const curRec = getRecommendedRoutines(ageInp.value, curGender);
      badgeEl.textContent = curRec.badge;

      mCountEl.textContent = `${morningList.length} adım`;
      mListEl.innerHTML = morningList.map((item, idx) => `
        <div class="bo-ritem">
          <input type="text" class="bo-rtxt" data-kind="morning" data-idx="${idx}" value="${escHtml(item.text)}" maxlength="80" aria-label="Sabah rutini ${idx + 1}">
          <input type="time" class="bo-rtime" data-kind="morning-time" data-idx="${idx}" value="${escHtml(item.time || "")}" aria-label="Saat">
          <button type="button" class="bo-rdel" data-del="morning" data-idx="${idx}" title="Kaldır">✕</button>
        </div>
      `).join("");

      eCountEl.textContent = `${eveningList.length} adım`;
      eListEl.innerHTML = eveningList.map((item, idx) => `
        <div class="bo-ritem">
          <input type="text" class="bo-rtxt" data-kind="evening" data-idx="${idx}" value="${escHtml(item.text)}" maxlength="80" aria-label="Akşam rutini ${idx + 1}">
          <input type="time" class="bo-rtime" data-kind="evening-time" data-idx="${idx}" value="${escHtml(item.time || "")}" aria-label="Saat">
          <button type="button" class="bo-rdel" data-del="evening" data-idx="${idx}" title="Kaldır">✕</button>
        </div>
      `).join("");

      const mExisting = new Set(morningList.map(x => (x.text || "").toLocaleLowerCase("tr-TR")));
      mSugsEl.innerHTML = curRec.morningSuggestions
        .filter(s => !mExisting.has(s.toLocaleLowerCase("tr-TR")))
        .map(s => `<button type="button" class="bo-sug-chip" data-sug="morning" data-val="${escHtml(s)}">+ ${escHtml(s)}</button>`)
        .join("");

      const eExisting = new Set(eveningList.map(x => (x.text || "").toLocaleLowerCase("tr-TR")));
      eSugsEl.innerHTML = curRec.eveningSuggestions
        .filter(s => !eExisting.has(s.toLocaleLowerCase("tr-TR")))
        .map(s => `<button type="button" class="bo-sug-chip" data-sug="evening" data-val="${escHtml(s)}">+ ${escHtml(s)}</button>`)
        .join("");
    }

    function applyRecommendedForCurrentProfile() {
      const nextRec = getRecommendedRoutines(ageInp.value, curGender);
      morningList = nextRec.morning.map(x => ({ ...x }));
      eveningList = nextRec.evening.map(x => ({ ...x }));
      userCustomizedRoutines = false;
      renderRoutineLists();
    }

    renderRoutineLists();

    // Input live editing inside routine lists
    screen.addEventListener("input", (ev) => {
      const t = ev.target;
      if (t.dataset.kind === "morning") {
        morningList[+t.dataset.idx].text = t.value;
        userCustomizedRoutines = true;
      } else if (t.dataset.kind === "morning-time") {
        morningList[+t.dataset.idx].time = t.value;
        userCustomizedRoutines = true;
      } else if (t.dataset.kind === "evening") {
        eveningList[+t.dataset.idx].text = t.value;
        userCustomizedRoutines = true;
      } else if (t.dataset.kind === "evening-time") {
        eveningList[+t.dataset.idx].time = t.value;
        userCustomizedRoutines = true;
      } else if (t === ageInp) {
        const v = Number(ageInp.value);
        if (v >= 10 && v <= 99 && !userCustomizedRoutines) {
          applyRecommendedForCurrentProfile();
        } else {
          badgeEl.textContent = getRecommendedRoutines(ageInp.value, curGender).badge;
        }
      }
    });

    // Click handlers inside onboarding
    screen.addEventListener("click", (ev) => {
      const gBtn = ev.target.closest("[data-gender]");
      if (gBtn) {
        curGender = gBtn.dataset.gender;
        screen.querySelectorAll("[data-gender]").forEach(b => b.classList.toggle("on", b.dataset.gender === curGender));
        if (!userCustomizedRoutines) {
          applyRecommendedForCurrentProfile();
        } else {
          renderRoutineLists();
        }
        return;
      }

      const delBtn = ev.target.closest("[data-del]");
      if (delBtn) {
        const idx = +delBtn.dataset.idx;
        if (delBtn.dataset.del === "morning") morningList.splice(idx, 1);
        else eveningList.splice(idx, 1);
        userCustomizedRoutines = true;
        renderRoutineLists();
        return;
      }

      const sugBtn = ev.target.closest("[data-sug]");
      if (sugBtn) {
        const val = (sugBtn.dataset.val || "").trim();
        if (!val) return;
        if (sugBtn.dataset.sug === "morning") morningList.push({ text: val, time: "", lvl: 2 });
        else eveningList.push({ text: val, time: "", lvl: 2 });
        userCustomizedRoutines = true;
        renderRoutineLists();
        return;
      }

      if (ev.target.id === "boRefreshRecBtn") {
        applyRecommendedForCurrentProfile();
        return;
      }

      if (ev.target.id === "boMorningAddBtn") {
        const inp = screen.querySelector("#boMorningAddInp");
        const val = (inp.value || "").trim();
        if (val) {
          morningList.push({ text: val, time: "", lvl: 2 });
          inp.value = "";
          userCustomizedRoutines = true;
          renderRoutineLists();
        }
        return;
      }

      if (ev.target.id === "boEveningAddBtn") {
        const inp = screen.querySelector("#boEveningAddInp");
        const val = (inp.value || "").trim();
        if (val) {
          eveningList.push({ text: val, time: "", lvl: 2 });
          inp.value = "";
          userCustomizedRoutines = true;
          renderRoutineLists();
        }
        return;
      }

      if (ev.target.id === "boCancelBtn") {
        document.body.style.overflow = previousOverflow;
        screen.remove();
        styles.remove();
      }
    });

    // Enter key on add inputs should add item instead of submitting whole form
    ["#boMorningAddInp", "#boEveningAddInp"].forEach((sel, isEve) => {
      const inp = screen.querySelector(sel);
      if (inp) {
        inp.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            screen.querySelector(isEve ? "#boEveningAddBtn" : "#boMorningAddBtn").click();
          }
        });
      }
    });

    nameInp.focus();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = (nameInp.value || "").trim();
      const age = Number(ageInp.value);
      if (!name) {
        errorEl.textContent = "Lütfen adını gir.";
        nameInp.focus();
        return;
      }
      if (!age || isNaN(age) || age < 10 || age > 99) {
        errorEl.textContent = "Lütfen geçerli bir yaş gir (10–99).";
        ageInp.focus();
        return;
      }

      const cleanMorning = morningList.map(x => ({ text: (x.text || "").trim(), time: x.time || "", lvl: x.lvl || 2 })).filter(x => x.text);
      const cleanEvening = eveningList.map(x => ({ text: (x.text || "").trim(), time: x.time || "", lvl: x.lvl || 2 })).filter(x => x.text);

      if (!cleanMorning.length || !cleanEvening.length) {
        errorEl.textContent = "Sabah ve akşam rutininde en az 1 adım bulunmalı.";
        return;
      }

      const profile = { name, age, gender: curGender, updatedAt: Date.now() };
      try {
        localStorage.setItem(NAME_KEY, name);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      } catch (storageError) {
        errorEl.textContent = "Bilgilerin kaydedilemedi. Lütfen tekrar dene.";
        return;
      }

      userName = name;
      savedProfile = profile;

      if (typeof window.__bloomApplyOnboardingProfile === "function") {
        try {
          window.__bloomApplyOnboardingProfile(profile, cleanMorning, cleanEvening);
        } catch (e) {}
      }

      document.body.style.overflow = previousOverflow;
      screen.remove();
      styles.remove();
      if (typeof window.render === "function") {
        try { window.render(); } catch (e) {}
      }
      personalizePage();
    });
  }

  window.__bloomOpenOnboarding = (allowCancel = true) => showOnboardingModal(allowCancel);
  window.__bloomGetUserProfile = () => {
    try {
      const rp = localStorage.getItem(PROFILE_KEY);
      if (rp) return JSON.parse(rp);
    } catch (e) {}
    return userName ? { name: userName, age: null, gender: null } : null;
  };

  if (savedProfile && savedProfile.name && savedProfile.age && savedProfile.gender) return;
  showOnboardingModal(false);
})();
