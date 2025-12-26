# ReelBerlin Demo

A demo website for testing the [ReelBerlin Website Promo API](https://github.com/yogami/InstagramReelPoster).

## Features

- **Landing Page** (`/`) - UI to submit website URLs for promo reel generation
- **Demo Cafe** (`/cafe/`) - Scrapable cafe website for testing
- **Demo Gym** (`/gym/`) - Scrapable gym website for testing
- **Demo Restaurant** (`/restaurant/`) - Scrapable restaurant website for testing

## Setup

### 1. Configure API Endpoint

Edit `app.js` and update the `API_BASE_URL`:

```javascript
const API_BASE_URL = 'https://your-api.railway.app';
```

### 2. Deploy to Railway

1. Connect this repo to Railway
2. Railway will auto-detect the Dockerfile
3. Deploy - no additional config needed

### 3. Update CORS (if needed)

In your InstagramReelPoster API, ensure CORS allows requests from your demo domain.

## Local Development

```bash
# Start local server
npx serve .

# Or with Python
python -m http.server 8080
```

## Architecture

```
[ReelBerlin Demo - This Site]
       │
       │ User enters: https://demo.example.com/cafe
       │ Clicks "Generate Reel"
       ▼
[InstagramReelPoster API]
       │
       │ 1. Scrapes the cafe URL
       │ 2. Detects category: "cafe"
       │ 3. Generates promo script
       │ 4. TTS → Images → Video
       ▼
[Returns video URL to Demo UI]
```

## Demo Sites Content

Each demo site includes:
- Meta tags (title, description, keywords)
- Hero section with H1
- Features/menu section
- Testimonials with star ratings
- CTAs and urgency triggers
- Location and hours

This content is optimized for the WebsiteScraperClient to extract business category and create compelling promo scripts.

## License

MIT
