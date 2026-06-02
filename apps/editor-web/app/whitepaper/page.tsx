'use client';

import React, { useCallback } from 'react';
import { 
  ArrowLeft, 
  Download,
  Code,
  Sparkles,
  Globe,
  Box,
  Users,
  Zap,
  Target,
  BookOpen,
  FileText,
  ExternalLink,
  RotateCcw,
  Brain,
  TrendingUp,
  CheckCircle,
  Activity
} from 'lucide-react';
import Link from 'next/link';


// Evolution Cycle Flow Component using Mermaid
const EvolutionCycleFlow = () => {
  return (
    <div className="w-full bg-gradient-to-br from-gray-900/80 to-gray-800/60 rounded-2xl border border-gray-600/50 overflow-hidden backdrop-blur-sm p-8">
      <div className="flex justify-center">
        <svg
          width="600"
          height="400"
          viewBox="0 0 600 400"
          className="text-white"
        >
                     {/* Background circle */}
           <circle
             cx="300"
             cy="200"
             r="210"
             fill="none"
             stroke="rgba(75, 85, 99, 0.3)"
             strokeWidth="2"
             strokeDasharray="5,5"
           />
          
                     {/* Define nodes in hexagon layout */}
           {/* User Creation - Top */}
           <g transform="translate(300,60)">
             <rect x="-80" y="-40" width="160" height="80" rx="16" fill="#1e40af" stroke="#3b82f6" strokeWidth="3"/>
             <text x="0" y="-8" textAnchor="middle" className="fill-white text-base font-bold">User Creation</text>
             <text x="0" y="18" textAnchor="middle" className="fill-gray-200 text-sm">Nodes & Scenes</text>
           </g>
           
           {/* Data Collection - Top-right */}
           <g transform="translate(500,120)">
             <rect x="-80" y="-40" width="160" height="80" rx="16" fill="#16a34a" stroke="#22c55e" strokeWidth="3"/>
             <text x="0" y="-8" textAnchor="middle" className="fill-white text-base font-bold">Data Collection</text>
             <text x="0" y="18" textAnchor="middle" className="fill-gray-200 text-sm">Track usage patterns</text>
           </g>
           
           {/* AI Analysis - Bottom-right */}
           <g transform="translate(500,280)">
             <rect x="-80" y="-40" width="160" height="80" rx="16" fill="#7c3aed" stroke="#a855f7" strokeWidth="3"/>
             <text x="0" y="-8" textAnchor="middle" className="fill-white text-base font-bold">Agent Analysis</text>
             <text x="0" y="18" textAnchor="middle" className="fill-gray-200 text-sm">Identify improvements</text>
           </g>
           
           {/* Auto-Generation - Bottom */}
           <g transform="translate(300,340)">
             <rect x="-80" y="-40" width="160" height="80" rx="16" fill="#d97706" stroke="#f59e0b" strokeWidth="3"/>
             <text x="0" y="-8" textAnchor="middle" className="fill-white text-base font-bold">Auto-Generation</text>
             <text x="0" y="18" textAnchor="middle" className="fill-gray-200 text-sm">Create optimizations</text>
           </g>
           
           {/* Validation - Bottom-left */}
           <g transform="translate(100,280)">
             <rect x="-80" y="-40" width="160" height="80" rx="16" fill="#059669" stroke="#10b981" strokeWidth="3"/>
             <text x="0" y="-8" textAnchor="middle" className="fill-white text-base font-bold">Validation</text>
             <text x="0" y="18" textAnchor="middle" className="fill-gray-200 text-sm">Test & approve changes</text>
           </g>
           
           {/* Enhanced System - Top-left */}
           <g transform="translate(100,120)">
             <rect x="-80" y="-40" width="160" height="80" rx="16" fill="#0891b2" stroke="#06b6d4" strokeWidth="3"/>
             <text x="0" y="-8" textAnchor="middle" className="fill-white text-base font-bold">Enhanced System</text>
             <text x="0" y="18" textAnchor="middle" className="fill-gray-200 text-sm">Platform improves</text>
           </g>
          
                     {/* Arrows */}
           <defs>
             <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto" markerUnits="strokeWidth">
               <polygon points="0,0 0,4 5,2" fill="#3b82f6"/>
             </marker>
             <marker id="arrowGreen" markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto" markerUnits="strokeWidth">
               <polygon points="0,0 0,4 5,2" fill="#22c55e"/>
             </marker>
             <marker id="arrowPurple" markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto" markerUnits="strokeWidth">
               <polygon points="0,0 0,4 5,2" fill="#a855f7"/>
             </marker>
             <marker id="arrowYellow" markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto" markerUnits="strokeWidth">
               <polygon points="0,0 0,4 5,2" fill="#f59e0b"/>
             </marker>
             <marker id="arrowEmerald" markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto" markerUnits="strokeWidth">
               <polygon points="0,0 0,4 5,2" fill="#10b981"/>
             </marker>
             <marker id="arrowCyan" markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto" markerUnits="strokeWidth">
               <polygon points="0,0 0,4 5,2" fill="#06b6d4"/>
             </marker>
           </defs>
           
                       {/* User Creation → Data Collection */}
            <line x1="380" y1="100" x2="420" y2="120" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowBlue)"/>
            
            {/* Data Collection → AI Analysis */}
            <line x1="500" y1="160" x2="500" y2="240" stroke="#22c55e" strokeWidth="2" markerEnd="url(#arrowGreen)"/>
            
            {/* AI Analysis → Auto-Generation */}
            <line x1="420" y1="320" x2="380" y2="340" stroke="#a855f7" strokeWidth="2" markerEnd="url(#arrowPurple)"/>
            
            {/* Auto-Generation → Validation */}
            <line x1="220" y1="340" x2="180" y2="320" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrowYellow)"/>
            
            {/* Validation → Enhanced System */}
            <line x1="100" y1="240" x2="100" y2="160" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowEmerald)"/>
            
            {/* Enhanced System → User Creation */}
            <line x1="180" y1="100" x2="220" y2="60" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrowCyan)"/>
        </svg>
      </div>
    </div>
  );
};

export default function WhitePaper() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="size-5" />
              <span>Back to App</span>
            </Link>
            
            <div className="text-lg font-semibold text-white">
              White Paper
            </div>

          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              The Future of Spatial Content Creation
            </h1>
            <p className="text-xl text-gray-300 mb-4">
              Building the First AI-Evolvable 3D Creation Platform
            </p>
            <div className="text-sm text-gray-400">
              A Technical White Paper by the Geometry Nodes Team
            </div>
          </div>

          {/* Abstract */}
          <section className="mb-12">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 rounded-2xl border border-blue-500/30">
              <h2 className="text-2xl font-bold text-white mb-4">Abstract</h2>
              <p className="text-gray-300 leading-relaxed">
                We present a revolutionary approach to 3D content creation through web-based procedural geometry systems 
                enhanced by autonomous AI agents. Our platform represents the first implementation of a self-evolving 
                3D creation tool where AI agents can read, understand, and improve the entire system without human intervention. 
                This paper outlines our technical architecture, the philosophical foundations of our approach, and the 
                implications for the future of spatial content creation in an increasingly digital world.
              </p>
            </div>
          </section>

          {/* Table of Contents */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Table of Contents</h2>
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600">
              <nav className="space-y-3">
                <a href="#mission" className="block text-blue-400 hover:text-blue-300 transition-colors">
                  1. Mission Statement
                </a>
                <a href="#problem" className="block text-blue-400 hover:text-blue-300 transition-colors">
                  2. The Problem We're Solving
                </a>
                <a href="#approach" className="block text-blue-400 hover:text-blue-300 transition-colors">
                  3. Our Technical Approach
                </a>
                <a href="#architecture" className="block text-blue-400 hover:text-blue-300 transition-colors">
                  4. AI-Evolvable Architecture
                </a>
                <a href="#implementation" className="block text-blue-400 hover:text-blue-300 transition-colors">
                  5. Implementation Details
                </a>
                <a href="#future" className="block text-blue-400 hover:text-blue-300 transition-colors">
                  6. Future Implications
                </a>
                <a href="#conclusion" className="block text-blue-400 hover:text-blue-300 transition-colors">
                  7. Conclusion
                </a>
              </nav>
            </div>
          </section>

          {/* Section 1: Mission Statement */}
          <section id="mission" className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">1. Mission Statement</h2>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-xl border border-purple-500/30">
                <h3 className="text-xl font-semibold text-white mb-4">Our Core Belief</h3>
                <p className="text-gray-300 leading-relaxed">
                  We believe that the future of 3D content creation lies not in static tools, but in living, evolving 
                  systems that learn and improve alongside their users. Our mission is to democratize 3D creation by 
                  building the first truly intelligent, self-improving platform that grows more powerful over time 
                  through autonomous AI evolution.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                  <Globe className="size-8 text-blue-400 mb-3" />
                  <h4 className="text-white font-semibold mb-2">Universal Access</h4>
                  <p className="text-sm text-gray-300">
                    Making professional 3D creation accessible to everyone, anywhere, through web-native technologies.
                  </p>
                </div>
                
                <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/30">
                  <Sparkles className="size-8 text-purple-400 mb-3" />
                  <h4 className="text-white font-semibold mb-2">AI Evolution</h4>
                  <p className="text-sm text-gray-300">
                    Creating systems that evolve autonomously through AI agents, continuously improving without human intervention.
                  </p>
                </div>
                
                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                  <Users className="size-8 text-green-400 mb-3" />
                  <h4 className="text-white font-semibold mb-2">User Co-Creation</h4>
                  <p className="text-sm text-gray-300">
                    Enabling humans and AI to collaborate as equals in the creative process, amplifying human creativity.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: The Problem */}
          <section id="problem" className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">2. The Problem We're Solving</h2>
            
            <div className="space-y-6">
              <p className="text-gray-300 leading-relaxed">
                The current landscape of 3D content creation is fragmented, complex, and inadequate for the demands 
                of our increasingly spatial digital future. Traditional tools were designed for desktop environments 
                and expert users, creating barriers that prevent widespread adoption and innovation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                    <h4 className="text-red-400 font-semibold mb-2">Technical Barriers</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Complex software requiring specialized training</li>
                      <li>• Expensive hardware and licensing costs</li>
                      <li>• Platform-specific workflows and formats</li>
                      <li>• Limited collaboration capabilities</li>
                    </ul>
                  </div>
                  
                  <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/30">
                    <h4 className="text-orange-400 font-semibold mb-2">Innovation Stagnation</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Tools that haven't fundamentally evolved in decades</li>
                      <li>• Manual, repetitive workflows</li>
                      <li>• Limited AI integration</li>
                      <li>• No self-improvement mechanisms</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
                    <h4 className="text-yellow-400 font-semibold mb-2">Market Demands</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Exponential growth in demand for 3D content</li>
                      <li>• Need for real-time, collaborative creation</li>
                      <li>• Web-native applications and experiences</li>
                      <li>• Scalable content generation</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                    <h4 className="text-blue-400 font-semibold mb-2">Future Requirements</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Metaverse and spatial computing</li>
                      <li>• AI-human collaborative workflows</li>
                      <li>• Instant accessibility and sharing</li>
                      <li>• Continuous learning and adaptation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Technical Approach */}
          <section id="approach" className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">3. Our Technical Approach</h2>
            
            <div className="space-y-6">
              <p className="text-gray-300 leading-relaxed">
                Our solution combines three revolutionary concepts: web-native procedural geometry, AI-powered automation, 
                and autonomous system evolution. This creates a platform that is not just a tool, but a living, 
                learning ecosystem.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-b from-blue-500/10 to-cyan-500/10 p-6 rounded-xl border border-blue-500/30">
                  <Code className="size-8 text-blue-400 mb-4" />
                  <h4 className="text-white font-semibold mb-3">Procedural Foundation</h4>
                  <p className="text-sm text-gray-300 mb-4">
                    Node-based visual programming where each operation is a composable, reusable component.
                  </p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• WebGPU-powered real-time rendering</li>
                    <li>• Serializable graph structures</li>
                    <li>• Type-safe parameter passing</li>
                    <li>• Infinite scalability</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-b from-purple-500/10 to-pink-500/10 p-6 rounded-xl border border-purple-500/30">
                  <Sparkles className="size-8 text-purple-400 mb-4" />
                  <h4 className="text-white font-semibold mb-3">AI Integration</h4>
                  <p className="text-sm text-gray-300 mb-4">
                    Large language models that understand and generate node graphs from natural language.
                  </p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Scene generation from descriptions</li>
                    <li>• Automatic workflow optimization</li>
                    <li>• Intelligent node suggestions</li>
                    <li>• Pattern recognition and reuse</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-b from-green-500/10 to-emerald-500/10 p-6 rounded-xl border border-green-500/30">
                  <Zap className="size-8 text-green-400 mb-4" />
                  <h4 className="text-white font-semibold mb-3">Autonomous Evolution</h4>
                  <p className="text-sm text-gray-300 mb-4">
                    AI agents that continuously analyze usage patterns and improve the system.
                  </p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Self-optimizing algorithms</li>
                    <li>• Automatic feature generation</li>
                    <li>• Performance improvements</li>
                    <li>• Emergent capabilities</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: AI-Evolvable Architecture */}
          <section id="architecture" className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">4. AI-Evolvable Architecture</h2>
            
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl border border-gray-600">
                <h3 className="text-xl font-semibold text-white mb-4">The Serialization Advantage</h3>
                <p className="text-gray-300 mb-4">
                  The key to our AI-evolvable architecture lies in the complete serialization of our node graphs to text. 
                  This enables AI agents to read, understand, modify, and improve every aspect of the system.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-500/20 p-4 rounded-lg">
                    <h4 className="text-blue-300 font-medium mb-2">Read</h4>
                    <p className="text-xs text-gray-300">
                      AI agents parse serialized graphs to understand structure, dependencies, and patterns.
                    </p>
                  </div>
                  <div className="bg-green-500/20 p-4 rounded-lg">
                    <h4 className="text-green-300 font-medium mb-2">Understand</h4>
                    <p className="text-xs text-gray-300">
                      Machine learning models identify optimization opportunities and usage patterns.
                    </p>
                  </div>
                  <div className="bg-purple-500/20 p-4 rounded-lg">
                    <h4 className="text-purple-300 font-medium mb-2">Evolve</h4>
                    <p className="text-xs text-gray-300">
                      Autonomous improvements are generated and validated before deployment.
                    </p>
                  </div>
                                 </div>
               </div>

               <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl border border-gray-600">
                 <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                   <RotateCcw className="size-6 text-purple-400" />
                   The Autonomous Evolution Cycle
                 </h3>
                 <p className="text-gray-300 mb-6">
                   This interactive diagram shows how our platform continuously evolves through AI agent analysis and optimization:
                 </p>
                 
                 <EvolutionCycleFlow />
                 
                 <div className="mt-4 text-center">
                   <p className="text-sm text-gray-400">
                     ↗️ <strong className="text-white">Animated Flow:</strong> Each step feeds into the next, creating an infinite improvement loop
                   </p>
                 </div>
               </div>

               <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-xl border border-purple-500/30">
                <h3 className="text-xl font-semibold text-white mb-4">Collaborative Intelligence Model</h3>
                <p className="text-gray-300 mb-4">
                  Our platform implements a novel paradigm where humans and AI agents work as equal partners in the creative process:
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                    <div>
                      <span className="text-white font-medium">Human Creativity:</span>
                      <span className="text-gray-300"> Users provide intent, artistic vision, and creative direction</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                    <div>
                      <span className="text-white font-medium">AI Assistance:</span>
                      <span className="text-gray-300"> AI generates technical implementations and suggests optimizations</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                    <div>
                      <span className="text-white font-medium">System Evolution:</span>
                      <span className="text-gray-300"> The platform learns from interactions and improves autonomously</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Implementation Details */}
          <section id="implementation" className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">5. Implementation Details</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600">
                  <h4 className="text-white font-semibold mb-4">Core Technologies</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <Box className="size-4 text-blue-400" />
                      <span>WebGPU for high-performance 3D rendering</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Code className="size-4 text-green-400" />
                      <span>React Flow for node graph visualization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="size-4 text-purple-400" />
                      <span>Large Language Models for AI generation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Globe className="size-4 text-cyan-400" />
                      <span>Next.js for web application framework</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600">
                  <h4 className="text-white font-semibold mb-4">Key Innovations</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <Target className="size-4 text-red-400" />
                      <span>Text-serializable node graphs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="size-4 text-yellow-400" />
                      <span>Real-time collaborative editing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="size-4 text-pink-400" />
                      <span>AI-human co-creation workflows</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <BookOpen className="size-4 text-orange-400" />
                      <span>Self-improving system architecture</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-6 rounded-xl border border-blue-500/30">
                <h4 className="text-white font-semibold mb-4">Performance Characteristics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">5x</div>
                    <div className="text-sm text-white mb-1">Faster Creation</div>
                    <div className="text-xs text-gray-400">vs Traditional Tools</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">70%</div>
                    <div className="text-sm text-white mb-1">Faster Setup</div>
                    <div className="text-xs text-gray-400">Web-Native Advantage</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-1">∞</div>
                    <div className="text-sm text-white mb-1">Improvement Rate</div>
                    <div className="text-xs text-gray-400">AI-Driven Evolution</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Future Implications */}
          <section id="future" className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">6. Future Implications</h2>
            
            <div className="space-y-6">
              <p className="text-gray-300 leading-relaxed">
                Our AI-evolvable platform represents more than a technological advancement—it's a paradigm shift 
                toward symbiotic human-AI collaboration that will define the future of creative tools and spatial computing.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                    <h4 className="text-green-400 font-semibold mb-2">Immediate Impact</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Democratization of 3D content creation</li>
                      <li>• Acceleration of spatial web development</li>
                      <li>• New forms of human-AI collaboration</li>
                      <li>• Reduction in technical barriers</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                    <h4 className="text-blue-400 font-semibold mb-2">Medium-Term Evolution</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Emergence of AI-native creative workflows</li>
                      <li>• Platform ecosystem growth and specialization</li>
                      <li>• Integration with metaverse platforms</li>
                      <li>• Educational transformation</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/30">
                    <h4 className="text-purple-400 font-semibold mb-2">Long-Term Vision</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Self-evolving creative ecosystems</li>
                      <li>• AI agents as creative partners</li>
                      <li>• Automatic knowledge transfer</li>
                      <li>• Emergent capabilities beyond human design</li>
                    </ul>
                  </div>
                  
                  <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/30">
                    <h4 className="text-orange-400 font-semibold mb-2">Societal Impact</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• New economy of spatial content creation</li>
                      <li>• Redefinition of digital craftsmanship</li>
                      <li>• Enhanced human creative capacity</li>
                      <li>• Global collaboration at unprecedented scale</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Conclusion */}
          <section id="conclusion" className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">7. Conclusion</h2>
            
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-8 rounded-2xl border border-purple-500/30">
              <p className="text-gray-300 leading-relaxed mb-6">
                We stand at the threshold of a new era in 3D content creation. By combining web-native accessibility, 
                procedural flexibility, and autonomous AI evolution, we're not just building a better tool—we're 
                crafting the foundation for the spatial web's creative economy.
              </p>
              
              <p className="text-gray-300 leading-relaxed mb-6">
                Our platform represents the first step toward a future where creative tools evolve alongside their users, 
                where AI agents serve as collaborative partners rather than mere assistants, and where the barrier 
                between imagination and implementation dissolves entirely.
              </p>
              
              <div className="text-center">
                <div className="inline-block bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 rounded-xl border border-blue-500/30">
                  <p className="text-lg text-white font-semibold mb-2">
                    "The future belongs to platforms that can learn, grow, and evolve."
                  </p>
                  <p className="text-base text-gray-300">
                    We're building that future, one intelligent node at a time.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="text-center">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-8 rounded-2xl border border-gray-600">
              <h3 className="text-2xl font-bold text-white mb-4">Join the Evolution</h3>
              <p className="text-gray-300 mb-6">
                Be part of the revolution in 3D content creation. Whether you're a developer, creator, or visionary, 
                there's a place for you in building the future of spatial computing.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link 
                  href="/editor" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Box className="size-4" />
                  Try the Platform
                </Link>
                
                <Link 
                  href="/investors" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  <FileText className="size-4" />
                  Investor Deck
                </Link>
                
                <a 
                  href="mailto:radiantclay@gmail.com?subject=White%20Paper%20Inquiry" 
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-500 hover:border-gray-400 text-gray-300 hover:text-white font-medium rounded-lg transition-colors"
                >
                  <ExternalLink className="size-4" />
                  Contact Us
                </a>
              </div>
            </div>
          </section>

                 </div>
       </div>
     </div>
   );
 } 