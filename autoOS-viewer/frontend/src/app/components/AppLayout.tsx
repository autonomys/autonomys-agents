'use client'

import Image from "next/image";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="navbar">
        <div className="container">
          <Link href="/" className="logo">
            [Agent Package Registry]
          </Link>
          <div className="network-container">
            <div className="network">
              <div className="network-tag">{'<network>'}</div>
              <div className="network-name">AUTONOMYS</div>
              <div className="network-tag">{'</network>'}</div>
            </div>
            <Image
              src="/autonomys-logo.png"
              alt="Autonomys Logo"
              width={40}
              height={40}
              className="network-logo"
            />
          </div>
        </div>
      </header>
      <main className="container">
        {children}
      </main>
      <footer className="footer">
        <div className="container">
          <div className="footer-links">
            <a href="https://www.autonomys.xyz/" target="_blank" rel="noopener noreferrer">
              Website
            </a>
            <span>•</span>
            <a href="https://github.com/autonomys/autonomys-agents" target="_blank" rel="noopener noreferrer">
              Documentation
            </a>
            <span>•</span>
            <a href="https://github.com/autonomys" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
          <div className="copyright">
            © {new Date().getFullYear()} Autonomys Network
          </div>
        </div>
      </footer>
    </>
  );
} 