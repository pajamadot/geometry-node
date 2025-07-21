# Geometry Script - Procedural Geometry System

A comprehensive web-based procedural geometry system for creating and managing complex 3D geometry with advanced node-based editing and real-time visualization.

## Features

### Core Features
- **Node-Based Geometry Creation**: Create complex 3D geometry using a visual node editor
- **Real-Time 3D Viewport**: Live preview of geometry with Three.js rendering
- **Advanced Node System**: 30+ built-in nodes for geometry manipulation
- **Time Animation**: Animate geometry with time-based nodes and parameters
- **Memory Optimization**: Built-in memory monitoring and optimization tools
- **Resizable Layout**: Customizable split-panel interface

### Geometry Nodes
- **Primitives**: Cube, Sphere, Cylinder with customizable parameters
- **Mathematical Operations**: Add, Subtract, Multiply, Divide, Power, Sin, Cos, Sqrt, Abs
- **Vector Mathematics**: Vector operations with 3D vector support
- **Transformations**: Position, Rotation, Scale with real-time updates
- **Geometry Modifiers**: Subdivide, Boolean operations, Mesh merging
- **Point Distribution**: Random, Poisson, Grid point distribution
- **Instancing**: Instance geometry on points with rotation and scale
- **Parametric Surfaces**: Create complex surfaces with mathematical functions

### Advanced Nodes
- **Time Node**: Animate parameters with time-based functions
- **Gesner Wave**: Create wave-based geometry patterns
- **Lighthouse**: Generate lighthouse-like structures
- **Seagull**: Create organic, seagull-inspired geometry
- **Low Poly Rock**: Generate stylized rock formations
- **Spiral Stair**: Create spiral staircase geometry
- **Mesh Boolean**: Union, Difference, Intersection operations

### Data Flow System
- **Socket Connections**: Type-safe connections between nodes
- **Parameter System**: Live parameter updates with real-time feedback
- **Make/Break Nodes**: Compose and decompose complex data structures
- **Generic Templates**: Dynamic node generation from templates

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Setup
1. Clone this repository:
```bash
git clone <repository-url>
cd geometry-script
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Guide

### Basic Workflow
1. **Create Nodes**: Right-click in the node editor to add nodes
2. **Connect Nodes**: Drag from output sockets to input sockets
3. **Adjust Parameters**: Modify node parameters in the right panel
4. **View Results**: See real-time updates in the 3D viewport

### Node Categories

#### Geometry Primitives
- **Cube**: Basic box geometry with width, height, depth
- **Sphere**: Spherical geometry with radius and segments
- **Cylinder**: Cylindrical geometry with radius, height, segments

#### Mathematical Operations
- **Math Node**: Basic arithmetic operations
- **Vector Math**: 3D vector operations
- **Time Node**: Time-based animation and functions

#### Transformations
- **Transform Node**: Position, rotation, and scale
- **Make/Break Transform**: Compose/decompose transform data

#### Geometry Modifiers
- **Subdivide Mesh**: Increase geometry resolution
- **Mesh Boolean**: Boolean operations between geometries
- **Join Node**: Combine multiple geometries
- **Merge Geometry**: Merge vertex and face data

#### Point Operations
- **Distribute Points**: Create point clouds with various patterns
- **Instance on Points**: Place geometry instances on points
- **Create Vertices**: Manual vertex creation
- **Create Faces**: Manual face topology creation

### Advanced Features

#### Time Animation
- Use the **Time Node** to create animated parameters
- Connect time outputs to other node parameters
- Real-time animation preview in the viewport

#### Parametric Surfaces
- Create complex surfaces using mathematical functions
- Define U and V functions for X, Y, Z coordinates
- Adjust segment counts for resolution control

#### Memory Management
- Built-in memory monitoring
- Automatic optimization for large geometries
- Performance warnings for complex node graphs

### Keyboard Shortcuts
- **Right-click**: Open context menu
- **Alt+Click**: Break connections
- **Ctrl+[**: Resize left panel
- **Ctrl+]**: Resize right panel
- **Ctrl+\**: Reset panel sizes

## Node Reference

### Input/Output Types
- **Geometry**: 3D mesh data
- **Vector**: 3-component vectors (x, y, z)
- **Number**: Single numeric values
- **Integer**: Whole numbers
- **Boolean**: True/false values
- **String**: Text data
- **Color**: Color values
- **Time**: Time/animation data
- **Points**: Point cloud data
- **Vertices**: Raw vertex data
- **Faces**: Face topology data
- **Instances**: Instance data
- **Material**: Material properties
- **Transform**: Position + Rotation + Scale

### Socket Compatibility
The system includes automatic type checking for connections:
- Geometry sockets connect to geometry inputs
- Vector sockets connect to vector inputs
- Number sockets connect to number and integer inputs
- Time sockets connect to time and number inputs

## Development

### Project Structure
```
app/
├── components/          # React components
│   ├── type-renderers/ # Parameter input widgets
│   └── widgets/        # UI widgets
├── registry/           # Node definitions
│   └── nodes/         # Individual node files
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

### Adding New Nodes
1. Create a new node definition in `app/registry/nodes/`
2. Define inputs, outputs, and parameters
3. Implement the execute function
4. Register the node in `app/registry/nodes/index.ts`

### Node Definition Example
```typescript
export const myNodeDefinition: NodeDefinition = {
  type: 'my-node',
  name: 'My Node',
  description: 'A custom node for geometry creation',
  category: 'geometry',
  color: {
    primary: '#eab308',
    secondary: '#fbbf24'
  },
  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      required: true
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry'
    }
  ],
  parameters: [
    {
      id: 'scale',
      name: 'Scale',
      type: 'number',
      defaultValue: 1.0,
      min: 0.1,
      max: 10.0
    }
  ],
  execute: (inputs, parameters) => {
    // Node execution logic
    return { geometry: inputs.geometry };
  }
};
```

## Performance Tips

### Optimization
- Use fewer nodes for simple operations
- Enable memory monitoring for large scenes
- Use appropriate segment counts for primitives
- Avoid excessive subdivision for real-time performance

### Best Practices
- Organize node graphs logically from left to right
- Use descriptive node labels
- Group related operations together
- Test complex graphs with simple inputs first

## Troubleshooting

### Common Issues
- **Nodes not connecting**: Check socket type compatibility
- **Viewport not updating**: Ensure nodes are properly connected
- **Performance issues**: Reduce geometry complexity or node count
- **Memory warnings**: Use optimization tools or simplify the graph

### Debug Tools
- **Log Panel**: View system messages and errors
- **Memory Monitor**: Track memory usage
- **Error Boundaries**: Graceful error handling

## Technical Details

### Architecture
- **Frontend**: Next.js 15 with React 19
- **3D Rendering**: Three.js with React Three Fiber
- **Node Editor**: ReactFlow for visual programming
- **Type System**: TypeScript for type safety
- **Styling**: Tailwind CSS for modern UI

### Key Technologies
- **ReactFlow**: Node-based visual programming
- **Three.js**: 3D graphics and rendering
- **React Three Fiber**: React integration for Three.js
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework

## Contributing

We welcome contributions! Please feel free to:

- Report bugs and issues
- Suggest new features
- Submit pull requests
- Add new node types
- Improve documentation

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is released under the MIT License. See LICENSE file for details.

## Support

For support, feature requests, or bug reports, please create an issue on the project repository.

## Version History

### v0.1.0
- Initial release
- Basic node-based geometry system
- Real-time 3D viewport
- 30+ built-in nodes
- Time animation system
- Memory optimization tools
- Resizable layout interface
