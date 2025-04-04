import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { rootDir } from './utils';


const CERT_DIR: string = path.join(rootDir, 'certs');
const CERT_FILE: string = path.join(CERT_DIR, 'server.cert');
const KEY_FILE: string = path.join(CERT_DIR, 'server.key');

console.log('Generating self-signed certificates for HTTP/2 development server...');

if (!fs.existsSync(CERT_DIR)) {
  fs.mkdirSync(CERT_DIR, { recursive: true });
  console.log(`Created directory: ${CERT_DIR}`);
}

if (fs.existsSync(CERT_FILE) && fs.existsSync(KEY_FILE)) {
  console.log('Certificates already exist. To regenerate, delete the existing certs directory first.');
  process.exit(0);
}

try {
  const openSslCommand: string = `openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -keyout ${KEY_FILE} -out ${CERT_FILE} -days 365`;
  
  console.log('Running OpenSSL command to generate certificates...');
  execSync(openSslCommand, { stdio: 'inherit' });
  
  console.log('\nSuccess! Self-signed certificates generated:');
  console.log(`- Certificate: ${CERT_FILE}`);
  console.log(`- Private Key: ${KEY_FILE}`);
  console.log('\nImportant: These certificates are self-signed and should only be used for development.');
  console.log('Add these certificates to your trusted root certificates to avoid browser warnings.');
  
} catch (error) {
  console.error('Failed to generate certificates:', error instanceof Error ? error.message : error);
  console.error('Make sure OpenSSL is installed on your system.');
  process.exit(1);
} 