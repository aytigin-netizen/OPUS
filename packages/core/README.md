# @opus/core

OPUS Core’un Module Contract ve Module Loader altyapısıdır.

## Sağlanan yetenekler

- `1.0.0` sürümlü çalışma zamanı Module Contract
- Modül şeması ve çapraz alan doğrulaması
- Benzersiz kimlikle kayıt
- Etkinleştirme ve devre dışı bırakma
- Sağlık durumu ve hata izolasyonu
- Güvenli kaldırma
- Müfredattan türetilen salt-okunur `units` ve `outcomes` görünümleri

## Temel kullanım

```ts
import { ModuleLoader } from "@opus/core";

const loader = new ModuleLoader();
loader.register(moduleDefinition);
loader.enable(moduleDefinition.id);
```

Module Loader modül kodunu dinamik olarak çalıştırmaz. Yalnızca doğrulanmış veri
sözleşmelerini kaydeder; çalıştırma adaptörleri ileriki sprintlerde ayrı güvenlik
sınırlarıyla ele alınacaktır.
