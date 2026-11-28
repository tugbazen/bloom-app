# 🌷 Bloom – Kişiselleştirilmiş Yaşam, Rutin, Cilt Bakımı & Okul Yönetimi (PWA)

**Bloom**, günlük hayatı daha düzenli, dengeli ve keyifli hale getirmek için tasarlanmış, çevrimdışı çalışabilen (PWA), tamamen kişiselleştirilebilir bir yaşam yönetimi uygulamasıdır. Günlük rutinleri (okul/iş günü ve boş/dinlenme günü ayrımlı), yaşa ve cinsiyete özel cilt bakımını, beslenme ve kalori takibini, su tüketimini, egzersizleri, akademik ders/AKTS takibini ve kişisel gelişimi tek bir yerde birleştirir.

---

## ✨ Temel Özellikler

### 1. 👤 Kişiselleştirilmiş Başlangıç (Onboarding: İsim, Yaş & Cinsiyet)
- İlk açılışta (veya **Rutinlerim / Cilt Bakımı / Ayarlar** sayfalarındaki **👤 Yaş & Cinsiyet** butonuyla) kullanıcının **Adı**, **Yaşı (10–99)** ve **Cinsiyeti** (`🌸 Kadın`, `🌿 Erkek`, `✨ Belirtme`) alınır.
- Girdiği isim tüm uygulama başlıklarına, karşılama ekranına ve yedekleme dosyası adına (`bloom-<isim>-yedek-YYYY-AA-GG.json`) otomatik yansır.
- Girilen **yaş** ve **cinsiyete** göre hem **Günlük Rutinler** hem de **Sabah & Akşam Cilt Bakım Rutinleri** otomatik olarak kişiye özel hazırlanır; kullanıcı daha sonra dilediği adımı ekleyip çıkarabilir veya sıralamasını değiştirebilir.

---

### 2. 🗓️ Başlıklarına ve Gün Tipine Göre Ayrı Günlük Rutinler (Yaşa Özel)
Günlük rutinler birbirinin kopyası değildir; günün temposuna ve kullanıcının yaş grubuna göre **3 ayrı başlık** altında yapılandırılmıştır:

1. **🎒 1. Okul / İş Günü Sabah Rutini (`school`)**
   - Ders, kampüs veya mesai günleri için erken uyanış, hızlı ve odaklı sabah bakımı, kahvaltı, ders/toplantı programı kontrolü ve çanta/evden çıkış hazırlığı adımlarını içerir.
2. **🏡 2. Boş Gün / Dinlenme Günü Rutini (`off`)**
   - Tatil, hafta sonu ve dinlenme günleri için alarmsız/dinlenmiş uyanış, sabah esnemesi veya doğa yürüyüşü, uzun ve keyifli kahvaltı, oda/yaşam alanı düzeni, haftalık hafif tekrar veya hobi ve zihinsel yenilenme adımlarını içerir.
3. **🌙 3. Akşam & Uyku Öncesi Rutini (`evening`)**
   - Günü kapatma, günün ders/iş tekrarını tamamlama, ertesi günün hazırlığı, ağız ve gece cilt bakımı, kitap okuma / günlük yazma ve kaliteli uykuya geçiş adımlarını içerir.

#### Yaş Gruplarına Göre Rutin Profilleri
| Yaş Grubu | Okul / İş Günü Sabah Başlığı | Boş Gün / Dinlenme Günü Başlığı | Akşam & Uyku Rutini Başlığı |
| :--- | :--- | :--- | :--- |
| **🎒 10–17 Yaş** *(Lise & Gençlik)* | Okul Günü Sabah Rutini (07:00 uyanış, okul kahvaltısı, ders programı & okul çantası) | Boş Gün & Hafta Sonu Dinlenme Rutini (09:00 alarmsız uyanış, aile kahvaltısı, masa düzeni, 40 dk test/tekrar & hobi) | Akşam Ödev, Hazırlık & Uyku Rutini (ödev, 20-30 soru pratik, çanta hazırlığı, cilt bakımı, 22:30 uyku) |
| **🎓 18–24 Yaş** *(Üniversite & Genç Yetişkin)* | Kampüs / Ders & İş Günü Sabah Rutini (07:30 uyanış, protein kahvaltısı, amfi/slayt kontrolü, laptop & matara hazırlığı) | Boş Gün & Dinlenme / Yenilenme Rutini (09:00 uyanış, esneme, uzun kahvaltı & kahve, haftalık oda/çamaşır düzeni, 45 dk vize/proje odak, açık hava/sosyal vakit) | Akşam Tekrar, Bakım & Uyku Rutini (20 dk ders notu tekrarı, yarınki kombin/çanta, çift aşamalı cilt bakımı, 23:30 uyku) |
| **💼 25–34 Yaş** *(Kariyer, İş & Aktif Yaşam)* | İş & Mesai Günü Sabah Rutini (07:00 uyanış, boyun/sırt esnemesi, C vitamini & SPF, toplantı/3 kritik hedef planı, öğle paketi) | İzin Günü & Dinlenme / Kendine Zaman Rutini (08:30 alarmsız uyanış, 15 dk sabah yogası/mobilite, uzun kahvaltı, haftalık yemek/alışveriş planı, dijital detoks) | Akşam Dijital Kapanış, Bakım & Dinlenme Rutini (19:30 iş bildirimlerini kapatma, 25 dk yürüyüş/pilates, aktif gece cilt bakımı, 23:00 uyku) |
| **🌿 35–49 Yaş** *(Denge, Sağlık & Üretkenlik)* | İş & Aktif Gün Sabah Rutini (06:45 uyanış, 2 bardak su, 10 dk eklem mobilite, peptit/SPF bakım, protein/lif kahvaltı & takviyeler) | Dinlenme Günü, Sağlık & Yaşam Dengesi Rutini (08:00 sakin uyanış, 20 dk yürüyüş/esneme, aile kahvaltısı, ev/bahçe düzeni, doğa/kültür & kendine şefkat molası) | Akşam Gevşeme, Onarım & Kaliteli Uyku Rutini (15 dk sindirim yürüyüşü, retinol/peptit gece bakımı, nefes gevşemesi & şükür günlüğü, 22:45 uyku) |
| **🌺 50+ Yaş** *(Zindelik, Canlılık & Sağlıklı Yaşam)* | Planlı & Aktif Gün Sabah Rutini (06:30 uyanış, yatakta eklem gerinmesi, ılık su, 20 dk sabah yürüyüşü, Akdeniz kahvaltısı, ilaç/vitamin takibi) | Huzurlu Dinlenme, Doğa & Keyif Günü Rutini (07:30 huzurlu uyanış, nefes/eklem esnetme, uzun kahvaltı, 30 dk doğa/sahil yürüyüşü veya bahçe bakımı, sohbet & kitap) | Akşam Sağlık, Bakım & Huzurlu Uyku Rutini (akşam yürüyüşü/bacak dinlendirme, akşam ilaç/vitamin kontrolü, yoğun gece/boyun/el bakımı, bitki çayı, 22:15 uyku) |

- **Enerji Modları:** Her gün için `🌸 Normal gün`, `⚡ Yoğun gün` veya `🌙 Dinlenme günü` seçilerek görev listesi o günkü enerji seviyesine göre otomatik sadeleştirilebilir.
- **Canlı Geçiş & Özelleştirme:** Rutinlerim sayfasında hem aktif gün tipinin (`🎒 Okul / İş Günü` veya `🏡 Boş / Dinlenme Günü`) görevleri işaretlenebilir hem de diğer gün tipinin planı tek kartta görülüp düzenlenebilir.
- **Yaşa Göre Dinamik Gün Etiketleri:** Gün tipi çipleri, Yarın sekmesi hazırlık notları ve Ayarlar başlıkları kullanıcının yaş grubuna göre otomatik uyarlanır (`10–17 Yaş`: `🎒 Okul Günü`, `18–24 Yaş`: `🎓 Kampüs / Ders Günü`, `25–49 Yaş`: `💼 İş / Mesai Günü`, `50+ Yaş`: `🌺 Planlı / Aktif Gün`).
- **⏰ Sıradaki Adım Vurgusu:** Günün saatine göre sıradaki tamamlanmamış rutin adımı hem Ana Sayfa'da hem de Rutinlerim sayfasında `⏰ Sıradaki` rozetiyle öne çıkarılır ve tek tıkla tamamlanabilir.

---

### 3. 🧴 Yaş ve Cinsiyete Göre Akıllı Cilt Bakım Rutini (Sabah & Akşam)
- **Yaşa Özel Cilt Bakımı:**
  - **10–17 Yaş:** Genç cilt bariyeri & sebum dengesi (nazik su bazlı jel, yağsız nemlendirici, komedojenik olmayan SPF 50+, akşam lokal BHA/Centella).
  - **18–24 Yaş:** Nem, ışıltı & gözenek/bariyer bakımı (Hyaluronik Asit / Niacinamide %5 serum, dengeleyici tonik, su bazlı nemlendirici & SPF 50+).
  - **25–34 Yaş:** Antioksidan koruma & ilk çizgi önleme (Sabah C Vitamini serumu, kafeinli göz çevresi kremi, SPF 50+; akşam düşük oranlı Retinol/Peptit serum ve seramid gece kremi).
  - **35–49 Yaş:** Elastikiyet, Peptit/Retinol & leke koruması (Peptit esansı, C Vitamini + Peptit serum, sıkılaştırıcı göz ve boyun kremi, PA++++ leke karşıtı SPF 50+; akşam Retinol/Bakuchiol ve yoğun onarıcı gece/boyun kremi).
  - **50+ Yaş:** Olgun cilt, boyun/dekolte & yoğun lipid onarımı (Kurutmayan süt/krem temizleyici, kolajen/panthenol nem esansı, C Vitamini + Peptit + Q10 serum, göz & dudak çevresi kremi, yüz/boyun/dekolte kremi ve akşam yoğun el/boyun/gece onarım kremi).
- **Cinsiyete Göre Uyarlama:**
  - **Erkek (`🌿 Erkek`)** seçildiğinde **hiçbir yaş grubunda `"Makyaj temizleme"` adımı yer almaz**; bunun yerine yüz/sakal arındırıcı jel, tıraş sonrası yatıştırıcı tonik ve parlama karşıtı nemlendirici adımları gelir.
  - **Kadın (`🌸 Kadın`)** seçildiğinde akşam rutininde yaş grubuna uygun çift aşamalı temizlik (`Makyaj & SPF temizleme`) yer alır.
- **Sabit & Düzenlenebilir Adımlar:** `🪥 Diş fırçalama` ve `🧼 Yüz yıkama` sabit adımlardır; diğer tüm ürün ve adımlar düzenlenebilir, sıralanabilir veya yeni ürün eklenebilir.
- **Çift Yönlü Senkronizasyon & Ana Sayfa Cilt Bakım Kartı:** Cilt Bakımı sayfasındaki sabah/akşam adımlarının tamamı işaretlendiğinde Günlük Rutin'deki `"Cilt bakımımı yap"` görevi otomatik tamamlanır (ve tersi de geçerlidir). Ana Sayfa'daki **🧴 Cilt Bakımım** kartından sabah/akşam ilerlemesi takip edilebilir ve sıradaki cilt bakım adımı tek dokunuşla tamamlanabilir.

---

### 4. 🥗 3 Katmanlı Beslenme & Kalori Hesaplama Stüdyosu
- **1. Katman (Yerel Veritabanı & Canlı Arama):** ~150 Türk ve dünya mutfağı yemeği için 100g bazlı kalori, protein, karbonhidrat ve yağ değerleri; yazarken açılan canlı öneri listesi ve yemek içeriğine göre dinamik porsiyon/birim seçenekleri (`1 kase (250g)`, `1 porsiyon`, `1 dilim`, `1 adet` vb.).
- **2. Katman (OpenFoodFacts Türkiye/Global):** Yerel listede bulunmayan paketli veya özel ürünler için ücretsiz OpenFoodFacts API araması (3.5 sn zaman aşımı korumalı).
- **3. Katman (İsteğe Bağlı Gemini 2.5 Flash & Yeni Yemek Öğretme):** Ayarlar'dan kendi ücretsiz Google Gemini API anahtarını giren kullanıcılar için fotoğraf veya metinden yapay zeka tahmini; anahtarsız kullanımda ise **"➕ Yeni Yemek Öğret"** paneliyle kendi yemeklerini yerel veritabanına kalıcı kaydetme.

---

### 5. 📚 Okulum, AKTS Ağırlıklı GANO & Kalıcı Odak Zamanlayıcısı
- **Temiz Başlangıç:** Uygulama hazır derslerle dolu gelmez; kullanıcı kendi derslerini ve AKTS kredilerini ekler.
- **Satır İçi Hızlı Ders Ekleme:** Sınav, Not veya Çalışma Kaydı eklerken modaldan çıkmadan `+ Yeni ders ekle` seçeneğiyle anında ders oluşturulabilir.
- **AKTS Ağırlıklı Ortalama & 4.00 GANO:** Geçme notu (varsayılan 60) ve AKTS kredilerine göre ağırlıklı genel ortalama, harf notu (`AA`–`FF`) ve 4.00 üzerinden GANO hesaplanır.
- **Kalıcı Odak Zamanlayıcısı:** Kronometre başlangıç zamanı `localStorage` üzerinde saklanır; sayfalar arasında gezinirken üst barda canlı rozet (`⏱️ SS:DD`) görünür ve sayfa yenilense bile süre kaybolmaz.

---

### 6. 💧 Su Takibi, 🏋️‍♂️/🧘‍♀️ Yaşa & Cinsiyete Özel Egzersiz ve 🌳 Dinamik Bahçe
- **Yaş ve Cinsiyete Göre Haftalık Egzersiz Programı:**
  - Onboarding'de girilen yaş grubu (`10–17`, `18–24`, `25–34`, `35–49`, `50+`) ve cinsiyete göre haftalık egzersiz planı, haftalık dakika hedefi (`140–180 dk`) ve egzersiz ikonları (`🏋️‍♂️/🧘‍♀️`, `🚶‍♂️/🚶‍♀️`, `🏊‍♂️/🏊‍♀️`, `🏃‍♂️/💃`) otomatik uyarlanır.
  - Egzersiz sayfasındaki yaş grubu çipleriyle istenen yaş grubunun haftalık antrenman programı tek dokunuşla yüklenebilir ve gün gün özelleştirilebilir.
- **Su Takibi & Bahçe Damlaları:** Günlük su hedefi, hızlı `+100 / +200 / +300 / +500 ml` butonları; içilen her `250 ml` su bahçe için `1 su damlası` kazandırır.
- **Yaşayan Bahçe:** Görevlerden kazanılan XP ve su damlalarıyla Tohum'dan Çiçek Açmış Ağaç'a kadar 6 büyüme aşaması; günün saatine göre (Sabah, Öğle, Gün Batımı, Gece) otomatik değişen gökyüzü ve açılıp gizlenebilen bahçe öğeleri.

---

### 7. 📱 Mobil Uyumluluk (iPhone 11 – iPhone 18 Pro Max) & PWA Güncelleme Mimarisi
- **iOS & Mobil Ergonomi:** iPhone 11 (`375×812`) ile iPhone 18 Pro Max (`440×956`) arasındaki tüm ekran boyutlarında yatay taşma (`horizontal overflow`) olmadan çalışır; `16px` input font boyutuyla iOS Safari otomatik yakınlaştırmasını engeller, çentik (`safe-area-inset`) ve alt sheet modal yapısını destekler.
- **Anında PWA Güncellemesi:** `sw.js` ağ öncelikli (`network-first`, `cache: 'no-store'`) stratejiyle çalışır. Yeni bir sürüm yayınlandığında eski önbellekleri temizler ve **Ayarlar > Uygulamayı Şimdi Güncelle** butonuyla tek dokunuşla son sürüme geçiş sağlar.

---

## 🚀 GitHub Pages ile Yayınlama

`.github/workflows/pages.yml` workflow'u `main` dalına her push yapıldığında uygulamayı GitHub Pages'e yayınlar. İlk yayınlamada repository ayarlarında **Settings > Pages > Build and deployment > Source** bölümünü **GitHub Actions** olarak seçin. İsterseniz workflow'u **Actions** sekmesinden `workflow_dispatch` ile de elle çalıştırabilirsiniz.

Yayınlanan sayfa `index.html` olarak sunulur; PWA'nın mevcut `index5.html` başlangıç adresi de korunur. Service worker (`sw.js`) ve `manifest.webmanifest` aynı dizinde yayınlandığından Pages alt yolunda da sorunsuz çalışır.
