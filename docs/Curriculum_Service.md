# Curriculum Service

## Amaç

Curriculum Service, branş uygulamalarının müfredat verisini doğrudan veri
dosyalarından okumasını engelleyen OPUS Core sınırıdır. Sınıf, ünite ve
öğrenme çıktısı sorguları Module Loader tarafından doğrulanmış ve etkin
modüller üzerinden yürütülür.

## Bağlam zorunluluğu

Her sorgu aşağıdaki kimlikleri açıkça taşır:

- `moduleId`
- `curriculumId`
- `gradeLevelId`
- Ünite sorgularında `unitId`
- Çıktı sorgularında `outcomeCode`

Bu tasarım, gelecekte aynı branşın birden fazla müfredat sürümünü taşıması
durumunda örtük veya hatalı sürüm seçimini önler.

## Güvenli çözümleme

Servis hiçbir zaman:

- Geçersiz sınıfı varsayılan sınıfa dönüştürmez.
- Bulunmayan ünite yerine ilk üniteyi döndürmez.
- Bulunmayan öğrenme çıktısı yerine başka bir çıktı seçmez.
- Etkin olmayan modülden müfredat verisi sunmaz.
- Farklı ünite veya sınıfa ait öğrenme çıktısını kabul etmez.

Bu koşullarda açık ve kodlanmış `CurriculumServiceError` üretilir; pedagojik
ürün üretimi çağıran katmanda durdurulmalıdır.

## FOPOS bağlantısı

`@opus/fopos`, ortak servisi `fopos` modülü ve
`philosophy-tr-2024` müfredatıyla bağlayan ince bir adaptör sunar. Adaptör
yalnızca 10 ve 11. sınıf felsefe bağlamını tanır; genel sorgu ve hata
davranışları Core içinde kalır.
