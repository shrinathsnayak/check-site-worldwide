#!/bin/bash

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. .env.local was not modified."
        exit 1
    fi
fi

# Create .env.local with Webshare configuration
cat > .env.local << 'EOF'
# Webshare Proxy Configuration
# Get your API key from: https://proxy.webshare.io/dashboard/api/
WEBSHARE_API_KEY=your_webshare_api_key_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_ENDPOINT=https://your-api-endpoint.com
EOF

echo "✅ .env.local created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Get your Webshare API key from: https://proxy.webshare.io/dashboard/api/"
echo "2. Replace 'your_webshare_api_key_here' with your actual API key"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "🔗 Webshare Dashboard: https://proxy.webshare.io/dashboard/"
echo "📚 Webshare API Docs: https://proxy.webshare.io/docs/" 