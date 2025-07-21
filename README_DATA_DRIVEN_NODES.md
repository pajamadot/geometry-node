# Data-Driven Node System

## Overview

This project has been upgraded from a component-based node system to a fully **data-driven, database-ready node system**. All nodes are now defined as JSON-serializable data structures that can be stored in databases, exported/imported, and dynamically created at runtime.

## 🚀 Key Features

### ✅ **Fully Serializable**
- All node definitions are JSON-serializable
- No React components or JavaScript functions in storage
- Database-ready data structures

### ✅ **Dynamic Execution Engine**
- Serializable execution definitions that compile to JavaScript functions
- Built-in function registry for common operations
- Expression-based execution for mathematical operations
- Template and composite execution types

### ✅ **Database Integration**
- REST API endpoints for CRUD operations
- User-specific and public node libraries
- Import/export functionality
- Search and filtering capabilities

### ✅ **Backward Compatibility**
- Hybrid registry system maintains existing functionality
- Automatic migration from legacy nodes
- Gradual adoption path

## 📁 Architecture

```
app/
├── types/
│   └── nodeSystem.ts           # Core type definitions
├── registry/
│   ├── SerializableNodeRegistry.ts    # New registry system
│   ├── ExecutionEngine.ts             # Compiles serializable execution
│   ├── IconRegistry.ts                # String-based icon mapping
│   └── NodeDefinitionConverter.ts     # Legacy conversion utilities
├── api/
│   ├── nodes/route.ts                 # CRUD API endpoints
│   └── nodes/export/route.ts          # Import/export endpoints
├── hooks/
│   └── useNodeDatabase.ts             # React hooks for database ops
├── components/
│   └── NodeLibrary.tsx               # Database node browser
└── demo/
    └── DataDrivenNodesDemo.tsx       # Complete demo
```

## 🔧 Core Types

### SerializableNodeDefinition
```typescript
interface SerializableNodeDefinition {
  id?: string;
  type: string;
  name: string;
  description: string;
  category: NodeCategory;
  version?: string;
  
  color: { primary: string; secondary: string };
  inputs: SocketDefinition[];
  outputs: SocketDefinition[];
  parameters: ParameterDefinition[];
  
  // Serializable execution
  execution: SerializableExecution;
  
  // Metadata
  tags?: string[];
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  isPublic?: boolean;
}
```

### SerializableExecution
```typescript
interface SerializableExecution {
  type: 'builtin' | 'expression' | 'template' | 'composite';
  
  // For builtin functions
  functionName?: string;
  
  // For mathematical expressions
  expressions?: Record<string, string>;
  
  // For template-based execution
  template?: TemplateConfig;
  
  // For multi-step operations
  steps?: CompositeStep[];
}
```

## 🛠️ Execution Types

### 1. Builtin Functions
Reference pre-registered functions by name:
```json
{
  "type": "builtin",
  "functionName": "cube"
}
```

### 2. Mathematical Expressions
Define outputs as mathematical expressions:
```json
{
  "type": "expression",
  "expressions": {
    "result": "valueA + valueB * Math.sin(valueC)"
  }
}
```

### 3. Template Operations
Multi-step template execution:
```json
{
  "type": "template",
  "template": {
    "operations": [
      {
        "operation": "add",
        "inputs": ["x", "y"],
        "output": "sum"
      }
    ]
  }
}
```

### 4. Composite Steps
Complex multi-operation nodes:
```json
{
  "type": "composite",
  "steps": [
    {
      "operation": "cube",
      "inputs": { "width": 1, "height": 1, "depth": 1 },
      "output": "geometry"
    }
  ]
}
```

## 💾 Database Operations

### Save Node
```typescript
const nodeRegistry = SerializableNodeRegistry.getInstance();
await nodeRegistry.registerSerializable(nodeDefinition);
```

### Load Nodes
```typescript
await nodeRegistry.loadFromDatabase(userId);
```

### Export/Import
```typescript
// Export
const json = await nodeRegistry.exportUserNodes(userId);

// Import
const count = await nodeRegistry.importNodes(jsonData);
```

## 🎯 API Endpoints

### Node CRUD
```
GET    /api/nodes              # List/search nodes
POST   /api/nodes              # Create node
PUT    /api/nodes              # Update node
DELETE /api/nodes?id={id}      # Delete node
```

### Import/Export
```
GET    /api/nodes/export?userId={id}    # Export user nodes
POST   /api/nodes/export?userId={id}    # Import nodes
```

## 🎨 React Hooks

### useNodeDatabase
```typescript
const {
  nodes,
  loading,
  error,
  saveNode,
  deleteNode,
  exportNodes,
  importNodes,
  searchNodes
} = useNodeDatabase(userId);
```

### useNode
```typescript
const { node, loading, error } = useNode(nodeId);
```

## 📝 Example Usage

### Creating a Custom Node
```typescript
const customNode: SerializableNodeDefinition = {
  type: 'custom-multiply',
  name: 'Custom Multiply',
  description: 'Multiplies input by a factor',
  category: 'math',
  version: '1.0.0',
  color: { primary: '#10b981', secondary: '#059669' },
  
  inputs: [
    { id: 'value', name: 'Value', type: 'number', defaultValue: 0 }
  ],
  outputs: [
    { id: 'result', name: 'Result', type: 'number' }
  ],
  parameters: [
    { id: 'factor', name: 'Factor', type: 'number', defaultValue: 2 }
  ],
  
  execution: {
    type: 'expression',
    expressions: {
      'result': 'value * factor'
    }
  },
  
  ui: { icon: 'calculator' },
  tags: ['math', 'multiply'],
  author: 'user123',
  isPublic: true
};

// Save to database
await serializableNodeRegistry.registerSerializable(customNode);
```

### Using the Node Library Component
```tsx
import NodeLibrary from './components/NodeLibrary';

function App() {
  const [showLibrary, setShowLibrary] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowLibrary(true)}>
        Open Node Library
      </button>
      
      {showLibrary && (
        <NodeLibrary
          userId="user123"
          isOpen={showLibrary}
          onClose={() => setShowLibrary(false)}
          onAddNode={(nodeType) => {
            // Add node to graph
            console.log('Adding node:', nodeType);
          }}
        />
      )}
    </div>
  );
}
```

## 🧪 Demo

Check out the complete demo at `app/demo/DataDrivenNodesDemo.tsx` which showcases:

- JSON node definitions
- Database storage and retrieval
- Dynamic execution
- Import/export functionality
- Custom node creation

## 🔄 Migration Path

The system maintains backward compatibility through a hybrid approach:

1. **Legacy nodes** continue to work as before
2. **New nodes** use the serializable system
3. **Automatic conversion** from legacy to serializable format
4. **Gradual migration** without breaking existing functionality

## 🚀 Benefits

### For Developers
- **No more boilerplate**: Define nodes as simple JSON
- **Type safety**: Full TypeScript support
- **Hot swapping**: Update nodes without code changes
- **Version control**: Nodes are just JSON files

### For Users
- **Shareable nodes**: Export and share custom nodes
- **Cloud storage**: Personal node libraries
- **Marketplace ready**: Public node sharing
- **No downtime**: Dynamic node loading

### For Teams
- **Collaborative**: Shared node libraries
- **Versioned**: Track node evolution
- **Deployment**: Database-driven updates
- **Scalable**: No code changes for new nodes

## 🎉 Conclusion

Your node system is now:
- ✅ **Database-ready** - Store and retrieve nodes dynamically
- ✅ **JSON-serializable** - Export/import anywhere
- ✅ **Execution-flexible** - Multiple execution strategies
- ✅ **User-friendly** - Rich library and editing interfaces
- ✅ **Scalable** - No code changes needed for new nodes

The transformation from a static component-based system to a dynamic data-driven system opens up unlimited possibilities for extensibility, sharing, and collaboration! 🚀 