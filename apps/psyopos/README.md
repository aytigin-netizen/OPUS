# @opus/psyopos

PSYOPOS, OPUS'un psikoloji branş modülüdür. Sprint 4.1 kapsamında modül,
Türkiye Yüzyılı Maarif Modeli Ortaöğretim Psikoloji Dersi Öğretim Programı
(2026) için kanonik müfredat verisini ve psikolojiye özgü güvenlik kurallarını
sağlar.

Program sınıf numarası belirtmeden ortaöğretim düzeyi ve haftada iki ders saati
tanımladığı için kanonik bağlam `secondary-education` olarak modellenmiştir.
Belirli okul türü ve sınıf atamaları müfredatın kendisine yazılmaz; daha sonraki
uygulama katmanının sorumluluğudur.

Resmî program dağılımı:

- 4 ünite
- 13 öğrenme çıktısı
- 68 ünite ders saati
- 4 okul temelli planlama saati
- 72 toplam ders saati

Sprint 4.2 ile modülün seçim yüzeyi Core `CurriculumService` üzerinden
çözümlenir. Adaptör tek resmî `secondary-education` bağlamını sabit tutar;
geçersiz ünite veya öğrenme çıktısında sessiz bir varsayıma dönmez.

Sprint 4.3 ile pedagojik istekler doğrulanmış müfredat bağlamına ve PSYOPOS'un
psikolojiye özgü AI kurallarına bağlanır. Üretim, açık öğretmen onayından önce
başlatılamaz; reddedilen veya başka bir karara ait onay üretim kapısını açmaz.

Kaynak: T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı,
`[TYMM] Ortaöğretim Psikoloji Dersi (2026)`, PID 2170.
