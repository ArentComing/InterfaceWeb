<div align="center">

# 🪞 Liquid Glass Portfolio Card

### Interactive 3D Developer Identity • Cloudflare Edge & KV Telemetry

<p align="center">
  <img src="https://img.shields.io/badge/Interface-Liquid%20Glass-0284c7?style=for-the-badge&logoColor=white" alt="Style" />
  <img src="https://img.shields.io/badge/Backend-Cloudflare%20Workers-f38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Workers" />
  <img src="https://img.shields.io/badge/Deployment-GitHub%20Pages-22c55e?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Pages" />
</p>

<!-- Preview Banner -->

<p align="center">
  <img src="./assets/images/preview.png" alt="Project Preview" width="760" style="border-radius: 14px; box-shadow: 0 20px 45px rgba(0, 0, 0, 0.55);" />
</p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#key-features">Features</a> •
  <a href="#architecture--kv-telemetry">Architecture & KV</a> •
  <a href="#cloudflare-worker-setup">Worker Setup</a> •
  <a href="#telegram-webhook-configuration">Webhook Config</a> •

</p>

---

</div>

## Overview

A responsive, zero-dependency interactive developer card built with pure web standards. The project combines SVG-driven **Liquid Glass** refraction effects, interactive background particle physics, spatial audio synthesis, and a smooth 3D perspective flip between developer profiles (**GitHub**) and community channels (**Telegram**).

Live updates for the Telegram card surface do not rely on brittle client-side scrapers. Instead, the application connects to a serverless **Cloudflare Worker** paired with **Cloudflare Workers KV**, receiving live channel webhooks from Telegram and serving sub-millisecond cached telemetry across global edge points.

---

## Key Features

- **Liquid Glass Distortion:** Implements SVG filter maps (`feTurbulence` and `feDisplacementMap`) to create authentic optical refraction, frosted backdrops, and specular light highlights.
- **Bi-Directional 3D Perspective:** Seamless CSS 3D transform transitions that toggle between personal GitHub profile statistics and live Telegram broadcasts.
- **Push-Based Telegram Pipeline:** Live channel updates (messages, media captions, files, audio) are pushed directly into edge storage via Telegram Bot Webhooks.
- **Cloudflare Workers KV:** Instant state retrieval (`LATEST_FEED`, `MEMBERS_COUNT`) without repeatedly hitting Telegram's rate-limited endpoints.
- **Dynamic Particle Canvas:** Lightweight HTML5 Canvas network reacting smoothly to viewport resizing with near-zero GPU overhead.
- **Zero Heavy Frameworks:** Pure semantic HTML5, modular CSS variables, and native ES6+ JavaScript.

---

## Architecture & KV Telemetry

```
[ Telegram Channel ]
        │  (New Post / Update)
        ▼
[ Telegram Bot Webhook ]
        │  POST request
        ▼
[ Cloudflare Worker ]  ── (PUT) ──► [ Workers KV: TG_KV ]
        ▲                                    │
        │  GET request (CORS Enabled)        │ (GET cached data)
        │                                    ▼
[ Browser Client / Portfolio Card ] ◄────────┘
```

### Why Cloudflare Workers & KV?

1. **Elimination of CORS & Proxy Reliance:** Direct client-side requests to Telegram previews trigger CORS violations, and public proxies face frequent throttling. The Worker acts as an open, secure edge API.
2. **Push Instead of Poll:** Instead of scraping public HTML pages on every visitor request, Telegram fires an automated webhook to the Worker whenever a new post is published.
3. **Edge Caching via KV:** Cleaned text snippets and subscriber counts are stored in Cloudflare's globally distributed key-value store (`TG_KV`). Visitors receive immediate responses served directly from their closest edge node with response times under 50ms.

---

## Cloudflare Worker Setup

### 1. Create KV Namespace

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation, go to **Storage & Databases** ➔ **KV**.
3. Click **Create Namespace**. Name it `TG_KV` and click **Add**.
4. *(Optional initial value)*: Add a key named `MEMBERS_COUNT` with your current channel member count (e.g., `1.2K`).

### 2. Deploy Worker Script

1. Go to **Compute (Workers) > Workers & Pages** ➔ **Create Application** ➔ **Create Worker**.
2. Name your worker (e.g., `telegram-card-worker`) and hit **Deploy**.
3. Select **Edit code** and paste the production worker script:

```javascript
export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Cache-Control": "no-cache"
    };

    // Handle Preflight Requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Telegram Bot Webhook Receiver
    if (request.method === "POST") {
      try {
        const update = await request.json();
        const post = update.channel_post || update.message;

        if (post) {
          let text = "";

          if (post.text) {
            text = post.text;
          } else if (post.caption) {
            text = post.caption;
          } else if (post.video || post.video_note) {
            text = "Video";
          } else if (post.photo) {
            text = "Image";
          } else if (post.audio || post.voice) {
            text = "Audio";
          } else if (post.document) {
            text = post.document.file_name || "File";
          } else {
            text = "New post";
          }

          const formattedFeed = text.replace(/\s+/g, " ").trim().slice(0, 50);

          // Store latest parsed snippet in Cloudflare KV
          await env.TG_KV.put("LATEST_FEED", formattedFeed);
        }

        return new Response("OK", { status: 200 });
      } catch (err) {
        return new Response("Error", { status: 500 });
      }
    }

    // Client GET Request Endpoint
    if (request.method === "GET") {
      try {
        const feed = await env.TG_KV.get("LATEST_FEED") || "Fight or flight updates";
        const members = await env.TG_KV.get("MEMBERS_COUNT") || "1.2K";

        return new Response(JSON.stringify({
          members: members,
          feed: feed
        }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({
          members: "1.2K",
          feed: "Fight or flight updates"
        }), { headers: corsHeaders });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  }
};
```

4. Click **Deploy**.

### 3. Bind the KV Namespace to the Worker

1. In your worker dashboard, open **Settings** ➔ **Variables and Secrets**.
2. Scroll to **KV Namespace Bindings** and click **Add binding**.
3. Set **Variable name** to `TG_KV` (this must match the identifier inside `env.TG_KV`).
4. Select the `TG_KV` namespace created earlier from the dropdown.
5. Click **Deploy** to apply the binding.

---

## Telegram Webhook Configuration

To receive posts instantly in your worker:

1. Create a bot using [@BotFather](https://t.me/BotFather) and copy your `BOT_TOKEN`.
2. Add your bot as an **Administrator** in your Telegram channel with channel message read permissions.
3. Open your browser or terminal and bind your Worker URL as the bot's webhook:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-worker-name.workers.dev"}'
```

Whenever a message or file is sent in the channel, Telegram automatically POSTs the update to your Worker, updating `LATEST_FEED` in KV in real time.

---

```text
.
├── assets/
│   └── images/
│       ├── bg.jpg          # High-resolution glass backdrop
│       ├── profile.jpg     # Front card avatar (GitHub)
│       ├── channel.jpg     # Back card avatar (Telegram)
│       └── preview.png     # Showcase graphic for README
├── index.html              # Structural layout & SVG distortion filters
├── style.css               # Glassmorphism, 3D flip card keyframes
├── script.js               # Client fetch logic, canvas particles, audio
└── README.md               # Repository documentation
```

---

## License

Distributed under the [MIT License](LICENSE).

<div align="center">

Created by [AmirAli Farhadi](https://github.com/ArentComing)

</div>