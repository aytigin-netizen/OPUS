# Module Contract

## Amaç

Module Contract, OPUS üzerinde çalışan her branş modülünün Core tarafından keşfedilebilmesi, doğrulanabilmesi ve çalıştırılabilmesi için sağlaması gereken ortak arayüzü tanımlar.

## Zorunlu alanlar

| Alan | Sorumluluk |
|---|---|
| `id` | Değişmez ve benzersiz modül kimliği |
| `name` | Kullanıcıya gösterilen modül adı |
| `curriculum` | Desteklenen müfredat tanımları ve sürümleri |
| `units` | Müfredat sürümüne bağlı ünite tanımları |
| `outcomes` | Ünite ve sınıf düzeyiyle ilişkili öğrenme çıktıları |
| `assessment` | Branşa özgü değerlendirme tanımları ve kuralları |
| `documents` | Branşa özgü belge türleri ve şablon bağları |
| `ai_rules` | Branş bilgisini ve pedagojik sınırları yöneten AI kuralları |
| `reports` | Branşa özgü rapor tanımları |

## Kavramsal sözleşme

```ts
interface OpusModule {
  id: string;
  name: string;
  curriculum: CurriculumDefinition[];
  units: UnitDefinition[];
  outcomes: OutcomeDefinition[];
  assessment: AssessmentDefinition;
  documents: DocumentDefinition[];
  ai_rules: AIRuleSet;
  reports: ReportDefinition[];
}
```

Bu TypeScript gösterimi Sprint 0 için kavramsaldır; üretim tipi değildir. Kesin şemalar ilgili motor sprintlerinde sürümlendirilecektir.

## Kimlik kuralları

- `id` kalıcıdır ve yayımlandıktan sonra değiştirilmez.
- Kayıt kimlikleri modül ad alanıyla çakışmayacak biçimde oluşturulur.
- Müfredat sürümü açıkça belirtilir.
- Ünite ve öğrenme çıktıları kendi yetkili müfredat kaynağına izlenebilir olmalıdır.

Örnek modül kimlikleri:

- `philosophy`
- `psychology`
- `logic`
- `sociology`

## Doğrulama koşulları

Bir modül yüklenmeden önce:

1. Zorunlu alanların tamamı bulunmalıdır.
2. Modül kimliği benzersiz olmalıdır.
3. Müfredat, ünite ve öğrenme çıktısı ilişkileri tutarlı olmalıdır.
4. Referans verilen belge ve rapor tanımları çözümlenebilmelidir.
5. AI kuralları güvenlik ve kaynaklandırma sınırlarını sağlamalıdır.
6. Sözleşme sürümü OPUS Core tarafından desteklenmelidir.

## İzolasyon kuralları

- Modül, başka bir branş modülünün iç yapısına erişemez.
- Modül, Core’un özel uygulama ayrıntılarına bağımlı olamaz.
- Modül yalnızca yayımlanmış Core arayüzlerini kullanır.
- Branşa özgü içerik ortak paketlere taşınamaz.
- Ortaklaştırma kararı en az iki modülün aynı ihtiyacının doğrulanmasına dayanır.

## Yaşam döngüsü

Module Loader gelecekte aşağıdaki yaşam döngüsünü yönetecektir:

1. Keşfet
2. Şemayı doğrula
3. Sürüm uyumluluğunu denetle
4. Kaydet
5. Etkinleştir
6. Sağlık durumunu izle
7. Güvenli biçimde devre dışı bırak

## Değişiklik yönetimi

Module Contract sürümlendirilecektir. Kırıcı değişiklikler göç rehberi ve uyumluluk süresi olmadan yayımlanamaz. Modül verileri sözleşme sürümüyle birlikte kaydedilmelidir.
