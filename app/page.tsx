'use client';

import React, { useState } from 'react';
import { SignedIn, SignedOut, SignUpButton } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  ArrowRight,
  Zap,
  Eye,
  Play,
  Github,
  Sun,
  Moon,
  Box,
  Move3d,
  Palette,
  Calculator,
  Sparkles,
  Code,
  Terminal,
  Workflow
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: Box,
      title: 'Visual Node Editor',
      description: 'Build complex 3D geometries with an intuitive node-based workflow',
      color: 'text-blue-500'
    },
    {
      icon: Zap,
      title: 'Real-time Preview',
      description: 'See your changes instantly with live geometry rendering',
      color: 'text-yellow-500'
    },
    {
      icon: Code,
      title: 'Export Ready',
      description: 'Generate code and assets ready for your 3D applications',
      color: 'text-green-500'
    },
    {
      icon: Workflow,
      title: 'Modular System',
      description: 'Reusable components and templates for faster iteration',
      color: 'text-purple-500'
    }
  ];

  const nodeCategories = [
    { icon: Box, name: 'Geometry', count: 12, color: 'bg-blue-500' },
    { icon: Move3d, name: 'Transform', count: 8, color: 'bg-green-500' },
    { icon: Palette, name: 'Material', count: 6, color: 'bg-purple-500' },
    { icon: Calculator, name: 'Math', count: 15, color: 'bg-orange-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm mb-6">
              <Sparkles className="size-3" />
              Visual geometry creation
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-medium mb-6 leading-tight">
            Build 3D geometry
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              visually
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Create complex 3D models using an intuitive node-based editor. 
            No coding required—just connect, configure, and create.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <SignedOut>
              <SignUpButton 
                mode="modal"
                forceRedirectUrl="/editor"
                signInForceRedirectUrl="/editor"
              >
                <button className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg text-lg transition-all duration-300 transform hover:scale-105">
                  <Play className="size-5" />
                  Start Creating
                  <ArrowRight className="size-5" />
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/editor">
                <button className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg text-lg transition-all duration-300 transform hover:scale-105">
                  <Play className="size-5" />
                  Open Editor
                  <ArrowRight className="size-5" />
                </button>
              </Link>
            </SignedIn>
          </div>

          {/* Demo Video */}
          <div className="relative max-w-5xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <video 
                src="https://r1dlvq8ky7dijhxt.public.blob.vercel-storage.com/assets/demo.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto rounded-2xl"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>


      {/* Stats Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '40+', label: 'Node Types' },
              { value: '∞', label: 'Possibilities' },
              { value: '0ms', label: 'Setup Time' },
              { value: '100%', label: 'Web Native' }
            ].map((stat, index) => (
              <div key={stat.label}>
                <div className="text-3xl font-medium mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <img 
                src="https://r1dlvq8ky7dijhxt.public.blob.vercel-storage.com/assets/logo.webp" 
                alt="Geometry Nodes Logo" 
                className="size-4 rounded"
              />
              <span>Geometry Nodes</span>
              <span>•</span>
              <span>Visual 3D geometry creation</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Built for the modern web</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
