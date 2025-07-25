'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Play,
  TrendingUp,
  Users,
  Zap,
  Target,
  Globe,
  Sparkles,
  Box,
  Code,
  DollarSign,
  Rocket,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { ReactFlowProvider } from 'reactflow';

// Import geometry editor components and providers
import GeometryNodeEditor from '../components/GeometryNodeEditor';
import { GeometryProvider } from '../components/GeometryContext';
import { TimeProvider } from '../components/TimeContext';
import { NodeProvider } from '../components/NodeContext';
import { ModalProvider } from '../components/ModalContext';
import { LoggingProvider } from '../components/LoggingContext';
import { LogsVisibilityProvider } from '../components/LogsVisibilityContext';



// Real Geometry Nodes Demo Component
const RealGeometryNodesDemo: React.FC = () => {
  return (
    <div className="w-full h-64 bg-gray-800/30 rounded-xl border border-gray-600/50 overflow-hidden">
      <div className="absolute top-2 left-2 text-xs text-gray-400 z-20">
        Live Geometry Nodes Editor - Right-click to add nodes!
      </div>
      
      <LogsVisibilityProvider>
        <ModalProvider>
          <LoggingProvider>
            <TimeProvider>
              <GeometryProvider>
                <ReactFlowProvider>
                  <div className="w-full h-full">
                    <GeometryNodeEditor />
                  </div>
                </ReactFlowProvider>
              </GeometryProvider>
            </TimeProvider>
          </LoggingProvider>
        </ModalProvider>
      </LogsVisibilityProvider>
    </div>
  );
};

export default function InvestorPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    // Slide 1: Title with Interactive Node Graph
    {
      id: 'title',
      title: 'Geometry Nodes On The Web!',
             content: (
         <div className="text-center space-y-6">
           <div className="space-y-2">
             <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
               Geometry Nodes
             </h1>
             <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
               On The Web!
             </h2>
           </div>
           
           <div className="max-w-4xl mx-auto space-y-4">
             <p className="text-sm sm:text-base md:text-lg text-gray-300">
               Revolutionizing 3D content creation with AI-powered procedural modeling in your browser
             </p>
             
             {/* Interactive Node Graph Demo */}
             <div className="my-6">
               <RealGeometryNodesDemo />
             </div>
             
             <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-3 rounded-lg border border-purple-500/30">
               <p className="text-sm sm:text-base text-gray-200">
                 <em>"We're building the future of the spatial web, one intelligent 3D model at a time."</em>
               </p>
             </div>
           </div>

           <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-gray-400">
             <div className="flex items-center gap-1">
               <Box className="size-3 sm:size-4" />
               <span>Procedural 3D Design</span>
             </div>
             <div className="flex items-center gap-1">
               <Sparkles className="size-3 sm:size-4" />
               <span>AI-Powered</span>
             </div>
             <div className="flex items-center gap-1">
               <Globe className="size-3 sm:size-4" />
               <span>Web-Native</span>
             </div>
           </div>
         </div>
      )
    },

    // Slide 2: Problem Statement
    {
      id: 'problem',
      title: 'The Problem',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">The Challenge We're Solving</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              3D content creation is complex, inaccessible, and inefficient
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30">
                <h3 className="text-lg font-semibold text-red-400 mb-2">High Barrier to Entry</h3>
                <p className="text-sm text-gray-300">Expensive software, specialized hardware, steep learning curves</p>
              </div>
              
              <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/30">
                <h3 className="text-lg font-semibold text-orange-400 mb-2">Inefficient Iteration</h3>
                <p className="text-sm text-gray-300">Time-consuming manual work, difficult to make changes</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/30">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Limited Control</h3>
                <p className="text-sm text-gray-300">Lack of programmatic, scalable content generation</p>
              </div>
              
              <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Growing Demand</h3>
                <p className="text-sm text-gray-300">Web-based games, VR/AR, metaverse need dynamic 3D content</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-block bg-gradient-to-r from-red-500/20 to-orange-500/20 p-4 rounded-xl border border-red-500/30">
              <p className="text-base text-white font-medium">
                Current workflows can't meet the demand for efficient, accessible 3D content creation
              </p>
            </div>
          </div>
        </div>
      )
    },

    // Slide 3: Solution & Product
    {
      id: 'solution',
      title: 'Our Solution',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">Revolutionary Solution</h2>
            <p className="text-lg text-gray-300 max-w-4xl mx-auto">
              Web-based procedural 3D geometry system with AI-powered automation
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-xl border border-blue-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="size-5 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">5x Faster Creation</h3>
                </div>
                <p className="text-gray-300">Generate complex 3D scenes in minutes, not hours</p>
              </div>

              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-4 rounded-xl border border-green-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="size-5 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Browser-Based</h3>
                </div>
                <p className="text-gray-300">No installation required, accessible anywhere</p>
              </div>

              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="size-5 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">AI-Powered</h3>
                </div>
                <p className="text-gray-300">Intelligent node and scene generation</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-2xl border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-3">Think Digital LEGOs</h3>
                <p className="text-gray-300 mb-3 text-sm">
                  Each node is like a LEGO brick that performs a specific 3D operation. Connect them to create complex structures.
                </p>
                <div className="text-sm text-gray-400">
                  <p>🧱 Create → 🔄 Transform → 🎨 Style → 🚀 Export</p>
                </div>
              </div>

                             <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 p-4 rounded-xl border border-indigo-500/30">
                 <h3 className="text-lg font-semibold text-white mb-2">Key Differentiator</h3>
                 <p className="text-gray-300 text-sm">
                   Unlike static AI generators, we provide <strong className="text-white">full creative control</strong> and <strong className="text-white">iterative design</strong> capabilities.
                 </p>
               </div>

               <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-xl border border-purple-500/30">
                 <h3 className="text-lg font-semibold text-white mb-2">🤖 Autonomous Evolution</h3>
                 <p className="text-gray-300 text-sm">
                   <strong className="text-purple-400">AI agents continuously enhance the platform</strong> - 
                   automatically optimizing nodes, workflows, and creating new capabilities without human intervention.
                 </p>
               </div>
            </div>
          </div>
        </div>
      )
    },

    // Slide 4: Market Opportunity
    {
      id: 'market',
      title: 'Market Opportunity',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-white mb-3">Massive Market Opportunity</h2>
            <p className="text-lg text-gray-300">
              The 3D modeling software market is experiencing explosive growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 rounded-2xl border border-green-500/30">
                <div className="text-3xl font-bold text-green-400 mb-1">$35.81B</div>
                <div className="text-base text-white mb-1">2024 Market Size</div>
                <div className="text-xs text-gray-400">3D Modeling Software</div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-6 rounded-2xl border border-blue-500/30">
                <div className="text-3xl font-bold text-blue-400 mb-1">$91.32B</div>
                <div className="text-base text-white mb-1">2033 Projection</div>
                <div className="text-xs text-gray-400">Expected Growth</div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 rounded-2xl border border-purple-500/30">
                <div className="text-3xl font-bold text-purple-400 mb-1">155%</div>
                <div className="text-base text-white mb-1">Growth Rate</div>
                <div className="text-xs text-gray-400">Over 9 Years</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 p-6 rounded-2xl border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Our Target Customers</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Users className="size-6 text-blue-400 mx-auto mb-2" />
                <h4 className="text-white font-medium mb-1 text-sm">3D Artists</h4>
                <p className="text-xs text-gray-400">Professional creators</p>
              </div>
              <div className="text-center">
                <Play className="size-6 text-green-400 mx-auto mb-2" />
                <h4 className="text-white font-medium mb-1 text-sm">Game Devs</h4>
                <p className="text-xs text-gray-400">Interactive content</p>
              </div>
              <div className="text-center">
                <Box className="size-6 text-purple-400 mx-auto mb-2" />
                <h4 className="text-white font-medium mb-1 text-sm">Architects</h4>
                <p className="text-xs text-gray-400">Design visualization</p>
              </div>
              <div className="text-center">
                <Target className="size-6 text-orange-400 mx-auto mb-2" />
                <h4 className="text-white font-medium mb-1 text-sm">Educators</h4>
                <p className="text-xs text-gray-400">Learning & teaching</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-base text-gray-300">
              <strong className="text-white">High-growth segment:</strong> Web-based procedural and AI-driven 3D content creation
            </p>
          </div>
        </div>
      )
    },

    // Slide 5: Competitive Advantage
    {
      id: 'competition',
      title: 'Competitive Advantage',
             content: (
         <div className="space-y-4">
           <div className="text-center mb-4">
             <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">How We Win</h2>
             <p className="text-sm sm:text-base text-gray-300">
               Unique positioning in the 3D creation landscape
             </p>
           </div>

           <div className="space-y-4">
             <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-green-500/30">
               <h3 className="text-base sm:text-lg font-semibold text-green-400 mb-2">🚀 Our Key Advantage</h3>
                               <p className="text-xs sm:text-sm text-gray-300 mb-2">
                  <strong className="text-white">Procedural + AI Integration:</strong> We generate flexible node graphs that <strong className="text-purple-400">auto-evolve via AI agents</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-400">
                    <strong className="text-green-400">✓ Editable outputs</strong> - Full creative control
                  </div>
                  <div className="text-gray-400">
                    <strong className="text-purple-400">✓ Self-improving</strong> - AI agents enhance the platform
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
               <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
                 <h4 className="text-sm font-semibold text-white mb-1">vs Spline</h4>
                 <p className="text-xs text-green-400">
                   <strong>Edge:</strong> Procedural + AI generation
                 </p>
               </div>

               <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
                 <h4 className="text-sm font-semibold text-white mb-1">vs Womp</h4>
                 <p className="text-xs text-green-400">
                   <strong>Edge:</strong> Advanced programmatic system
                 </p>
               </div>

               <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
                 <h4 className="text-sm font-semibold text-white mb-1">vs Meshy AI</h4>
                 <p className="text-xs text-green-400">
                   <strong>Edge:</strong> Editable, parametric outputs
                 </p>
               </div>
             </div>

             <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/30">
               <h3 className="text-base sm:text-lg font-semibold text-white mb-3 text-center">Performance Impact</h3>
               <div className="grid grid-cols-2 gap-4 text-center">
                 <div>
                   <div className="text-xl sm:text-2xl font-bold text-purple-400 mb-1">70%</div>
                   <div className="text-xs sm:text-sm text-white">Faster setup</div>
                 </div>
                 <div>
                   <div className="text-xl sm:text-2xl font-bold text-pink-400 mb-1">50%</div>
                   <div className="text-xs sm:text-sm text-white">Faster iterations</div>
                 </div>
               </div>
             </div>
           </div>
         </div>
      )
    },

    // Slide 6: Technology Innovation
    {
      id: 'technology',
      title: 'Core Technology',
      content: (
        <div className="space-y-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">Technology Innovation</h2>
            <p className="text-xl text-gray-300">
              Web-based procedural geometry engine with AI integration
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-6 rounded-xl border border-blue-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Code className="size-6 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">Visual Programming</h3>
                </div>
                <p className="text-gray-300">
                  Node-based system where each node performs specific 3D operations. 
                  Connect them like digital LEGO blocks to create complex geometries.
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="size-6 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">AI Integration</h3>
                </div>
                <p className="text-gray-300">
                  AI automatically generates new nodes and entire scenes based on user intent, 
                  dramatically reducing manual effort.
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 rounded-xl border border-green-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="size-6 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Web-Native</h3>
                </div>
                <p className="text-gray-300">
                  Built with WebGPU and modern web technologies. 
                  No installation required, runs in any browser.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-5 rounded-2xl border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-4">Key Technical Advantages</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="size-2 bg-green-400 rounded-full mt-1 flex-shrink-0"></div>
                    <div>
                      <p className="text-white font-medium text-sm">Serializable to Text</p>
                      <p className="text-xs text-gray-400">Node graphs can be saved, shared, and evolved by AI</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="size-2 bg-blue-400 rounded-full mt-1 flex-shrink-0"></div>
                    <div>
                      <p className="text-white font-medium text-sm">Real-time Rendering</p>
                      <p className="text-xs text-gray-400">Instant feedback with live geometry updates</p>
                    </div>
                  </div>
                                     <div className="flex items-start gap-2">
                     <div className="size-2 bg-purple-400 rounded-full mt-1 flex-shrink-0"></div>
                     <div>
                       <p className="text-white font-medium text-sm">🤖 Auto-Evolvable by AI Agents</p>
                       <p className="text-xs text-gray-400">AI agents autonomously improve nodes, workflows, and the entire platform</p>
                     </div>
                   </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-6 rounded-xl border border-orange-500/30">
                <h3 className="text-lg font-semibold text-white mb-3">Performance Impact</h3>
                <p className="text-gray-300 text-sm">
                  What takes hours with traditional tools can be prototyped and refined in minutes 
                  using our AI generation capabilities.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },

                                       // Slide 7: Self-Evolving Generation System
       {
         id: 'self-evolving',
         title: 'Self-Evolving Generation System',
         content: (
           <div className="space-y-6">
             <div className="text-center mb-6">
               <h2 className="text-4xl font-bold text-white mb-3">🤖 Co-Creating with AI</h2>
               <p className="text-lg text-gray-300 max-w-4xl mx-auto">
                 Users and AI agents work together to continuously evolve the platform
               </p>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
               {/* User Co-Creation */}
               <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-xl border border-blue-500/30">
                 <h3 className="text-lg font-semibold text-white mb-3">👥 User Co-Creation</h3>
                 <div className="space-y-2 text-sm text-gray-300">
                   <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                     <span>Users create unique workflows</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                     <span>Share innovative node patterns</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                     <span>Collaborate on complex scenes</span>
                   </div>
                 </div>
               </div>

               {/* AI Learning */}
               <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-xl border border-purple-500/30">
                 <h3 className="text-lg font-semibold text-white mb-3">🧠 AI Learning</h3>
                 <div className="space-y-2 text-sm text-gray-300">
                   <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                     <span>Learns from user creations</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                     <span>Generates new node types</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                     <span>Optimizes workflows automatically</span>
                   </div>
                 </div>
               </div>

               {/* Platform Evolution */}
               <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-xl border border-green-500/30">
                 <h3 className="text-lg font-semibold text-white mb-3">🚀 Platform Evolution</h3>
                 <div className="space-y-2 text-sm text-gray-300">
                   <div className="flex items-center gap-2">
                     <Sparkles className="size-3 text-yellow-400" />
                     <span>Self-improving capabilities</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                     <span>Enhanced user experiences</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                     <span>Continuous innovation</span>
                   </div>
                 </div>
               </div>
             </div>

             {/* Compact Impact Statement */}
             <div className="text-center">
               <div className="inline-block bg-gradient-to-r from-purple-500/15 to-pink-500/15 p-6 rounded-xl border border-purple-500/30">
                 <h3 className="text-xl font-semibold text-white mb-2">🔮 Collaborative Intelligence</h3>
                 <p className="text-base text-gray-300">
                   <strong className="text-purple-400">Users + AI = Exponential Innovation</strong>
                   <br/>Every creation teaches the system, making everyone more powerful
                 </p>
               </div>
             </div>
           </div>
         )
       },

     // Slide 8: Vision & Impact
     {
       id: 'vision',
       title: 'Vision & Impact',
      content: (
        <div className="space-y-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">Long-Term Vision</h2>
            <p className="text-xl text-gray-300">
              Becoming the definitive platform for generative 3D content creation
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 rounded-2xl border border-blue-500/30">
                <h3 className="text-2xl font-semibold text-white mb-4">🌍 Massive Impact</h3>
                <p className="text-lg text-gray-300 mb-4">
                  Fundamentally change how 3D content is produced - making it faster, more accessible, and infinitely scalable.
                </p>
                <p className="text-gray-400">
                  Fueling the growth of the spatial web and digital economies.
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 rounded-xl border border-green-500/30">
                <h3 className="text-xl font-semibold text-white mb-3">🚀 Democratization</h3>
                <p className="text-gray-300">
                  Empowering everyone from individual artists to large enterprises to create immersive 3D experiences.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-white mb-6">Target Industries</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600 text-center">
                    <Play className="size-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-white font-medium">Gaming</div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600 text-center">
                    <Globe className="size-6 text-green-400 mx-auto mb-2" />
                    <div className="text-white font-medium">Metaverse</div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600 text-center">
                    <DollarSign className="size-6 text-yellow-400 mx-auto mb-2" />
                    <div className="text-white font-medium">E-commerce</div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600 text-center">
                    <Users className="size-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-white font-medium">Education</div>
                  </div>
                </div>
              </div>

                             <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-xl border border-purple-500/30">
                 <h3 className="text-lg font-semibold text-white mb-3">🤖 Autonomous AI Evolution</h3>
                 <p className="text-gray-300 text-sm">
                   <strong className="text-purple-400">AI agents autonomously evolve the entire platform</strong> - analyzing usage patterns, 
                   optimizing workflows, creating new nodes, and improving performance without any human intervention. 
                   The system becomes more powerful over time, automatically.
                 </p>
               </div>
            </div>
          </div>

        </div>
      )
                   },

            // Slide 9: Our Philosophy
       {
         id: 'philosophy',
         title: 'Our Philosophy',
        content: (
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Our Philosophy</h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                We are just normal people passionate about building tools for creators
              </p>
            </div>

            <div className="max-w-5xl mx-auto space-y-6">
                             <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-xl border border-purple-500/30">
                 <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4">Our Core Belief</h3>
                 <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
                   "Great tools don't just solve problems—they inspire new possibilities. 
                   We're here to put powerful, intuitive 3D creation tools in the hands of everyone, 
                   from weekend hobbyists to professional studios. We believe the best tools come from people who understand the creative process firsthand."
                 </p>
               </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-lg border border-blue-500/30">
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-3">🛠️ Tool Builders</h4>
                  <p className="text-sm text-gray-300">
                    We love creating tools that make complex tasks simple and enjoyable
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-green-500/30">
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-3">🎨 Creator-First</h4>
                  <p className="text-sm text-gray-300">
                    Every feature is designed with creators' workflows and needs in mind
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/30">
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-3">🚀 Pragmatic Vision</h4>
                  <p className="text-sm text-gray-300">
                    Big dreams, practical solutions—we build what actually works
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4 rounded-lg border border-orange-500/30">
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-3">💡 Innovation Focus</h4>
                  <p className="text-sm text-gray-300">
                    We prioritize meaningful innovation over flashy features
                  </p>
                </div>
                <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 p-4 rounded-lg border border-teal-500/30">
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-3">🌍 Democratization</h4>
                  <p className="text-sm text-gray-300">
                    Making powerful 3D creation accessible to everyone, everywhere
                  </p>
                </div>
              </div>

              
            </div>
          </div>
        )
             },

      // Slide 10: Ask/Next Steps
      {
        id: 'ask',
        title: 'Partnership Opportunity',
      content: (
        <div className="space-y-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">Join Our Journey</h2>
            <p className="text-xl text-gray-300">
              Partner with us to revolutionize 3D content creation
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 rounded-2xl border border-green-500/30">
                <h3 className="text-xl font-semibold text-white mb-4">Why Now?</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Rocket className="size-4 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium text-sm">Market Timing</p>
                      <p className="text-xs text-gray-400">$35B → $91B market growth over next 9 years</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="size-4 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium text-sm">Technology Readiness</p>
                      <p className="text-xs text-gray-400">WebGPU, AI advances enabling powerful web-based 3D</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="size-4 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium text-sm">Demand Surge</p>
                      <p className="text-xs text-gray-400">VR/AR, metaverse, gaming driving content needs</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-xl border border-purple-500/30">
                <h3 className="text-lg font-semibold text-white mb-3">Our Passion</h3>
                <p className="text-gray-300 text-sm">
                  We're driven by a profound passion for <strong className="text-white">tool development</strong>. 
                  We believe the right tools unlock immense creative potential and solve complex problems in ways previously unimaginable.
                </p>
              </div>
            </div>

                         <div className="space-y-6">
               <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-2xl border border-gray-600">
                 <h3 className="text-xl font-semibold text-white mb-4 text-center">What We're Looking For</h3>
                 <div className="space-y-4">
                   <div className="text-center">
                     <div className="text-2xl font-bold text-blue-400 mb-1">Mentorship</div>
                     <p className="text-gray-300 text-sm">Guidance from industry experts and successful entrepreneurs</p>
                   </div>
                   <div className="text-center">
                     <div className="text-2xl font-bold text-green-400 mb-1">Network</div>
                     <p className="text-gray-300 text-sm">Access to potential customers, partners, and future investors</p>
                   </div>
                   <div className="text-center">
                     <div className="text-2xl font-bold text-purple-400 mb-1">Resources</div>
                     <p className="text-gray-300 text-sm">Platform to accelerate development and market entry</p>
                   </div>
                 </div>
               </div>

               

               <div className="text-center">
                 <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 rounded-2xl border border-blue-500/30">
                                       <h3 className="text-xl font-semibold text-white mb-3">Ready to Build the Future?</h3>
                    <p className="text-base text-gray-300 mb-4">
                      Let's discuss how we can transform 3D content creation together
                    </p>
                    <div className="text-xs text-gray-400 mb-3">
                      Contact us to learn more about our technology, roadmap, and partnership opportunities
                    </div>
                                         <a 
                       href="mailto:radiantclay@gmail.com?subject=Investor%20Interest%20-%20Geometry%20Nodes%20On%20The%20Web" 
                       className="relative inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105 z-10"
                       style={{ pointerEvents: 'auto' }}
                     >
                       📧 Email Us
                     </a>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Navigation Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="size-5" />
              <span>Back to App</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {currentSlide + 1} / {slides.length}
              </span>
              <div className="text-lg font-semibold text-white">
                {slides[currentSlide].title}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={nextSlide}
                disabled={currentSlide === slides.length - 1}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Content */}
      <div className="pt-20 pb-24 h-screen flex items-center justify-center">
        <div className="container mx-auto px-4 max-h-[calc(100vh-160px)] overflow-hidden">
          <div className="max-w-7xl mx-auto h-full flex items-center justify-center">
            <div className="w-full max-h-full overflow-hidden">
              {slides[currentSlide].content}
            </div>
          </div>
        </div>
      </div>

      {/* Side Navigation Arrows */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 opacity-60 hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="flex items-center justify-center size-12 rounded-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 hover:bg-gray-700/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 group shadow-lg"
        >
          <ChevronLeft className="size-6 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 opacity-60 hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="flex items-center justify-center size-12 rounded-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 hover:bg-gray-700/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 group shadow-lg"
        >
          <ChevronRight className="size-6 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-600">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`size-2 rounded-full transition-all duration-200 ${
                index === currentSlide 
                  ? 'bg-blue-400 scale-125' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Keyboard Navigation */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-600 text-xs text-gray-400">
          Use ← → keys or side arrows to navigate
        </div>
      </div>

      {/* Keyboard Event Handler */}
      <div
        className="fixed inset-0 z-0"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' && currentSlide < slides.length - 1) {
            nextSlide();
          } else if (e.key === 'ArrowLeft' && currentSlide > 0) {
            prevSlide();
          }
        }}
      />
    </div>
  );
} 