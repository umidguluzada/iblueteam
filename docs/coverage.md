# Coverage hesablama qaydası

Coverage statusu (`none / partial / full`) **əl ilə seçilmir**. O, texnikaya bağlı qaydalardan və log mənbələrinin vəziyyətindən hesablanır. Kod: `backend/coverage.py`.

## 1. Qaydanın effektiv səviyyəsi

Yuxarıdan aşağı ilk uyğun gələn şərt tətbiq olunur:

| Şərt | Səviyyə | İzah |
|---|---|---|
| Status `disabled` | boşluq (0) | Söndürülmüş qayda heç nəyi aşkar etmir |
| Qaydanın log mənbələrindən **biri** toplanmır | boşluq (0), **kor** | Qayda var, amma işləmək üçün data yoxdur |
| Heç bir log mənbəyi göstərilməyib | ən çoxu qismən (1) | Telemetriyanın olub-olmadığını yoxlamaq mümkün deyil |
| Status `active` və son test nəticəsi uğurlu | tam (2) | |
| Qalan hallar (`draft`, test olunmamış, son test uğursuz) | qismən (1) | |

Qaydanın log mənbələri **AND** şərti ilə oxunur: hamısı toplanmalıdır. Buna görə qayda üçün yalnız həqiqətən vacib mənbələri seçin.

Test nəticəsi: qaydaya test qeydi əlavə olunubsa, `tested` və `last_tested` ən son qeyddən çıxarılır (uğurlu = test olunub). Qeyd yoxdursa, əl ilə işarə qəbul edilir.

## 2. Texnikanın səviyyəsi

- Texnikanın səviyyəsi = ona bağlı qaydaların effektiv səviyyələrinin **maksimumu**. Qayda yoxdursa, boşluq.
- Ana texnikanın xanası = özü və alt-texnikaları arasında maksimum (matris xanasının rəngi).
- **Kor texnika**: səviyyə boşluqdur və səbəb telemetriyadır. Ya qayda var, amma mənbəsi toplanmır, ya da ATT&CK-ın bu texnika üçün tələb etdiyi Windows log mənbələrinin heç biri toplanmır.

## 3. Heatmap balı (dərinlik, 0 ilə 100)

Boşluq üçün 0. Əks halda:

```
bal = baza + dərinlik + keyfiyyət
baza       = 70 (tam) və ya 40 (qismən)
dərinlik   = min(20, 10 × (effektiv qayda sayı − 1))
keyfiyyət  = round((orta keyfiyyət − 1) / 4 × 10)     # qaydaların 1 ilə 5 keyfiyyətindən
```

Matrisdə «Dərinlik (heatmap)» açarı xanaları bu bala görə rəngləyir.

## 4. Risk-çəkili əhatə

Hər texnikanın çəkisi: `1 + min(40, onu istifadə edən ATT&CK qrup sayı)`. Kredit: tam 1, qismən 0.5, boşluq 0.

```
çəkili əhatə = Σ(çəki × kredit) / Σ(çəki)
```

Hesablama yalnız «yarpaq» texnikalar üzərindədir: alt-texnikalar və alt-texnikası olmayan ana texnikalar. Alt-texnikası olan ana texnika yalnız özünə qayda bağlıdırsa ayrıca sayılır. Live Detection Monitor-un «gözlənilən» göstəricisi eyni düsturdur.

## 5. Boşluq prioritet balı

```
bal = baza + qruplar + kor + qeyd
baza    = 40 (boşluq) və ya 15 (qismən)
qruplar = min(30, texnikanı istifadə edən qrup sayı)
kor     = +10 (telemetriya bağlanmalıdır)
qeyd    = +20 (yüksək), +10 (orta), +4 (aşağı) prioritetli qeyd varsa
honeypot = min(20, son 24 saatda honeypot-da müşahidə olunan hadisə sayı)
```

Səbəb sütunu: «qayda var, amma log mənbəyi toplanmır», «lazım olan log mənbəyi toplanmır», «qayda aktiv və ya test olunmuş deyil», «bütün qaydalar söndürülüb» və ya «qayda yoxdur».

## 6. Platforma

Matris, statistika, boşluqlar və ixrac `platform` parametrinə görə filtrlənir. Susmaya görə `Windows`, `all` bütün platformalar deməkdir.

## 7. ATT&CK məlumatından gələnlər

- **Lazım olan log mənbələri**: texnika üçün detection strategy, onun analitikaları (yalnız Windows platformalı) və analitiklərin log source adları (`WinEventLog:Sysmon` kimi).
- **Qrup sayı**: texnikanı `uses` əlaqəsi ilə istifadə edən intrusion-set sayı. Ana texnika üçün öz və alt-texnikaların qrupları birləşdirilir.
- **Ləğv olunmuş ID-lər**: ATT&CK-da bəzi texnikalar ləğv olunub və yenisi ilə əvəz edilib (məs. `T1070.001` → `T1685.005`). `revoked-by` əlaqəsi `technique_aliases` cədvəlinə yazılır və köhnə etiketli Sigma qaydaları avtomatik yeni texnikaya bağlanır.
