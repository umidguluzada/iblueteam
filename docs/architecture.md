# Arxitektur

```mermaid
flowchart LR
    subgraph Brauzer["Brauzer (vanilla JS, build yoxdur)"]
        UI["Matris · Monitor · Qaydalar · Mənbələr · Boşluqlar · İcmal"]
        CV["Monitor canvas (2D nöqtəli xəritə)"]
    end

    subgraph Server["FastAPI (backend/)"]
        API["main.py (REST API)"]
        AUTH["auth.py (PBKDF2 + HMAC token)"]
        COV["coverage.py (əhatə, heatmap, boşluq balı)"]
        MON["monitor.py (sintetik hadisə generatoru)"]
        HPY["honeypot.py (qəbul, təsnifat)"]
        IMP["attack_import.py + sigma.py"]
    end

    DB[("SQLite<br/>data/ibluteam.db")]
    STIX[["MITRE ATT&CK STIX<br/>data/enterprise-attack.json"]]
    FILES[["Sigma YAML / CSV"]]

    HP["Honeypot VM (honeypot/honeypot.py)"] -->|"POST /api/honeypot/ingest"| API
    API --> HPY
    UI -->|"fetch /api/*"| API
    CV -->|"poll /api/monitor/events"| API
    API --> AUTH
    API --> COV
    API --> MON
    COV --> DB
    MON --> COV
    IMP --> DB
    STIX --> IMP
    FILES -->|idxal| API
```

## Məlumat axını

1. **ATT&CK** STIX faylı açılışda bir dəfə bazaya yüklənir: taktikalar, texnikalar, alt-texnikalar, Windows log mənbələri, qrup sayı, ləğv olunmuş ID-lər. Yeniləmək üçün faylı əvəz edib `python run.py --reimport-attack` işlədin.
2. **Qaydalar** əl ilə, Sigma YAML və ya CSV ilə daxil olur. Sigma etiketləri (`attack.t1059.001`) texnikaya, logsource log mənbəyinə təklif kimi bağlanır.
3. **Əhatə** hər sorğuda qaydalardan və log mənbəyi vəziyyətindən hesablanır (`coverage.py`), saxlanmır. Beləliklə statuslar köhnələ bilməz.
4. **Monitor** hadisələri texnikaların çəkisinə görə seçir, nəticəni (aşkarlandı, qismən, qaçırıldı) cari əhatədən götürür. Qayda əlavə edib test etsəniz və ya log mənbəyini söndürsəniz, monitor dərhal dəyişir.

## Təhlükəsizlik

- Oxuma açıqdır, dəyişiklik üçün giriş lazımdır. Token 12 saat etibarlıdır, HMAC ilə imzalanır, gizli açar `data/.secret` faylındadır.
- Parollar PBKDF2-SHA256 (200 000 iterasiya) ilə saxlanılır. Uğursuz giriş cəhdləri məhdudlaşdırılır.
- İlk işə salmada `admin` yaranır. Parol `IBT_ADMIN_PASSWORD` ilə verilir, verilməzsə təsadüfi yaradılıb konsola bir dəfə çap olunur.
- Monitor sintetikdir: IP-lər sənəd aralığından (RFC 5737), mənbələr məlumat mərkəzi şəhərləridir. Real təşkilat datası yoxdur.
