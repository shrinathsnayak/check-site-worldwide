# 🌍 Check Site Worldwide

A powerful Next.js application that checks website accessibility from multiple countries using geo-distributed proxies. Built with TypeScript, featuring comprehensive logging, caching, and a modern API design.

[![GitHub](https://img.shields.io/badge/GitHub-kickstart--sh%2Fcheck--site--worldwide-blue)](https://github.com/kickstart-sh/check-site-worldwide)
[![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 🚀 Features

### Core Functionality
- **Multi-Country Website Testing**: Check website accessibility from 12+ countries
- **Geo-Distributed Proxies**: Uses Webshare paid proxies for accurate location-based testing
- **Real-Time Results**: Get instant feedback on website accessibility and response times
- **Comprehensive Logging**: Centralized logging system with configurable levels
- **Smart Caching**: Intelligent caching system for improved performance
- **Rate Limiting**: Built-in rate limiting to prevent abuse

### Technical Features
- **TypeScript**: Fully typed codebase for better development experience
- **Next.js 15**: Latest Next.js with App Router and API Routes
- **SEO Optimized**: Dynamic sitemap, robots.txt, and meta tags
- **Error Handling**: Robust error handling and validation
- **Performance Optimized**: Parallel processing and efficient caching

## 📋 Supported Countries

We support **42 countries** across **6 continents** for comprehensive website accessibility testing.

<details>
<summary><strong>🌍 Europe (25 countries)</strong></summary>

| Country | Code |
|---------|------|
| United Kingdom | GB |
| Germany | DE |
| Spain | ES |
| France | FR |
| Netherlands | NL |
| Italy | IT |
| Switzerland | CH |
| Poland | PL |
| Romania | RO |
| Sweden | SE |
| Denmark | DK |
| Lithuania | LT |
| Hungary | HU |
| Austria | AT |
| Norway | NO |
| Czechia | CZ |
| Serbia | RS |
| Belgium | BE |
| Latvia | LV |
| Cyprus | CY |
| Slovenia | SI |
| Malta | MT |
| Estonia | EE |
| Greece | GR |
| Finland | FI |
| Albania | AL |
| Ukraine | UA |
| Portugal | PT |
| Ireland | IE |
| Bulgaria | BG |

</details>

<details>
<summary><strong>🌎 North America (3 countries)</strong></summary>

| Country | Code |
|---------|------|
| United States | US |
| Canada | CA |
| Mexico | MX |

</details>

<details>
<summary><strong>🌏 Asia (3 countries)</strong></summary>

| Country | Code |
|---------|------|
| Singapore | SG |
| Japan | JP |
| Türkiye | TR |

</details>

<details>
<summary><strong>🌍 South America (3 countries)</strong></summary>

| Country | Code |
|---------|------|
| Brazil | BR |
| Chile | CL |
| Argentina | AR |

</details>

<details>
<summary><strong>🌍 Africa (2 countries)</strong></summary>

| Country | Code |
|---------|------|
| South Africa | ZA |
| Egypt | EG |

</details>

<details>
<summary><strong>🌏 Oceania (1 country)</strong></summary>

| Country | Code |
|---------|------|
| Australia | AU |

</details>

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Webshare API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/kickstart-sh/check-site-worldwide.git
   cd check-site-worldwide
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your Webshare API key:
   ```env
   WEBSHARE_API_KEY=your_webshare_api_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   API_ENDPOINT=http://localhost:3000/api
   ```

4. **Get Webshare API Key**
   - Visit [Webshare Dashboard](https://proxy.webshare.io/dashboard/api/)
   - Create an account and get your API key
   - Add the key to your `.env.local` file

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 API Documentation

### Check Website Accessibility

**Endpoint:** `GET /api/check`

**Parameters:**
- `url` (required): The website URL to check
- `countries` (optional): Comma-separated country codes (default: all countries)
- `timeout` (optional): Request timeout in milliseconds (default: 30000)

**Example Request:**
```bash
curl "http://localhost:3000/api/check?url=https://example.com&countries=US,ES,PL&timeout=30000"
```

**Example Response:**
```json
{
  "success": true,
  "url": "https://example.com",
  "summary": {
    "total": 3,
    "accessible": 3,
    "inaccessible": 0,
    "successRate": 100,
    "avgResponseTime": 2456
  },
  "resultsByRegion": {
    "North America": [
      {
        "country": "US",
        "countryName": "United States",
        "region": "North America",
        "accessible": true,
        "responseTime": 2100,
        "statusCode": 200,
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ],
    "Europe": [
      {
        "country": "ES",
        "countryName": "Spain",
        "region": "Europe",
        "accessible": true,
        "responseTime": 2800,
        "statusCode": 200,
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Get Available Countries

**Endpoint:** `GET /api/countries`

**Example Request:**
```bash
curl "http://localhost:3000/api/countries"
```

**Example Response:**
```json
{
  "success": true,
  "resultsByRegion": {
    "North America": [
      {
        "code": "US",
        "name": "United States",
        "continent": "North America",
        "supported": true
      },
      {
        "code": "CA",
        "name": "Canada",
        "continent": "North America",
        "supported": true
      }
    ],
    "Europe": [
      {
        "code": "GB",
        "name": "United Kingdom",
        "continent": "Europe",
        "supported": true
      }
    ]
  }
}
```

## 🏗️ Project Structure

```
check-site-worldwide/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── check/         # Website accessibility check
│   │   │   └── countries/     # Available countries
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   ├── sitemap.ts         # Dynamic sitemap
│   │   └── robots.ts          # Dynamic robots.txt
│   ├── services/              # Business logic services
│   │   ├── website-checker.ts # Core website checking logic
│   │   ├── paid-proxy-services.ts # Proxy management
│   │   └── webshare-api.ts    # Webshare API integration
│   ├── utils/                 # Utility functions
│   │   ├── logger.ts          # Centralized logging
│   │   ├── response.ts        # API response helpers
│   │   ├── utils.ts           # General utilities
│   │   └── countries.ts       # Country data and helpers
│   ├── cache/                 # Caching system
│   │   └── cache.ts           # Generic cache implementation
│   ├── constants/             # Application constants
│   │   ├── constants.ts       # General constants
│   │   └── metadata.ts        # SEO and metadata
│   ├── types/                 # TypeScript type definitions
│   │   └── types.ts           # All interfaces and types
│   ├── validation/            # Input validation
│   │   ├── validation.ts      # Validation functions
│   │   └── errors.ts          # Error response helpers
│   └── middleware.ts          # Next.js middleware

├── public/                    # Static assets

└── package.json               # Dependencies and scripts
```



## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository**
   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Configure environment variables**
   - Add `WEBSHARE_API_KEY` in Vercel dashboard
   - Set `NEXT_PUBLIC_APP_URL` to your domain

3. **Deploy**
   - Vercel will automatically deploy on push to main branch



## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `WEBSHARE_API_KEY` | Webshare proxy API key | Yes | - |
| `NEXT_PUBLIC_APP_URL` | Application URL | No | `http://localhost:3000` |
| `API_ENDPOINT` | API endpoint URL | No | `http://localhost:3000/api` |

### Logging Configuration

The application uses a centralized logging system with configurable levels:

- **DEBUG**: Detailed debugging information
- **INFO**: General information messages
- **WARN**: Warning messages
- **ERROR**: Error messages
- **FATAL**: Critical errors

### Cache Configuration

- **Proxy Cache TTL**: 1 hour (3600 seconds)
- **Website Check Cache TTL**: 5 minutes (300 seconds)
- **Rate Limit Cache TTL**: 1 minute (60 seconds)

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test your changes** manually
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
7. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Webshare](https://proxy.webshare.io/) - Proxy service provider
- [TypeScript](https://www.typescriptlang.org/) - Type safety


## 📞 Support

If you have any questions or need help:

- **Issues**: [GitHub Issues](https://github.com/kickstart-sh/check-site-worldwide/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kickstart-sh/check-site-worldwide/discussions)

## 🔄 Changelog

### v1.0.0 (Current)
- ✅ Multi-country website accessibility checking
- ✅ Webshare proxy integration
- ✅ Comprehensive logging system
- ✅ Smart caching implementation
- ✅ API rate limiting
- ✅ SEO optimization
- ✅ TypeScript support
- ✅ Next.js 15 with App Router

---

**Made with ❤️ by Shrinath Nayak**

[![GitHub stars](https://img.shields.io/github/stars/kickstart-sh/check-site-worldwide?style=social)](https://github.com/kickstart-sh/check-site-worldwide)
[![GitHub forks](https://img.shields.io/github/forks/kickstart-sh/check-site-worldwide?style=social)](https://github.com/kickstart-sh/check-site-worldwide)
[![GitHub issues](https://img.shields.io/github/issues/kickstart-sh/check-site-worldwide)](https://github.com/kickstart-sh/check-site-worldwide/issues)
