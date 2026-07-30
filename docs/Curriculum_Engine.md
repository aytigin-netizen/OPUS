# Curriculum Engine

## Amaç

Curriculum Engine, OPUS modüllerinin müfredat verisini aynı sözleşme üzerinden tanımlamasını, doğrulamasını ve sorgulamasını sağlar. Motor branş içeriğini bilmez; yalnızca yapıyı ve veri bütünlüğünü yönetir.

## Sözleşme sürümü

İlk şema sürümü `1.0.0` değeridir. Müfredatın kendi sürümü ile veri sözleşmesinin sürümü ayrı tutulur:

- `schemaVersion`: OPUS veri sözleşmesi sürümü
- `version`: Yetkili müfredat belgesinin veya veri paketinin sürümü

## Temel varlıklar

| Varlık | İşlev |
|---|---|
| Curriculum | Müfredatın kimliği, yaşam döngüsü ve bütün içeriği |
| SourceReference | Yetkili kurum, belge sürümü ve erişim bilgisi |
| GradeLevel | Sınıf/kademe tanımı |
| CurriculumUnit | Ünite, sıra, süre ve çıktı bağları |
| LearningOutcome | Kodlanmış öğrenme çıktısı ve kanıt ipuçları |

## Bütünlük kuralları

- Kimlikler küçük harfli ve tire ayrımlı kararlı anahtarlardır.
- Sınıf, ünite, öğrenme çıktısı kimlikleri kendi kapsamlarında benzersizdir.
- Öğrenme çıktısı kodları müfredat içinde benzersizdir.
- Ünite sıra numaraları tekrar edemez.
- Ünite ve öğrenme çıktısı ilişkisi çift yönlü ve tutarlı olmalıdır.
- Tüm sınıf düzeyi referansları tanımlı olmalıdır.
- Bitiş tarihi başlangıç tarihinden önce olamaz.
- Kaynak belgesi, kurum ve yayımlanma tarihi zorunludur.

## Sınırlar

Motor:

- felsefe, psikoloji, mantık veya sosyoloji içeriği barındırmaz;
- branşa özgü değerlendirme ya da AI kuralı belirlemez;
- kullanıcı, okul veya öğrenci verisini yönetmez;
- Module Loader görevini üstlenmez.

## Sprint 1 kabul ölçütleri

1. Geçerli bir örnek müfredat ayrıştırılabilmelidir.
2. Bozuk referanslar doğrulama hatası üretmelidir.
3. Şema, tip ve çalışma zamanı doğrulaması tek kaynaktan üretilmelidir.
4. Ünite ve öğrenme çıktıları kimlik ve kod üzerinden indekslenebilmelidir.
5. Paket derlenmeli, tip kontrolünden ve sözleşme testlerinden geçmelidir.
