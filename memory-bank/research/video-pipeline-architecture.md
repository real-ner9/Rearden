# Архитектура видео-пайплайна: загрузка, обработка, доставка

Исследование на основе публичных инженерных блогов Instagram, YouTube, TikTok и практических реализаций.

---

## 1. Upload Flow -- что происходит при загрузке видео

### Как это делают большие платформы

**Chunked Upload (загрузка частями)**

Все крупные платформы используют chunked upload. Видео разбивается на части (chunks) по 5-10 MB на клиенте, каждая часть получает индекс и загружается на сервер отдельным HTTP-запросом. Это дает три ключевых преимущества:

- **Resumable** -- если соединение оборвалось, перезагружается только потерянный chunk, а не весь файл
- **Параллельная загрузка** -- несколько chunks загружаются одновременно
- **Раннее начало обработки** -- сервер начинает транскодинг первых chunks, не дожидаясь окончания загрузки

Instagram использует протокол resumable uploads через `rupload.facebook.com`. Клиент инициирует сессию загрузки POST-запросом, получает upload session ID, затем отправляет chunks с этим ID. Если загрузка прерывается, клиент запрашивает сервер "какие chunks уже получены?" и досылает только недостающие.

**Client-side pre-processing**

Instagram и TikTok выполняют предварительную обработку на клиенте перед отправкой:

- Ресайз до максимально допустимого разрешения (1080x1920 для вертикальных Reels)
- Перекодирование в оптимальный кодек (H.264 Baseline для максимальной совместимости)
- Обрезка/тримминг видео по выбранному фрагменту
- Наложение фильтров и эффектов (делается до загрузки, чтобы не тратить серверные ресурсы)

В браузере аналогичная предобработка возможна через **FFmpeg.wasm** -- WebAssembly-порт FFmpeg, который работает в Web Worker и позволяет сжимать/ресайзить видео до отправки на сервер.

**Протокол tus**

Открытый стандарт для resumable uploads поверх HTTP. Поддерживает:
- Создание загрузки с метаданными
- Частичную загрузку с возможностью продолжения
- Проверку целостности через checksum
- Параллельную загрузку chunks (Concatenation extension)
- TTL для незавершенных загрузок

Клиентские библиотеки: **tus-js-client**, **Uppy** (полнофункциональный загрузчик с UI).

### Флоу загрузки (упрощенно)

```
Client                    API Gateway              Upload Service           Object Storage
  |                           |                          |                        |
  |-- POST /upload/init ----->|                          |                        |
  |<-- upload_id, presigned --|                          |                        |
  |                           |                          |                        |
  |-- PUT chunk_0 (5MB) -----|------------------------->|-- store raw ---------> |
  |-- PUT chunk_1 (5MB) -----|------------------------->|-- store raw ---------> |
  |-- PUT chunk_2 (5MB) -----|------------------------->|-- store raw ---------> |
  |                           |                          |                        |
  |-- POST /upload/complete ->|                          |                        |
  |                           |-- enqueue job ---------->| (Message Queue)        |
  |<-- 202 Accepted ----------|                          |                        |
```

**Оптимизация Instagram**: Видео публикуется сразу после готовности **одного** варианта максимального качества, остальные разрешения генерируются в фоне. Это критически снижает время от нажатия "опубликовать" до появления видео в ленте.

---

## 2. Storage -- где хранятся файлы

### Принцип: в БД -- метаданные, в Object Storage -- файлы

Ни одна платформа не хранит видеофайлы в реляционной базе данных. Всегда используется object storage.

**Структура хранения:**

```
bucket/
  raw/                          # Исходные файлы (как загрузил пользователь)
    {video_id}/original.mp4

  processed/                    # Транскодированные версии
    {video_id}/
      1080p/
        master.m3u8             # HLS master playlist
        playlist.m3u8           # Playlist для данного качества
        segment_000.ts          # 6-секундные сегменты
        segment_001.ts
        ...
      720p/
        ...
      480p/
        ...

  thumbnails/
    {video_id}/
      poster.jpg                # Основной thumbnail
      sprite.jpg                # Sprite sheet для seekbar preview
      sprite.vtt                # VTT метаданные позиций в sprite sheet
```

**Тиры хранения по частоте доступа (YouTube/TikTok подход):**

| Тир | Описание | Где хранится |
|-----|----------|-------------|
| Hot | Популярные/свежие видео | CDN edge + Object Storage Standard |
| Warm | Видео со средней активностью | Object Storage Standard |
| Cold | Старые/редко просматриваемые | Object Storage Infrequent Access / Archive |

**Конкретные технологии:**
- YouTube: Google Colossus (внутренняя распределенная ФС)
- Instagram/TikTok: Кастомные решения поверх blob storage
- Стартапы: **AWS S3**, **Cloudflare R2** (нет egress fees), **Google Cloud Storage**, **MinIO** (self-hosted)

**Cloudflare R2 vs S3:**
R2 не берет плату за исходящий трафик (egress). Для видео-платформы, где доставка -- основная статья расходов, это принципиально. S3 берет $0.09/GB за egress.

---

## 3. Transcoding Pipeline -- обработка видео после загрузки

### Архитектура пайплайна

```
Upload Complete Event
        |
        v
  Message Queue (SQS / RabbitMQ / Kafka)
        |
        v
  Transcoding Worker (FFmpeg)
        |
        +-- Extract metadata (ffprobe): resolution, duration, codec, fps
        |
        +-- Determine quality presets (не делать 1080p из 480p исходника)
        |
        +-- Transcode to multiple resolutions:
        |     1080p (5000 kbps video, 192 kbps audio)
        |     720p  (2800 kbps video, 128 kbps audio)
        |     480p  (1400 kbps video, 128 kbps audio)
        |
        +-- Generate HLS segments (.ts files, 6 sec each)
        |
        +-- Generate master.m3u8 playlist
        |
        +-- Generate thumbnails
        |
        +-- Upload results to Object Storage
        |
        +-- Update DB status: "ready"
        |
        +-- Notify CDN to warm cache (optional)
```

### Ключевые решения

**Кодеки:**
- **H.264 (AVC)** -- максимальная совместимость, быстрый encode. Используется как baseline.
- **H.265 (HEVC)** -- на 50% лучше сжатие, но лицензии и не все браузеры поддерживают.
- **VP9** -- open-source альтернатива от Google, YouTube активно использует.
- **AV1** -- будущее. Лучшее сжатие, open-source, но encode очень медленный. YouTube транскодирует в AV1 для популярного контента.

Для MVP/стартапа: **H.264 only**. Поддерживается везде, быстрый encode.

**HLS vs DASH:**
- **HLS** (Apple) -- де-факто стандарт, поддерживается нативно на iOS/Safari, на других платформах через hls.js
- **DASH** -- открытый стандарт, Instagram использует DASH для Android (Exoplayer)
- Для стартапа: **HLS**. Одного формата достаточно, hls.js работает везде.

**Параметры FFmpeg для HLS:**

```bash
ffmpeg -i input.mp4 \
  -codec:v libx264 -profile:v main -level 4.0 \
  -preset medium -crf 23 \
  -codec:a aac -b:a 128k \
  -f hls \
  -hls_time 6 \
  -hls_list_size 0 \
  -hls_segment_type mpegts \
  -hls_flags independent_segments \
  -force_key_frames "expr:gte(t,n_forced*6)" \
  -vf scale=-2:720 \
  output_720p.m3u8
```

Ключевые флаги:
- `-force_key_frames` -- keyframe каждые 6 секунд (совпадает с длиной сегмента)
- `-hls_flags independent_segments` -- каждый сегмент декодируется независимо
- `-preset medium` -- баланс скорости/качества. `fast` для MVP, `slow` для максимального качества

**Оптимизация Instagram (снижение compute на 94%):**

Instagram обнаружил, что два формата (Basic ABR и Progressive) используют один и тот же кодек с минимальными отличиями в profile и preset. Вместо двойного транскодинга из оригинала, они стали **перепаковывать** (repackaging) видео-фреймы из одного формата в другой через MP4Box. Время обработки 23-секундного видео в 720p снизилось с 86 секунд CPU до 0.36 секунд.

**Масштабирование:**

| Подход | Когда использовать |
|--------|-------------------|
| Один сервер + FFmpeg | MVP, < 100 видео/день |
| Docker containers + queue (SQS/RabbitMQ) | 100-10,000 видео/день |
| Kubernetes + auto-scaling worker pods | 10,000+ видео/день |
| AWS ECS/Fargate + SQS | Serverless-подход, платишь за compute |
| AWS Lambda (ограничение 15 мин, 10GB RAM) | Короткие видео < 5 мин |

---

## 4. CDN Delivery -- доставка видео пользователям

### Как это работает

CDN (Content Delivery Network) кеширует видео-сегменты на edge-серверах по всему миру. Когда пользователь запрашивает видео:

1. Клиент получает URL master playlist из API
2. Запрос идет на ближайший CDN edge node
3. Если сегмент есть в кеше -- отдается мгновенно
4. Если нет -- CDN запрашивает origin (S3/R2), кеширует, отдает

**Adaptive Bitrate Streaming (ABR):**

Видео-плеер (hls.js, Exoplayer) автоматически переключается между качествами на основе:
- Текущей пропускной способности сети
- Размера буфера
- Возможностей устройства

Пользователь на 4G смотрит 720p, зашел в Wi-Fi -- плеер бесшовно переключается на 1080p.

**Конкретные CDN:**

| CDN | Особенности | Цена |
|-----|-------------|------|
| Cloudflare (с R2) | Нет egress fees, глобальная сеть | Бесплатный CDN при использовании R2 |
| CloudFront (AWS) | Глубокая интеграция с S3, Lambda@Edge | $0.085/GB первые 10TB |
| Bunny CDN | Дешевый, есть Bunny Stream | $0.01/GB |
| Fastly | Мгновенный purge, программируемый edge | $0.12/GB |

**Для стартапа**: Cloudflare R2 + Cloudflare CDN -- нулевые egress fees и встроенный CDN. Или Bunny CDN как самый бюджетный вариант.

**Cache-Control для видео-сегментов:**

```
# .ts сегменты (иммутабельны, кешировать агрессивно)
Cache-Control: public, max-age=31536000, immutable

# master.m3u8 (может обновляться для live)
Cache-Control: public, max-age=60

# Thumbnails
Cache-Control: public, max-age=86400
```

---

## 5. Thumbnail Generation -- создание превью

### Подходы

**1. Извлечение кадров из видео (базовый)**

```bash
# Один thumbnail из середины видео
ffmpeg -i input.mp4 -ss 00:00:05 -frames:v 1 -q:v 2 thumbnail.jpg

# Thumbnail каждые 10 секунд (для seekbar preview)
ffmpeg -i input.mp4 -vf "fps=1/10,scale=320:-1" thumb_%03d.jpg
```

**2. Sprite sheet для seekbar preview**

Вместо сотен отдельных картинок -- одно большое изображение + VTT-файл с координатами:

```bash
# Генерация sprite sheet (10 кадров в ряд)
ffmpeg -i input.mp4 \
  -vf "fps=1/5,scale=160:-1,tile=10x10" \
  -frames:v 1 \
  sprite.jpg
```

VTT-файл для плеера:
```
WEBVTT

00:00:00.000 --> 00:00:05.000
sprite.jpg#xywh=0,0,160,90

00:00:05.000 --> 00:00:10.000
sprite.jpg#xywh=160,0,160,90
```

**3. AI-powered thumbnail selection (YouTube)**

YouTube генерирует множество кандидатов, затем ML-модель ранжирует их по предсказанному engagement (CTR). Автор также может загрузить свой thumbnail.

**Для стартапа**: Извлечение 1 кадра из середины видео (или с отметки 25% длительности) + sprite sheet для seekbar. Делается в том же transcoding worker, что и основная обработка.

---

## 6. Database -- что хранится в БД

### Принцип: в БД хранятся ТОЛЬКО метаданные, не файлы

**Основная таблица videos:**

```
videos{id, creatorId, status, title, description, duration,
       originalWidth, originalHeight, originalCodec, originalSize,
       storageKey, hlsPlaylistUrl, thumbnailUrl, spriteSheetUrl,
       processingStartedAt, processingCompletedAt,
       createdAt, updatedAt}
```

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Первичный ключ |
| creatorId | UUID | FK на пользователя |
| status | ENUM | `uploading`, `processing`, `ready`, `failed`, `deleted` |
| title | VARCHAR | Заголовок |
| description | TEXT | Описание |
| duration | FLOAT | Длительность в секундах |
| originalWidth | INT | Ширина оригинала |
| originalHeight | INT | Высота оригинала |
| originalCodec | VARCHAR | Кодек оригинала (h264, hevc...) |
| originalSize | BIGINT | Размер оригинала в байтах |
| storageKey | VARCHAR | Ключ в object storage (raw/{id}/original.mp4) |
| hlsPlaylistUrl | VARCHAR | URL master.m3u8 через CDN |
| thumbnailUrl | VARCHAR | URL основного thumbnail |
| spriteSheetUrl | VARCHAR | URL sprite sheet для seekbar |
| processingStartedAt | TIMESTAMP | Начало обработки |
| processingCompletedAt | TIMESTAMP | Окончание обработки |
| createdAt | TIMESTAMP | Дата создания |
| updatedAt | TIMESTAMP | Дата обновления |

**Таблица video_variants (для каждого качества):**

```
video_variants{id, videoId, resolution, width, height,
               bitrate, codec, playlistUrl, segmentCount,
               fileSize, createdAt}
```

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | PK |
| videoId | UUID | FK на videos |
| resolution | VARCHAR | "1080p", "720p", "480p" |
| width | INT | Ширина |
| height | INT | Высота |
| bitrate | INT | Битрейт в kbps |
| codec | VARCHAR | "h264", "vp9" |
| playlistUrl | VARCHAR | URL playlist для данного качества |
| segmentCount | INT | Количество сегментов |
| fileSize | BIGINT | Суммарный размер данного варианта |

**Дополнительно в NoSQL/Redis (для быстрых lookup):**
- Счетчики просмотров, лайков, комментариев
- Кеш метаданных для feed

**Что НЕ хранится в БД:**
- Сами видеофайлы
- HLS-сегменты
- Thumbnail-изображения
- Любые бинарные данные

---

## 7. Упрощенная реализация для стартапов и MVP

### Вариант A: Полностью управляемый сервис (минимум работы)

**Mux или Cloudflare Stream**

```
Client --> Upload API --> Mux/CF Stream API --> (всё делается за тебя)
                                                  - Transcoding
                                                  - HLS generation
                                                  - CDN delivery
                                                  - Thumbnail generation
                                                  - Player SDK
```

**Mux:**
- Upload через direct upload URL или API
- Автоматический транскодинг в несколько качеств
- HLS/DASH out of the box
- Встроенная аналитика (Mux Data) -- quality of experience
- Player SDK (mux-player-react)
- Стоимость: ~$0.015/мин encoding + $0.005/мин storage/мес + delivery
- Плюсы: лучший DX, аналитика, AI-фичи (автокаптионинг)
- Минусы: дороже при масштабе

**Cloudflare Stream:**
- Upload через tus или direct creator upload
- Автоматический транскодинг
- Встроенный CDN Cloudflare (бесплатная доставка)
- Стоимость: $5/1000 мин хранения + $1/1000 мин доставки, encoding бесплатно
- Плюсы: предсказуемая цена, нет egress fees, простой API
- Минусы: меньше аналитики, меньше контроля

**Когда выбирать:**
- Mux -- если нужна видео-аналитика, live streaming, максимальный DX
- Cloudflare Stream -- если бюджет ограничен, нужна простота

### Вариант B: Self-hosted с минимальной инфраструктурой

**Cloudflare R2 + FFmpeg + Workers**

```
Client
  |
  v
API (Hono/Express)
  |-- Upload raw video --> Cloudflare R2 (raw/)
  |-- Enqueue job -------> Queue (BullMQ + Redis / SQS)
  |
  v
Transcoding Worker (Node.js + fluent-ffmpeg)
  |-- Download from R2
  |-- FFmpeg: transcode to 720p, 480p HLS
  |-- FFmpeg: generate thumbnail
  |-- Upload results to R2 (processed/)
  |-- Update DB status = "ready"
  |
  v
Cloudflare CDN (автоматически для R2)
  |
  v
Client (hls.js player)
```

**Стек для MVP:**
- **Storage**: Cloudflare R2 ($0.015/GB/мес, 0 egress)
- **Transcoding**: VPS с FFmpeg (Hetzner 4 vCPU -- ~$7/мес) или AWS Lambda
- **Queue**: BullMQ + Redis (или просто PostgreSQL + pg-boss)
- **CDN**: Cloudflare (бесплатный при использовании R2)
- **Player**: hls.js (open-source, 2KB gzipped)
- **DB**: PostgreSQL (Prisma ORM)

**Примерная стоимость на 1000 видео/мес (3 мин среднее):**

| Компонент | Managed (CF Stream) | Self-hosted (R2 + FFmpeg) |
|-----------|---------------------|--------------------------|
| Хранение | $15 (3000 мин) | $0.45 (30GB raw) |
| Encoding | $0 (включено) | $7 (VPS) |
| Доставка (100K просмотров) | $300 (300K мин) | $0 (R2 egress free) |
| **Итого** | **~$315/мес** | **~$7.45/мес** |

Self-hosted радикально дешевле, но требует разработки и поддержки пайплайна.

### Вариант C: AWS-native

**S3 + MediaConvert + CloudFront**

```
S3 Upload --> S3 Event --> Lambda --> MediaConvert Job
                                          |
                                          v
                                    S3 (processed/) --> CloudFront --> Client
```

- **AWS Elemental MediaConvert**: управляемый транскодинг, $0.024/мин (on-demand)
- **S3**: $0.023/GB хранение + $0.09/GB egress
- **CloudFront**: $0.085/GB доставка
- Плюс: полностью serverless, масштабируется автоматически
- Минус: egress fees складываются, сложнее настройка, vendor lock-in

### Рекомендация для Rearden (видео-платформа для найма)

Учитывая, что Rearden -- платформа с короткими видео-визитками (30-90 секунд), рекомендуемый путь:

**Фаза 1 (MVP):** Cloudflare Stream
- Минимальный код, максимальная скорость запуска
- Direct creator uploads -- клиент загружает напрямую в CF Stream
- Встроенный player или iframe
- В БД хранится только `cloudflareStreamId` и метаданные

**Фаза 2 (рост):** Миграция на R2 + FFmpeg
- Когда объемы вырастут и CF Stream станет дорого
- Полный контроль над качеством и форматами
- Собственный transcoding pipeline

**Фаза 3 (масштаб):** Kubernetes + distributed encoding
- Когда self-hosted worker не справляется
- Auto-scaling на основе очереди
- Multi-region storage и CDN

---

## Источники

- [TikTok System Design -- System Design Handbook](https://www.systemdesignhandbook.com/guides/tiktok-system-design-interview/)
- [Instagram Video Upload Latency Improvements](https://instagram-engineering.com/video-upload-latency-improvements-at-instagram-bcf4b4c5520a)
- [Instagram 94% Video Encoding Reduction -- Meta Engineering](https://engineering.fb.com/2022/11/04/video-engineering/instagram-video-processing-encoding-reduction/)
- [Roll Your Own HLS (Lambda + FFmpeg + R2)](https://yehiaabdelm.com/blog/roll-your-own-hls)
- [YouTube Video Processing Architecture](https://sderay.com/youtube-video-processing-architecture-how-video-goes-from-upload-to-play/)
- [HLS Transcoding Pipeline (AWS S3 + ECS + SQS)](https://github.com/tarunkavi/hls-video-transcoding-pipeline)
- [Video Streaming Pricing Comparison 2026](https://www.buildmvpfast.com/api-costs/video)
- [Mux vs Cloudflare Stream](https://www.mux.com/compare/cloudflare-stream)
- [Cloudflare Stream Pricing](https://developers.cloudflare.com/stream/pricing/)
- [tus -- Resumable Upload Protocol](https://tus.io/)
- [FFmpeg.wasm -- Browser Video Processing](https://ffmpegwasm.netlify.app/docs/overview/)
- [FFmpeg Thumbnail Extraction -- Mux](https://www.mux.com/articles/extract-thumbnails-from-a-video-with-ffmpeg)
- [Cloudflare Stream Alternatives (2026)](https://www.buildmvpfast.com/alternatives/cloudflare-stream)
