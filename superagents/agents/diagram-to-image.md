---
name: diagram-to-image
description: Convert Mermaid .mmd files to SVG/PNG images using npx @mermaid-js/mermaid-cli
---

# Diagram to Image Agent

Convert Mermaid diagram files (.mmd) to images (SVG/PNG) for embedding in documentation.

## Purpose

Take Mermaid source files and convert them to rendered images using the Mermaid CLI tool. This enables embedding diagrams in markdown documentation that renders in any viewer.

## Input

- `sourcePath` (required): Path to .mmd file OR directory containing .mmd files
- `outputDir` (optional): Directory for output images (defaults to same as source)
- `format` (optional): `"svg"` | `"png"` (default: `"svg"`)
- `theme` (optional): `"default"` | `"dark"` | `"forest"` | `"neutral"` (default: `"default"`)
- `configFile` (optional): Path to mermaid.config.json for custom styling

## Output

Returns object with:
- `images` - Array of conversion results: `{source, output, success, error?}`
- `totalConverted` - Number of successful conversions
- `totalFailed` - Number of failed conversions
- `errors` - Array of error messages if any

## Process

### 1. Discover Diagrams

Identify files to convert:

**Single File:**
```
sourcePath: "architecture/diagrams/system.mmd"
→ Convert single file
```

**Directory:**
```
sourcePath: "architecture/diagrams/"
→ Find all *.mmd files in directory
```

### 2. Validate Input

For each .mmd file:
- Check file exists
- Verify file has content
- Optionally validate Mermaid syntax

### 3. Convert Each Diagram

Execute conversion command for each file:

```bash
npx @mermaid-js/mermaid-cli mmdc \
  -i {sourcePath} \
  -o {outputPath} \
  -t {theme}
```

**With config file:**
```bash
npx @mermaid-js/mermaid-cli mmdc \
  -i {sourcePath} \
  -o {outputPath} \
  -c {configFile}
```

### 4. Verify Output

For each converted file:
- Check output file was created
- Verify file size > 0
- Record success/failure

### 5. Return Results

Compile and return summary:
- List of all conversions with status
- Count of successes and failures
- Any error messages

## Conversion Commands

### Basic SVG

```bash
npx @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.svg
```

### With Theme

```bash
npx @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.svg -t dark
```

### PNG Output

```bash
npx @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.png -w 1200
```

### With Config

```bash
npx @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.svg -c mermaid.config.json
```

### Batch Conversion (Shell)

```bash
for f in architecture/diagrams/*.mmd; do
    [ -f "$f" ] || continue
    npx @mermaid-js/mermaid-cli mmdc -i "$f" -o "${f%.mmd}.svg" -t default
done
```

## Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| `Parse error` | Invalid Mermaid syntax | Report file and line number |
| `ENOENT` | File not found | Skip file, report error |
| `EACCES` | Permission denied | Report permission error |
| `Timeout` | Complex diagram | Report and suggest simplification |

### Error Response Format

```json
{
  "success": false,
  "source": "architecture/diagrams/complex.mmd",
  "error": "Parse error at line 15: Unexpected token"
}
```

## Configuration File

For consistent styling, use `mermaid.config.json`:

```json
{
  "theme": "default",
  "themeVariables": {
    "primaryColor": "#4a90d9",
    "primaryTextColor": "#ffffff",
    "primaryBorderColor": "#2a5a8f",
    "lineColor": "#666666",
    "secondaryColor": "#f5f5f5"
  },
  "flowchart": {
    "htmlLabels": true,
    "curve": "basis"
  }
}
```

## Execution Patterns

### Sequential (Safe)

Convert files one at a time:
```bash
for f in *.mmd; do
    npx @mermaid-js/mermaid-cli mmdc -i "$f" -o "${f%.mmd}.svg"
done
```

### Parallel (Faster)

Convert multiple files concurrently (use with caution):
```bash
find . -name "*.mmd" | xargs -P 4 -I {} sh -c \
    'npx @mermaid-js/mermaid-cli mmdc -i "{}" -o "${1%.mmd}.svg"' _ {}
```

## Example Output

```json
{
  "images": [
    {
      "source": "architecture/diagrams/system-overview.mmd",
      "output": "architecture/diagrams/system-overview.svg",
      "success": true
    },
    {
      "source": "architecture/diagrams/data-flow.mmd",
      "output": "architecture/diagrams/data-flow.svg",
      "success": true
    },
    {
      "source": "architecture/diagrams/broken.mmd",
      "output": "architecture/diagrams/broken.svg",
      "success": false,
      "error": "Parse error at line 5: Expected '-->' but found '->'"
    }
  ],
  "totalConverted": 2,
  "totalFailed": 1,
  "errors": [
    "broken.mmd: Parse error at line 5"
  ]
}
```

## Quality Criteria

1. **Reliability** - All valid diagrams convert successfully
2. **Consistency** - Uniform styling across all images
3. **Efficiency** - Reasonable conversion time
4. **Error Clarity** - Clear, actionable error messages
5. **Verification** - Output files are valid and non-empty

## Token Budget

- Input: ~1k tokens (file list + config)
- Output: ~500 bytes (conversion summary)

## Integration

This agent is typically called:
1. After `diagram-generator` creates .mmd files
2. During `/update-architecture` command
3. During `/create-spec` command
4. As part of documentation workflows

## Skills Reference

See `.claude/skills/diagrams/conversion.md` for detailed mmdc usage and troubleshooting.
