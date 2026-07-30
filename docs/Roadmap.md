# OPUS Yol Haritası

## Sprint 0 — Mimari temel

**Amaç:** OPUS’un kapsamını, sınırlarını ve modül sözleşmesini kesinleştirmek.

Çıktılar:

- Depo iskeleti
- Proje vizyonu
- Mimari belge
- Module Contract
- Yol haritası
- MIT lisansı

Tamamlanma ölçütü: Belgeler Core–modül ayrımını açıkça tanımlar ve üretim kodu içermez.

## Sprint 1 — Curriculum Engine

**Amaç:** Müfredatın sürümlenebilir, doğrulanabilir ve modüllerden yüklenebilir ortak modelini oluşturmak.

Planlanan çıktılar:

- Müfredat şeması
- Sürüm ve kaynak bilgisi
- Sınıf, ders alanı, ünite ve öğrenme çıktısı ilişkileri
- Doğrulama kuralları
- Örnek ve sözleşme testleri

## Sprint 2 — Module Loader

**Amaç:** Module Contract uygulayan branş modüllerini güvenli biçimde keşfetmek ve kaydetmek.

Planlanan çıktılar:

- Modül kaydı
- Sözleşme ve sürüm doğrulaması
- Etkinleştirme/devre dışı bırakma
- Hata izolasyonu
- Modül sağlık görünürlüğü

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
