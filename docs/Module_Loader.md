# Module Loader

## Amaç

Module Loader, OPUS branş modüllerinin ortak sözleşmeye göre doğrulanmasını ve Core yaşam döngüsüne güvenli biçimde katılmasını sağlar.

## Yaşam döngüsü

1. **Doğrula:** Module Contract ve iç müfredatlar çalışma zamanında doğrulanır.
2. **Kaydet:** Benzersiz kimlikli modül Core Registry’ye eklenir.
3. **Etkinleştir:** Sağlıklı modül kullanılabilir duruma getirilir.
4. **İzle:** Sağlık durumu görünür tutulur.
5. **İzole et:** Hatalı modül `error` durumuna alınır ve etkinleştirilemez.
6. **Devre dışı bırak:** Modül güvenli biçimde kullanım dışına alınır.
7. **Kaldır:** Yalnızca etkin olmayan modül kayıt sisteminden çıkarılır.

## Durumlar

| Durum | Anlam |
|---|---|
| `registered` | Doğrulandı ve kaydedildi; henüz etkin değil |
| `enabled` | Core tarafından kullanılabilir |
| `disabled` | Bilinçli biçimde kullanım dışı |
| `error` | Sağlık hatası nedeniyle izole edildi |

## Sözleşme alanları

- `id`
- `name`
- `contractVersion`
- `subjectIds`
- `curriculum`
- `assessment`
- `documents`
- `ai_rules`
- `reports`

`units` ve `outcomes`, müfredatın içinde tek kaynak olarak saklanır. Module Loader bunları yüklenen modülde salt-okunur görünümler halinde sunar.

## Güvenlik ve izolasyon

- Geçersiz sözleşme kayıt sistemine giremez.
- Aynı kimlikle iki modül kaydedilemez.
- Modül verisi kayıt sırasında derin dondurulur.
- Sağlıksız modül etkinleştirilemez.
- Etkin modül doğrudan kaldırılamaz.
- Loader modül tarafından sağlanan keyfî kodu çalıştırmaz.

## Sprint 2 kabul ölçütleri

1. Geçerli modül kaydedilebilmelidir.
2. Bozuk veya uyumsuz modül reddedilmelidir.
3. Tekrarlanan modül kimliği reddedilmelidir.
4. Yaşam döngüsü geçişleri öngörülebilir olmalıdır.
5. Sağlıksız modül izole edilmelidir.
6. Ünite ve öğrenme çıktıları tek müfredat kaynağından türetilmelidir.
7. Tip kontrolü, derleme, test ve CI başarılı olmalıdır.
