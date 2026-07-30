# @opus/curriculum

OPUS’un branştan bağımsız müfredat sözleşmesi ve doğrulama motorudur.

## Kapsam

- Müfredat ve şema sürümü
- Yetkili kaynak ve belge izlenebilirliği
- Sınıf düzeyleri
- Üniteler
- Öğrenme çıktıları
- Ünite–çıktı referans bütünlüğü
- Etkinlik tarih aralığı
- Kimlik ve kod benzersizliği

Bu paket branşa özgü müfredat içeriği veya pedagojik strateji içermez.

## Temel kullanım

```ts
import {
  createCurriculumIndex,
  parseCurriculum,
  validateCurriculum,
} from "@opus/curriculum";

const curriculum = parseCurriculum(input);
const validation = validateCurriculum(input);
const index = createCurriculumIndex(input);
```

`parseCurriculum` geçersiz veride ayrıntılı Zod hatası üretir.
`validateCurriculum` hata fırlatmadan doğrulama sonucu döndürür.
