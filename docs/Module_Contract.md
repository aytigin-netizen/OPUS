# Module Contract

## Amaç

Module Contract, OPUS üzerinde çalışan her branş modülünün Core tarafından doğrulanması, kaydedilmesi ve yaşam döngüsünün yönetilmesi için sağlaması gereken ortak çalışma zamanı arayüzünü tanımlar.

İlk üretim sözleşmesi sürümü `1.0.0` değeridir ve `@opus/core` paketindeki `OpusModuleSchema` tarafından uygulanır.

## Zorunlu alanlar

| Alan | Sorumluluk |
|---|---|
| `contractVersion` | Core ile uyumluluğu belirleyen sözleşme sürümü |
| `id` | Değişmez ve benzersiz modül kimliği |
| `name` | Kullanıcıya gösterilen modül adı |
| `subjectIds` | Modülün sahip olduğu branş kimlikleri |
| `curriculum` | Desteklenen, doğrulanmış müfredat tanımları |
| `assessment` | Branşa özgü değerlendirme yetenekleri |
| `documents` | Branşa özgü belge türleri ve çıktı biçimleri |
| `ai_rules` | Branş bilgisini ve pedagojik sınırları yöneten AI kuralları |
| `reports` | Branşa özgü rapor tanımları |

## Ünite ve öğrenme çıktıları

`units` ve `outcomes` ayrı veri kopyaları olarak sözleşmeye yazılmaz. Bunların tek yetkili kaynağı `curriculum` içindeki müfredat tanımlarıdır. Module Loader, yüklenmiş modülde bu iki alanı salt-okunur ve türetilmiş görünümler olarak sunar.

Bu karar, Single Source of Truth ilkesini korur ve aynı verinin iki yerde farklılaşmasını önler.

## Çalışma zamanı sözleşmesi

```ts
interface OpusModule {
  contractVersion: "1.0.0";
  id: string;
  name: string;
  subjectIds: string[];
  curriculum: Curriculum[];
  assessment: AssessmentDefinition[];
  documents: DocumentDefinition[];
  ai_rules: AIRuleSet;
  reports: ReportDefinition[];
}

interface LoadedModule extends OpusModule {
  readonly units: readonly CurriculumUnit[];
  readonly outcomes: readonly LearningOutcome[];
}
```

Kesin ve çalıştırılabilir şema `packages/core/src/module-contract.ts` dosyasındadır.

## Kimlik kuralları

- Modül `id` değeri yayımlandıktan sonra değiştirilmez.
- Modül, müfredat ve yetenek kimlikleri kendi kapsamlarında benzersizdir.
- Müfredat `subjectId` değeri modülün `subjectIds` listesinde bulunmalıdır.
- Müfredat sürümü ve sözleşme sürümü ayrı tutulur.
- Ünite ve öğrenme çıktıları yetkili müfredat kaynağına izlenebilir olmalıdır.

Örnek modül kimlikleri:

- `philosophy`
- `psychology`
- `logic`
- `sociology`

## Doğrulama koşulları

Bir modül kaydedilmeden önce:

1. Sözleşme sürümü Core tarafından desteklenmelidir.
2. Zorunlu alanların tamamı bulunmalıdır.
3. Modül ve yetenek kimlikleri benzersiz olmalıdır.
4. Her müfredat modülün tanımladığı branşlardan birine ait olmalıdır.
5. Müfredat, ünite ve öğrenme çıktısı ilişkileri Curriculum Engine tarafından doğrulanmalıdır.
6. AI kural setinde en az bir açık kural bulunmalıdır.

## İzolasyon kuralları

- Modül verisi kayıt sırasında derin dondurulur.
- Sağlıksız modül etkinleştirilemez.
- Etkin modül doğrudan kaldırılamaz.
- Modül başka bir modülün iç yapısına erişemez.
- Core yalnızca yayımlanmış sözleşmeleri kullanır.
- Loader modül tarafından sağlanan keyfî kodu çalıştırmaz.
- Branşa özgü içerik ortak paketlere taşınamaz.

## Yaşam döngüsü

Module Loader aşağıdaki yaşam döngüsünü uygular:

1. Şemayı doğrula
2. Kaydet
3. Etkinleştir
4. Sağlık durumunu izle
5. Hatalı modülü izole et
6. Devre dışı bırak
7. Güvenli biçimde kaldır

## Değişiklik yönetimi

Module Contract sürümlendirilir. Kırıcı değişiklikler yeni ana sürüm, göç rehberi ve uyumluluk süresi olmadan yayımlanamaz. Modül verileri `contractVersion` değeriyle birlikte kaydedilir.
