# AI Prompt Templates

This file contains example prompts for generating nodes and scenes with the AI assistant.

## Node Generation Prompts

### Basic Geometry Nodes

#### Torus Generator
```
Create a torus (donut) geometry node with controls for major radius, minor radius, and segment count. Include material input for styling.
```

#### Hexagonal Prism
```
Build a hexagonal prism generator with height and radius controls. Add a sides parameter to make it configurable between 3-12 sides.
```

#### Rounded Cube
```
Create a rounded cube node with edge radius control and subdivision parameters for smooth corners.
```

### Procedural Generators

#### Spiral Staircase
```
Design a spiral staircase generator with:
- Number of steps (integer input)
- Step height and width controls
- Spiral radius and angle parameters
- Optional handrail generation
```

#### Tree Branch System
```
Create an organic tree branch generator using L-systems with:
- Branch iterations (recursion depth)
- Branch angle variation
- Length scaling factors
- Randomness seed for variation
```

#### Crystal Lattice
```
Build a crystal lattice generator that creates geometric crystal formations with:
- Crystal type selection (cubic, hexagonal, tetragonal)
- Size and density controls
- Random positioning with seed
- Faceted surface generation
```

### Terrain and Landscape

#### Perlin Noise Terrain
```
Create a terrain generator using Perlin noise with:
- Grid resolution controls
- Height amplitude scaling
- Frequency and octave parameters
- Optional texture coordinate generation
```

#### Rock Formation
```
Build a procedural rock generator that creates realistic rock shapes using:
- Base size controls (width, height, depth)
- Surface noise for texture
- Fractal displacement
- Erosion simulation parameters
```

### Architectural Elements

#### Brick Wall Generator
```
Design a brick wall node with:
- Wall dimensions (height, width, thickness)
- Brick size parameters
- Mortar gap thickness
- Random brick variation
- Weathering effects
```

#### Window Frame System
```
Create a parametric window frame generator with:
- Frame dimensions and depth
- Glass panel thickness
- Mullion patterns (grid, cross, decorative)
- Material inputs for frame and glass
```

### Organic and Natural Forms

#### Flower Petal System
```
Build a flower petal generator that creates realistic petals with:
- Petal count and arrangement
- Shape parameters (pointed, rounded, ruffled)
- Size variation and randomness
- Stem and center generation
```

#### Coral Reef Structure
```
Create a coral reef generator using fractal growth with:
- Coral type selection (branching, table, brain)
- Growth parameters and density
- Color variation inputs
- Surface texture detail
```

### Mathematical and Abstract

#### Möbius Strip
```
Generate a Möbius strip with configurable width, radius, and twist parameters. Include subdivision controls for smoothness.
```

#### Fibonacci Spiral
```
Create a 3D Fibonacci spiral generator with:
- Growth factor (golden ratio based)
- Number of iterations
- Thickness and taper controls
- Optional sphere placement at nodes
```

#### Parametric Surface
```
Build a parametric surface node that accepts mathematical equations for:
- X(u,v), Y(u,v), Z(u,v) functions
- Parameter ranges and resolution
- Normal calculation options
- UV mapping generation
```

## Scene Generation Prompts

### Natural Environments

#### Enchanted Forest
```
Create a magical forest scene with:
- Tall, twisted trees with glowing bark
- Floating luminescent particles
- Mushroom circles with bioluminescent caps
- Soft, ethereal lighting filtering through fog
- Ancient stone ruins covered in moss
```

#### Ocean Sunset
```
Design a serene ocean scene featuring:
- Calm water with gentle waves and foam
- A vibrant sunset sky with graduated colors
- Distant islands silhouetted against the horizon
- Seabirds flying in formation
- Light reflecting on the water surface
```

#### Mountain Landscape
```
Build a dramatic mountain landscape with:
- Layered mountain ridges fading into distance
- Snow-capped peaks with glacial features
- Alpine meadows with wildflowers
- Winding paths and rocky outcroppings
- Dynamic cloud formations
```

### Architectural Scenes

#### Futuristic Cityscape
```
Create a sci-fi city scene featuring:
- Sleek, geometric skyscrapers with glass facades
- Floating platforms and sky bridges
- Neon lighting and holographic displays
- Flying vehicles following traffic patterns
- Atmospheric haze and particle effects
```

#### Medieval Castle
```
Design a medieval castle complex with:
- Stone fortress walls with towers and battlements
- Wooden bridges and iron portcullis
- Surrounding village with thatched roofs
- Mountain backdrop with misty atmosphere
- Torch lighting and flickering shadows
```

#### Japanese Garden
```
Build a tranquil Japanese garden featuring:
- Zen rock garden with raked gravel patterns
- Wooden bridge over a koi pond
- Cherry blossom trees in full bloom
- Traditional stone lanterns
- Bamboo water feature (shishi-odoshi)
```

### Abstract and Artistic

#### Geometric Mandala
```
Create a 3D geometric mandala with:
- Radial symmetry and fractal patterns
- Layered geometric shapes (cubes, spheres, pyramids)
- Gradient materials transitioning through colors
- Gentle rotation animation
- Central focal point with light emission
```

#### Particle Flow Visualization
```
Design an abstract particle flow scene with:
- Streams of colored particles flowing in curves
- Particle trails and motion blur effects
- Gravitational attractors affecting flow
- Pulsing light sources
- Transparent, ethereal materials
```

#### Crystal Cave
```
Build a mystical crystal cave featuring:
- Large crystal formations in various colors
- Reflective surfaces and light refraction
- Glowing crystal veins in cave walls
- Atmospheric lighting with colored beams
- Floating crystal shards and particles
```

### Scientific and Technical

#### Solar System Model
```
Create an accurate solar system visualization with:
- Sun with surface detail and corona effects
- Planets in correct relative sizes and distances
- Orbital paths and rotation animations
- Asteroid belt between Mars and Jupiter
- Moons orbiting their parent planets
```

#### Molecular Structure
```
Design a molecular visualization showing:
- Atoms as spheres with element-based colors
- Chemical bonds as connecting cylinders
- Electron orbital representations
- Molecular vibration animations
- Scientific labeling and annotations
```

#### DNA Helix
```
Build a detailed DNA double helix with:
- Spiral sugar-phosphate backbone
- Base pairs (A-T, G-C) with correct colors
- Major and minor groove details
- Gentle rotation animation
- Scale indicators and measurements
```

### Fantasy and Mythology

#### Dragon's Lair
```
Create a dramatic dragon lair scene with:
- Volcanic cave environment with lava flows
- Treasure hoard with coins and gems
- Sleeping dragon with detailed scales
- Stalactites and crystalline formations
- Fire particles and heat shimmer effects
```

#### Underwater Atlantis
```
Design a lost city beneath the waves featuring:
- Ancient marble columns and temple ruins
- Coral growth on weathered structures
- Schools of tropical fish swimming through
- Shafts of sunlight penetrating from above
- Seaweed and aquatic vegetation
```

#### Fairy Ring Portal
```
Build a magical portal scene with:
- Mushroom ring with glowing caps
- Swirling energy vortex in the center
- Floating particles and light wisps
- Ancient runes carved in nearby stones
- Ethereal mist and atmospheric effects
```

## Tips for Better Prompts

### Node Generation Tips
1. **Specify Inputs**: Clearly list what parameters you want users to control
2. **Define Outputs**: Mention what the node should produce
3. **Include Math**: Reference specific algorithms or mathematical concepts
4. **Consider Performance**: Mention if you need LOD or optimization features
5. **Material Support**: Specify if the node should accept material inputs

### Scene Generation Tips
1. **Set the Mood**: Use descriptive adjectives for atmosphere
2. **Layer Elements**: Mention foreground, midground, and background
3. **Lighting**: Specify time of day, light sources, and shadows
4. **Materials**: Describe surface properties and textures
5. **Animation**: Mention any moving or changing elements
6. **Scale**: Give a sense of size and proportions

### General Best Practices
- **Be Specific**: Detailed prompts produce better results
- **Use Examples**: Reference real-world objects or known concepts
- **Mention Style**: Art style, realism level, or aesthetic preferences
- **Include Constraints**: Technical limitations or requirements
- **Iterate**: Start simple and add complexity in follow-up prompts 