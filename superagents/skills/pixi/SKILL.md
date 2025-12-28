# PixiJS Skill

## When to Use
- 2D games and interactive media
- Canvas-based visualizations
- High-performance graphics
- WebGL/WebGPU rendering

## Technology Stack
- **PixiJS v8** - 2D rendering engine
- **@pixi/react** - React 19 integration
- **@pixi/ui** - UI components
- **@pixi/sound** - Audio support

## API Reference

**WARNING**: `reference.md` is 250KB+ (7000+ lines). Do NOT read it fully.
- Use `Grep` to search for specific API methods
- Read only the section you need with offset/limit
- Example: `Grep pattern="class Sprite" path="skills/pixi/reference.md"`

## Setup

```bash
npm create pixi.js@latest
# Or add to existing project
npm install pixi.js
```

## Basic Application

```typescript
import { Application, Assets, Sprite, Container } from 'pixi.js'

async function main() {
  // Create application
  const app = new Application()
  await app.init({
    background: '#1099bb',
    resizeTo: window,
    // antialias: true,
    // resolution: window.devicePixelRatio
  })

  document.body.appendChild(app.canvas)

  // Load assets
  const texture = await Assets.load('sprite.png')

  // Create sprite
  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5)
  sprite.x = app.screen.width / 2
  sprite.y = app.screen.height / 2

  app.stage.addChild(sprite)

  // Game loop
  app.ticker.add((time) => {
    sprite.rotation += 0.01 * time.deltaTime
  })
}

main()
```

## Core Concepts

### Scene Graph
```typescript
// Containers group objects
const container = new Container()
app.stage.addChild(container)

// Children inherit transforms
container.addChild(sprite1)
container.addChild(sprite2)

// Transform container affects children
container.x = 100
container.rotation = Math.PI / 4
container.scale.set(2)
```

### Asset Loading
```typescript
// Single asset
const texture = await Assets.load('image.png')

// Multiple assets
const assets = await Assets.load(['a.png', 'b.png', 'c.png'])

// Bundles (recommended for games)
Assets.addBundle('game', {
  player: 'player.png',
  enemy: 'enemy.png',
  background: 'bg.png'
})
const bundle = await Assets.loadBundle('game')

// Background loading
Assets.backgroundLoad(['level2.png', 'level3.png'])
```

### Sprites
```typescript
const sprite = new Sprite(texture)

// Positioning
sprite.x = 100
sprite.y = 200
sprite.position.set(100, 200)

// Anchor (pivot point, 0-1)
sprite.anchor.set(0.5) // Center
sprite.anchor.set(0, 0) // Top-left (default)

// Scale
sprite.scale.set(2) // Uniform
sprite.scale.set(2, 1) // Non-uniform

// Rotation (radians)
sprite.rotation = Math.PI / 4 // 45 degrees

// Visibility
sprite.visible = false
sprite.alpha = 0.5

// Tint
sprite.tint = 0xff0000 // Red tint
```

### Graphics (Shapes)
```typescript
const graphics = new Graphics()

// Rectangle
graphics.rect(0, 0, 100, 50)
graphics.fill(0xff0000)

// Circle
graphics.circle(50, 50, 30)
graphics.fill({ color: 0x00ff00, alpha: 0.5 })

// Line
graphics.moveTo(0, 0)
graphics.lineTo(100, 100)
graphics.stroke({ width: 2, color: 0x0000ff })

// Polygon
graphics.poly([0, 0, 50, 100, 100, 0])
graphics.fill(0xffff00)
```

### Text
```typescript
import { Text, TextStyle, BitmapText } from 'pixi.js'

// Regular text (Canvas-based)
const style = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 36,
  fill: 0xffffff,
  stroke: { color: 0x000000, width: 4 }
})
const text = new Text({ text: 'Hello!', style })

// Bitmap text (GPU-based, better performance)
await Assets.load('fonts/bitmap.fnt')
const bitmapText = new BitmapText({
  text: 'Score: 0',
  style: { fontFamily: 'BitmapFont', fontSize: 32 }
})
```

## Game Loop Patterns

### Delta Time
```typescript
// Always use deltaTime for frame-independent movement
app.ticker.add((time) => {
  // time.deltaTime = frames elapsed (1 at 60fps)
  // time.elapsedMS = milliseconds since last frame

  sprite.x += speed * time.deltaTime
})
```

### Fixed Timestep
```typescript
const FIXED_DT = 1000 / 60 // 60 updates per second
let accumulator = 0

app.ticker.add((time) => {
  accumulator += time.elapsedMS

  while (accumulator >= FIXED_DT) {
    fixedUpdate(FIXED_DT)
    accumulator -= FIXED_DT
  }

  render(accumulator / FIXED_DT) // Interpolation factor
})
```

## Input Handling

### Pointer Events
```typescript
sprite.eventMode = 'static' // Enable events
sprite.cursor = 'pointer'

sprite.on('pointerdown', (event) => {
  console.log('Clicked at', event.global.x, event.global.y)
})

sprite.on('pointerup', handler)
sprite.on('pointermove', handler)
sprite.on('pointerover', handler)
sprite.on('pointerout', handler)
```

### Keyboard
```typescript
const keys: Record<string, boolean> = {}

window.addEventListener('keydown', (e) => {
  keys[e.code] = true
})

window.addEventListener('keyup', (e) => {
  keys[e.code] = false
})

app.ticker.add((time) => {
  if (keys['ArrowLeft']) player.x -= speed * time.deltaTime
  if (keys['ArrowRight']) player.x += speed * time.deltaTime
})
```

## Performance Patterns

### Object Pooling
```typescript
class BulletPool {
  private pool: Bullet[] = []
  private active: Set<Bullet> = new Set()

  get(): Bullet {
    const bullet = this.pool.pop() ?? new Bullet()
    bullet.visible = true
    this.active.add(bullet)
    return bullet
  }

  release(bullet: Bullet) {
    bullet.visible = false
    this.active.delete(bullet)
    this.pool.push(bullet)
  }
}
```

### Sprite Batching
```typescript
// Use spritesheets for batching
const spritesheet = await Assets.load('spritesheet.json')
const textures = spritesheet.textures

// All sprites from same sheet batch together
const sprite1 = new Sprite(textures['frame1.png'])
const sprite2 = new Sprite(textures['frame2.png'])
```

### Culling
```typescript
import { CullerPlugin } from 'pixi.js'

// Enable automatic culling
app.stage.cullable = true
app.stage.cullArea = new Rectangle(0, 0, app.screen.width, app.screen.height)
```

### Cache as Texture
```typescript
// Cache complex containers as single texture
container.cacheAsTexture(true)

// Update when contents change
container.updateCacheTexture()
```

## React Integration

```tsx
import { Application, extend } from '@pixi/react'
import { Container, Sprite, Graphics } from 'pixi.js'

// Extend pixi.js classes for React
extend({ Container, Sprite, Graphics })

function Game() {
  return (
    <Application background="#1099bb" resizeTo={window}>
      <container x={100} y={100}>
        <sprite texture={texture} anchor={0.5} />
      </container>
    </Application>
  )
}
```

## Common Game Patterns

### Animation
```typescript
import { AnimatedSprite, Assets } from 'pixi.js'

const sheet = await Assets.load('animations.json')
const frames = Object.values(sheet.textures)

const animation = new AnimatedSprite(frames)
animation.animationSpeed = 0.1
animation.play()

// Control
animation.stop()
animation.gotoAndPlay(5)
animation.loop = false
animation.onComplete = () => console.log('done')
```

### Collision Detection (AABB)
```typescript
function intersects(a: Sprite, b: Sprite): boolean {
  const boundsA = a.getBounds()
  const boundsB = b.getBounds()

  return (
    boundsA.x < boundsB.x + boundsB.width &&
    boundsA.x + boundsA.width > boundsB.x &&
    boundsA.y < boundsB.y + boundsB.height &&
    boundsA.y + boundsA.height > boundsB.y
  )
}
```

### Camera/Viewport
```typescript
class Camera {
  container: Container
  target?: Sprite

  constructor(stage: Container) {
    this.container = new Container()
    stage.addChild(this.container)
  }

  follow(target: Sprite) {
    this.target = target
  }

  update(screenWidth: number, screenHeight: number) {
    if (!this.target) return
    this.container.x = screenWidth / 2 - this.target.x
    this.container.y = screenHeight / 2 - this.target.y
  }
}
```

## Related Skills
- [reference.md](reference.md) - Full PixiJS documentation
- `frontend-react` - React patterns
- `frontend-design` - UI/UX design
