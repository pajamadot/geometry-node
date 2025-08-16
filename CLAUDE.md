# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for a web-based procedural geometry system that allows users to create complex 3D geometry using a visual node editor with AI-powered generation capabilities. The main application is a Next.js 15 app with React 19, Three.js for 3D rendering, and ReactFlow for the node-based interface.

## Essential Commands

### Development
```bash
# From root directory
npm run dev          # Start all apps in development mode with Turbopack
npm run build        # Build all apps for production
npm run lint         # Run linting across all apps

# From apps/web directory (if working specifically on web app)
cd apps/web
npm run dev          # Start Next.js dev server with Turbopack
npm run build        # Create production build
npm run start        # Start production server
npm run lint         # Run Next.js linting
```

### Environment Setup
- Node.js 22.x required (specified in package.json engines)
- npm 10+ required
- Create `.env.local` in `apps/web/` with `OPENROUTER_API_KEY` for AI features

## Architecture & Key Systems

### Core Architecture Pattern
The application follows a modular component-based architecture with clear separation of concerns:

1. **Node Registry System** (`apps/web/app/registry/NodeRegistry.ts`)
   - Central registry managing all node definitions (30+ built-in nodes)
   - Supports dynamic node registration and custom JSON-based nodes
   - Type-safe socket connections with validation

2. **AI Agent System** (`apps/web/app/agent/GeometryAIAgent.ts`)
   - Handles AI-powered node and scene generation via OpenRouter
   - Streaming responses with real-time integration
   - Multiple model support (Claude, GPT-4, Gemini)

3. **Context-Based State Management**
   - GeometryContext: Manages 3D geometry state and operations
   - NodeContext: Handles node graph state and connections
   - TimeContext: Controls animation and time-based parameters
   - Multiple UI contexts for modals, logging, and layout

4. **Type System** (`apps/web/app/types/`)
   - Comprehensive TypeScript definitions for all geometry types
   - Socket type compatibility matrix
   - Parameter validation schemas

### Key Architectural Decisions

- **Monorepo with Turborepo**: Enables efficient builds and parallel development
- **App Router (Next.js 15)**: Modern React Server Components architecture
- **Three.js Integration**: React Three Fiber for declarative 3D rendering
- **ReactFlow**: Provides the visual node editor with custom node implementations
- **Tailwind CSS v4**: Modern utility-first styling with CSS variables
- **Clerk Authentication**: Middleware-based route protection

### File Organization Pattern

```
apps/web/
├── app/
│   ├── components/       # UI components organized by feature
│   │   ├── NodeEditor/  # Node editor components
│   │   ├── Viewport/    # 3D viewport components
│   │   └── ui/          # Shared UI components
│   ├── registry/        # Node definitions and registry
│   │   ├── nodes/       # Individual node implementations
│   │   └── NodeRegistry.ts
│   ├── agent/           # AI agent implementation
│   ├── types/           # TypeScript type definitions
│   ├── contexts/        # React contexts for state management
│   ├── utils/           # Utility functions
│   └── api/             # API routes for AI and node operations
```

### Node System Implementation

When working with nodes:
1. Node definitions are in `apps/web/app/registry/nodes/`
2. Each node implements the `NodeDefinition` interface
3. Nodes must be registered in `apps/web/app/registry/nodes/index.ts`
4. Custom nodes can be added via JSON definitions without code changes

### API Routes Structure

- `/api/ai/generate-node`: Creates new nodes from prompts
- `/api/ai/generate-scene`: Generates complete scenes
- `/api/ai/modify-node`: Modifies existing nodes
- `/api/ai/modify-scene`: Updates scene configurations
- `/api/nodes`: CRUD operations for custom nodes

## Development Guidelines

### Adding New Features
1. Check existing components in `apps/web/app/components/` for similar patterns
2. Follow the established socket type system for node connections
3. Use existing contexts for state management rather than creating new ones
4. Implement error boundaries for 3D rendering components

### Working with the Node System
1. Study existing nodes in `apps/web/app/registry/nodes/` for patterns
2. Use the `NodeDefinition` type for type safety
3. Test socket compatibility with existing nodes
4. Consider performance impact for geometry operations

### Code Quality Notes
- TypeScript strict mode is enabled - maintain type safety
- No test framework currently configured - manual testing required
- Use `npm run lint` before committing changes
- Follow existing code patterns for consistency

### Common Tasks

**Creating a new geometry node:**
1. Create definition in `apps/web/app/registry/nodes/your-node.ts`
2. Implement execute function with proper typing
3. Register in `apps/web/app/registry/nodes/index.ts`
4. Test connections with existing nodes

**Modifying AI generation:**
1. Check `apps/web/app/agent/GeometryAIAgent.ts` for prompt templates
2. API routes in `apps/web/app/api/ai/` handle requests
3. Test with different models via OpenRouter

**Updating 3D viewport:**
1. Components in `apps/web/app/components/Viewport/`
2. Uses React Three Fiber - check their docs for Three.js integration
3. Memory monitoring hooks available in utils

## Important Technical Details

- **Authentication**: Clerk middleware protects routes - check `apps/web/middleware.ts`
- **Build System**: Turborepo manages dependencies - changes to shared code trigger rebuilds
- **Performance**: Monitor memory usage with built-in tools for complex geometries
- **Type Safety**: Extensive TypeScript types - avoid using `any`
- **State Management**: Context-based - avoid prop drilling