# AI-Powered Node and Scene Generation

The geometry script editor now includes powerful AI capabilities for automatically generating geometry nodes and complete scenes using OpenRouter and various LLM models.

## Setup

### 1. Environment Variables

Create a `.env.local` file in your project root with your OpenRouter API key:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

Get your API key from: https://openrouter.ai/keys

### 2. Install Dependencies

The required dependencies are already included:
- `@openrouter/ai-sdk-provider`
- `ai` (Vercel AI SDK)
- `zod` (Schema validation)

## Features

### AI Panel

The AI panel appears as a purple magic wand button in the bottom-right corner of the editor. Click it to open the AI assistant interface.

### Two Main Modes

#### 1. Generate Nodes
Create custom geometry nodes by describing what you want:

**Example Prompts:**
- "Create a spiral staircase generator with configurable steps and radius"
- "Make a node that creates organic-looking tree branches"
- "Build a crystal lattice generator with adjustable density"
- "Create a procedural brick wall with mortar gaps"

#### 2. Generate Scenes
Create complete node graphs for complex 3D scenes:

**Example Prompts:**
- "Create a floating island with waterfalls and vegetation"
- "Build a futuristic city with glowing buildings"
- "Make an underwater scene with coral and fish"
- "Create a magical forest with glowing mushrooms"

### Available Models

Choose from multiple AI models:
- **Claude 3.5 Sonnet** (Default) - Best for complex geometry
- **GPT-4o** - Great for creative scenes
- **GPT-4o Mini** - Fast and efficient
- **Gemini Pro 1.5** - Good balance of speed and quality
- **Llama 3.1 70B** - Open source alternative
- **Mixtral 8x7B** - Fast open source option

### Generation Modes

#### Generate Mode
- Creates actual functional nodes/scenes
- Automatically registers nodes in the system
- Immediately usable in your projects

#### Explain Mode
- Provides detailed explanations of how to create nodes/scenes
- Educational tool for learning node design
- Step-by-step walkthroughs

## Usage Guide

### Creating Custom Nodes

1. **Open AI Panel**: Click the magic wand button
2. **Select "Generate Nodes" tab**
3. **Choose your model**: Select from the dropdown
4. **Write a descriptive prompt**: Be specific about what you want
5. **Click Generate**: The AI will create and register the node

**Tips for Node Prompts:**
- Be specific about inputs and outputs needed
- Mention any mathematical concepts involved
- Describe the visual result you want
- Include any animation or time-based behavior

### Creating Complete Scenes

1. **Open AI Panel**: Click the magic wand button
2. **Select "Generate Scenes" tab**
3. **Choose your model**: Select from the dropdown
4. **Describe your scene vision**: Include mood, elements, style
5. **Click Generate**: The AI will create the entire node graph

**Tips for Scene Prompts:**
- Describe the overall mood and atmosphere
- Mention specific objects or elements you want
- Include lighting preferences
- Specify any animation or movement
- Mention materials and textures

## Node Generation Examples

### Simple Geometry Node
**Prompt**: "Create a torus (donut) generator with major and minor radius controls"

**Generated Features**:
- Major radius input (controls overall size)
- Minor radius input (controls tube thickness)
- Segment controls for resolution
- Material input for styling

### Complex Procedural Node
**Prompt**: "Build a procedural building generator with floors, windows, and a roof"

**Generated Features**:
- Height, width, depth controls
- Floor count parameter
- Window density settings
- Roof style options
- Material inputs for different parts

## Scene Generation Examples

### Artistic Scene
**Prompt**: "Create a dreamy underwater coral reef with animated fish and flowing seaweed"

**Generated Elements**:
- Coral formations using procedural noise
- Swimming fish with path animation
- Flowing seaweed with wind simulation
- Underwater lighting and caustics
- Ocean floor with sand particles

### Architectural Scene
**Prompt**: "Design a modern minimalist house with large windows and a reflecting pool"

**Generated Elements**:
- Geometric building structure
- Large window panels with materials
- Reflecting pool with water effects
- Surrounding landscape elements
- Appropriate lighting setup

## Advanced Features

### Node Type System
The AI understands the complete socket type system:
- `geometry` - 3D meshes and shapes
- `vector` - 3D coordinates and directions
- `number` - Numeric values and parameters
- `material` - Surface appearance definitions
- `transform` - Position, rotation, scale
- `time` - Animation and temporal values

### Integration with Existing System
- Generated nodes automatically integrate with the existing node registry
- Compatible with all existing nodes and materials
- Saves to localStorage for persistence
- Can be exported/imported like any other nodes

### Streaming Responses
- Real-time feedback during generation
- Progress updates and status messages
- Error handling and recovery
- Export conversation history

## Best Practices

### For Node Generation
1. **Start Simple**: Begin with basic concepts, then iterate
2. **Be Specific**: Clear descriptions lead to better results
3. **Test Iteratively**: Generate, test, refine prompts
4. **Use Categories**: Think about where your node fits conceptually

### For Scene Generation
1. **Set the Mood**: Describe the atmosphere and feeling
2. **Layer Elements**: Mention foreground, midground, background
3. **Consider Animation**: Think about what moves or changes
4. **Material Awareness**: Mention textures and surface properties

## Troubleshooting

### Common Issues

**Node Generation Fails**
- Check your OpenRouter API key
- Verify internet connection
- Try a simpler prompt
- Switch to a different model

**Generated Node Doesn't Work**
- The AI is learning - some generations may need refinement
- Check the Three.js console for errors
- Try regenerating with more specific requirements

**Scene Too Complex**
- Break complex scenes into smaller parts
- Generate individual elements first
- Combine manually after generation

### Error Messages

**"API Key Missing"**
- Add `OPENROUTER_API_KEY` to your `.env.local` file
- Restart the development server

**"Model Not Available"**
- Try a different model from the dropdown
- Check OpenRouter status page

**"Generation Timeout"**
- Complex requests may take time
- Try breaking into smaller parts
- Use a faster model for initial iterations

## Contributing

The AI system is designed to be extensible:

### Adding New Models
Edit `app/agent/aiClient.ts` to include new OpenRouter models in the `getAvailableModels()` function.

### Improving Prompts
The system prompts can be enhanced in the `GeometryAIAgent` class to better understand geometry concepts.

### Custom Templates
Create prompt templates for common use cases to help users get started quickly.

## API Reference

### Core Classes

#### `GeometryAIAgent`
- `generateNode(prompt, model?)` - Generate a new node
- `generateScene(prompt, model?)` - Generate a complete scene
- `streamNodeGeneration(prompt, model?)` - Stream explanation
- `streamSceneGeneration(prompt, model?)` - Stream explanation

#### `AIPanel`
- Main UI component for AI interactions
- Handles streaming responses
- Manages conversation history
- Provides model selection interface

### API Endpoints

#### `/api/ai/generate-node`
- `POST` - Generate nodes with streaming response
- `GET` - List available models

#### `/api/ai/generate-scene`
- `POST` - Generate scenes with streaming response

## Future Enhancements

- **Template Library**: Pre-built prompts for common scenarios
- **Node Optimization**: AI-powered node graph optimization
- **Style Transfer**: Apply artistic styles to generated content
- **Collaborative Features**: Share and rate AI-generated content
- **Advanced Controls**: Fine-tune generation parameters
- **Multi-modal Input**: Support for image-based prompts

---

*The AI features are powered by OpenRouter, providing access to state-of-the-art language models for creative geometry generation.* 