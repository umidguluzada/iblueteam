# Demo ssenarisi (təxminən 8 dəqiqə)

Hazırlıq: `IBT_ADMIN_PASSWORD=demo12345 python run.py`, brauzerdə http://127.0.0.1:8000.

1. **Matris (1 dəq).** Platforma «Windows». Yuxarıdakı zolaqda ümumi əhatə, risk-çəkili əhatə və kor texnika sayı. Sütun başlıqlarında taktika üzrə faiz. «Dərinlik (heatmap)» açarını aç: xanalar əhatə dərinliyinə görə rənglənir. Qırıq haşiyəli və göz işarəli xana «kor» texnikadır (məs. Phishing).
2. **Detail paneli (1 dəq).** `T1003.006` (DCSync) üzərinə klik: təsvir, lazım olan log mənbələri (toplanır/toplanmır), bağlı qayda, test qeydləri. Phishing-ə klik: səbəb «lazım olan log mənbəyi toplanmır».
3. **Giriş (30 san).** Giriş etmədən «Yeni qayda» pəncərəsi giriş istəyir. `admin` ilə daxil ol.
4. **Qayda və test (1,5 dəq).** «Qaydalar» → «Yeni qayda»: ad, texnika `T1059.003`, log mənbəyi `WinEventLog:Sysmon`, status Aktiv. Qaydanı aç, test qeydi əlavə et (Keçdi). Matrisə qayıt: texnika «tam» oldu.
5. **Log mənbəyi təsiri (1 dəq).** «Mənbələr» səhifəsində `WinEventLog:Sysmon` açarını söndür. Sysmon-a bağlı qaydaların hamısı «kor» olur, əhatə kəskin düşür. Açarı geri qaytar.
6. **Boşluqlar (1 dəq).** Prioritet sırası, «kor» filtri, səbəb və qrup sayı. CSV ixrac.
7. **Live Detection Monitor (2 dəq).** Mavi qövs aşkarlandı, kəhrəba qismən, qırmızı qaçırıldı. Sağdakı axında qırmızı hadisəyə klik: texnikanın paneli açılır. «Yalnız qaçırılanlar» filtri, 2× və 4× sürət, «Ən təhlükəli boşluqlar» siyahısı. Kiçik pəncərədə monitor ardıcıl yerləşir. Gözlənilən göstərici (çəkili əhatə) ilə faktiki aşkarlanma faizini müqayisə et.
8. **İxrac (30 san).** İxrac menyusu: JSON, CSV, ATT&CK Navigator layer.
