# first-project
Bloom, günlük hayatımı daha düzenli, dengeli ve keyifli hale getirmek için tasarladığım, tamamen kişiselleştirilmiş bir yaşam yönetimi uygulamasıdır. Günlük rutinlerimi, beslenmemi, su tüketimimi, egzersizlerimi, okul hayatımı, ders programımı ve kişisel gelişimimi tek bir yerde birleştirir.

son olarak egzersiz kısmını ekledım kalorı kısmında yapay zeka ve tarayıcıya baglandı ama hatalar mevcut bu kısımda duzenleme yapılacak ayrıca manuel olarakta hala verıtabanı mevcut

## GitHub Pages ile yayınlama

`.github/workflows/pages.yml` workflow'u `main` dalına her push yapıldığında uygulamayı GitHub Pages'e yayınlar. İlk yayınlamada repository ayarlarında **Settings > Pages > Build and deployment > Source** bölümünü **GitHub Actions** olarak seçin. İsterseniz workflow'u **Actions** sekmesinden `workflow_dispatch` ile de elle çalıştırabilirsiniz.

Yayınlanan sayfa `index.html` olarak sunulur; PWA'nın mevcut `index5.html` başlangıç adresi de korunur. Service worker ve manifest aynı dizinde yayınlandığından Pages alt yolunda da çalışır.

Repository şu anda private olduğundan Pages kullanılabilirliği GitHub planına ve repository izinlerine bağlıdır. Public yapmak tüm repository kaynak kodunu görünür hale getirir; bunu yalnızca bilinçli olarak tercih ediyorsanız yapın.
