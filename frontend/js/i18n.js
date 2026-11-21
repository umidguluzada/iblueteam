import { catalog } from "./i18n-catalog.js";
const entries = `
Matris|Matrix
Monitor|Monitor
Honeypot|Honeypot
Qaydalar|Rules
Yoxlamalar|Reviews
Mənbələr|Sources
Boşluqlar|Gaps
İcmal|Overview
İxrac|Export
Dil|Language
Məzmuna keç|Skip to content
Əsas naviqasiya|Main navigation
Texnika təfərrüatı|Technique details
Qayda yoxlamaları|Rule reviews
Göndərilən qaydalar, gözləyən qərarlar və təsdiqləmə tarixçəsi|Submitted rules, pending decisions and review history
Giriş tələb olunur|Sign in required
Yoxlamaları görmək üçün Admin, Analyst və ya Reviewer hesabı ilə daxil olun.|Sign in as Admin, Analyst or Reviewer to view reviews.
Yoxlamalar yüklənmədi|Could not load reviews
Yüklənir...|Loading...
Yüklənir|Loading
Matris yüklənir|Loading matrix
Hamısı|All
Qayda|Rule
Göndərən|Submitted by
Status|Status
Qeyd|Note
Yoxlayan|Reviewer
Qərar|Decision
Təsdiqlə|Approve
Rədd et|Reject
Gözləmədə|Pending
Yekunlaşıb|Completed
Bu statusda yoxlama yoxdur|No reviews with this status
Rədd etmə səbəbini daxil edin:|Enter the reason for rejection:
Təsdiq qeydi (istəyə bağlı):|Approval note (optional):
Rədd etmə səbəbi tələb olunur|A rejection reason is required
Yoxlama qərarı saxlanıldı|Review decision saved
Pending · Gözləmədə|Pending
Approved · Təsdiqlənib|Approved
Rejected · Rədd edilib|Rejected
Təsdiqlənib|Approved
Rədd edilib|Rejected
Yeni qayda|New rule
Qayda əlavə et|Add rule
Qayda yarat|Create rule
Qaydanı yarat|Create rule
Qaydanı saxla|Save rule
Saxla|Save
Ləğv et|Cancel
Bağla|Close
Sil|Delete
Düzəliş et|Edit
Redaktə et|Edit
Daxil ol|Sign in
Çıxış|Sign out
İstifadəçilər|Users
İstifadəçi|User
İstifadəçi yarat|Create user
Yeni istifadəçi|New user
Parol|Password
İstifadəçi adı|Username
Rol|Role
Administrator|Administrator
Analitik|Analyst
Yoxlayıcı|Reviewer
Axtar|Search
Axtarış|Search
Filtrlər|Filters
Filtr|Filter
Təmizlə|Clear
Bütün platformalar|All platforms
Platforma|Platform
Texnika|Technique
Texnikalar|Techniques
Alt-texnikalar|Sub-techniques
Taktika|Tactic
Taktikalar|Tactics
Əhatə|Coverage
Tam|Full
Qismən|Partial
Boşluq|Gap
Aktiv|Active
Söndürülüb|Disabled
Yüksək|High
Orta|Medium
Aşağı|Low
Keçdi|Passed
Uğursuz|Failed
Yoxlamaya göndər|Submit for review
Göndər|Submit
Qaydaların sayı|Rule count
Qaydalar yoxdur|No rules
Məlumat yoxdur|No data
Nəticə yoxdur|No results
Testlər|Tests
Test|Test
Yeni test|New test
Test əlavə et|Add test
Log mənbələri|Log sources
Log mənbəyi|Log source
Mənbə əlavə et|Add source
Risk|Risk
Prioritet|Priority
Ümumi|Overall
Ümumi əhatə|Overall coverage
Risk-çəkili əhatə|Risk-weighted coverage
İdarəetmə paneli|Dashboard
Canlı monitor|Live monitor
Canlı izləmə|Live monitoring
Hadisələr|Events
Hadisə|Event
Simulyasiya|Simulation
Başlat|Start
Dayandır|Stop
Yenilə|Refresh
İdxal|Import
Yüklə|Upload
Yükləmə|Download
Hesabat|Report
Tarixçə|History
Vaxt|Time
Tarix|Date
Ad|Name
Təsvir|Description
Növ|Type
Məqsəd|Purpose
Ətraflı|Details
Bax|View
Geri|Back
Növbəti|Next
Təsdiq|Approval
İmtina|Rejection
Xəta|Error
Uğurlu|Success
Sessiya bitib. Yenidən daxil olun|Session expired. Please sign in again
Səhifə yüklənmədi|Page could not be loaded
Serverə qoşulmaq mümkün olmadı|Could not connect to server
Matris (JSON)|Matrix (JSON)
Matris (CSV)|Matrix (CSV)
Boşluqlar (CSV)|Gaps (CSV)
Texnikalar, qaydalar, log mənbələri və boşluqlar|Techniques, rules, log sources and gaps
Hər texnika üçün bir sətir|One row per technique
Prioritet sırası ilə|Sorted by priority
Açıq mövzuya keç|Switch to light theme
Tünd mövzuya keç|Switch to dark theme
Mövzunu dəyiş|Toggle theme
iBlueTeam, giriş səhifəsinə qayıt|iBlueTeam, return to landing page

İdxal et|Import
Qayda axtar|Search rules
Bütün statuslar|All statuses
Bütün mənbələr|All sources
Bütün platformalar|All platforms
Gözləyən qərarlar|Pending decisions
Hələ qayda yoxdur|No rules yet
Axtarışa uyğun qayda tapılmadı|No matching rules found
Axtarışı və ya filtrləri dəyişin.|Change the search or filters.
Yoxlamaya göndərildi. Yoxlamalar səhifəsində Pending kimi görünəcək.|Submitted for review. It will appear as Pending on the Reviews page.
Təsvir yoxdur|No description
Məzmunu yoxdur|No content
Qaydanı redaktə et|Edit rule
Lazım olan log mənbələri|Required log sources
Log mənbəyi|Log source
Log mənbələri|Log sources
Qaydanın adı|Rule name
Qaydanın təsviri|Rule description
Qayda adı|Rule name
Təsvir|Description
Qayda ID|Rule ID
Texnika ID|Technique ID
Yalnız oxuma|Read-only
Yalnız baxış|View only
Baxış rejimi|View mode
Ətraflı məlumat|Details
Təfərrüatlar|Details
Əlaqəli qaydalar|Related rules
Mövcud qaydalar|Existing rules
Qayda məlumatları|Rule details
Test nəticələri|Test results
Test qeydləri|Test records
Hələ test qeydi yoxdur.|No test records yet.
Test əlavə edildi|Test added
Testi əlavə et|Add test
Nəticə|Result
Üsul|Method
Uğurlu|Successful
Uğursuz|Failed
Qismən|Partial
Tam|Full
Yoxdur|None
Bilinmir|Unknown
Toplanır|Collected
Toplanmır|Not collected
Əhatəyə töhfəsi|Coverage contribution
Ümumi əhatə|Overall coverage
Risk-çəkili əhatə|Risk-weighted coverage
Əhatə olunub|Covered
Əhatə olunmayıb|Not covered
Əhatə vəziyyəti|Coverage status
Kritik|Critical
Yüksək|High
Orta|Medium
Aşağı|Low
Boşluq analizi|Gap analysis
Prioritet boşluqlar|Priority gaps
Qayda sayı|Rule count
Aktiv qaydalar|Active rules
Qayda yoxlamaları|Rule reviews
Yoxlama tarixçəsi|Review history
Yoxlama sorğuları|Review requests
Yoxlama gözləyir|Awaiting review
Gözləmədə|Pending
Təsdiqləndi|Approved
Rədd edildi|Rejected
Təsdiqlənib|Approved
Rədd edilib|Rejected
Gözləyən|Pending
Təsdiqlə|Approve
Rədd et|Reject
Təsdiq et|Approve
Qərar ver|Make decision
Səbəb|Reason
Səbəb qeyd edin|Enter a reason
Qeyd əlavə et|Add note
Yoxlama qeydi|Review note
Göndərən|Submitted by
Yoxlayan|Reviewer
Qərar verən|Decided by
İstifadəçi yaradıldı|User created
İstifadəçi silindi|User deleted
İstifadəçi adı|Username
İstifadəçi yarat|Create user
Parolu daxil edin|Enter password
Parol|Password
Parolu təkrarla|Confirm password
Yanlış istifadəçi adı və ya parol|Invalid username or password
Daxil olun|Sign in
Daxil ol|Sign in
Çıxış et|Sign out
Çıxış|Sign out
İstifadəçilər|Users
İstifadəçi|User
İstifadəçi idarəetməsi|User management
İstifadəçi dəyiş|Switch user
İstifadəçi dəyişdir|Switch user
Səlahiyyət|Permission
Səlahiyyət yoxdur|Permission denied
İcazə yoxdur|Access denied
Bu əməliyyat üçün icazəniz yoxdur|You do not have permission for this action
İnzibatçı|Administrator
Administrator|Administrator
Analitik|Analyst
Yoxlayıcı|Reviewer
Təhlükəsizlik yoxlayıcısı|Security reviewer
Məlumat yüklənir|Loading data
Məlumatlar yüklənir|Loading data
Məlumat yüklənmədi|Failed to load data
Yüklənmə xətası|Loading error
Yenidən cəhd et|Try again
Yenidən yoxla|Check again
Yenilə|Refresh
Əlavə et|Add
Yeni|New
Redaktə|Edit
Redaktə et|Edit
Dəyiş|Change
Dəyişiklikləri saxla|Save changes
Saxla|Save
Ləğv et|Cancel
Sil|Delete
Bağla|Close
Geri qayıt|Go back
Geri|Back
Davam et|Continue
Aç|Open
Bax|View
Seç|Select
Seçin|Select
Hamısını seç|Select all
Təmizlə|Clear
Sıfırla|Reset
Filtr tətbiq et|Apply filter
Filtrləri sıfırla|Reset filters
Bütün qaydalar|All rules
Bütün texnikalar|All techniques
Bütün taktikalar|All tactics
Bütün nəticələr|All results
İstənilən|Any
Seçilməyib|Not selected
Əl ilə|Manual
Avtomatik|Automatic
Mənbə əlavə et|Add source
Mənbəni redaktə et|Edit source
Mənbəni sil|Delete source
Mənbə adı|Source name
Mənbə növü|Source type
Log mənbələrinin vəziyyəti|Log source status
Canlı monitor|Live monitor
Canlı izləmə|Live monitoring
Canlı hadisələr|Live events
Hadisə axını|Event stream
Hadisə detalları|Event details
Hadisələr|Events
Hadisə|Event
Son hadisələr|Recent events
Son yenilənmə|Last updated
İzləməni başlat|Start monitoring
İzləməni dayandır|Stop monitoring
Başlat|Start
Dayandır|Stop
Simulyasiya et|Simulate
Simulyasiya|Simulation
Demo rejimi|Demo mode
Təhlükə|Threat
Təhlükələr|Threats
Aşkarlanma|Detection
Aşkarlama|Detection
Xəbərdarlıq|Alert
Xəbərdarlıqlar|Alerts
Ciddilik|Severity
Mənbə IP|Source IP
Hədəf IP|Destination IP
IP ünvanı|IP address
Vaxt damğası|Timestamp
Tarix və vaxt|Date and time
Son 24 saat|Last 24 hours
Son 7 gün|Last 7 days
Son 30 gün|Last 30 days
Bu gün|Today
Dünən|Yesterday
Hesabatı ixrac et|Export report
İxrac et|Export
İxrac|Export
İdxal|Import
Fayl seç|Choose file
Fayl yüklə|Upload file
Yüklə|Download
Köçür|Copy
Kopyalandı|Copied
Uğurla saxlanıldı|Saved successfully
Xəta baş verdi|An error occurred
Əməliyyat uğurludur|Operation successful
Əminsiniz?|Are you sure?
Bəli|Yes
Xeyr|No
Qeyd|Note
Qeydlər|Notes
Ad|Name
Növ|Type
Status|Status
Tarix|Date
Vaxt|Time
Ətraflı|Details
Axtar|Search
Axtarış|Search
Filtrlər|Filters
Sıralama|Sort
Artan|Ascending
Azalan|Descending
Göstər|Show
Gizlət|Hide
Göstərilən|Showing
Cəmi|Total
Ümumi|Overall
Aktiv|Active
Deaktiv|Inactive
Söndürülüb|Disabled
Qaralama|Draft
Təsdiq gözləyir|Awaiting approval
İdarəetmə paneli|Dashboard
İcmal|Overview
Matris|Matrix
Qaydalar|Rules
Yoxlamalar|Reviews
Mənbələr|Sources
Boşluqlar|Gaps

Əhatə dərinliyi (əhatə xəritəsi)|Coverage depth (heatmap)
Dərinlik|Depth
Əhatə xəritəsi|Heatmap
Xanaları əhatə səviyyəsinə görə rəngləndir: qaydaların sayı və keyfiyyəti nəzərə alınır|Color cells by coverage level, taking rule count and quality into account
Aşkarlama yoxdur və səbəb telemetriyadır|Detection is unavailable due to missing telemetry
Aşkarlama yoxdur və səbəb log mənbəyinin toplanmamasıdır|Detection is unavailable because the required log source is not collected
Kor|Blind spot
kor texnika|blind techniques
zəif|low
 dərin| deep
texnikada aşkarlama var|techniques have detection coverage
Aşkarlama qaydaları|Detection rules
Aşkarlama|Detection
Aşkarlandı|Detected
Qaçırıldı|Missed
qaçırıldı|missed
Hadisə gözlənilir|Waiting for events
Hadisə axını|Event feed
Ən təhlükəli boşluqlar|Highest-risk gaps
Bütün boşluqlar|All gaps
Boşluq qalmayıb.|No coverage gaps remain.
Yalnız qaçırılanlar|Missed events only
Monitor yüklənir|Loading monitor
Qoşulur|Connecting
Göstəricilər|Metrics
Sürət|Speed
Mənbə|Source
Hadisə axını|Event feed
Hadisə detalları|Event details
Hadisə sayı|Event count
Honeypot yüklənir|Loading honeypot
Hücum kateqoriyaları|Attack categories
Ən çox hədəflənən portlar|Most targeted ports
Ən aktiv mənbələr|Most active sources
Sensor açarı yarat|Generate sensor key
Qəbul açıqdır|Receiving events
Simulyasiya (sınaq üçün)|Simulation (for testing)
Hadisə yarat|Generate events
Simulyasiyanı sil|Delete simulated events
Quraşdırma|Setup
Son hadisələr|Recent events
Bütün kateqoriyalar|All categories
Bütün portlar|All ports
Port planı və ATT&CK uyğunlaşdırması|Port plan and ATT&CK mapping
Xidmət|Service
Susmaya görə kateqoriya|Default category
Skan|Scan
Veb yoxlama|Web probe
SMB cəhdi|SMB attempt
RDP cəhdi|RDP attempt
Verilənlər bazası|Database
Exploit cəhdi|Exploit attempt
Kateqoriya|Category
Taktikalar|Tactics
Platformalar|Platforms
Qruplar|Groups
Qrup məlumatı yoxdur|No group information available
ATT&CK qrupu istifadə edir|ATT&CK groups use this technique
Son 24 saatda|In the last 24 hours
hadisə|events
hadisə, son 24 saat|events in the last 24 hours
Alt-texnika. Ana texnika:|Sub-technique. Parent technique:
MITRE ATT&CK səhifəsində aç|Open on MITRE ATT&CK
ATT&CK analitiklərinə görə (Windows). Bu mənbələr olmadan aşkarlama mümkün deyil.|According to ATT&CK analytics (Windows). Detection is not possible without these sources.
ATT&CK bu texnika üçün Windows log mənbəyi göstərmir.|ATT&CK does not specify a Windows log source for this technique.
toplanır|collected
toplanmır|not collected
test olunub|tested
test olunmayıb|not tested
log mənbəyi toplanmır|log source not collected
Bu texnika üçün qayda yoxdur.|No detection rules for this technique.
Test qeydi yoxdur. Qaydanı açıb test nəticəsini əlavə edin.|No test records. Open a rule to add test results.
Qeydlər|Notes
Qeyd mətni|Note text
Qeyd əlavə edildi|Note added
Qeyd əlavə etmək üçün|To add a note,
daxil olun|sign in
Boşluq, plan və ya log mənbəyi haqqında qeyd|Note about a gap, plan or log source
Yüksək prioritet|High priority
Aşağı prioritet|Low priority
Paneli bağla|Close panel
Bu texnikanın özünə bağlı qayda yoxdur. Əhatə alt-texnikalardan gəlir.|No rules are directly linked to this technique. Coverage comes from its sub-techniques.
Texnikalar üzrə əhatə|Coverage by technique
Taktikalar üzrə|By tactic
Qayda cəmi|Total rules
Test uğur faizi|Test pass rate
Log mənbəyi toplanır|Log sources collected
Orta keyfiyyət (5-dən)|Average quality (out of 5)
Qaydaların mənbəyi|Rule sources
texnikada ən azı qismən aşkarlama var|techniques have at least partial detection
Qayda yoxlamaları|Rule reviews
Gözləyən qərarlar|Pending decisions
İstifadəçi menyusu|User menu
Keyfiyyət nəzarətçisi|Quality reviewer
Yeni istifadəçi adı|New username
Parol (ən azı 8 simvol)|Password (at least 8 characters)
İstifadəçi əlavə et|Add user
İstifadəçi əlavə edildi|User added
Çıxış edildi|Signed out
Xoş gəlmisiniz,|Welcome,
İstifadəçi adı və parolu daxil edin|Enter a username and password
Qayda axtar|Search rules
Texnika ID və ya ad|Technique ID or name
Texnika axtar|Search techniques
Boşluq axtar|Search gaps
Bütün log mənbələri|All log sources
Əhatə filtri|Coverage filter
Ümumi əhatə|Overall coverage
Çox qrupun istifadə etdiyi texnikalar daha çox çəkiyə malikdir|Techniques used by more groups carry greater weight
Qayda əlavə et|Add rule
Qayda yarat|Create rule
Qayda saxlanıldı|Rule saved
Qayda silindi|Rule deleted
Qayda əlavə edildi|Rule added
Hələ qayda yoxdur|No rules yet
Qayda məlumatları|Rule details
Yoxlama tarixçəsi|Review history
Qayda yoxlamaları|Rule reviews
Göndərilən qaydalar, gözləyən qərarlar və təsdiqləmə tarixçəsi|Submitted rules, pending decisions and review history
Qərar|Decision
Gözləmədə|Pending
Təsdiqlənib|Approved
Rədd edilib|Rejected
İstifadəçi idarəetməsi|User management
Hələ məlumat yoxdur.|No data yet.
Söndürüləndə sensor hadisələri qəbul olunmur|When disabled, the sensor does not accept events
Əvvəlcə fayl seçin.|Choose a file first.
CSV şablonu|CSV template
Başlanğıc status|Initial status
Test olunmuş kimi qeyd et|Mark as tested
Qaydaları idxal et|Import rules
Sigma fayllarını seçin və ya bura buraxın|Select Sigma files or drop them here
CSV faylını seçin və ya bura buraxın|Select a CSV file or drop it here
Bütün texnikalar tam örtülüb|All techniques are fully covered
Filtrə uyğun texnika tapılmadı|No techniques match the filters
Boşluq və qismən|Gaps and partial coverage
Yalnız boşluq|Gaps only
Yalnız qismən|Partial coverage only
Yalnız kor|Blind spots only
Bütün prioritetlər|All priorities
Səbəb|Reason
Qrup|Group
Skan|Scan
Veb|Web
İstifadəçilər|Users
Sürətli baxış|Quick view
Təhlükə səviyyəsi|Threat level

Yoxlama üçün qeyd (istəyə bağlı):|Review note (optional):
Yeni açar köhnəsini ləğv edəcək, sensoru yenidən qurmaq lazım olacaq. Davam edək?|Generating a new key will invalidate the old one. You will need to reconfigure the sensor. Continue?
Əhatə xəritəsi|Heatmap
Əhatə dərinliyi|Coverage depth
Aktivlik xəritəsi|Activity map
Hadisə aktivliyi|Event activity
Qayda vəziyyəti|Rule status
Aşkarlama vəziyyəti|Detection status
Risk səviyyəsi|Risk level
Əhatə faizi|Coverage percentage
Əhatə göstəricisi|Coverage metric
İstifadəçi məlumatları|User details
İstifadəçi yaradılması|Create user
İstifadəçini sil|Delete user
İstifadəçiyə keç|Switch to user
Hesaba keç|Switch account
Giriş məlumatları|Sign-in credentials
İcazə verilmir|Not permitted
Yalnız oxuma rejimi|Read-only mode
Qaydaların yoxlanması|Rule review
Yoxlamaya təqdim et|Submit for review
Yoxlama üçün göndər|Submit for review
Yoxlamaya təqdim edildi|Submitted for review
Yoxlama gözləyən|Pending review
Qərar gözləyir|Awaiting decision
Yoxlama tamamlandı|Review completed
Yoxlama rədd edildi|Review rejected
Qərar qeydi|Decision note
Rədd etmə səbəbi|Rejection reason
Qayda təsdiqləndi|Rule approved
Qayda rədd edildi|Rule rejected
Yoxlama tapılmadı|Review not found
Mövcud yoxlamalar|Existing reviews
Qayda yaradılması|Create rule
Qaydanı silmək|Delete rule
Qaydanı sil|Delete rule
Qaydanı yenilə|Update rule
Qayda yeniləndi|Rule updated
Qayda aktivləşdirildi|Rule activated
Qayda deaktiv edildi|Rule deactivated
Qayda aktiv deyil|Rule is inactive
Qayda təsviri|Rule description
Qayda növü|Rule type
Qayda mənbəyi|Rule source
Qaydanın vəziyyəti|Rule status
Qayda keyfiyyəti|Rule quality
Test vəziyyəti|Test status
Test nəticəsi|Test result
Test qeydi|Test record
Test uğurludur|Test passed
Test uğursuzdur|Test failed
Test silindi|Test deleted
Test nəticəsi əlavə edildi|Test result added
Yeni log mənbəyi|New log source
Log mənbəyi əlavə edildi|Log source added
Log mənbəyi yeniləndi|Log source updated
Log mənbəyi silindi|Log source deleted
Məlumat mənbələri|Data sources
Toplanan mənbələr|Collected sources
Toplanmayan mənbələr|Unavailable sources
Məlumat toplanır|Data is being collected
Məlumat toplanmır|Data is not being collected
Məlumat tapılmadı|No data found
Məlumatı yenilə|Refresh data
Səhifəni yenilə|Refresh page
Son yoxlama|Last checked
Son hadisə|Latest event
Hadisə tapılmadı|No events found
Hadisə aşkarlanıb|Event detected
Hadisə aşkarlanmadı|No event detected
Təhdid aşkarlandı|Threat detected
Təhdid aşkarlanmadı|No threat detected
Aşkarlanmış hadisələr|Detected events
Qaçırılmış hadisələr|Missed events
Hadisə simulyasiyası|Event simulation
Simulyasiya başladıldı|Simulation started
Simulyasiya dayandırıldı|Simulation stopped
Simulyasiya tamamlandı|Simulation completed
Sensor vəziyyəti|Sensor status
Sensor aktivdir|Sensor is active
Sensor deaktivdir|Sensor is inactive
Sensor bağlantısı|Sensor connection
Sensor hadisələri|Sensor events
Hücum cəhdləri|Attack attempts
Hücum cəhdi|Attack attempt
Hücum növü|Attack type
Hücum mənbəyi|Attack source
Hücum vaxtı|Attack time
Hədəf port|Target port
Mənbə port|Source port
Mənbə ünvanı|Source address
Hədəf ünvanı|Destination address
İstifadəçi agenti|User agent
Əlaqəli texnikalar|Related techniques
Texnika haqqında|About technique
Texnika məlumatları|Technique details
Texnikanın təsviri|Technique description
Texnikanın əhatəsi|Technique coverage
Texnika seçin|Select a technique
Texnika tapılmadı|Technique not found
Alt-texnika|Sub-technique
Alt-texnikaları göstər|Show sub-techniques
Alt-texnikaları gizlət|Hide sub-techniques
Məlumat paneli|Details panel
Ətraflı baxış|Detailed view
Açılan panel|Expanded panel
Paneli aç|Open panel
Paneli gizlət|Hide panel
Əhatə boşluğu|Coverage gap
Əhatə boşluqları|Coverage gaps
Boşluqların təhlili|Gap analysis
Boşluq tapılmadı|No gaps found
Prioritetləşdirilmiş boşluqlar|Prioritized gaps
Yüksək riskli texnikalar|High-risk techniques
Riskə görə əhatə|Risk-weighted coverage
Riskə görə çəkiləndirilmiş əhatə|Risk-weighted coverage
Ümumi göstəricilər|Overall metrics
Aşkarlama göstəriciləri|Detection metrics
Əhatə göstəriciləri|Coverage metrics
Qrafik|Chart
Diaqram|Chart
Siyahı|List
Cədvəl|Table
Göstərici|Metric
Səviyyə|Level
Say|Count
Miqdar|Quantity
Orta göstərici|Average metric
Təhlükəsizlik hadisəsi|Security event
Təhlükəsizlik hadisələri|Security events
Dəyişiklik uğurla saxlanıldı|Changes saved successfully
Dəyişiklik saxlanılmadı|Changes could not be saved
Yadda saxlanıldı|Saved
Xəbərdarlıq|Warning
Diqqət|Attention
Əməliyyat tamamlandı|Operation completed
Əməliyyat alınmadı|Operation failed
Yenidən yoxlayın|Please check again
Fayl tapılmadı|File not found
Fayl seçilməyib|No file selected
Fayl formatı|File format
Dəstəklənən formatlar|Supported formats
Yüklənən fayl|Uploaded file
Fayl yükləndi|File uploaded
Fayl yüklənmədi|File upload failed
İdxal tamamlandı|Import completed
İdxal uğursuz oldu|Import failed
İxrac tamamlandı|Export completed
İxrac uğursuz oldu|Export failed
Əməliyyat ləğv edildi|Operation cancelled
Daxil edilməyib|Not provided
Daxil edin|Enter
Daxil etməlisiniz|Required
Məcburi sahə|Required field
İstəyə bağlı|Optional
Boş buraxın|Leave blank
Seçim edin|Make a selection
Müddət|Duration
Başlama vaxtı|Start time
Bitmə vaxtı|End time
Yenilənmə vaxtı|Updated at
Yaradılma vaxtı|Created at
Yaradan|Created by
Dəyişdirən|Modified by
Yoxlayan şəxs|Reviewed by
Göstərilən nəticələr|Displayed results
Nəticələr|Results
Əlavə məlumat|Additional information
Məlumat|Information
Kömək|Help
Ayarlar|Settings
Parametrlər|Settings
1 qayda|1 rule
qayda|rule
qaydası yoxdur|rule is missing
Detection qaydası yoxdur|No detection rule
Aşkarlama qaydası yoxdur|No detection rule
Detection qaydası|Detection rule
qayda yoxdur|no rule
risk-çəkili əhatə|risk-weighted coverage
qrup istifadə edir|groups use this technique
qrupu istifadə edir|groups use this technique
istifadə edir|use this technique
Sin gap|No gap
Əhatə dərinliyi (əhatə xəritəsi)|Coverage depth (heatmap)
Əhatə xəritəsi|Heatmap
Aşkarlanma|Detection rate
Aşkarlanma, son|Detection rate, last
aşkarlanma, son|detection rate, last
missed|missed
gözlənilən|expected
Dayandırılıb|Paused
Davam et|Continue
Davam etdir|Resume
Dayandır|Pause
Sintetik|Synthetic
Yalnız qaçırılanlar|Missed events only
Qaçırılanlar|Missed
Qaçırıldı|Missed
Aşkarlandı|Detected
Qismən aşkarlandı|Partially detected
Aşkarlanmadı|Not detected
Sintetik hadisələr. Mənbələr məlumat mərkəzi şəhərləridir, IP-lər sənəd aralığındandır.|Synthetic events. Sources are data-center cities; IP addresses are from documentation-only ranges.
Honeypot hadisələri. Nəticə, həmin hücum bizə qarşı olsaydı cari qaydaların onu aşkarlayıb-aşkarlamayacağını göstərir. IP-nin yeri hücumçunun yeri demək deyil (VPN, proxy).|Honeypot events. Results estimate whether current rules would detect these attacks. IP geolocation does not necessarily indicate the attacker's location (VPNs and proxies).
Çox qrupun istifadə etdiyi texnikalara görə çəkili əhatə. Hadisələr də bu çəki ilə seçilir.|Coverage weighted by techniques used by more groups. Simulated events are sampled using the same weighting.
Hələ qaçırılan hadisə yoxdur.|No missed events yet.
Hələ honeypot hadisəsi yoxdur.|No honeypot events yet.
Honeypot səhifəsindən|From the Honeypot page
sensor qoşun və ya simulyasiya yaradın.|connect a sensor or generate simulated events.
Hadisə gözlənilir|Waiting for events
hadisə, son 24 saat|events, last 24 hours
Canlı|Live
simulyasiya|simulation
Simulyasiya|Simulation
adı göstər|show name
adı gizlət|hide name
Ən təhlükəli boşluqlar|Highest-risk gaps
Ən yüksək riskli boşluqlar|Highest-risk gaps
kor|blind spot
Taktikalar|Tactics
Platformalar|Platforms
Qruplar|Groups
Qrup məlumatı yoxdur|No group information available
ATT&CK qrupu istifadə edir|ATT&CK groups use this technique
Son 24 saatda|In the last 24 hours
Bu texnikanın özünə bağlı qayda yoxdur. Əhatə alt-texnikalardan gəlir.|No rule is linked directly to this technique. Coverage is derived from its sub-techniques.
Bu texnika üçün qayda yoxdur.|No detection rules are associated with this technique.
Bu texnika üçün Windows log mənbəyi göstərmir.|does not list Windows log sources for this technique.
ATT&CK analitiklərinə görə (Windows). Bu mənbələr olmadan aşkarlama mümkün deyil.|Based on ATT&CK analytics for Windows. Detection requires these log sources.
test olunub|tested
test olunmayıb|not tested
log mənbəyi toplanmır|log source not collected
Boşluq, plan və ya log mənbəyi haqqında qeyd|Note about a gap, plan or log source
Qeyd mətni|Note text
Reviewer qayda yarada bilməz|Reviewers cannot create rules
məlumatı|information
məlumat yoxdur|no data
Açıq portlara gələn real skan və hücum cəhdləri burada toplanır. Hər hadisə ATT&CK texnikasına uyğunlaşdırılır və Monitor-da «Honeypot» rejimində xəritədə göstərilir: həmin hücum bizə qarşı olsaydı, mövcud qaydalarımız onu aşkarlayardımı?|Real scans and attack attempts against exposed ports are collected here. Each event is mapped to an ATT&CK technique and displayed on the Monitor map in Honeypot mode. Would our existing detection rules have detected the attack?
Ən çox hədəflənən portlar|Most targeted ports
Ən aktiv mənbələr|Most active sources
Hələ məlumat yoxdur.|No data yet.
Sensor açarı yarat|Generate sensor key
Açarı yenilə|Regenerate key
Açar yaradılmayıb|No key generated
Açar yaradılıb|Key generated
Sensor qoşulub|Sensor connected
Sensor gözlənilir|Waiting for sensor
Qəbul söndürülüb|Event reception paused
Qəbul açıqdır|Receiving events
Söndürüləndə sensor hadisələri qəbul olunmur|When disabled, sensor events are not accepted
Simulyasiya (sınaq üçün)|Simulation (for testing)
Real internet trafiki yoxdursa, platformanı sınamaq üçün sintetik hadisələr yaradın. Onlar «simulyasiya» işarəsi daşıyır və real statistikanı çaşdırmır (filtrlə gizlətmək olar).|If real internet traffic is unavailable, generate synthetic events to test the platform. They are labeled as simulated and kept separate from real statistics; you can hide them using filters.
Ayrı, təcrid olunmuş VM açın (açıq IP). Orada real məlumat, parol və açar olmasın.|Create a separate, isolated VM with a public IP address. Do not store real data, passwords or secrets on it.
VM-in çıxış (egress) trafikini firewall ilə yalnız platformaya və DNS-ə icazə verin.|Use a firewall to restrict outbound traffic from the VM to the platform and DNS only.
Platforma honeypot VM-dən əlçatan olmalıdır (xüsusi şəbəkə və ya WireGuard). Platformanı|The platform must be reachable from the honeypot VM (private network or WireGuard). Run the platform using
ilə işə salın.|to start it.
Agenti yükləyin (honeypot.py) və VM-də işə salın:|Download the agent (honeypot.py) and run it on the VM:
1024-dən aşağı portlar üçün|For ports below 1024,
lazımdır.|is required.
portlar açılandan sonra imtiyazları endirir.|drops privileges after binding ports.
Root olmadan sınaq:|Test without root:
Bütün portlar|All ports
unikal mənbə IP|unique source IPs
real hadisə (cəmi)|real events (total)
sensor onlayn|sensors online
ən çox hədəf|top target
Hələ sensor qoşulmayıb.|No sensor connected yet.
Əvvəl açar yaradın.|Generate a key first.
agenti işə salın.|start the agent.
GeoIP bazası yoxdur: real IP-lər xəritədə göstərilmir (siyahıda və statistikada görünür). Pulsuz DB-IP «IP to City Lite» (mmdb) faylını|GeoIP database missing: real IP addresses cannot be plotted on the map (they still appear in lists and statistics). Place the free DB-IP "IP to City Lite" (MMDB) file at
adı ilə qoyun|as
sonra serveri yenidən başladın.|then restart the server.
yer məlum deyil|location unknown
Hadisə yoxdur|No events
Sensor qoşulandan sonra və ya simulyasiya yaradanda hadisələr burada görünəcək.|Events will appear here after a sensor connects or you generate simulated traffic.
Yeni açar köhnəsini ləğv edəcək, sensoru yenidən qurmaq lazım olacaq. Davam edək?|A new key will revoke the old one and require reconfiguring the sensor. Continue?
Açar yalnız indi göstərilir. Kopyalayıb təhlükəsiz yerdə saxlayın:|The key is shown only once. Copy it and store it securely:
Kopyala|Copy
Yeni sensor açarı yaradıldı|New sensor key generated
simulyasiya hadisəsi yaradıldı|simulated events generated
simulyasiya hadisəsi silindi|simulated events deleted
Simulyasiya hadisələri yarat|Generate simulated events
Simulyasiya hadisələrini sil|Delete simulated events
Quraşdırma|Setup
göstər / gizlət|show / hide
Təsnifat heuristikdir (port və ilk baytlar). Tək bağlantı «skan» sayılır. «Brute force» üçün giriş cəhdi əlaməti (USER, PASS, login) və ya 10 dəqiqədə eyni portda 5 və daha çox bağlantı lazımdır. Parollar sensor tərəfindən gizlədilir, saxlanmır.|Classification is heuristic (port and initial bytes). A single connection counts as a scan. Brute-force classification requires login-attempt indicators (USER, PASS, login) or at least five connections to the same port within ten minutes. Passwords are redacted by the sensor and are not stored.
gündən sonra silinir.|days.
Əlavə et|Add
Göstər|Show
Gizlət|Hide
Yoxla|Review
Mənbələr|Sources
Boşluqlar|Gaps
Yaradıldı|Created
Silindi|Deleted
Yeniləndi|Updated
Əməliyyat uğurludur|Operation successful
Əməliyyat alınmadı|Operation failed
Əhatə yoxdur|No coverage
Mövcud deyil|Unavailable
Yenidən cəhd edin|Try again
Mənbə|Source
Sürət|Speed
Canlı|Live
Bağlantı kəsildi, yenidən cəhd olunur|Connection lost. Reconnecting…
Bağlantı kəsildi|Connection lost
MITRE ATT&CK səhifəsində aç|Open on MITRE ATT&CK
ATT&CK bu texnika üçün Windows log mənbəyi göstərmir.|ATT&CK does not list Windows log sources for this technique.
Üsul:|Method:
kiçik hərf, rəqəm, _ . -|lowercase letters, digits, _ . -
Xəta|Error
Xəta statusu|Error status
bağlı deyil|not linked
Test olunmayıb|Not tested
Qaydaya baxış|Rule details
məs:|e.g.:
yazın və ya siyahıdan seçin|enter or select from the list
ATT&CK analitikalarında|in ATT&CK analytics
Bu mənbəni tələb edən ATT&CK texnikaları|ATT&CK techniques requiring this source
Aşağı|Low
Keçdi|Passed
Bağla|Close
Nümunə qayda|Example rule
Qaydanın qısa təsviri|Brief rule description
ATT&CK-da tapılmayan texnikalar (bağlanmadı):|Techniques not found in ATT&CK (not linked):
heç vaxt|never
san əvvəl|sec ago
dəq əvvəl|min ago
saat əvvəl|hours ago
gün əvvəl|days ago
Bu əməliyyat yalnız admin üçündür|This action is restricted to administrators
Açar kopyalandı|Key copied
Qəbul açıldı|Event reception enabled
Qəbul söndürüldü|Event reception disabled
Seçmə ATT&CK dəsti (tam matris üçün README-yə baxın)|Subset of ATT&CK data (see README for the full matrix)
ATT&CK Enterprise, məlumat|ATT&CK Enterprise, data as of
tarixinə|as of
Sinqapur|Singapore
Tokio|Tokyo
Mumbay|Mumbai
Seul|Seoul
Virginiya|Virginia
Mexiko|Mexico City
Dubay|Dubai
Stokholm|Stockholm
Sidney|Sydney
Hələlik|Not yet
Hazırda|Currently
Təsdiqləmə|Approval
Sınaq|Test
Xəritə|Map
Göstər / gizlət|Show / hide
İstifadə olunub|Used
Qaydası yoxdur|No detection rule
Qayda yoxdur|No detection rule
qaydası yoxdur|no detection rule
Qayda:|Rule:
Qaydalar:|Rules:
Qeyd yoxdur|No notes
Yalnız|Only
Qeyd əlavə et|Add note
Dəyişikliklər|Changes
Səhv|Error
İcazə yoxdur|Permission denied
Uğurla|Successfully
Axtarış nəticələri|Search results
Təhlükə|Threat
Təhdid|Threat
Ən çox|Most
Sıfırla|Reset
Başla|Start
Qayıt|Back
İstifadəçi tapılmadı|User not found
Parol yanlışdır|Incorrect password
Daxil olmaq mümkün olmadı|Could not sign in
son 24 saat|last 24 hours
son 12 hadisə|last 12 events
hadisə (son 24 saat)|events (last 24 hours)
son 24 saatda|in the last 24 hours

Aşkarlandı|Detected
Qaçırıldı|Missed
Qismən|Partial
Qayda yoxdur|No rule
Qayda mövcud deyil|No rule available
Aşkarlama qaydası yoxdur|No detection rule
Detection qaydası yoxdur|No detection rule
Qayda:|Rule:
Sinxronlaşdırılır|Synchronizing
Sinqapur|Singapore
Tokio|Tokyo
Mumbay|Mumbai
Virciniya|Virginia
Mexiko|Mexico City
Seul|Seoul
Stokholm|Stockholm
Dubay|Dubai
Sidney|Sydney
Süni hadisələr|Synthetic events
Sintetik hadisələr|Synthetic events
Sintetik hadisələr. Mənbələr məlumat mərkəzi şəhərləridir, IP-lər sənəd aralığındandır.|Synthetic events. Source locations represent data-center cities, and IP addresses come from documentation ranges.
Davam et|Continue
Dayandırılıb|Paused
Dayandır|Pause
Yalnız qaçırılanlar|Missed events only
Ən yüksək riskli boşluqlar|Highest-risk gaps
Riskə görə çəkiləndirilmiş əhatə|Risk-weighted coverage
risk-çəkili əhatə|risk-weighted coverage
qrup istifadə edir|groups use this technique
qrup istifadə edir.|groups use this technique.
qayda|rule
qaydalar|rules
hadisə|event
hadisələr|events
saniyə əvvəl|seconds ago
san əvvəl|sec ago
dəq əvvəl|min ago
saat əvvəl|hours ago
gün əvvəl|days ago
heç vaxt|never
Hücum kateqoriyaları|Attack categories
Skan|Scan
Veb yoxlama|Web probe
SMB cəhdi|SMB attempt
RDP cəhdi|RDP attempt
Verilənlər bazası|Database
Exploit cəhdi|Exploit attempt
Açıq portlar|Open ports
Hücumlar|Attacks
Sensor açarı|Sensor key
Gözlənilən|Expected
Göstəricilər|Metrics
Əhatə xəritəsi|Coverage map
Əhatə dərinliyi|Coverage depth
Məlumat mərkəzləri|Data centers
Bütün hadisələr|All events
Yoxlama gözləyir|Pending review
43 qayda|43 rules
qayda|rules
qayda əlavə edildi|rules added
mənbə|sources
hadisə|events
texnika|techniques
qrup|groups
saat|hours
cəmi|total
tam|full
qismən|partial
boşluq|gap
kor|blind
toplanır|collected
toplanmır|not collected
Aşkarlandı|Detected
Qaçırıldı|Missed
Aşkarlama yoxdur və səbəb telemetriyadır|Detection unavailable due to missing telemetry
Paneli bağla|Close panel
Qruplar|Groups
ATT&CK qrupu istifadə edir|ATT&CK groups use this technique
Qrup məlumatı yoxdur|No group data
Son 24 saatda|In the last 24 hours
test olunub|tested
test olunmayıb|not tested
log mənbəyi toplanmır|log source not collected
Keyfiyyət|Quality
Üsul|Method
Boşluq, plan və ya log mənbəyi haqqında qeyd|Note about a gap, plan, or log source
Qeyd mətni|Note text
Reviewer qayda yarada bilməz|Reviewers cannot create rules
Qeyd əlavə edildi|Note added
Çıxış edildi|Signed out
İstifadəçi adı və parolu daxil edin|Enter your username and password
Xoş gəlmisiniz|Welcome
İstifadəçi menyusu|User menu
siz|you
kiçik hərf, rəqəm, _ . -|lowercase letters, digits, _ . -
İstifadəçi silindi|User deleted
İstifadəçi əlavə edildi|User added
Serverə qoşulmaq mümkün olmadı. 'python run.py' işləyir?|Cannot connect to server. Is 'python run.py' running?
Xəta|Error
Sessiya bitib. Yenidən daxil olun|Session expired. Sign in again
İdxal et|Import
Qayda adı axtar|Search rule names
Qayda axtar|Search rules
Əhatəyə töhfəsi|Coverage contribution
Log mənbəyi toplanmır|Log source not collected
Yoxlama üçün qeyd (istəyə bağlı)|Review note (optional)
Qaydaya baxış|Rule details
Təsvir yoxdur|No description
Qaydanı redaktə et|Edit rule
T1059.001 yazın və ya siyahıdan seçin|Enter T1059.001 or choose from the list
məs|e.g.
Qayda nəyi aşkar edir və niyə vacibdir?|What does this rule detect and why does it matter?
Yadda saxla|Save
Qaydanı əlavə et|Add rule
texnikasını|technique
mənbəyini|source
Nə baş verdi? Alert nə qədər tez yarandı? Yalançı pozitiv oldumu?|What happened? How quickly was an alert generated? Was there a false positive?
Əminsiniz? Sil|Are you sure? Delete
Qayda yeniləndi|Rule updated
Qayda əlavə edildi|Rule added
Mənbə əlavə et|Add source
Mənbə axtar|Search sources
Görünüş|View
Bu mənbəni tələb edən ATT&CK texnikaları|ATT&CK techniques requiring this source
Mənbəni redaktə et|Edit source
Yeni log mənbəyi|New log source
Yadda saxlanıldı|Saved
Skan|Scan
Veb yoxlama|Web probe
SMB cəhdi|SMB attempt
RDP cəhdi|RDP attempt
Verilənlər bazası|Database
Exploit cəhdi|Exploit attempt
san əvvəl|sec ago
dəq əvvəl|min ago
saat əvvəl|hours ago
gün əvvəl|days ago
Söndürüləndə sensor hadisələri qəbul olunmur|Sensor events are not accepted when disabled
Hadisə sayı|Event count
Hadisə yarat|Generate events
Simulyasiyanı sil|Delete simulation
Qəbul söndürülüb|Receiving disabled
Sensor qoşulub|Sensor connected
Sensor gözlənilir|Waiting for sensor
Açar yaradılmayıb|No key generated
ən çox hədəf|most targeted
Hələ sensor qoşulmayıb|No sensor connected yet
Açar yaradılıb|Key generated
agenti işə salın|start the agent
Əvvəl açar yaradın|Generate a key first
Açarı yenilə|Rotate key
Sensor açarı yarat|Generate sensor key
simulyasiya|simulation
Bu əməliyyat yalnız admin üçündür|This action is restricted to administrators
Yeni açar köhnəsini ləğv edəcək, sensoru yenidən qurmaq lazım olacaq. Davam edək?|A new key will revoke the previous one. You will need to reconfigure the sensor. Continue?
Açar kopyalandı|Key copied
Yeni sensor açarı yaradıldı|New sensor key generated
Qəbul açıldı|Receiving enabled
Qəbul söndürüldü|Receiving disabled
simulyasiya hadisəsi yaradıldı|simulation events generated
simulyasiya hadisəsi silindi|simulation events deleted
Əmr kopyalandı|Command copied
Kopyalamaq alınmadı, əl ilə seçin|Copy failed; select manually
Seçmə ATT&CK dəsti (tam matris üçün README-yə baxın)|Selected ATT&CK dataset (see README for the full matrix)
məlumat|data
tarixinə|as of
Texnika ID və ya ad|Technique ID or name
Texnika axtar|Search techniques
Əhatə filtri|Coverage filter
Xanaları əhatə səviyyəsinə görə rəngləndir: qaydaların sayı və keyfiyyəti nəzərə alınır|Color cells by coverage level, rule count, and quality
Ümumi əhatə|Overall coverage
texnikada aşkarlama var|techniques have detection coverage
Çox qrupun istifadə etdiyi texnikalar daha çox çəkiyə malikdir|Techniques used by more groups have greater weight
Aşkarlama yoxdur və səbəb log mənbəyinin toplanmamasıdır|Detection is unavailable because a log source is not collected
kor texnika|blind techniques
alt-texnika|sub-techniques
Alt-texnikalar|Sub-techniques
Test uğur faizi|Test pass rate
Matris (JSON)|Matrix (JSON)
Matris (CSV)|Matrix (CSV)
Boşluqlar (CSV)|Gaps (CSV)
Texnikalar, qaydalar, log mənbələri və boşluqlar|Techniques, rules, log sources, and gaps
Hər texnika üçün bir sətir|One row per technique
Prioritet sırası ilə|Sorted by priority
Açıq mövzuya keç|Switch to light theme
Tünd mövzuya keç|Switch to dark theme
Monitor yüklənir|Loading monitor
Honeypot yüklənir|Loading honeypot
Matris yüklənir|Loading matrix
Göstəricilər|Metrics
Hadisə axını|Event feed
Sürət|Speed
Son hadisələr|Recent events
qrup istifadə edir|groups use this technique
Hələ qaçırılan hadisə yoxdur.|No missed events yet.
Hələ honeypot hadisəsi yoxdur.|No honeypot events yet.
Hadisə gözlənilir|Waiting for events
hadisə, son 24 saat|events, last 24 hours
gözlənilən|expected
Canlı|Live
Bağlantı kəsildi, yenidən cəhd olunur|Connection lost. Retrying
Davam et|Resume
Dayandır|Pause
Dayandırılıb|Paused
Bağlantı kəsildi|Disconnected
Qoşulur|Connecting
adı göstər|show name
adı gizlət|hide name
Sintetik hadisələr. Mənbələr məlumat mərkəzi şəhərləridir, IP-lər sənəd aralığındandır.|Synthetic events. Sources are data center cities and IP addresses are from documentation ranges.
Honeypot hadisələri. Nəticə, həmin hücum bizə qarşı olsaydı cari qaydaların onu aşkarlayıb-aşkarlamayacağını göstərir. IP-nin yeri hücumçunun yeri demək deyil (VPN, proxy).|Honeypot events. Results estimate whether current rules would detect an equivalent attack. IP location does not necessarily identify the attacker (VPN, proxy).
Qəbul|Receiving
Təsnifat heuristikdir|Classification is heuristic
İstifadəçi adı və ya parol səhvdir|Incorrect username or password
Bu istifadəçi adı artıq mövcuddur|Username already exists
İstifadəçi tapılmadı|User not found
Özünüzü silə bilməzsiniz|You cannot delete your own account
Qayda tapılmadı|Rule not found
Texnika tapılmadı|Technique not found
Qayda artıq yoxlamadadır|Rule is already under review
Yoxlama tapılmadı|Review not found
Bu yoxlama artıq yekunlaşıb|This review is already completed
Öz qaydanızı təsdiqləyə bilməzsiniz|You cannot approve your own rule
Rədd etmə səbəbini yazın|Enter a rejection reason
Naməlum texnika ID|Unknown technique ID
Naməlum log mənbəyi|Unknown log source
Aktivləşdirmə üçün keyfiyyət nəzarətçisinin təsdiqi tələb olunur|Reviewer approval is required for activation
Aktiv qayda dəyişiklikləri üçün admin icazəsi tələb olunur; layihəni draft kimi saxlayın|Administrator permission is required to change active rules; save as draft
Test qeydi tapılmadı|Test record not found
İdxal olunan qayda əvvəl yoxlamadan keçməlidir|Imported rules must be reviewed first
Status draft, active və ya disabled olmalıdır|Status must be draft, active, or disabled
CSV faylında 'name' sütunu olmalıdır|CSV file must contain a 'name' column
Log mənbəyi tapılmadı|Log source not found
Bu log mənbəyi artıq mövcuddur|This log source already exists
Qeyd tapılmadı|Note not found
Sensor açarı səhvdir|Invalid sensor key
Honeypot qəbulu söndürülüb|Honeypot receiving is disabled
Agent faylı tapılmadı|Agent file not found
Bu əməliyyat üçün daxil olmaq lazımdır|Sign in to perform this action
Bu əməliyyat yalnız analitik və admin üçündür|This action is restricted to analysts and administrators
PowerShell kodlaşdırılmış əmr arqumenti ilə başladılıb. Skript məzmununu gizlətmək üçün tez-tez istifadə olunur.|PowerShell started with an encoded command argument, often used to conceal script content.
Security jurnalı təmizlənib (Event ID 1102). İzləri silmək cəhdi ola bilər.|The Security event log was cleared (Event ID 1102), potentially to erase traces.
Qeyri-standart proses lsass.exe yaddaşına giriş istəyir. Kredensial dump əlaməti ola bilər.|An unusual process accessed lsass.exe memory, possibly indicating credential dumping.
Yeni lokal istifadəçi hesabı yaradılıb (Event ID 4720).|A new local user account was created (Event ID 4720).
schtasks.exe ilə yeni planlı tapşırıq yaradılıb.|A new scheduled task was created with schtasks.exe.
Bir ünvandan qısa müddətdə çox sayda müxtəlif hesaba uğursuz giriş cəhdi.|Many failed logins against different accounts from one address in a short time.
Office tətbiqi rundll32.exe prosesini işə salıb.|An Office application launched rundll32.exe.
Xidmət şübhəli yoldan və ya əmr sətrindən quraşdırılıb (Event ID 7045).|A service was installed from a suspicious path or command line (Event ID 7045).
Xarici IP ünvanından RDP ilə giriş (LogonType 10).|RDP sign-in from an external IP address (LogonType 10).
IIS işçi prosesi əmr xətti və ya PowerShell işə salıb. Web shell əlaməti ola bilər.|An IIS worker process launched a command shell or PowerShell, possibly indicating a web shell.
vssadmin ilə kölgə nüsxələrinin silinməsi. Şifrələyici zərərverici proqramlarda geniş yayılıb.|Shadow copies were deleted using vssadmin, a common ransomware behavior.
Dinamik DNS provayderlərinə aid domenlərə sorğu.|DNS queries to domains belonging to dynamic DNS providers.
NewCredentials tipli NTLM girişi. Pass-the-Hash üçün xarakterik nümunə.|NTLM sign-in using NewCredentials, a pattern associated with Pass-the-Hash.
Run və RunOnce reyestr açarlarına yeni dəyər yazılıb.|A new value was written to the Run or RunOnce registry keys.
RC4 şifrələməsi ilə Kerberos xidmət bileti sorğusu (Event ID 4769).|Kerberos service ticket request using RC4 encryption (Event ID 4769).
Defender-in real-time qorunması söndürülüb (Event ID 5001).|Microsoft Defender real-time protection was disabled (Event ID 5001).
certutil.exe ilə uzaq fayl yüklənməsi.|Remote file download using certutil.exe.
comsvcs.dll vasitəsilə LSASS yaddaş dump-ı.|LSASS memory dump using comsvcs.dll.
Əvvəl görünməyən ölkədən giriş.|Sign-in from a previously unseen country.
wmic /node ilə uzaq hostda proses yaradılması.|Remote process creation using wmic /node.
mshta.exe ilə http/vbscript/javascript icrası.|HTTP, VBScript, or JavaScript execution through mshta.exe.
bitsadmin /transfer ilə fayl yüklənməsi.|File download using bitsadmin /transfer.
Event 4732: istifadəçi Administrators qrupuna əlavə edildi.|Event 4732: a user was added to the Administrators group.
Event 5140: C$, ADMIN$ paylaşımına uzaq giriş.|Event 5140: remote access to the C$ or ADMIN$ share.
Event 4662: DC olmayan hesabdan replikasiya hüququ ilə sorğu.|Event 4662: replication-rights request from a non-domain-controller account.
ntdsutil ifc / activate instance ntds ilə NTDS.dit kopyalanması.|NTDS.dit copied using ntdsutil ifc / activate instance ntds.
Sysmon EID 19/20/21: WMI filter, consumer və binding yaradılması.|Sysmon EID 19/20/21: WMI filter, consumer, or binding creation.
Sysmon EID 8: başqa prosesə CreateRemoteThread.|Sysmon EID 8: CreateRemoteThread targeting another process.
svchost.exe services.exe-dən başqa valideynlə başlayıb.|svchost.exe started with a parent other than services.exe.
net user /domain və net group komandaları.|net user /domain and net group commands.
rar/7z ilə parolla arxivləmə (məlumatın toplanması).|Password-protected archiving with rar/7z (data collection).
whoami /all komandası.|Execution of whoami /all.
net view və net share komandaları.|Execution of net view and net share.
İmzasız DLL istifadəçi qovluğundan yüklənir (Sysmon EID 7).|Unsigned DLL loaded from a user directory (Sysmon EID 7).
cmd.exe Office, wscript və ya mshta prosesindən başladılıb.|cmd.exe launched by Office, wscript, or mshta.
Qısa müddətdə systeminfo, tasklist və ipconfig işlədilir.|systeminfo, tasklist, and ipconfig executed in quick succession.
net view /domain və ping dövrəsi ilə hostların tapılması.|Host discovery using net view /domain and repeated ping.
reg add ilə Run və Services açarlarının dəyişdirilməsi.|Run and Services registry keys modified using reg add.
Event 4624: iş saatlarından kənar interaktiv giriş.|Event 4624: interactive sign-in outside working hours.
certutil -decode ilə faylın açılması.|File decoding using certutil -decode.
Sysmon EID 23: log qovluqlarında fayl silinməsi.|Sysmon EID 23: file deletion in log directories.
ATT&CK analitikalarında istifadə olunan log mənbəyi.|Log source used by ATT&CK analytics.
IIS veb server giriş jurnalı.|IIS web server access logs.
Şəbəkə sensorunun axın və protokol qeydləri (SMB, DNS, HTTP).|Network sensor flow and protocol logs (SMB, DNS, HTTP).
Tətbiq jurnalı.|Application event log.
PowerShell Script Block (4104) və modul jurnalı.|PowerShell Script Block (4104) and module logs.
Windows Security jurnalı: giriş, hesab dəyişikliyi, Kerberos, audit hadisələri.|Windows Security log: sign-ins, account changes, Kerberos, and audit events.
Proses yaradılması, şəbəkə bağlantısı, registry, fayl, modul və LSASS girişi hadisələri.|Process creation, network connections, registry, file, module, and LSASS access events.
Servis quraşdırılması, sürücü və sistem hadisələri.|Service installation, driver, and system events.
Task Scheduler əməliyyat jurnalı.|Task Scheduler operational log.
WMI-Activity jurnalı: WMI abunəlikləri və uzaq çağırışlar.|WMI-Activity log: WMI subscriptions and remote calls.
Microsoft Defender antivirus hadisələri.|Microsoft Defender antivirus events.
Entra ID (Azure AD) giriş jurnalı.|Entra ID (Azure AD) sign-in logs.
DNS sorğu jurnalı.|DNS query log.
powershell -enc ilə əmr işlədildi, 2 saniyə ərzində alert yarandı. Kodlaşdırılmamış əmrdə alert yoxdur.|An encoded PowerShell command triggered an alert within two seconds; an unencoded command did not.
Event 1102 göründü, alert yarandı. Adi admin girişində alert yoxdur.|Event 1102 triggered an alert; routine administrator activity did not.
Sysmon EID 10 alert verdi. Defender özü LSASS-a girəndə istisna işlədi.|Sysmon EID 10 triggered an alert; Defender's legitimate LSASS access was excluded.
Alert yarandı. Planlı yedəkləmə tapşırığı üçün istisna siyahısı lazımdır.|An alert fired; scheduled backup tasks require an exclusion.
10 dəqiqədə 20 uğursuz giriş: alert yarandı. 3 səhv parol ilə adi istifadəçi alert vermədi.|Twenty failed sign-ins in ten minutes triggered an alert; three ordinary failed passwords did not.
Alert yarandı, lakin təmiz Word açılışında da yalançı pozitiv oldu. Filtr dəqiqləşdirilməlidir.|An alert fired, but opening a clean Word document also caused a false positive; the filter needs refinement.
Event 4624 type 10 alert verdi. Daxili şəbəkə IP-sində alert yoxdur.|Event 4624 type 10 triggered an alert; internal network IPs did not.
Alert dərhal yarandı. Yedək proqramının əməliyyatı istisna olundu.|An alert fired immediately; backup software activity was excluded.
Event 4624 (NTLM, LogonType 9) üzrə alert yarandı.|An alert fired for Event 4624 (NTLM, LogonType 9).
Sysmon EID 13 alert verdi. Proqram quraşdırıcılarından gələn yazı istisna olundu.|Sysmon EID 13 triggered an alert; installer changes were excluded.
Event 4769 (RC4) üzrə alert. AES şifrələməsi ilə sorğu alert vermədi.|An alert fired for Event 4769 (RC4); AES-encrypted requests did not.
Sysmon EID 1 üzrə alert yarandı.|An alert fired for Sysmon EID 1.
Komanda sətri üzrə alert yarandı, eyni zamanda LSASS qaydası da işlədi.|A command-line alert fired, and the LSASS detection rule also triggered.
Alert yarandı. Yerli wmic sorğusunda alert yoxdur.|An alert fired; local wmic queries did not.
Alert yarandı.|An alert fired.
Alert yarandı. Adi regsvr32 qeydiyyatında alert yoxdur.|An alert fired; ordinary regsvr32 registration did not.
Event 4732 üzrə alert yarandı.|An alert fired for Event 4732.
Event 5140 üzrə alert. Backup serverindən gələn giriş istisna olundu.|An alert fired for Event 5140; backup server access was excluded.
Event 4662 üzrə kritik alert. DC hesabları ilə alert yoxdur.|A critical alert fired for Event 4662; domain controller accounts were excluded.
Alert yarandı. Normal servis başlanğıcında alert yoxdur.|An alert fired; normal service startup did not.
Alert yarandı, lakin yüksək səs-küy var, səviyyə low saxlanıldı.|An alert fired but produced too much noise, so the severity remained low.
Alert yarandı. Makrosuz Word açılışında alert yoxdur.|An alert fired; opening Word without macros did not.
10 saniyədə 4 komanda: alert yarandı.|Four commands in ten seconds triggered an alert.
Event 4624 üzrə alert. İş saatı daxilində alert yoxdur.|An alert fired for Event 4624; sign-ins during working hours did not.
Office makro simulyasiyası|Office macro simulation
Xarici IP-dən RDP (lab)|RDP from an external IP (lab)
svchost.exe adlı surət cmd.exe-dən işə salındı|A copy named svchost.exe was launched from cmd.exe
Office makrosu ilə cmd.exe (lab)|cmd.exe launched by an Office macro (lab)
systeminfo & tasklist & ipconfig ardıcıl|systeminfo, tasklist, and ipconfig in sequence
Gecə 02:00 RDP girişi (lab)|RDP sign-in at 02:00 (lab)
Fişinq e-poçtları üçün aşkarlama yoxdur. E-poçt gateway loglarını SIEM-ə qoşmaq lazımdır.|No phishing email detection. Connect email gateway logs to the SIEM.
Veb tətbiq WAF logları hələ toplanmır.|Web application WAF logs are not yet collected.
SMB/WinRM üçün qayda yazılmalıdır, RDP artıq örtülüb.|An SMB/WinRM detection rule is needed; RDP is already covered.
Fayl şifrələmə (ransomware) davranışı üçün qayda yoxdur. Kütləvi fayl dəyişikliyi üzrə qayda lazımdır.|No rule covers ransomware-style file encryption. A rule for bulk file changes is needed.
Eksfiltrasiya üçün şəbəkə axın qeydləri toplanmır.|Network flow logs for exfiltration detection are not collected.
Brauzer parollarının oğurlanması üçün aşkarlama yoxdur.|No detection for browser password theft.
`.trim().split('\n').filter(s => s.includes('|')).map(s => s.split('|'));

const azToEn = new Map(entries);
for (const item of Object.values(catalog)) if (item.az && item.en) azToEn.set(item.az, item.en);
const extraPairs = [
  ["Yohannesburq", "Johannesburg"], ["Sinqapur", "Singapore"], ["Tokio", "Tokyo"], ["Sidney", "Sydney"],
  ["Lazım olan log mənbəyi toplanmır:", "Required log source not collected:"],
  ["Qayda var, amma log mənbəyi toplanmır:", "A rule exists, but its log source is not collected:"],
  ["Qayda var, amma aktiv və test olunmuş deyil", "A rule exists but is not active and tested"],
  ["Bütün qaydalar söndürülüb", "All rules are disabled"],
  ["Aşkarlama qaydası yoxdur", "No detection rule"],
  ["Lazım olan log source not collected:", "Required log source not collected:"],
  ["Lazim olan log source not collected:", "Required log source not collected:"],
  ["Test olunub", "Tested"], ["Kor qayda", "Blind rule"], ["Test uğur faizi", "Test pass rate"]
];
for (const [az, en] of extraPairs) azToEn.set(az, en);
const enToAz = new Map();
for (const [az, en] of azToEn) if (!enToAz.has(en)) enToAz.set(en, az);
enToAz.set('Heatmap', 'Əhatə xəritəsi');
enToAz.set('Coverage depth (heatmap)', 'Əhatə dərinliyi (əhatə xəritəsi)');
enToAz.set('Live monitor', 'Canlı monitorinq');
enToAz.set('Detection rules', 'Aşkarlama qaydaları');
enToAz.set('Gap analysis', 'Əhatə boşluqlarının təhlili');
enToAz.set('Dashboard', 'İdarə paneli');
enToAz.set('Review', 'Yoxlama');
enToAz.set('Pending', 'Gözləmədə');
const originalText = new WeakMap();
const originalAttrs = new WeakMap();
let current = 'az';
let observer;
let scheduled = false;

const azPhrases = [...azToEn.entries()].filter(([a]) => a.length >= 4).sort((a,b) => b[0].length-a[0].length);
const enPhrases = [...enToAz.entries()].filter(([a]) => a.length >= 4).sort((a,b) => b[0].length-a[0].length);
const protect = /^(?:T\d{4}(?:\.\d{3})?|[A-Z0-9_-]{12,}|\d+(?:[./:%-]\d+)*|https?:\/\/\S+)$/;

function translate(value, lang) {
  const trimmed = value.trim();
  if (!trimmed || protect.test(trimmed)) return value;
  const lookup = lang === 'en' ? azToEn : enToAz;
  const exact = lookup.get(trimmed);
  if (exact) return value.replace(trimmed, exact);
  const phrases = lang === 'en' ? azPhrases : enPhrases;
  const matches = [];
  for (const [from, to] of phrases) {
    let pos = 0;
    while ((pos = trimmed.indexOf(from, pos)) !== -1) {
      const before = trimmed[pos-1] || '';
      const after = trimmed[pos+from.length] || '';
      const word = /[\p{L}\p{N}_]/u;
      if (!word.test(before) && !word.test(after) && !matches.some(([a,b]) => pos < b && pos+from.length > a)) matches.push([pos,pos+from.length,to]);
      pos += from.length;
    }
  }
  if (!matches.length) return value;
  let result = trimmed;
  for (const [a,b,to] of matches.sort((x,y)=>y[0]-x[0])) result = result.slice(0,a)+to+result.slice(b);
  return value.replace(trimmed,result);
}

function translateNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.parentElement?.closest('script,style,code,pre,[data-no-translate],.brand-name,[contenteditable],.tid,.mono')) return;
    const saved = originalText.get(node);
    const source = saved ?? node.nodeValue;
    const target = translate(source, current);
    if (node.nodeValue !== target) node.nodeValue = target;
    if (!saved) originalText.set(node, source);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  if (node.matches('script,style,code,pre,[data-no-translate]')) return;
  for (const attr of ['placeholder', 'title', 'aria-label', 'alt', 'data-tooltip']) {
    if (!node.hasAttribute(attr)) continue;
    let originals = originalAttrs.get(node);
    if (!originals) { originals = {}; originalAttrs.set(node, originals); }
    if (!(attr in originals)) originals[attr] = node.getAttribute(attr);
    const target = translate(originals[attr], current);
    if (node.getAttribute(attr) !== target) node.setAttribute(attr, target);
  }
  if (node.matches('input[type=button],input[type=submit],input[type=reset]')) {
    let originals = originalAttrs.get(node);
    if (!originals) { originals = {}; originalAttrs.set(node, originals); }
    if (!('value' in originals)) originals.value = node.value;
    node.value = translate(originals.value, current);
  }
  for (const child of node.childNodes) translateNode(child);
}

function paint() {
  if (observer) observer.disconnect();
  translateNode(document.body);
  if (observer) observer.observe(document.body, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label', 'alt', 'data-tooltip']});
}

function queuePaint() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => { scheduled = false; paint(); });
}

export function getLanguage() { return current; }
export function t(key, params = {}) {
  const item = catalog[key];
  if (!item) { console.warn("Missing i18n key:", key); return key; }
  return String(item[current] ?? item.en ?? key).replace(/\{([a-zA-Z0-9_]+)\}/g, (all, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : all);
}

export function translateText(value, lang = current) { return translate(String(value), lang); }

export function setLanguage(lang) {
  current = lang === 'en' ? 'en' : 'az';
  document.documentElement.lang = current;
  document.documentElement.dataset.lang = current;
  try { localStorage.setItem('ibt-lang', current); } catch {}
  document.querySelectorAll('[data-lang-option]').forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.dataset.langOption === current));
  });
  queuePaint();
  window.dispatchEvent(new CustomEvent("ibt:languagechange", { detail: { lang: current } }));
}

export function initLanguage() {
  const nativeAlert = window.alert.bind(window);
  const nativeConfirm = window.confirm.bind(window);
  const nativePrompt = window.prompt.bind(window);
  window.alert = message => nativeAlert(translate(String(message), current));
  window.confirm = message => nativeConfirm(translate(String(message), current));
  window.prompt = (message, defaultValue = '') => nativePrompt(translate(String(message), current), defaultValue);
  try { current = localStorage.getItem('ibt-lang') === 'en' ? 'en' : 'az'; } catch { current = 'az'; }
  document.querySelectorAll('[data-lang-option]').forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.langOption)));
  observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === "characterData") originalText.delete(record.target);
      if (record.type === "attributes") originalAttrs.delete(record.target);
    }
    queuePaint();
  });
  const switcher = document.querySelector('.language-switch');
  if (switcher) {
    switcher.addEventListener('pointermove', event => {
      const bounds = switcher.getBoundingClientRect();
      switcher.style.setProperty('--lx', `${event.clientX - bounds.left}px`);
      switcher.style.setProperty('--ly', `${event.clientY - bounds.top}px`);
    }, {passive:true});
  }
  setLanguage(current);
}
