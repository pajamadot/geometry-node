'use client';

import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Github, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0 hover:opacity-80 transition-opacity">
          <img 
            src="https://r1dlvq8ky7dijhxt.public.blob.vercel-storage.com/assets/logo.webp" 
            alt="Geometry Nodes Logo" 
            className="size-8 sm:size-10 rounded-xl flex-shrink-0"
          />
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <h1 className="font-medium text-white text-sm sm:text-base truncate">Geometry Nodes</h1>
            <span className="hidden xs:inline-block text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full flex-shrink-0">Beta</span>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <a 
            href="https://github.com/pajamadot/geometry-node" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Github className="size-4" />
            <span>GitHub</span>
          </a>
          
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium rounded-lg transition-all duration-300">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
          
          <SignedIn>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </SignedIn>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          <SignedIn>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </SignedIn>
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-sm border-b border-gray-800">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <a 
              href="https://github.com/pajamadot/geometry-node" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Github className="size-4" />
              <span>GitHub</span>
            </a>
            
            <SignedOut>
              <div className="space-y-2">
                <SignInButton mode="modal">
                  <button 
                    className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-left"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button 
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium rounded-lg transition-all duration-300 text-left"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
          </div>
        </div>
      )}
    </header>
  );
} 