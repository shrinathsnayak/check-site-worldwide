# Check Site Worldwide

A Next.js application that checks website accessibility from multiple countries using Webshare proxy services.

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd check-site-worldwide
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your Webshare API credentials
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Check Website Accessibility
```
GET /api/check?url=<website-url>&countries=<country-codes>&timeout=<timeout-ms>
```

**Parameters:**
- `url` (required): The website URL to check
- `countries` (required): Comma-separated list of country codes (e.g., US,ES,PL)
- `timeout` (optional): Request timeout in milliseconds (default: 10000)

**Example:**
```bash
curl "http://localhost:3000/api/check?url=https://google.com&countries=US,ES,PL"
```

### Get Supported Countries
```
GET /api/countries
```

Returns a list of all supported countries with their codes and names.

## Features

- ✅ **Global Testing**: Check website accessibility from multiple countries
- ✅ **Proxy Integration**: Uses Webshare proxy services for accurate results
- ✅ **Real-time Results**: Get response times and status from each country
- ✅ **Caching**: Intelligent caching for improved performance
- ✅ **Rate Limiting**: Built-in rate limiting for API protection
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **TypeScript**: Full TypeScript support for type safety

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Webshare API Configuration
WEBSHARE_API_KEY=your_webshare_api_key
WEBSHARE_API_URL=https://proxy.webshare.io/api/v2/proxy/list/

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_ENDPOINT=https://your-api-domain.com

# Optional: Enable caching in development
ENABLE_CACHE=true
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── check/         # Website checking endpoint
│   │   └── countries/     # Countries list endpoint
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── sitemap.ts         # Dynamic sitemap generation
│   └── robots.ts          # Dynamic robots.txt generation
├── lib/                    # Core library
│   ├── api/               # API-related functionality
│   ├── cache/             # Caching system
│   ├── constants/         # Configuration constants
│   ├── services/          # Core business logic
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── validation/        # Input validation
└── middleware.ts           # Rate limiting and security headers
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Code Organization

The project follows a clean architecture pattern:

- **API Layer**: Handles HTTP requests and responses
- **Service Layer**: Core business logic for website checking
- **Cache Layer**: Intelligent caching for performance
- **Validation Layer**: Input validation and error handling
- **Utils Layer**: Reusable utility functions

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**: Use the Next.js build command
- **Railway**: Deploy directly from GitHub
- **DigitalOcean App Platform**: Supports Next.js out of the box

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API examples

---

**Check Site Worldwide** - Test your website's global accessibility with confidence! 🌍
