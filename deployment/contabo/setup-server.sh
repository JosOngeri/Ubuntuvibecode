#!/bin/bash
# Contabo Server Setup Script for Ubuntu HRMS APK Hosting
# Run this script on your Contabo server via SSH

echo "Setting up Contabo server for Ubuntu HRMS APK hosting..."

# Update system
sudo apt update
sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Create directory for APK hosting
sudo mkdir -p /var/www/ubuntu-hrms/apk
sudo chown -R $USER:$USER /var/www/ubuntu-hrms

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/ubuntu-hrms > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location /apk/ {
        alias /var/www/ubuntu-hrms/apk/;
        autoindex on;
        
        # Force download
        add_header Content-Disposition "attachment";
        add_header Content-Type "application/vnd.android.package-archive";
        
        # Enable CORS
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type";
    }
}
EOF

# Remove default Nginx site if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Enable Ubuntu HRMS site
sudo ln -s /etc/nginx/sites-available/ubuntu-hrms /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✓ Contabo server setup complete!"
echo "APK hosting directory: /var/www/ubuntu-hrms/apk"
echo "Nginx configuration: /etc/nginx/sites-available/ubuntu-hrms"
