# @opus/logopos

LOGOPOS, OPUS'un mantık branş modülüdür. Sprint 5.1 kapsamında modül,
Türkiye Yüzyılı Maarif Modeli Ortaöğretim Mantık Dersi Öğretim Programı
(2026) için kanonik müfredat verisini ve mantığa özgü üretim kurallarını sağlar.

Program sınıf numarası belirtmeden ortaöğretim düzeyi ve haftada iki ders saati
tanımladığı için kanonik bağlam `secondary-education` olarak modellenmiştir.
Belirli okul türü ve sınıf atamaları müfredatın kendisine yazılmaz; uygulama
katmanının sorumluluğudur.

Resmî program dağılımı:

- 4 ünite
- 17 öğrenme çıktısı
- 68 ünite ders saati
- 4 okul temelli planlama saati
- 72 toplam ders saati

Mantık alanına özgü müfredat bilgisi ve üretim kuralları yalnızca bu modülde
tutulur; OPUS Core alan bağımsız kalır.

Kaynak: T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı,
`[TYMM] Ortaöğretim Mantık Dersi (2026)`, PID 2172.
