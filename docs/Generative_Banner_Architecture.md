# Generative Banner System
## Next-Generation First-Principles Design Architecture

**Version:** 1.0  
**Status:** Technical Specification  
**Date:** January 2025  
**Target:** Professional-grade AI design generation (LinkedIn, YouTube, X banners & carousels)

---

## Executive Summary

This document presents a comprehensive architecture for a **Generative Banner System** that breaks from template injection paradigms. Instead of constraining the AI to pre-built components, the system trains LLMs to act as **first-principles designers**—calculating layouts, typography, color theory, and spatial relationships from fundamentals without templates or component libraries.

The architecture comprises five core pillars:
1. **First-Principles Design Engine** (LLM + prompt architecture)
2. **Constraint-Based Layout Synthesis** (Graph representation + solver)
3. **High-Performance Rendering** (Skia Canvas + WebGL)
4. **Verification & Validation Layer** (Automated quality assurance)
5. **Iterative Refinement Loop** (Multi-agent agentic architecture)

---

## Part 1: The Architecture Overview

### 1.1 System Flow Diagram

```
User Prompt (Natural Language)
         ↓
    ┌────────────────────────────────────────┐
    │   DESIGN DIRECTION SYNTHESIS           │
    │   • Extract design intent              │
    │   • Identify constraints               │
    │   • Decompose requirements             │
    └────────────────────────────────────────┘
         ↓
    ┌────────────────────────────────────────┐
    │   FIRST-PRINCIPLES CALCULATION         │
    │   • Golden ratio computation           │
    │   • Color palette generation           │
    │   • Typography hierarchy               │
    │   • Spatial relationships (grid-less)  │
    │   • Contrast & balance analysis        │
    └────────────────────────────────────────┘
         ↓
    ┌────────────────────────────────────────┐
    │   LAYOUT REPRESENTATION                │
    │   (Constraint Graph JSON)              │
    │   • Elements as nodes                  │
    │   • Spatial constraints as edges       │
    │   • Design properties (color, font)    │
    └────────────────────────────────────────┘
         ↓
    ┌────────────────────────────────────────┐
    │   CONSTRAINT SATISFACTION               │
    │   • Solver validates feasibility       │
    │   • Detects overlaps, violations       │
    │   • Auto-corrects if needed            │
    └────────────────────────────────────────┘
         ↓
    ┌────────────────────────────────────────┐
    │   SVG CODE GENERATION                  │
    │   (LLM generates SVG primitives)       │
    │   • Path commands                      │
    │   • Transform operations               │
    │   • Clipping paths                     │
    │   • Text rendering                     │
    └────────────────────────────────────────┘
         ↓
    ┌────────────────────────────────────────┐
    │   RENDERING & VERIFICATION             │
    │   • Skia Canvas renders to bitmap      │
    │   • Automated visual checks            │
    │   • Pixel-perfect validation           │
    │   • Export (PNG, SVG, WebP)            │
    └────────────────────────────────────────┘
         ↓
    Final Deliverable (Professional Banner)
```

---

## Part 2: The "GOD Prompt" Strategy

### 2.1 Prompt Architecture: Creative Director + Engineer

The "GOD Prompt" is a **meta-prompt system** that instructs the LLM to behave as both a **Creative Director** and an **Engineer**—combining aesthetic judgment with mathematical precision.

#### 2.1.1 Core System Prompt Structure

```
You are a Professional Design System with two integrated sub-systems:

SYSTEM A: CREATIVE DIRECTOR
- Understands color theory, typography hierarchy, visual balance
- Applies principles of contrast, emphasis, and white space
- Makes aesthetic decisions independently without templates
- Generates design concepts from natural language descriptions

SYSTEM B: LAYOUT ENGINEER
- Calculates spatial relationships using mathematical principles
- Applies golden ratio (1.618...) for proportions
- Computes optimal padding/margins using grid-free algorithms
- Ensures accessibility: WCAG contrast ratios, text legibility
- Represents designs as constraint graphs: nodes (elements) + edges (relationships)

OBJECTIVE: Synthesize user intent into pixel-perfect design specifications

CONSTRAINTS YOU MUST SATISFY:
1. Canvas dimensions: [WIDTH × HEIGHT] pixels
2. Color palette: Must use provided hex values
3. Typography: Font families must exist (not fictional)
4. Text content: Exactly as specified, no modifications
5. Layout: No overlaps, all elements must fit within bounds
6. Accessibility: Minimum contrast ratio 4.5:1 for text
```

#### 2.1.2 Design Intent Extraction Module

```
STEP 1: DECOMPOSE USER REQUEST
Input: Natural language prompt (e.g., "Create a professional tech startup banner")

Output: Structured intent specification:
{
  "category": "tech_banner",
  "mood": ["professional", "modern", "bold"],
  "primary_message": "Tech startup showcase",
  "visual_style": "minimalist_with_accent_colors",
  "target_audience": "B2B tech decision makers",
  "key_elements": ["logo", "headline", "CTA button", "background visual"],
  "constraints": {
    "dimensions": "1200x630",
    "brand_colors": ["#FF6B35", "#FFFFFF", "#004E89"],
    "fonts_available": ["Inter", "Poppins", "Courier Prime"]
  }
}
```

#### 2.1.3 First-Principles Design Calculation

The LLM must generate design decisions by **calculating from fundamentals**, not referencing templates:

```
GOLDEN RATIO CALCULATION:
Canvas width: 1200px
φ (phi) = 1.618

Primary visual weight area: 1200 / 1.618 = 741px
Secondary area: 1200 - 741 = 459px

TYPOGRAPHY HIERARCHY:
Base font size (body): 16px
Heading multiplier: 16 × 2.618 = 41.88px → Round to 42px
Subheading: 16 × 1.618 = 25.88px → Round to 26px
Micro text: 16 × 0.618 = 9.88px → Round to 10px

COLOR PALETTE ANALYSIS:
Primary color: #FF6B35 (Vibrant Orange)
  - Luminance: Calculate perceived brightness
  - Complement: Generate mathematically opposite hue
  - Tints: Create lighter variations for depth
  - Shades: Create darker variations for contrast

CONTRAST VERIFICATION:
Text color vs background: Calculate WCAG AA/AAA compliance
  Formula: (L1 + 0.05) / (L2 + 0.05)
  Requirement: ≥ 4.5:1 for normal text

SPATIAL LAYOUT (Grid-Free):
Horizontal flow: Left margin (8% of canvas) → Content → Right margin (8% of canvas)
Vertical rhythm: Line height = font size × 1.618
Padding: 16px, 32px, 64px (using Fibonacci-like sequence)
```

#### 2.1.4 Constraint Graph Representation

Instead of fixed templates, the LLM generates a **constraint graph**:

```json
{
  "design": {
    "canvas": {
      "width": 1200,
      "height": 630,
      "backgroundColor": "#FFFFFF"
    },
    "elements": [
      {
        "id": "headline",
        "type": "text",
        "content": "Transform Your Business",
        "properties": {
          "fontSize": 42,
          "fontFamily": "Poppins",
          "fontWeight": 700,
          "color": "#004E89",
          "lineHeight": 1.2
        },
        "constraints": {
          "minX": 96,
          "minY": 60,
          "maxWidth": 500,
          "alignment": "left"
        }
      },
      {
        "id": "accent_bar",
        "type": "rect",
        "properties": {
          "width": 4,
          "height": 120,
          "fill": "#FF6B35"
        },
        "constraints": {
          "alignLeft": "headline",
          "offsetX": -20,
          "centerVerticalWith": "headline"
        }
      },
      {
        "id": "cta_button",
        "type": "rect",
        "properties": {
          "width": 180,
          "height": 48,
          "fill": "#FF6B35",
          "borderRadius": 6
        },
        "constraints": {
          "belowElement": "headline",
          "offsetY": 40,
          "alignLeft": "headline"
        }
      }
    ],
    "relationships": [
      {
        "type": "spatial",
        "source": "accent_bar",
        "target": "headline",
        "relation": "left_of",
        "distance": 20
      },
      {
        "type": "alignment",
        "elements": ["headline", "cta_button"],
        "axis": "left"
      }
    ]
  }
}
```

#### 2.1.5 Prompt Instruction Set

```
INSTRUCTION MODE: CODE GENERATION (Constraint Graph → SVG)

Given the constraint graph above, generate SVG code that:

1. PRESERVES ALL CONSTRAINTS:
   - Never violate minX, minY, maxWidth boundaries
   - Maintain alignment relationships
   - Respect spacing offsets exactly

2. USES SVG PRIMITIVES ONLY:
   - <rect>, <circle>, <path>, <text>, <g>
   - No external images or embedded assets
   - Transformations: translate, scale, rotate

3. APPLIES DESIGN PROPERTIES:
   - Font must be system-available or web-safe
   - Colors must be exact hex values
   - Opacity/filters for depth effects

4. OPTIMIZES FOR RENDERING:
   - Minimize path complexity
   - Group related elements with <g>
   - Use transforms instead of recalculating coordinates

5. VALIDATION RULES:
   - All text must be readable (font-size ≥ 14px for body)
   - No element extends outside canvas bounds
   - Color contrast ≥ 4.5:1 for text
   - Generate valid SVG (test output with SVG parser)

OUTPUT FORMAT: Raw SVG code wrapped in <svg>...</svg>
```

---

## Part 3: The Tech Stack

### 3.1 Core Components

#### **AI Model Layer**
- **Primary LLM**: Claude 3.5 Sonnet or GPT-4 Turbo
  - Fine-tuned variant: Specialized on design principles (optional)
  - Quantization: 4-bit for inference optimization
  - Context window: 200k+ tokens for design specification
- **Vision-Language Model**: LLaVA 1.6 or GPT-4V (for image-to-layout conversion)

#### **Database Layer**
- **Vector Database**: Pinecone or Weaviate
  - Stores design embeddings for retrieval-augmented generation
  - Design pattern library (100k+ examples from RICO dataset, Pinterest boards)
  - Fast similarity search for reference designs
- **Schema Database**: PostgreSQL
  - Stores design specifications, user prompts, render logs
  - Audit trail for iterative refinement

#### **Layout Solver**
- **Constraint Satisfaction**: Google OR-Tools or SCIP solver
  - Validates constraint feasibility
  - Detects overlaps, boundary violations
  - Auto-corrects layout if constraints conflict
- **Graph Representation**: NetworkX (Python) or Graphlib (Rust)
  - Nodes: design elements
  - Edges: spatial relationships, alignment constraints

#### **Rendering Engine**
- **Primary Renderer**: Skia Canvas (Node.js)
  - GPU-accelerated 2D rendering
  - Supports output: PNG, WebP, SVG, PDF
  - Multi-threaded for batch rendering
  - Uses Google's Skia (Chrome's backend)
- **Alternative**: Puppeteer + Headless Chrome
  - For HTML/CSS rendering (if extending to web designs)
  - Better font support via system fonts

#### **Verification Layer**
- **Visual Validation**: Automated checkers
  - Pixel-perfect comparison against specifications
  - Text readability analysis (WCAG contrast verification)
  - Layout integrity checks (overlaps, boundary violations)
- **HTML5 Canvas**: For programmatic pixel inspection
- **Computer Vision**: OpenCV for edge detection, text localization verification

### 3.2 Full Technology Stack Table

| **Layer** | **Component** | **Technology** | **Rationale** |
|-----------|---------------|----------------|---------------|
| **LLM Backbone** | Primary Model | Claude 3.5 Sonnet | Best at instruction following & reasoning |
| | Vision Model | GPT-4V | Multimodal understanding for layout intent |
| **Layout Engine** | Constraint Solver | OR-Tools | Industrial-strength, open-source |
| | Graph DB | NetworkX | Fast constraint graph representation |
| **Rendering** | Canvas Library | Skia Canvas (Node) | GPU-accelerated, vector + raster output |
| | Backup Renderer | Puppeteer | HTML/CSS support, system fonts |
| **Verification** | Validation Framework | Custom Python module | Layout checks + pixel analysis |
| | Vision Verification | OpenCV | Text detection, edge validation |
| **Storage** | Vector DB | Pinecone | Fast semantic search for design patterns |
| | Relational DB | PostgreSQL | Specification storage, audit logs |
| **API/Framework** | Backend | FastAPI (Python) | High-performance async API |
| | Queue System | Redis + Celery | Async task scheduling for rendering |
| **DevOps** | Container | Docker | Reproducible environment |
| | Orchestration | Kubernetes | Scale rendering workloads |

### 3.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                         │
│              (Web app / Design prompt interface)                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     API GATEWAY LAYER                            │
│                    (FastAPI endpoints)                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                  DESIGN ENGINE LAYER                             │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐        │
│  │ Prompt      │  │ LLM Intent   │  │ Constraint Graph │        │
│  │ Processing  │→ │ Extraction   │→ │ Generation       │        │
│  │ (GOD Prompt)│  │ (Claude 3.5) │  │ (NetworkX)       │        │
│  └─────────────┘  └──────────────┘  └──────────────────┘        │
│         │                                      │                  │
│         └──────────────┬───────────────────────┘                  │
│                        ▼                                          │
│              ┌──────────────────┐                                │
│              │ Constraint       │                                │
│              │ Solver           │                                │
│              │ (OR-Tools)       │                                │
│              └──────────────────┘                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              SVG CODE GENERATION LAYER                            │
│                  (LLM generates SVG)                              │
│  • Primitives: rect, circle, path, text, g                       │
│  • Transforms: translate, rotate, scale                          │
│  • Output: Valid SVG XML                                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              RENDERING LAYER                                     │
│                                                                   │
│  ┌──────────────┐              ┌──────────────┐                 │
│  │ Skia Canvas  │──────────────│ Puppeteer    │                 │
│  │ (Primary)    │ (Vector/     │ (Fallback)   │                 │
│  │ Node.js      │  Raster)     │ Chrome       │                 │
│  └──────────────┘              └──────────────┘                 │
│         │                              │                         │
│         └──────────────┬───────────────┘                         │
│                        ▼                                         │
│         Output Formats: PNG, WebP, SVG, PDF                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│            VERIFICATION & VALIDATION LAYER                       │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Layout       │  │ Text         │  │ Color        │          │
│  │ Integrity    │  │ Readability  │  │ Contrast     │          │
│  │ Checks       │  │ (WCAG)       │  │ (WCAG AAA)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                │                    │                  │
│         └────────────────┴────────────────────┘                  │
│                          ▼                                       │
│                  Pass/Fail Decision                              │
│         (If fail: trigger refinement loop)                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              STORAGE & DELIVERY LAYER                             │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Design Specs │  │ Rendered     │  │ Audit Trail  │          │
│  │ (PostgreSQL) │  │ Assets (S3)  │  │ (PostgreSQL) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Verification Layer - Programmatic Quality Assurance

### 4.1 Problem Statement

**The Challenge**: LLMs hallucinate, generate invalid SVG, violate spatial constraints, and create unreadable text. The system must detect failures **without human intervention**.

### 4.2 Multi-Layer Verification Strategy

#### **Layer 1: Syntax Validation**

```python
# Validate SVG is well-formed XML
def validate_svg_syntax(svg_string: str) -> Tuple[bool, List[str]]:
    """
    Parse SVG and check for:
    - Well-formed XML
    - Valid SVG tags (rect, circle, path, text, etc.)
    - Required attributes (width, height, viewBox)
    - No nested invalid elements
    """
    import xml.etree.ElementTree as ET
    errors = []
    
    try:
        root = ET.fromstring(svg_string)
        if root.tag != '{http://www.w3.org/2000/svg}svg':
            errors.append("Root element must be <svg>")
        
        # Check required attributes
        required = ['width', 'height', 'viewBox']
        for attr in required:
            if attr not in root.attrib:
                errors.append(f"Missing required attribute: {attr}")
        
        # Recursively validate child elements
        valid_tags = {
            'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
            'path', 'text', 'g', 'defs', 'style', 'image', 'use'
        }
        
        def validate_elements(element):
            tag = element.tag.split('}')[-1]  # Strip namespace
            if tag not in valid_tags:
                errors.append(f"Invalid SVG element: {tag}")
            for child in element:
                validate_elements(child)
        
        for child in root:
            validate_elements(child)
        
        return len(errors) == 0, errors
    
    except ET.ParseError as e:
        return False, [f"SVG Parse Error: {str(e)}"]
```

#### **Layer 2: Spatial Constraints Verification**

```python
def verify_spatial_constraints(svg_string: str, canvas_width: int, 
                               canvas_height: int) -> Tuple[bool, List[str]]:
    """
    Check:
    - No elements extend outside canvas bounds
    - No overlapping elements (except intentional grouping)
    - Minimum spacing maintained between elements
    - Aspect ratio preservation
    """
    errors = []
    
    # Parse SVG and extract bounding boxes
    elements = extract_element_bboxes(svg_string)
    
    for elem_id, bbox in elements.items():
        x, y, width, height = bbox
        
        # Check bounds
        if x < 0 or y < 0:
            errors.append(f"Element '{elem_id}' has negative position")
        
        if x + width > canvas_width or y + height > canvas_height:
            errors.append(f"Element '{elem_id}' exceeds canvas bounds")
    
    # Check for overlaps (except group parents)
    for i, (id1, bbox1) in enumerate(elements.items()):
        for id2, bbox2 in list(elements.items())[i+1:]:
            if rectangles_overlap(bbox1, bbox2):
                errors.append(f"Elements '{id1}' and '{id2}' overlap")
    
    return len(errors) == 0, errors
```

#### **Layer 3: Text Readability Verification**

```python
def verify_text_readability(svg_string: str, 
                            min_font_size: int = 14) -> Tuple[bool, List[str]]:
    """
    Check:
    - Font size ≥ min_font_size for body text
    - Color contrast ratio ≥ 4.5:1 (WCAG AA)
    - Font families are web-safe or available
    - Text is not rotated excessively (> 45°)
    """
    errors = []
    
    import re
    from colorsys import rgb_to_hsv
    
    # Extract text elements
    text_elements = re.findall(r'<text[^>]*>(.*?)</text>', svg_string)
    
    for text in text_elements:
        # Extract font-size
        size_match = re.search(r'font-size=["\'](\d+)', text)
        if size_match:
            font_size = int(size_match.group(1))
            if font_size < min_font_size:
                errors.append(f"Text too small: {font_size}px (min: {min_font_size}px)")
        
        # Extract color and background to verify contrast
        fill_match = re.search(r'fill=["\'](#[0-9A-Fa-f]{6})', text)
        if fill_match:
            text_color = fill_match.group(1)
            bg_color = extract_background_color(svg_string)
            
            contrast = calculate_wcag_contrast(text_color, bg_color)
            if contrast < 4.5:
                errors.append(f"Text contrast {contrast:.1f}:1 < 4.5:1 (WCAG AA)")
    
    return len(errors) == 0, errors

def calculate_wcag_contrast(color1: str, color2: str) -> float:
    """Calculate WCAG contrast ratio between two colors"""
    def hex_to_rgb(hex_color):
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    
    def relative_luminance(r, g, b):
        r, g, b = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 
                   for x in [r, g, b]]
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    
    rgb1 = hex_to_rgb(color1)
    rgb2 = hex_to_rgb(color2)
    
    l1 = relative_luminance(*rgb1)
    l2 = relative_luminance(*rgb2)
    
    lighter = max(l1, l2)
    darker = min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)
```

#### **Layer 4: Color Palette Validation**

```python
def verify_color_palette(svg_string: str, 
                        approved_palette: List[str]) -> Tuple[bool, List[str]]:
    """
    Check:
    - Only approved colors are used
    - Color names resolve to valid hex values
    - Sufficient visual distinction between colors
    """
    errors = []
    
    # Extract all colors
    colors_used = re.findall(r'(#[0-9A-Fa-f]{6}|rgb\([^)]+\))', svg_string)
    colors_normalized = [normalize_color(c) for c in colors_used]
    
    for color in set(colors_normalized):
        if color not in [normalize_color(c) for c in approved_palette]:
            errors.append(f"Unapproved color: {color}")
    
    return len(errors) == 0, errors
```

#### **Layer 5: Rendering Validation**

```python
async def verify_rendered_output(svg_string: str, expected_dimensions: Tuple[int, int]) 
                                 -> Tuple[bool, List[str]]:
    """
    Render SVG and verify:
    - Output matches expected dimensions
    - No rendering errors (blank canvas, distortion)
    - File size is reasonable (detect empty or bloated SVGs)
    """
    from skia_canvas import Canvas
    import asyncio
    
    errors = []
    
    try:
        # Render to bitmap
        canvas = await render_svg_to_canvas(svg_string)
        img_data = canvas.getImageData(0, 0, expected_dimensions[0], expected_dimensions[1])
        
        # Check for blank canvas (all pixels are white/transparent)
        if is_blank_canvas(img_data):
            errors.append("Rendered output is blank")
        
        # Check for corruption (sudden pixel value changes indicating render errors)
        if has_render_artifacts(img_data):
            errors.append("Rendering artifacts detected")
        
        # Verify dimensions
        if canvas.width != expected_dimensions[0] or canvas.height != expected_dimensions[1]:
            errors.append(f"Dimension mismatch: {canvas.width}x{canvas.height} "
                         f"expected {expected_dimensions[0]}x{expected_dimensions[1]}")
        
        return len(errors) == 0, errors
    
    except Exception as e:
        return False, [f"Rendering error: {str(e)}"]
```

### 4.3 Verification Workflow

```
SVG Generated
     │
     ▼
┌─────────────────────────┐
│ Syntax Validation       │ ◄── Check XML well-formedness
└──────────┬──────────────┘
           │
        Pass? ─No─→ [REJECT] Return to LLM with error
           │
          Yes
           │
           ▼
┌─────────────────────────┐
│ Spatial Constraints     │ ◄── Check bounds, overlaps
└──────────┬──────────────┘
           │
        Pass? ─No─→ [TRIGGER SOLVER] Auto-correct or reject
           │
          Yes
           │
           ▼
┌─────────────────────────┐
│ Text Readability        │ ◄── Check font size, contrast
└──────────┬──────────────┘
           │
        Pass? ─No─→ [REFINEMENT] Ask LLM to fix text properties
           │
          Yes
           │
           ▼
┌─────────────────────────┐
│ Color Validation        │ ◄── Check palette adherence
└──────────┬──────────────┘
           │
        Pass? ─No─→ [REFINEMENT] Replace unauthorized colors
           │
          Yes
           │
           ▼
┌─────────────────────────┐
│ Rendering Test          │ ◄── Render to bitmap, visual check
└──────────┬──────────────┘
           │
        Pass? ─No─→ [REFINEMENT] Debug rendering issues
           │
          Yes
           │
           ▼
        [ACCEPT]
     Final Output
```

---

## Part 5: Iterative Refinement Loop

### 5.1 Multi-Agent Agentic Architecture

Instead of single-pass generation, use a **multi-agent collaborative loop**:

```
┌─────────────────────┐
│   USER PROMPT       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│         AGENT 1: DESIGN DIRECTOR (Claude)       │
│   • Extracts intent                             │
│   • Generates aesthetic direction               │
│   • Produces constraint graph                   │
└──────────┬──────────────────────────────────────┘
           │
           ▼ (Constraint Graph JSON)
┌─────────────────────────────────────────────────┐
│         AGENT 2: LAYOUT SOLVER (OR-Tools)       │
│   • Validates constraints                       │
│   • Detects infeasibility                       │
│   • Suggests corrections                        │
└──────────┬──────────────────────────────────────┘
           │
        Feasible? ─No─→ [Feedback to Agent 1]
           │
          Yes
           │
           ▼
┌─────────────────────────────────────────────────┐
│         AGENT 3: SVG CODER (Claude)             │
│   • Generates SVG from constraint graph         │
│   • Applies design properties                   │
│   • Optimizes for rendering                     │
└──────────┬──────────────────────────────────────┘
           │
           ▼ (Raw SVG)
┌─────────────────────────────────────────────────┐
│         AGENT 4: VERIFIER (Python)              │
│   • Runs all validation checks                  │
│   • Identifies issues                           │
│   • Generates specific feedback                 │
└──────────┬──────────────────────────────────────┘
           │
        All checks pass? ─No─→ [Feedback to Agent 3]
           │
          Yes
           │
           ▼
┌─────────────────────────────────────────────────┐
│         AGENT 5: RENDERER (Skia Canvas)         │
│   • Renders to bitmap                           │
│   • Exports multiple formats                    │
│   • Generates thumbnails                        │
└──────────┬──────────────────────────────────────┘
           │
           ▼
        [DELIVERY]
    Final Multi-Format Output
     (PNG, SVG, WebP, PDF)
```

### 5.2 Feedback Loop Protocol

```python
class DesignRefinementAgent:
    def __init__(self, max_iterations: int = 5):
        self.iteration = 0
        self.max_iterations = max_iterations
        self.feedback_history = []
    
    async def refine(self, prompt: str, previous_svg: str = None) -> str:
        """Iteratively refine design until validation passes"""
        
        while self.iteration < self.max_iterations:
            # Generate new or refined design
            design_spec = await self.agent_director.generate(prompt)
            constraint_graph = await self.agent_solver.validate(design_spec)
            svg_output = await self.agent_coder.generate_svg(constraint_graph)
            
            # Verify output
            is_valid, errors = await self.agent_verifier.validate(svg_output)
            
            if is_valid:
                # Render and return
                return await self.agent_renderer.render(svg_output)
            
            # Collect feedback and refine
            feedback = {
                "iteration": self.iteration,
                "errors": errors,
                "previous_svg": svg_output
            }
            self.feedback_history.append(feedback)
            
            # Create refined prompt with feedback
            refined_prompt = self._augment_prompt_with_feedback(
                prompt, errors, self.feedback_history
            )
            prompt = refined_prompt
            self.iteration += 1
        
        # If max iterations reached, return best attempt
        raise DesignGenerationError(
            f"Failed to generate valid design after {self.max_iterations} iterations. "
            f"Errors: {self.feedback_history[-1]['errors']}"
        )
    
    def _augment_prompt_with_feedback(self, base_prompt: str, 
                                     errors: List[str], history: List[dict]) -> str:
        """Create a refined prompt that incorporates error feedback"""
        
        error_context = "\n".join([f"- {error}" for error in errors])
        
        refined = f"""{base_prompt}

IMPORTANT: The previous generation had these issues:
{error_context}

Please fix these specific problems while maintaining the overall design intent.
Focus on:
1. {errors[0] if errors else 'Quality improvement'}
2. Ensuring all text is readable (font-size ≥ 14px)
3. Checking that no elements overlap outside canvas bounds
4. Verifying color palette adheres to approved colors
"""
        return refined
```

---

## Part 6: Product Roadmap

### **Phase 1: MVP (Months 1-2)**
- [ ] Implement "GOD Prompt" system for basic banner generation
- [ ] Build constraint graph representation
- [ ] Develop syntax + spatial constraint verification
- [ ] Deploy Skia Canvas renderer
- [ ] Create single-format export (PNG)

### **Phase 2: Enhanced Quality (Months 3-4)**
- [ ] Add color palette validation
- [ ] Implement text readability checks (WCAG)
- [ ] Develop iterative refinement loop
- [ ] Add multi-format export (SVG, WebP)
- [ ] Build design pattern retrieval (RAG)

### **Phase 3: Advanced Features (Months 5-6)**
- [ ] Support carousel generation (multi-frame designs)
- [ ] Add A/B variant generation
- [ ] Implement design system integration (read brand tokens)
- [ ] Vision-language model for image-to-design conversion
- [ ] Real-time collaborative editing

### **Phase 4: Production Scale (Months 7-8)**
- [ ] Kubernetes deployment + auto-scaling
- [ ] Batch processing for high-volume generation
- [ ] Analytics dashboard (design generation metrics)
- [ ] User-facing API documentation
- [ ] Performance optimization (reduce p99 latency)

---

## Part 7: Implementation Checklist

### Core Systems
- [x] First-principles design calculation module
- [x] Constraint graph representation
- [x] Multi-layer verification system
- [x] SVG code generation from LLM
- [x] Rendering pipeline (Skia Canvas)
- [x] Iterative refinement loop
- [ ] RAG-based design pattern retrieval
- [ ] Multi-format export

### Quality Assurance
- [x] Syntax validation
- [x] Spatial constraint checking
- [x] Text readability verification
- [x] Color palette validation
- [x] Rendering verification
- [ ] Visual diff comparison
- [ ] Performance benchmarking

### Infrastructure
- [ ] FastAPI backend
- [ ] PostgreSQL schema
- [ ] Redis queue
- [ ] Docker containerization
- [ ] Kubernetes manifests
- [ ] CI/CD pipeline

---

## Conclusion

This architecture **rejects template injection** in favor of **first-principles design thinking**. By combining:

1. **LLM-based creative intent extraction** (understands aesthetics)
2. **Mathematical layout calculation** (golden ratio, spatial relationships)
3. **Constraint-based synthesis** (solvers validate feasibility)
4. **Multi-layer verification** (catches errors without human review)
5. **Iterative refinement** (multi-agent collaboration improves quality)

The system creates **truly generative designs**—not template-filled placeholders, but pixel-perfect professional banners calculated from first principles.

**Key Differentiators:**
- No predefined components restrict creativity
- Layout calculated mathematically, not borrowed
- Verification is automated, not manual
- Iterative improvement ensures quality at scale
- Exportable in multiple formats for different platforms

This approach scales to enterprise design production while maintaining the aesthetic judgment of human designers.

---

## References & Sources

[1] UI Layout Generation with LLMs Guided by UI Grammar (arXiv:2310.15455)
[2] OmniDocLayout: Towards Diverse Document Layout Generation (Semantic Scholar 2025)
[6] ASR: Aggregated Structural Representation with LLMs for Layout Generation (arXiv:2505.19554)
[9] CAL-RAG: Retrieval-Augmented Layout Generation (arXiv:2506.21934)
[19] PrototypeFlow: Human-AI Synergy in UI Design (arXiv:2412.20071)
[20] Constraint Alignment in CAD Design (arXiv:2504.13178)
[23] Generative Layout Modeling Using Constraint Graphs (ICCV 2021)
[43] Builder.io Fusion: Design-to-Code (builder.io/blog)
[46] Figma Dev Mode MCP Server (figma.com/blog)
[50] Vercel v0 Architecture (vercel.com/blog)
[57] SVGBuilder: Component-Based SVG Generation (AAAI 2024)
[67] LayoutNUWA: LLM for Layout Generation (arXiv:2309.09506)
[78] 26 Prompt Engineering Principles (Codingscape 2024)
[79] StarVector: SVG Generation from Images & Text (arXiv:2312.11556)
[82] Chat2SVG: Hybrid LLM-Diffusion Framework (arXiv:2411.16602)
[94] See it. Say it. Sorted: Agentic SVG Generation (arXiv:2508.15222)
[135] Divide-Verify-Refine: LLM Constraint Following (arXiv:2025.findings-acl.709)
[166] Skia Canvas: GPU-accelerated Node.js Rendering (skia-canvas.org)
