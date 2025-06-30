#!/bin/bash

# SSL Certificate Generation Script for Development
# This script generates self-signed SSL certificates for local development

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="$SCRIPT_DIR/../nginx/ssl"

echo "🔐 Generating SSL certificates for development..."

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Generate private key
echo "🔑 Generating private key..."
openssl genrsa -out "$SSL_DIR/key.pem" 2048

# Generate certificate signing request
echo "📝 Generating certificate signing request..."
openssl req -new -key "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.csr" -subj "/C=US/ST=State/L=City/O=Ignitabull/OU=Dev/CN=localhost/emailAddress=dev@ignitabull.local"

# Generate self-signed certificate
echo "📜 Generating self-signed certificate..."
openssl x509 -req -days 365 -in "$SSL_DIR/cert.csr" -signkey "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem" -extensions v3_req -extfile <(cat <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = State
L = City
O = Ignitabull
OU = Development
CN = localhost
emailAddress = dev@ignitabull.local

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.ignitabull.local
DNS.3 = app.ignitabull.local
DNS.4 = api.ignitabull.local
DNS.5 = marketing.ignitabull.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
)

# Set appropriate permissions
chmod 600 "$SSL_DIR/key.pem"
chmod 644 "$SSL_DIR/cert.pem"

# Clean up CSR
rm "$SSL_DIR/cert.csr"

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificates location: $SSL_DIR"
echo ""
echo "📋 To trust these certificates in your browser:"
echo "   1. Chrome/Safari: Add cert.pem to System Keychain (macOS) or Certificate Store (Windows)"
echo "   2. Firefox: Go to Settings > Privacy & Security > Certificates > View Certificates > Import"
echo ""
echo "🚀 You can now start Docker Compose with SSL support:"
echo "   docker-compose up -d"
echo ""
echo "🌐 Access your applications via HTTPS:"
echo "   - Marketing: https://marketing.ignitabull.local"
echo "   - Web App: https://app.ignitabull.local"
echo "   - API: https://api.ignitabull.local"
echo ""
echo "⚠️  Note: Add these domains to your /etc/hosts file:"
echo "   127.0.0.1 marketing.ignitabull.local"
echo "   127.0.0.1 app.ignitabull.local"
echo "   127.0.0.1 api.ignitabull.local"