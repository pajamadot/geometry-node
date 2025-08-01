# Geometry Script Web Application

This is the Next.js web application for the Geometry Script procedural geometry system.

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- OpenRouter API key (for AI features)

### Development Setup

1. Navigate to the web app directory:
```bash
cd apps/web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional - for AI features):
```bash
# Create .env.local file
echo "OPENROUTER_API_KEY=your_openrouter_api_key_here" > .env.local
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

## Project Structure

```
apps/web/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── ai/           # AI generation endpoints
│   │   └── nodes/        # Node data endpoints
│   ├── components/        # React components
│   │   ├── editor/       # Node editor components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── type-renderers/ # Parameter input widgets
│   │   ├── ui/           # Base UI components
│   │   └── widgets/      # Specialized widgets
│   ├── data/             # Static data and examples
│   │   ├── nodes/        # Example node definitions
│   │   └── scenes/       # Example scene configurations
│   ├── registry/         # Node registration system
│   │   ├── nodes/        # Individual node definitions
│   │   └── TemplateSystem.ts # Template generation
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── assets/               # Static assets (images, etc.)
├── public/               # Public assets (served directly)
├── middleware.ts         # Next.js middleware
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── postcss.config.mjs    # PostCSS configuration
```

## Development

### Adding New Components

Components are organized by functionality:
- **Core UI**: Place in `app/components/ui/`
- **Editor specific**: Place in `app/components/editor/`
- **Widget components**: Place in `app/components/widgets/`
- **Type renderers**: Place in `app/components/type-renderers/`

### Adding New Nodes

1. Create a new node definition in `app/registry/nodes/`:
```typescript
// app/registry/nodes/MyNewNode.ts
export const myNewNodeDefinition: NodeDefinition = {
  type: 'my-new-node',
  name: 'My New Node',
  description: 'Description of functionality',
  category: 'geometry', // or 'math', 'utilities', etc.
  // ... rest of definition
};
```

2. Register the node in `app/registry/nodes/index.ts`:
```typescript
import { myNewNodeDefinition } from './MyNewNode';

export const nodeDefinitions = [
  // ... existing nodes
  myNewNodeDefinition,
];
```

### Adding API Routes

API routes are located in `app/api/`:
- **AI endpoints**: `app/api/ai/` - For AI generation features
- **Node endpoints**: `app/api/nodes/` - For node data operations

### Working with Types

TypeScript types are organized in `app/types/`:
- `geometry.ts` - 3D geometry and mesh types
- `nodes.ts` - Node system types
- `connections.ts` - Socket connection types
- `nodeSystem.ts` - Graph and execution types

## Configuration

### Environment Variables

Create a `.env.local` file in the `apps/web` directory:

```bash
# Required for AI features
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional: Custom API base URL
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Optional: Development settings
NODE_ENV=development
```

### Next.js Configuration

The `next.config.ts` file includes:
- Development origin allowlist for CORS
- Build optimization settings
- Asset handling configuration

### Tailwind Configuration

Custom Tailwind configuration in `tailwind.config.js`:
- Custom screen sizes (`xs: '480px'`)
- CSS custom property colors
- Component and utility scanning

## Building for Production

### Local Production Build

```bash
npm run build
npm run start
```

### Build Optimization

The build process includes:
- TypeScript compilation and type checking
- Tailwind CSS optimization and purging
- Next.js optimization and code splitting
- Static asset optimization

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set the build command: `cd apps/web && npm run build`
3. Set the output directory: `apps/web/.next`
4. Add environment variables in Vercel dashboard

### Other Platforms

For other deployment platforms:
1. Ensure build directory is set to `apps/web`
2. Install command: `cd apps/web && npm install`
3. Build command: `cd apps/web && npm run build`
4. Serve from: `apps/web/.next`

## Troubleshooting

### Common Issues

**Build Errors:**
- Ensure you're in the `apps/web` directory
- Check Node.js version (18+ required)
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

**Development Server Issues:**
- Port 3000 already in use: Specify different port with `npm run dev -- -p 3001`
- Module resolution errors: Check import paths are relative to `apps/web`

**AI Features Not Working:**
- Check `OPENROUTER_API_KEY` is set in `.env.local`
- Verify API key is valid at [OpenRouter](https://openrouter.ai/keys)
- Check browser console for API errors

### Debug Tools

- **Next.js Debug**: Set `DEBUG=next:*` environment variable
- **TypeScript**: Run `npx tsc --noEmit` for type checking
- **Lint**: Run `npm run lint` for code quality checks

## Performance

### Development
- Uses Turbopack for faster development builds
- Hot module replacement for instant updates
- Optimized for large codebases

### Production
- Automatic code splitting
- Image optimization
- Static asset caching
- Bundle analysis available with `ANALYZE=true npm run build`

## Architecture

### Key Technologies
- **Next.js 15**: App Router with React 19
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Three.js**: 3D graphics rendering
- **React Three Fiber**: React integration for Three.js
- **ReactFlow**: Node-based visual programming
- **Clerk**: Authentication (if enabled)

### Design Patterns
- Component composition over inheritance
- Custom hooks for state management
- Type-safe API routes with Zod validation
- Modular node system architecture
- Reactive data flow with socket connections

## Contributing

### Code Style
- Use TypeScript for all new code
- Follow existing component patterns
- Use Tailwind for styling
- Add JSDoc comments for complex functions

### Testing
- Test components in isolation
- Verify node connections work correctly
- Test with various geometry inputs
- Performance test with large node graphs

For more information about the overall project structure, see the [main README](../../README.md).