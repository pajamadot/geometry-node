# Type Renderer System

A comprehensive, data-driven type rendering system for node-based interfaces, inspired by Blender's node system.

## Overview

This system provides consistent rendering for all parameter types with the following patterns:

### Socket Row Template
- **Input (unwired)**: `PIN → LABEL → WIDGET`
- **Input (wired)**: `PIN → LABEL`
- **Output**: `LABEL → PIN`

### Type-Specific Widgets

| Type | Widget | Socket Style |
|------|--------|--------------|
| Geometry | (no widget) | Fat diamond, cyan |
| Float | Numeric field/slider | Circle, grey |
| Integer | Stepper field | Circle, dark-grey |
| Boolean | Checkbox/toggle | Circle, green |
| Vector2 | X/Y numeric fields | Circle, teal |
| Vector3 | X/Y/Z numeric fields | Circle, teal |
| Vector4 | X/Y/Z/W numeric fields | Circle, teal |
| Rotation (Euler) | XYZ degree fields | Circle, sky-blue |
| Quaternion | XYZW numeric fields | Circle, sky-blue |
| Matrix3 | 3×3 numeric grid | Circle, dark-cyan |
| Matrix4 | 4×4 numeric grid | Circle, dark-cyan |
| Color (RGBA) | Color picker swatch | Circle, yellow |
| String | Single-line text box | Circle, purple |
| Enum | Combo-box/dropdown | Circle, lilac |

## File Structure

```
type-renderers/
├── types.ts              # Base types and metadata
├── SocketRenderer.tsx    # Base socket rendering component
├── TypeRenderer.tsx      # Main type renderer component
├── index.ts             # Exports
├── TypeRendererDemo.tsx # Demo component
├── README.md           # This file
└── widgets/            # Individual widget components
    ├── NumericWidget.tsx
    ├── StepperWidget.tsx
    ├── CheckboxWidget.tsx
    ├── VectorWidget.tsx
    ├── ColorWidget.tsx
    ├── TextWidget.tsx
    ├── DropdownWidget.tsx
    ├── RotationWidget.tsx
    └── MatrixWidget.tsx
```

## Usage

### Basic Usage

```tsx
import { TypeRenderer } from './type-renderers';

// Render a number input
<TypeRenderer
  id="my-number"
  name="Value"
  type="number"
  isConnected={false}
  isInput={true}
  value={42}
  onValueChange={(value) => console.log(value)}
/>

// Render a vector output
<TypeRenderer
  id="my-vector"
  name="Position"
  type="vector"
  isConnected={false}
  isInput={false}
  value={{ x: 1, y: 2, z: 3 }}
/>
```

### Specific Type Renderers

```tsx
import { 
  NumberRenderer, 
  VectorRenderer, 
  BooleanRenderer 
} from './type-renderers';

// Use specific renderers for better type safety
<NumberRenderer
  id="width"
  name="Width"
  isConnected={false}
  isInput={true}
  value={10}
  min={0}
  max={100}
  onValueChange={setWidth}
/>
```

### Integration with Node Layout

```tsx
// In your node layout component
import { TypeRenderer } from './type-renderers';

const renderInput = (input: InputComponent) => (
  <TypeRenderer
    id={input.id}
    name={input.name}
    type={input.type}
    isConnected={isConnected}
    isInput={true}
    value={socketValues[input.id]}
    defaultValue={input.defaultValue}
    onValueChange={(value) => handleSocketValueChange(input.id, value)}
    min={input.min}
    max={input.max}
    step={input.step}
    options={input.options}
  />
);
```

## Features

### ✅ Consistent Rendering
- All types follow the same pin → label → widget pattern
- Automatic widget hiding when connected
- Consistent styling and spacing

### ✅ Type-Safe
- Full TypeScript support
- Type-specific renderers for better safety
- Proper type checking for values and callbacks

### ✅ Extensible
- Easy to add new parameter types
- Modular widget system
- Customizable styling through metadata

### ✅ Data-Driven
- Type metadata defines appearance
- Widget mapping is configurable
- No hardcoded rendering logic

### ✅ Blender-Style
- Follows Blender's node system patterns
- Proper socket shapes and colors
- Consistent with industry standards

## Adding New Types

1. **Add to ParameterType** in `app/types/nodeSystem.ts`:
```typescript
export type ParameterType = 
  | 'existing' 
  | 'new-type';  // Add here
```

2. **Add metadata** in `types.ts`:
```typescript
export const TYPE_METADATA: Record<ParameterType, SocketStyle> = {
  // ... existing types
  'new-type': {
    color: '#your-color',
    className: 'new-type-handle',
    size: 'medium',
    shape: 'circle'
  }
};
```

3. **Add widget mapping** in `types.ts`:
```typescript
export const TYPE_WIDGET_MAP: Record<ParameterType, WidgetType> = {
  // ... existing mappings
  'new-type': 'appropriate-widget-type'
};
```

4. **Create widget component** in `widgets/` folder if needed

5. **Add to TypeRenderer** in `TypeRenderer.tsx`

## Demo

Run the demo component to see all types in action:

```tsx
import { TypeRendererDemo } from './type-renderers/TypeRendererDemo';

// In your app
<TypeRendererDemo />
```

This shows each type in all three states: unwired input, wired input, and output. 