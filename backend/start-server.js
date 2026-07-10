"use strict";

process.env.NODE_ENV = 'production';

const fs = require('fs');
const path = require('path');

// Load environment-specific environment variables
const rootPath = '/app'; // Docker container volume

// Load env from .env file in container
const envPath = path.join(rootPath, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^(\w+)=(.*)$/);
    if (match) {
      const key = match[1];
      const value = match[2];
      process.env[key] = value;
    }
  });
}

console.log('Loaded env:', Object.keys(process.env).filter(key => key.startsWith('DB_') || key.startsWith('WEBPACK') || key.startsWith('OLLAMA') || key === 'DATABASE_URL'))

const port = process.env.PORT || 8000;
console.log('PORT:', port)

require('./dist/index.js');
