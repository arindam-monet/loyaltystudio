#!/bin/bash

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "This script is only for macOS"
    exit 1
fi

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo"
    exit 1
fi

# Add entries to /etc/hosts
echo "Adding entries to /etc/hosts..."
echo "127.0.0.1 api.loyaltystudio.local" >> /etc/hosts
echo "127.0.0.1 admin.loyaltystudio.local" >> /etc/hosts
echo "127.0.0.1 merchant.loyaltystudio.local" >> /etc/hosts

# Flush DNS cache
echo "Flushing DNS cache..."
dscacheutil -flushcache; killall -HUP mDNSResponder

echo "Local DNS setup complete!"
echo "You can now access:"
echo "- API: http://api.loyaltystudio.local:3001"
echo "- Admin: http://admin.loyaltystudio.local:3000"
echo "- Merchant: http://merchant.loyaltystudio.local:3000" 