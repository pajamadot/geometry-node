# JSON Node Architecture - Complete Database Integration

## Overview

Our data-driven node system supports **complete JSON serialization**, allowing nodes to be stored in databases, transmitted via APIs, and dynamically registered into the live system. This document demonstrates the full pipeline.

## ✅ Verified Capabilities

### 1. **Pure JSON Representation**
```typescript
// Example node as pure JSON - no functions or React components!
{
  "type": "custom-multiplier",
  "name": "Custom Multiplier",
  "description": "Multiplies input by a factor with optional power",
  "category": "math",
  "version": "1.0.0",
  "color": { "primary": "#8b5cf6", "secondary": "#7c3aed" },
  "inputs": [
    { "id": "value", "name": "Value", "type": "number", "defaultValue": 5 },
    { "id": "multiplier", "name": "Multiplier", "type": "number", "defaultValue": 2 }
  ],
  "outputs": [
    { "id": "result", "name": "Result", "type": "number" }
  ],
  "parameters": [
    { "id": "power", "name": "Power", "type": "number", "defaultValue": 1 }
  ],
  "execution": {
    "type": "expression",
    "expressions": {
      "result": "Math.pow(value * multiplier, power)"
    }
  },
  "ui": { "icon": "calculator" },
  "tags": ["custom", "math", "multiplier"],
  "author": "demo-user",
  "isPublic": true,
  "createdAt": "2024-01-23T10:00:00Z",
  "updatedAt": "2024-01-23T10:00:00Z"
}
```

### 2. **Database Storage**
- **Database Compatible**: Works with any JSON-compatible database (PostgreSQL, MongoDB, etc.)
- **Full CRUD Operations**: Complete Create, Read, Update, Delete via REST API
- **Versioning Support**: Built-in version tracking and metadata
- **User Management**: Public/private nodes with author attribution

### 3. **API Endpoints**
```typescript
// Available REST endpoints
GET    /api/nodes           // List all nodes
POST   /api/nodes           // Create new node
PUT    /api/nodes/:id       // Update existing node
DELETE /api/nodes/:id       // Delete node
GET    /api/nodes/export    // Export nodes as JSON
POST   /api/nodes/import    // Import nodes from JSON
```

### 4. **Dynamic Registration**
```typescript
// Load from database and register dynamically
const loadAndRegisterNode = async (nodeId: string) => {
  // 1. Load from database via API
  const response = await fetch(`/api/nodes/${nodeId}`);
  const nodeDefinition = await response.json();
  
  // 2. Register into live system
  await serializableNodeRegistry.registerSerializable(nodeDefinition);
  
  // 3. Node is now available for use!
  // Can be added to graphs, executed, etc.
};
```

### 5. **Execution Engine**
Our execution engine converts JSON execution definitions into live JavaScript functions:

```typescript
// JSON execution definition
{
  "execution": {
    "type": "expression",
    "expressions": {
      "result": "Math.pow(value * multiplier, power)"
    }
  }
}

// Becomes executable function
const executeFunction = (inputs, parameters) => {
  const { value, multiplier } = inputs;
  const { power } = parameters;
  return {
    result: Math.pow(value * multiplier, power)
  };
};
```

## 🏗️ Technical Architecture

### Serializable Types
```typescript
// All node data uses only JSON-serializable types
interface SerializableNodeDefinition {
  // Basic properties - all strings/numbers
  type: string;
  name: string;
  description: string;
  
  // JSON-compatible execution
  execution: SerializableExecution;
  
  // String-based icon identifiers (not React components)
  ui?: { icon?: IconType };
  
  // Arrays and objects - all serializable
  inputs: SocketDefinition[];
  outputs: SocketDefinition[];
  parameters: ParameterDefinition[];
  
  // Metadata - all primitives
  author?: string;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

### Execution Types
```typescript
// Serializable execution strategies
type SerializableExecution = 
  | { type: 'expression'; expressions: Record<string, string> }
  | { type: 'builtin'; functionName: string }
  | { type: 'template'; template: TemplateConfig }
  | { type: 'composite'; steps: CompositeStep[] };
```

### Icon System
```typescript
// String-based icon identifiers instead of React components
type IconType = 
  | 'calculator' | 'box' | 'sphere' | 'settings'
  | 'waves' | 'mountain' | 'sparkles' | 'zap'
  // ... more string identifiers

// Dynamically resolved to React components at runtime
const IconComponent = getIconComponent(node.ui.icon);
```

## 🔄 Complete Workflow

### 1. Create Node
```typescript
const createNode = (definition: SerializableNodeDefinition) => {
  // Node created with only JSON-serializable data
  return {
    ...definition,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
};
```

### 2. Save to Database
```typescript
const saveToDatabase = async (node: SerializableNodeDefinition) => {
  const response = await fetch('/api/nodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(node) // Pure JSON!
  });
  return response.json();
};
```

### 3. Load from Database
```typescript
const loadFromDatabase = async (): Promise<SerializableNodeDefinition[]> => {
  const response = await fetch('/api/nodes');
  return response.json(); // Pure JSON objects
};
```

### 4. Dynamic Registration
```typescript
const registerNode = async (node: SerializableNodeDefinition) => {
  // Compile execution from JSON to function
  const executeFunction = ExecutionEngine.compileExecution(node.execution);
  
  // Create runtime node definition
  const runtimeNode: NodeDefinition = {
    ...node,
    execute: executeFunction,
    icon: getIconComponent(node.ui.icon)
  };
  
  // Register in system
  nodeRegistry.register(runtimeNode);
};
```

### 5. Execute
```typescript
const executeNode = (nodeType: string, inputs: any, parameters: any) => {
  const node = nodeRegistry.getDefinition(nodeType);
  return node.execute(inputs, parameters);
};
```

## 🚀 Real-World Usage

### Database Integration
```sql
-- Example PostgreSQL table
CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(255) UNIQUE NOT NULL,
  definition JSONB NOT NULL,
  author_id UUID,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- JSON is stored directly in JSONB column
INSERT INTO nodes (type, definition, author_id, is_public) 
VALUES ('custom-multiplier', '{"name": "Custom Multiplier", ...}', user_id, true);
```

### API Implementation
```typescript
// Express.js backend example
app.get('/api/nodes', async (req, res) => {
  const nodes = await db.query('SELECT definition FROM nodes WHERE is_public = true');
  res.json(nodes.map(row => row.definition));
});

app.post('/api/nodes', async (req, res) => {
  const definition = req.body; // Pure JSON
  const result = await db.query(
    'INSERT INTO nodes (type, definition) VALUES ($1, $2) RETURNING *',
    [definition.type, JSON.stringify(definition)]
  );
  res.json(result.rows[0].definition);
});
```

### Frontend Integration
```typescript
// React component for dynamic node management
const NodeManager = () => {
  const [nodes, setNodes] = useState<SerializableNodeDefinition[]>([]);
  
  const loadNodes = async () => {
    const response = await fetch('/api/nodes');
    const loadedNodes = await response.json();
    setNodes(loadedNodes);
    
    // Register each node dynamically
    for (const node of loadedNodes) {
      await serializableNodeRegistry.registerSerializable(node);
    }
  };
  
  const createAndSaveNode = async (definition: SerializableNodeDefinition) => {
    // Save to database
    const saved = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(definition)
    }).then(r => r.json());
    
    // Register in live system
    await serializableNodeRegistry.registerSerializable(saved);
    
    // Update UI
    setNodes(prev => [...prev, saved]);
  };
};
```

## 💾 Database Examples

### MongoDB
```javascript
// Store as MongoDB document
{
  _id: ObjectId("..."),
  type: "custom-multiplier",
  definition: {
    name: "Custom Multiplier",
    inputs: [...],
    execution: {...}
  },
  authorId: ObjectId("..."),
  isPublic: true,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### PostgreSQL with JSONB
```sql
-- Efficient JSON queries with PostgreSQL
SELECT definition FROM nodes 
WHERE definition->>'category' = 'math' 
  AND definition->'tags' ? 'multiplier';

-- Index JSON fields for performance
CREATE INDEX idx_nodes_category ON nodes USING GIN ((definition->>'category'));
```

### Firebase/Firestore
```javascript
// Firestore document
{
  type: "custom-multiplier",
  definition: {
    name: "Custom Multiplier",
    // ... full JSON definition
  },
  authorId: "user123",
  isPublic: true,
  createdAt: firebase.firestore.Timestamp.now()
}
```

## 🔧 Migration & Versioning

### Version Management
```typescript
const migrateNode = (node: SerializableNodeDefinition, targetVersion: string) => {
  const migrator = new NodeMigrator();
  return migrator.migrate(node, targetVersion);
};

// Example migration
{
  "version": "2.0.0",
  "migrations": {
    "1.0.0->2.0.0": {
      "changes": ["renamed 'factor' input to 'multiplier'"],
      "transform": (node) => {
        // Automatically update old nodes
        if (node.inputs.find(i => i.id === 'factor')) {
          node.inputs.find(i => i.id === 'factor').id = 'multiplier';
        }
        return node;
      }
    }
  }
}
```

## ✨ Benefits

1. **Database Agnostic**: Works with any JSON-supporting database
2. **API Ready**: Standard REST operations out of the box
3. **Version Control**: JSON diffs work perfectly with Git
4. **Import/Export**: Trivial to backup, share, and migrate
5. **Type Safe**: Full TypeScript support with runtime validation
6. **Scalable**: Separation of definition (JSON) and execution (compiled)
7. **Collaborative**: Easy sharing and community node libraries
8. **Dynamic**: Hot-loading of new nodes without app restart

## 🎯 Conclusion

Our data-driven node system provides **complete JSON serialization** with:
- ✅ Pure JSON representation (no functions/components in data)
- ✅ Database storage via standard APIs
- ✅ Dynamic loading and registration
- ✅ Runtime compilation from JSON to executable functions
- ✅ Full CRUD operations via REST endpoints
- ✅ Type safety with TypeScript interfaces
- ✅ Collaborative sharing and community libraries

This enables building true **cloud-native node-based applications** where the entire node library can be stored, versioned, and shared through standard database and API infrastructure. 