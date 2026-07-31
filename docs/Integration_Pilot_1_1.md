# Entegrasyon Pilotu 1.1

## Amaç

OPUS Core ile mevcut FOPOS ürününün ileride bağlanacağı sınırı, 10. sınıf
felsefe günlük planı üzerinden uçtan uca doğrulamak:

1. müfredat seçimi,
2. pedagojik karar,
3. öğretmen onayı,
4. belge üretimi.

Bu sprint canlı FOPOS deposunu veya üretim sitesini değiştirmez. OPUS içindeki
FOPOS modülü, canlı entegrasyon öncesi referans uygulama ve sözleşme testi olarak
kullanılır.

## Sözleşme sınırı

`DocumentGenerationService`, branşa ve belge biçimine bağımlı değildir. Yalnızca
`ready-for-generation` durumundaki öğretmen onaylı kararı kabul eder, karar ile
üretim isteğinin kimliğini eşleştirir ve belge üreticisine değişmez bir bağlam
aktarır. DOCX/PDF oluşturma mantığı Core'a alınmaz.

Üretilen sonuç; karar kimliği, öğretmen kimliği, onay zamanı, belge türü ve
müfredat referansını içeren bir izlenebilirlik kaydı taşır.

## Pilot kapsamı

- Branş: Felsefe
- Sınıf: 10
- Belge: Günlük plan
- Süre: 80 dakika
- Referans seçim: `f10-u1` / `FEL.10.1.1`
- Belge üreticisi: sözleşme testi için bellek içi taklit

## Kabul ölçütleri

- Geçerli seçim kanonik FOPOS müfredatından çözümlenir.
- Yanlış ünite-öğrenme çıktısı eşleşmesi akışı durdurur.
- Öğretmen onayı olmayan karar belge üreticisine ulaşmaz.
- Reddedilmiş veya başka karara ait onay üretim kapısını açmaz.
- Onaylı karar belge üreticisine müfredat bağlamı ve modül kurallarıyla ulaşır.
- Sonuç, onay ve müfredat kaynağını izlemeye yeterli provenance bilgisi taşır.
- Core içinde FOPOS'a, felsefeye, günlük plana, DOCX'e veya canlı siteye özgü
  koşul bulunmaz.
- Workspace typecheck, build ve test komutları başarılı olur.

## Sonraki aşama

Pilot sözleşmesi onaylandıktan sonra mevcut `aytigin-netizen/FOPOS` deposunda
ayrı bir entegrasyon PR'ı açılır. Canlı günlük plan üreticisi bu sözleşmeye
uyarlanır; öğretmen onay ekranı, hata durumları ve DOCX çıktısı test ortamında
doğrulandıktan sonra ayrıca canlıya alınır.
