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

  // Her yaş grubu (10-17, 18-24, 25-34, 35-49, 50+) ve cinsiyet için belirgin, gerçekçi ortalama rutinler
  function getRecommendedRoutines(ageNum, gender) {
    const age = Math.max(10, Math.min(99, Number(ageNum) || 21));
    const g = gender || "female";
    const isFemale = g === "female";
    const isMale = g === "male";

    let groupKey = "18-24";
    let groupLabel = "18–24 Yaş · Üniversite & Genç Yetişkin";
    let school = [];
    let off = [];
    let evening = [];

    if (age <= 17) {
      groupKey = "10-17";
      groupLabel = "10–17 Yaş · Lise & Gençlik Rutini";
      school = [
        { text: "Alarm ertelemeden uyan & perdeyi aç", time: "07:00", lvl: 1 },
        { text: "Yatağımı topla & odamı havalandır", time: "", lvl: 2 },
        { text: "El-yüz yıkama & diş fırçalama", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (Nazik temizleyici & güneş kremi)" : isMale ? "Cilt bakımımı yap (Yüz yıkama & nemlendirici)" : "Cilt bakımımı yap", time: "", lvl: 3 },
        { text: "1 büyük bardak su iç", time: "", lvl: 1 },
        { text: "Okul öncesi besleyici kahvaltı yap", time: "", lvl: 1 },
        { text: "Ders programına göre okul çantamı kontrol et", time: "", lvl: 2 },
        { text: "Okul kıyafetimi giy ve evden çıkmaya hazırlan", time: "", lvl: 1 }
      ];
      off = school.map(x => ({ ...x, time: x.time === "07:00" ? "08:30" : x.time }));
      evening = [
        { text: "Günlük ödevleri ve konu tekrarını bitir", time: "19:30", lvl: 2 },
        { text: "Sınav / test pratiği yap (20-30 soru)", time: "20:15", lvl: 3 },
        { text: "Yarınki okul çantamı ve kıyafetimi hazırla", time: "", lvl: 2 },
        { text: "Su tüketimimi kontrol et", time: "", lvl: 2 },
        { text: "Dişlerimi fırçala", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (Yüz temizliği & dudak bakımı)" : "Cilt bakımımı yap (Akşam yüz temizliği)", time: "", lvl: 2 },
        { text: "Telefonu masaya bırak & 15 dk kitap oku", time: "", lvl: 3 },
        { text: "9 saatlik verimli uyku için yatağa geç", time: "22:30", lvl: 1 }
      ];
    } else if (age <= 24) {
      groupKey = "18-24";
      groupLabel = "18–24 Yaş · Üniversite & Genç Yetişkin Rutini";
      school = [
        { text: "Uyan & 1 büyük bardak su iç", time: "07:30", lvl: 1 },
        { text: "Yatağımı düzelt & odamı havalandır", time: "", lvl: 2 },
        { text: "Yüzümü yıka & dişlerimi fırçala", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (Tonik, Serum & SPF 50)" : isMale ? "Cilt bakımımı yap (Yüz yıkama, sakal/tıraş & SPF nemlendirici)" : "Cilt bakımımı yap (Nemlendirici & SPF)", time: "", lvl: 3 },
        { text: "Protein ağırlıklı kahvaltı yap", time: "", lvl: 1 },
        { text: "Amfi / ders programını ve slaytları kontrol et", time: "", lvl: 2 },
        { text: "Laptop, şarj aleti, su matarası ve notlarımı çantama koy", time: "", lvl: 2 },
        { text: "Günün 3 önceliğini belirle", time: "", lvl: 3 },
        { text: "Evden çıkmaya hazırlan", time: "", lvl: 1 }
      ];
      off = school.map(x => ({ ...x, time: x.time === "07:30" ? "09:00" : x.time }));
      evening = [
        { text: "Bugün işlenen ders notlarını / slaytları 20 dk gözden geçir", time: "20:30", lvl: 2 },
        { text: "Beslenme ve su kayıtlarını tamamla", time: "", lvl: 3 },
        { text: "Yarınki dersleri kontrol et & çantamı hazırla", time: "", lvl: 2 },
        { text: isFemale ? "Yarınki kombinimi hazırla" : "Yarınki kıyafet ve spor eşyalarımı hazırla", time: "", lvl: 3 },
        { text: "Çalışma masamı ve odamı 5 dakika toparla", time: "", lvl: 3 },
        { text: "Dişlerimi fırçala & diş ipi kullan", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (Çift aşamalı temizlik, serum & gece kremi)" : "Cilt bakımımı yap (Gece yüz temizliği & nemlendirici)", time: "", lvl: 2 },
        { text: "Günlük değerlendirme yaz", time: "", lvl: 3 },
        { text: "Ekran süresini bitir & uykuya hazırlan", time: "23:30", lvl: 1 }
      ];
    } else if (age <= 34) {
      groupKey = "25-34";
      groupLabel = "25–34 Yaş · Kariyer, İş & Aktif Yaşam Rutini";
      school = [
        { text: "Uyan & 1 büyük bardak ılık su iç", time: "07:00", lvl: 1 },
        { text: "Yatağımı düzelt & 5 dk sabah esnemesi yap", time: "", lvl: 2 },
        { text: "Yüz yıkama & diş fırçalama", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (C Vitamini serum, göz kremi, nemlendirici & SPF)" : isMale ? "Cilt bakımımı yap (Yüz temizliği, tıraş/sakal bakımı & SPF)" : "Cilt bakımımı yap (Serum, nemlendirici & SPF)", time: "", lvl: 2 },
        { text: "Dengeli kahvaltı yap & günlük vitaminlerimi al", time: "", lvl: 1 },
        { text: "İş takvimimi, toplantılarımı ve günün 3 kritik hedefini planla", time: "", lvl: 2 },
        { text: "Öğle yemeği / ara öğün ve su matarımı yanıma al", time: "", lvl: 3 },
        { text: "Güne enerjik başla", time: "", lvl: 1 }
      ];
      off = school.map(x => ({ ...x, time: x.time === "07:00" ? "08:30" : x.time }));
      evening = [
        { text: "İş bildirimlerini kapat & dijital mesaiyi bitir", time: "19:30", lvl: 2 },
        { text: "25 dk akşam yürüyüşü, pilates veya sırt/boyun esnetme", time: "", lvl: 3 },
        { text: "Akşam yemeği ve su tüketimimi kaydet", time: "", lvl: 2 },
        { text: "Mutfağı ve yaşam alanını 10 dakika toparla", time: "", lvl: 3 },
        { text: isFemale ? "Yarınki iş kombinimi ve çantamı hazırla" : "Yarınki iş kıyafetimi ve çantamı hazırla", time: "", lvl: 2 },
        { text: "Dişlerimi fırçala & ağız bakımı yap", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (Makyaj/SPF temizliği, aktif serum & gece kremi)" : "Cilt bakımımı yap (Gece yüz yıkama & onarıcı nemlendirici)", time: "", lvl: 2 },
        { text: "Bitki çayı eşliğinde kitap oku veya günlüğe yaz", time: "", lvl: 3 },
        { text: "Telefonu sessize al & uykuya hazırlan", time: "23:00", lvl: 1 }
      ];
    } else if (age <= 49) {
      groupKey = "35-49";
      groupLabel = "35–49 Yaş · Denge, Sağlık & Üretkenlik Rutini";
      school = [
        { text: "Erken uyan & derin nefes ile güne başla", time: "06:45", lvl: 1 },
        { text: "2 bardak oda sıcaklığında su iç", time: "", lvl: 1 },
        { text: "10 dk eklem mobilite, duruş ve sırt esnetme", time: "", lvl: 2 },
        { text: "Diş fırçalama & yüz yıkama", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (Peptit/antioksidan serum, göz kremi & SPF 50)" : isMale ? "Cilt bakımımı yap (Yüz temizliği, göz/yüz nemlendirici & SPF)" : "Cilt bakımımı yap (Onarıcı serum & SPF 50)", time: "", lvl: 2 },
        { text: "Protein ve lif zengin kahvaltı & takviyelerimi al", time: "", lvl: 1 },
        { text: "Günlük iş, aile ve kişisel önceliklerimi netleştir", time: "", lvl: 2 }
      ];
      off = school.map(x => ({ ...x, time: x.time === "06:45" ? "08:00" : x.time }));
      evening = [
        { text: "Akşam yemeği sonrası 15 dk sindirim yürüyüşü", time: "20:00", lvl: 3 },
        { text: "Günlük su hedefimi ve beslenme notlarımı kontrol et", time: "", lvl: 2 },
        { text: "Yarınki programı ve hazırlıkları tamamla", time: "", lvl: 2 },
        { text: "Evde 10 dk akşam toparlaması yap", time: "", lvl: 3 },
        { text: "Dişlerimi fırçala & diş ipi kullan", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (Çift aşamalı temizlik, retinol/onarıcı serum & gece kremi)" : "Cilt bakımımı yap (Gece yüz temizliği & onarıcı gece kremi)", time: "", lvl: 2 },
        { text: "10 dk nefes gevşemesi, kitap veya şükür günlüğü", time: "", lvl: 3 },
        { text: "Mavi ışığı kapat & kaliteli uykuya geç", time: "22:45", lvl: 1 }
      ];
    } else {
      groupKey = "50+";
      groupLabel = "50+ Yaş · Zindelik, Canlılık & Sağlıklı Yaşam Rutini";
      school = [
        { text: "Güne dinç uyan & yatakta hafif gerinme yap", time: "06:30", lvl: 1 },
        { text: "1-2 bardak ılık su iç", time: "", lvl: 1 },
        { text: "Diş ve ağız bakımımı yap & yüzümü yıka", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (Yoğun nemlendirici, göz/boyun bakımı & SPF 50)" : "Cilt bakımımı yap (Yatıştırıcı nemlendirici & güneş koruyucu)", time: "", lvl: 2 },
        { text: "20 dk sabah yürüyüşü veya eklem dostu esneme egzersizi", time: "", lvl: 2 },
        { text: "Akdeniz tipi dengeli kahvaltı yap", time: "", lvl: 1 },
        { text: "Sabah ilaç / vitamin takibimi tamamla", time: "", lvl: 1 },
        { text: "Günün keyifli aktivitelerini planla", time: "", lvl: 2 }
      ];
      off = school.map(x => ({ ...x, time: x.time === "06:30" ? "07:30" : x.time }));
      evening = [
        { text: "Hafif akşam yürüyüşü veya bacak dinlendirme", time: "19:30", lvl: 2 },
        { text: "Günlük su tüketimimi ve akşam ilaç/vitaminlerimi kontrol et", time: "", lvl: 1 },
        { text: "Yarınki planımı gözden geçir", time: "", lvl: 2 },
        { text: "Dişlerimi fırçala", time: "", lvl: 1 },
        { text: isFemale ? "Cilt bakımımı yap (Nazik temizlik, besleyici gece & boyun kremi)" : "Cilt bakımımı yap (Gece yüz temizliği & yatıştırıcı krem)", time: "", lvl: 2 },
        { text: "Bitki çayı & dinlendirici kitap okuma / günlük", time: "", lvl: 3 },
        { text: "Odayı havalandır & huzurlu uykuya geç", time: "22:15", lvl: 1 }
      ];
    }

    const genderLabel = isFemale ? "Kadın 🌸" : isMale ? "Erkek 🌿" : "Kişisel ✨";
    return {
      groupKey,
      groupLabel,
      badge: `${groupLabel} · ${genderLabel}`,
      school,
      off,
      evening
    };
  }

  window.__bloomGetRecommendedRoutines = getRecommendedRoutines;

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

    const styles = document.createElement("style");
    styles.id = "bloom-onboarding-styles";
    styles.textContent = `
      .bloom-onboarding {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: grid;
        place-items: center;
        padding: calc(20px + env(safe-area-inset-top, 0px)) 16px calc(24px + env(safe-area-inset-bottom, 0px));
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        background: radial-gradient(800px 600px at 20% 10%, #fde9f1, transparent 70%),
                    radial-gradient(700px 600px at 90% 90%, #efe6f8, transparent 70%),
                    linear-gradient(160deg, #fff8fa, #fdf1f5 50%, #f6f1fa);
        font-family: 'Quicksand', 'Nunito', 'Segoe UI', system-ui, sans-serif;
        color: #5b4450;
      }
      .bloom-onboarding__card {
        width: min(100%, 460px);
        margin: auto;
        padding: 32px 26px;
        text-align: center;
        background: rgba(255, 255, 255, .92);
        border: 1px solid rgba(232, 191, 209, .7);
        border-radius: 28px;
        box-shadow: 0 20px 60px rgba(91, 68, 80, .16);
      }
      .bloom-onboarding__flower { font-size: 42px; line-height: 1; }
      .bloom-onboarding h1 {
        margin: 12px 0 8px;
        color: #6a4659;
        font: 600 30px/1.2 'Fraunces', Georgia, serif;
      }
      .bloom-onboarding__sub {
        margin: 0 0 20px;
        color: #8a5f75;
        font-size: 14.5px;
        line-height: 1.55;
      }
      .bo-field {
        margin-bottom: 14px;
        text-align: left;
      }
      .bloom-onboarding label.bo-lbl {
        display: block;
        margin-bottom: 6px;
        color: #8a5f75;
        font-size: 13px;
        font-weight: 700;
      }
      .bloom-onboarding input.bo-inp {
        width: 100%;
        padding: 12px 14px;
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
        box-shadow: 0 0 0 4px rgba(214, 139, 170, .15);
      }
      .bo-gender-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .bo-gender-btn {
        padding: 11px 8px;
        border-radius: 14px;
        border: 1.5px solid #f5dce8;
        background: #fffdf8;
        color: #7a5468;
        font: inherit;
        font-size: 13.5px;
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
      .bo-preview-badge {
        margin: 14px 0 6px;
        padding: 10px 14px;
        border-radius: 16px;
        background: linear-gradient(120deg, #fceaf1, #f3edf8);
        color: #7a415d;
        font-size: 13px;
        line-height: 1.45;
        text-align: left;
      }
      .bloom-onboarding__error {
        min-height: 20px;
        margin: 8px 0 8px;
        text-align: left;
        color: #b34e67;
        font-size: 13px;
        font-weight: 700;
      }
      .bo-foot {
        display: flex;
        gap: 10px;
        margin-top: 6px;
      }
      .bo-submit {
        flex: 1;
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
      @media (max-width: 480px) {
        .bloom-onboarding__card { padding: 26px 18px; }
        .bloom-onboarding h1 { font-size: 26px; }
      }
    `;
    document.head.appendChild(styles);

    const initRec = getRecommendedRoutines(initAge, initGender);

    const screen = document.createElement("section");
    screen.className = "bloom-onboarding";
    screen.setAttribute("role", "dialog");
    screen.setAttribute("aria-modal", "true");
    screen.setAttribute("aria-labelledby", "bloom-onboarding-title");
    screen.innerHTML = `
      <div class="bloom-onboarding__card">
        <div class="bloom-onboarding__flower" aria-hidden="true">🌷</div>
        <h1 id="bloom-onboarding-title">Bloom'a hoş geldin</h1>
        <p class="bloom-onboarding__sub">Bu küçük dünyayı senin için kişiselleştirelim. Girdiğin yaş ve cinsiyete göre ortalama sabah &amp; akşam rutinlerin otomatik hazırlanır; daha sonra Rutinlerim sayfasından istediğin gibi ekleyip çıkarabilirsin.</p>
        <form id="bloom-onboarding-form" novalidate>
          <div class="bo-field">
            <label class="bo-lbl" for="bloom-onboarding-name">Adın *</label>
            <input class="bo-inp" id="bloom-onboarding-name" name="name" type="text" autocomplete="given-name" maxlength="80" placeholder="Adın…" value="${escHtml(initName)}" required>
          </div>
          <div class="bo-field">
            <label class="bo-lbl" for="bloom-onboarding-age">Yaşın *</label>
            <input class="bo-inp" id="bloom-onboarding-age" name="age" type="number" min="10" max="99" placeholder="örn. 21" value="${escHtml(initAge)}" required>
          </div>
          <div class="bo-field">
            <label class="bo-lbl">Cinsiyet</label>
            <div class="bo-gender-row" id="boGenderRow">
              <button type="button" class="bo-gender-btn ${initGender === "female" ? "on" : ""}" data-gender="female">🌸 Kadın</button>
              <button type="button" class="bo-gender-btn ${initGender === "male" ? "on" : ""}" data-gender="male">🌿 Erkek</button>
              <button type="button" class="bo-gender-btn ${initGender === "other" ? "on" : ""}" data-gender="other">✨ Belirtme</button>
            </div>
          </div>
          <div class="bo-preview-badge" id="boPreviewBadge">
            ✨ Seçilen yaş grubu rutini: <b>${escHtml(initRec.badge)}</b>
          </div>
          <div class="bloom-onboarding__error" id="bloom-onboarding-error" aria-live="polite"></div>
          <div class="bo-foot">
            ${allowCancel ? `<button type="button" class="bo-cancel" id="boCancelBtn">Vazgeç</button>` : ""}
            <button type="submit" class="bo-submit">Devam Et 🌷</button>
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
    const badgeEl = screen.querySelector("#boPreviewBadge");
    const errorEl = screen.querySelector("#bloom-onboarding-error");
    let curGender = initGender;

    function updateBadge() {
      const rec = getRecommendedRoutines(ageInp.value, curGender);
      badgeEl.innerHTML = `✨ Seçilen yaş grubu rutini: <b>${escHtml(rec.badge)}</b>`;
    }

    ageInp.addEventListener("input", updateBadge);

    screen.addEventListener("click", (ev) => {
      const gBtn = ev.target.closest("[data-gender]");
      if (gBtn) {
        curGender = gBtn.dataset.gender;
        screen.querySelectorAll("[data-gender]").forEach(b => b.classList.toggle("on", b.dataset.gender === curGender));
        updateBadge();
        return;
      }
      if (ev.target.id === "boCancelBtn") {
        document.body.style.overflow = previousOverflow;
        screen.remove();
        styles.remove();
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

      const rec = getRecommendedRoutines(age, curGender);
      const profile = { name, age, gender: curGender, groupKey: rec.groupKey, groupLabel: rec.groupLabel, updatedAt: Date.now() };
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
          window.__bloomApplyOnboardingProfile(profile, rec.school, rec.off, rec.evening);
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
