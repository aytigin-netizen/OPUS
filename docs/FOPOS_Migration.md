# FOPOS Geçiş Planı

## Kapsam

Sprint 3, çalışan `aytigin-netizen/FOPOS` deposunu yerinde değiştirmez.
Geçiş, OPUS içinde kurulan ve doğrulanan bir adaptör üzerinden ilerler.
Kaynak envanteri `FOPOS v47` (`720f312`) esas alınarak çıkarılmıştır.

## Sınırlar

| FOPOS'tan taşınan | OPUS Core'da kalan |
| --- | --- |
| Felsefe müfredatı ve dış kodları | Module Contract ve Module Loader |
| Branşa özgü pedagojik kurallar | Ortak doğrulama |
| Branşa özgü AI davranış sınırları | Kimlik, kullanıcı ve öğretmen yönetimi |
| Felsefe doküman ve rapor tanımları | Analitik ve doküman altyapısı |

## Veri eşlemesi

| FOPOS v47 | OPUS Contract |
| --- | --- |
| `subjectCode: philosophy` | `subjectIds: ["philosophy"]` |
| `datasetVersion: 2024.1` | `curriculum.version: 2024.1` |
| `F10_U1` | `unit.id: f10-u1` |
| `FEL.10.1.1` | `outcome.id: fel-10-1-1`, `outcome.code: FEL.10.1.1` |
| `duration_hours` | `estimatedPeriods` |
| `purpose` | `unit.description` |

Kaynak belge yalnızca yayın yılını içerdiği için Contract'ın zorunlu tarih
alanında `2024-01-01` normalizasyon değeri kullanılır. Bu değer kesin yayın
günü iddiası değildir.

## Kademeli geçiş

1. Kanonik 2024 müfredatını Module Contract'a uyarlama.
2. Adaptörü Module Loader ile sözleşme ve kapsam testlerinden geçirme.
3. FOPOS servis sınırlarını Core servislerine tek tek bağlama.
4. Eşdeğerlik testleri tamamlandıktan sonra çalışma zamanı yönlendirmesini
   OPUS'a alma.

Eski FOPOS deposu, dördüncü adım ayrıca onaylanana kadar çalışan sürüm ve
bakım deposu olarak kalır.
