# OPUS Yol Haritası

## Sprint 0 — Mimari temel ✅

Tamamlandı:

- Depo iskeleti
- Proje vizyonu
- Mimari belge
- Module Contract taslağı
- Yol haritası
- MIT lisansı

## Sprint 1 — Curriculum Engine ✅

Tamamlandı:

- Müfredat ve kaynak şemaları
- Sözleşme sürümü ve yaşam döngüsü
- Sınıf, ünite ve öğrenme çıktısı ilişkileri
- Çapraz veri bütünlüğü doğrulaması
- Sorgu indeksleri
- Sözleşme testleri
- GitHub CI

## Sprint 2 — Module Loader

**Amaç:** Module Contract uygulayan branş modüllerini güvenli biçimde doğrulamak, kaydetmek ve yönetmek.

Uygulanan çıktılar:

- Module Contract `1.0.0`
- Modül kayıt sistemi
- Sözleşme ve sürüm doğrulaması
- Etkinleştirme/devre dışı bırakma
- Hata izolasyonu
- Modül sağlık görünürlüğü
- Güvenli kaldırma
- Türetilmiş ünite ve öğrenme çıktısı görünümleri
- Testler ve CI doğrulaması

## Sprint 3 — FOPOS geçişi

**Amaç:** Mevcut FOPOS’u çalışan sürümü bozmadan OPUS Core’a taşımak.

Planlanan adımlar:

- Mevcut yetenek ve veri envanteri
- FOPOS–Module Contract eşlemesi
- `philosophy` varsayılanıyla geriye uyumluluk
- Kontrollü veri göçü
- Eski ve yeni çıktıların karşılaştırmalı doğrulaması
- Aşamalı geçiş ve geri dönüş planı

## Sprint 4 — PSYOPOS

**Amaç:** Psikoloji modülünü Module Contract üzerinden eklemek ve Core’un ikinci branşla gerçekten ortak çalıştığını doğrulamak.

## Sprint 5 — LOGOPOS

**Amaç:** Mantık modülünü eklemek; değerlendirme, AI ve doküman altyapısının farklı pedagojik ihtiyaçlarda çalışmasını doğrulamak.

## Sonraki aşama — SOSOPOS

Sosyoloji modülü; Core ve ilk üç modül kararlı hale geldikten sonra planlanacaktır.

## Yol haritası kuralları

- Her sprint kendi kabul ölçütleri ve geçiş planıyla başlar.
- Çalışan FOPOS bakım hattı Sprint 3 tamamlanana kadar bağımsız kalır.
- Üretim kodu mimari belgelerle çelişemez; gerekli değişiklik önce karar kaydına işlenir.
- Yeni ortak yetenekler branş bağımsızlığı açısından doğrulanmadan Core’a eklenmez.
