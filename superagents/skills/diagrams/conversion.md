# Diagram Image Conversion

Converting Mermaid diagrams to images using `npx @mermaid-js/mermaid-cli`.

## Overview

Mermaid diagrams in `.mmd` files are converted to SVG images for embedding in markdown documentation. This uses the official Mermaid CLI tool via `npx` (no pre-installation required).

## Basic Usage

### Single File Conversion

```bash
npx @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.svg
```

### Directory Batch Conversion

```bash
# Convert all .mmd files in a directory
for f in architecture/diagrams/*.mmd; do
    npx @mermaid-js/mermaid-cli mmdc -i "$f" -o "${f%.mmd}.svg"
done
```

## Command Options

| Option | Description | Example |
|--------|-------------|---------|
| `-i, --input` | Input .mmd file | `-i diagram.mmd` |
| `-o, --output` | Output file | `-o diagram.svg` |
| `-t, --theme` | Theme name | `-t default` |
| `-w, --width` | Width in pixels | `-w 800` |
| `-H, --height` | Height in pixels | `-H 600` |
| `-b, --backgroundColor` | Background color | `-b transparent` |
| `-c, --configFile` | Config JSON file | `-c mermaid.config.json` |
| `-p, --puppeteerConfigFile` | Puppeteer config | `-p puppeteer.json` |

## Output Formats

| Extension | Format | Use Case |
|-----------|--------|----------|
| `.svg` | Vector | Web, markdown (recommended) |
| `.png` | Raster | Fixed-size images |
| `.pdf` | PDF | Print, documents |

**Recommended**: Use SVG for all web/markdown use cases. Vector format scales cleanly.

## Themes

| Theme | Description |
|-------|-------------|
| `default` | Light theme with blue accents |
| `dark` | Dark background, light text |
| `forest` | Green nature-inspired |
| `neutral` | Grayscale, minimal |

```bash
# Use dark theme
npx @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.svg -t dark
```

## Configuration File

For consistent styling across all diagrams, create `mermaid.config.json`:

```json
{
  "theme": "default",
  "themeVariables": {
    "primaryColor": "#4a90d9",
    "primaryTextColor": "#ffffff",
    "primaryBorderColor": "#2a5a8f",
    "lineColor": "#666666",
    "secondaryColor": "#f5f5f5",
    "tertiaryColor": "#e8e8e8",
    "edgeLabelBackground": "#ffffff"
  },
  "flowchart": {
    "htmlLabels": true,
    "curve": "basis"
  },
  "sequence": {
    "diagramMarginX": 50,
    "diagramMarginY": 10,
    "actorMargin": 50,
    "width": 150,
    "height": 65
  }
}
```

Use with:
```bash
npx @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.svg -c mermaid.config.json
```

## Project Integration

### Standard Conversion Script

Create `scripts/convert-diagrams.sh`:

```bash
#!/bin/bash
set -e

# Convert all Mermaid diagrams to SVG
DIRS=("architecture/diagrams" "spec/diagrams" ".agents/plans/diagrams")

for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        for f in "$dir"/*.mmd; do
            [ -f "$f" ] || continue
            output="${f%.mmd}.svg"
            echo "Converting: $f -> $output"
            npx @mermaid-js/mermaid-cli mmdc -i "$f" -o "$output" -t default
        done
    fi
done

echo "Done!"
```

### TypeScript/Bun Script

```typescript
import { $ } from "bun";
import { glob } from "glob";

const dirs = ["architecture/diagrams", "spec/diagrams", ".agents/plans/diagrams"];

for (const dir of dirs) {
  const files = await glob(`${dir}/*.mmd`);
  for (const file of files) {
    const output = file.replace(".mmd", ".svg");
    console.log(`Converting: ${file} -> ${output}`);
    await $`npx @mermaid-js/mermaid-cli mmdc -i ${file} -o ${output} -t default`;
  }
}
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `npx: command not found` | Node.js not installed | Install Node.js 18+ |
| `Parse error at line X` | Invalid Mermaid syntax | Check syntax in [Mermaid Live Editor](https://mermaid.live) |
| `ENOENT: no such file` | File path incorrect | Verify .mmd file exists |
| `EACCES: permission denied` | Write permission issue | Check output directory permissions |
| `Timed out` | Complex diagram | Increase timeout or simplify diagram |

### Debug Mode

```bash
# Enable verbose output for debugging
npx @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.svg 2>&1 | tee conversion.log
```

### Validate Syntax First

Before batch conversion, validate syntax using Mermaid Live Editor or:

```bash
# Check if diagram parses (dry run)
npx @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o /dev/null
```

## Best Practices

1. **Use SVG format** - Scales cleanly, smaller file size
2. **Use consistent theme** - Project-wide `mermaid.config.json`
3. **Keep source .mmd files** - Commit both .mmd and .svg to git
4. **Automate conversion** - Run script before commits or in CI
5. **Verify output** - Check SVG renders correctly in target context

## Markdown Embedding

After conversion, reference in markdown using relative paths:

```markdown
## System Architecture

![System Overview](./diagrams/system-overview.svg)

The diagram above shows...
```

For GitHub/GitLab, SVG files render inline automatically.

## CI Integration

### GitHub Actions Example

```yaml
- name: Convert Mermaid diagrams
  run: |
    for f in architecture/diagrams/*.mmd; do
      [ -f "$f" ] || continue
      npx @mermaid-js/mermaid-cli mmdc -i "$f" -o "${f%.mmd}.svg"
    done
```

## Puppeteer Configuration

For headless environments (CI/Docker), create `puppeteer-config.json`:

```json
{
  "args": ["--no-sandbox", "--disable-setuid-sandbox"]
}
```

Use with:
```bash
npx @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.svg -p puppeteer-config.json
```
