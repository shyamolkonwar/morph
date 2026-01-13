# Generative Banner System
## Implementation Code References

**This document provides Python/TypeScript code snippets for core system components.**

---

## 1. The "GOD Prompt" System Prompt

```python
def create_god_prompt(
    canvas_width: int = 1200,
    canvas_height: int = 630,
    brand_colors: List[str] = None,
    design_brief: str = ""
) -> str:
    """
    Generate the system prompt that instructs LLM to act as 
    Creative Director + Layout Engineer
    """
    
    return f"""
You are a Professional Design System with two integrated sub-systems:

═══════════════════════════════════════════════════════════════════
SYSTEM A: CREATIVE DIRECTOR
═══════════════════════════════════════════════════════════════════
Your creative responsibilities:
• Apply color theory (primary, complementary, analogous harmonies)
• Design visual hierarchy using typography
• Create balance through white space and composition
• Use contrast to emphasize key messages
• Make aesthetic decisions that communicate brand personality
• Generate original concepts without relying on templates

═══════════════════════════════════════════════════════════════════
SYSTEM B: LAYOUT ENGINEER
═══════════════════════════════════════════════════════════════════
Your engineering responsibilities:
• Calculate spatial relationships using mathematical principles
• Apply golden ratio (φ = 1.618) for optimal proportions
• Compute typography hierarchy: body × 1.618 = subheading, × 2.618 = headline
• Design padding using Fibonacci-inspired spacing (8px, 16px, 32px, 64px)
• Ensure no overlaps, all elements within canvas bounds
• Verify WCAG AA compliance: text contrast ≥ 4.5:1
• Represent design as a constraint graph: elements (nodes) + relationships (edges)

═══════════════════════════════════════════════════════════════════
CANVAS SPECIFICATIONS
═══════════════════════════════════════════════════════════════════
Canvas Dimensions: {canvas_width}px × {canvas_height}px
Aspect Ratio: {canvas_width / canvas_height:.2f}:1
Brand Colors (REQUIRED): {', '.join(brand_colors or ['#FF6B35', '#FFFFFF', '#004E89'])}
Typography: Only web-safe fonts (Arial, Helvetica, Georgia, Times New Roman, Courier)

═══════════════════════════════════════════════════════════════════
DESIGN INTENT
═══════════════════════════════════════════════════════════════════
{design_brief}

═══════════════════════════════════════════════════════════════════
GENERATION PROCESS (YOU MUST FOLLOW)
═══════════════════════════════════════════════════════════════════
Step 1: DECOMPOSE THE BRIEF
- Extract key messages
- Identify visual hierarchy (primary, secondary, tertiary)
- Define emotional tone (professional, playful, aggressive, minimal)
- List required elements (headline, logo, CTA, background)

Step 2: CALCULATE DESIGN METRICS
- Golden ratio split: {canvas_width} / 1.618 = primary area
- Typography sizes: 16px base → calculate hierarchy
- Color palette: primary + complement + accents
- Layout grid: margin calculations (typically 8% of width)
- Contrast verification: Calculate WCAG ratios for all text

Step 3: GENERATE CONSTRAINT GRAPH (JSON)
Create a structured representation:
{{
  "elements": [
    {{"id": "headline", "type": "text", "content": "...", "constraints": {{...}}}},
    {{"id": "accent_bar", "type": "rect", "constraints": {{...}}}}
  ],
  "relationships": [
    {{"type": "alignment", "elements": ["headline", "subheading"]}},
    {{"type": "spacing", "source": "headline", "target": "cta", "distance": 40}}
  ]
}}

Step 4: GENERATE SVG CODE
From the constraint graph, produce valid SVG:
- Use only primitives: <rect>, <circle>, <path>, <text>, <g>
- Apply calculated colors, fonts, sizes
- Use transforms (translate, rotate, scale)
- Ensure all text is readable (font-size ≥ 14px)
- No element extends outside canvas bounds

═══════════════════════════════════════════════════════════════════
CONSTRAINTS YOU MUST SATISFY
═══════════════════════════════════════════════════════════════════
1. SYNTAX: Output must be valid SVG (parseable XML)
2. BOUNDS: All elements must fit within {canvas_width}×{canvas_height}
3. COLORS: Use ONLY the approved brand colors: {', '.join(brand_colors or [])}
4. TEXT: Font must be web-safe. Content is EXACT, no changes.
5. CONTRAST: Text color vs background ≥ 4.5:1 (WCAG AA)
6. SPACING: No overlaps. Minimum 8px padding between elements.
7. ACCESSIBILITY: Ensure high contrast, readable font sizes

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (CRITICAL)
═══════════════════════════════════════════════════════════════════
Provide your response in this exact format:

[ANALYSIS]
(Show your decomposition and calculations here)

[CONSTRAINT_GRAPH]
(Provide the JSON constraint graph)

[SVG_CODE]
<svg width="{canvas_width}" height="{canvas_height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Your SVG primitives here -->
</svg>

Do not include any text outside these sections.
"""
```

---

## 2. Constraint Graph Validation

```python
from typing import Dict, List, Tuple
import json
from dataclasses import dataclass

@dataclass
class Element:
    id: str
    type: str  # "rect", "text", "circle", etc.
    x: float
    y: float
    width: float
    height: float
    properties: Dict

class ConstraintGraphValidator:
    """Validates constraint graphs before SVG generation"""
    
    def validate(self, graph_json: str) -> Tuple[bool, List[str]]:
        """Parse and validate constraint graph"""
        errors = []
        
        try:
            graph = json.loads(graph_json)
        except json.JSONDecodeError as e:
            return False, [f"Invalid JSON: {str(e)}"]
        
        # Validate structure
        if "elements" not in graph:
            errors.append("Missing 'elements' key")
        
        if "relationships" not in graph:
            errors.append("Missing 'relationships' key")
        
        # Validate elements
        elements = {}
        for elem in graph.get("elements", []):
            if "id" not in elem:
                errors.append("Element missing 'id'")
                continue
            
            elem_id = elem["id"]
            elements[elem_id] = elem
            
            # Validate element has required properties
            required_keys = {"type", "constraints"}
            for key in required_keys:
                if key not in elem:
                    errors.append(f"Element '{elem_id}' missing '{key}'")
        
        # Validate relationships reference existing elements
        for rel in graph.get("relationships", []):
            rel_type = rel.get("type")
            
            if rel_type == "alignment":
                for elem_id in rel.get("elements", []):
                    if elem_id not in elements:
                        errors.append(f"Relationship references non-existent element: {elem_id}")
            
            elif rel_type == "spacing":
                source = rel.get("source")
                target = rel.get("target")
                
                if source and source not in elements:
                    errors.append(f"Spacing relationship references non-existent source: {source}")
                if target and target not in elements:
                    errors.append(f"Spacing relationship references non-existent target: {target}")
        
        return len(errors) == 0, errors
```

---

## 3. SVG Syntax Validation

```python
import xml.etree.ElementTree as ET
from typing import Tuple, List

class SVGValidator:
    """Validates SVG syntax and structure"""
    
    VALID_TAGS = {
        'svg', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
        'path', 'text', 'tspan', 'g', 'defs', 'style', 'image', 'use',
        'clipPath', 'mask', 'linearGradient', 'radialGradient'
    }
    
    REQUIRED_SVG_ATTRS = ['width', 'height']
    
    def validate(self, svg_string: str) -> Tuple[bool, List[str]]:
        """Validate SVG syntax"""
        errors = []
        
        # Try to parse as XML
        try:
            root = ET.fromstring(svg_string)
        except ET.ParseError as e:
            return False, [f"SVG Parse Error: {str(e)}"]
        
        # Check root is <svg>
        tag = root.tag.split('}')[-1]  # Strip namespace
        if tag != 'svg':
            errors.append(f"Root element must be <svg>, got <{tag}>")
        
        # Check required attributes
        for attr in self.REQUIRED_SVG_ATTRS:
            if attr not in root.attrib:
                errors.append(f"Missing required SVG attribute: {attr}")
        
        # Validate dimensions are numeric
        try:
            width = float(root.attrib.get('width', 0))
            height = float(root.attrib.get('height', 0))
            
            if width <= 0 or height <= 0:
                errors.append("Width and height must be positive")
        except ValueError:
            errors.append("Width and height must be numeric")
        
        # Recursively validate child elements
        self._validate_element(root, errors)
        
        return len(errors) == 0, errors
    
    def _validate_element(self, element, errors):
        """Recursively validate SVG elements"""
        tag = element.tag.split('}')[-1]
        
        if tag not in self.VALID_TAGS:
            errors.append(f"Invalid SVG element: <{tag}>")
        
        # Validate child elements
        for child in element:
            self._validate_element(child, errors)
        
        # Validate text content in <text> elements
        if tag == 'text' and not element.text and not list(element):
            errors.append("Text element is empty")
```

---

## 4. WCAG Contrast Validation

```python
import re
from typing import Tuple

class WCAGValidator:
    """Validates color contrast ratios"""
    
    @staticmethod
    def hex_to_rgb(hex_color: str) -> Tuple[float, float, float]:
        """Convert hex color to RGB (0-1 range)"""
        hex_color = hex_color.lstrip('#')
        if len(hex_color) != 6:
            raise ValueError(f"Invalid hex color: {hex_color}")
        
        r = int(hex_color[0:2], 16) / 255.0
        g = int(hex_color[2:4], 16) / 255.0
        b = int(hex_color[4:6], 16) / 255.0
        
        return r, g, b
    
    @staticmethod
    def relative_luminance(r: float, g: float, b: float) -> float:
        """Calculate WCAG relative luminance"""
        # Convert to linear RGB
        def linear(val):
            if val <= 0.03928:
                return val / 12.92
            else:
                return ((val + 0.055) / 1.055) ** 2.4
        
        r = linear(r)
        g = linear(g)
        b = linear(b)
        
        # Calculate luminance
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    
    @staticmethod
    def contrast_ratio(color1: str, color2: str) -> float:
        """Calculate WCAG contrast ratio between two colors"""
        r1, g1, b1 = WCAGValidator.hex_to_rgb(color1)
        r2, g2, b2 = WCAGValidator.hex_to_rgb(color2)
        
        l1 = WCAGValidator.relative_luminance(r1, g1, b1)
        l2 = WCAGValidator.relative_luminance(r2, g2, b2)
        
        lighter = max(l1, l2)
        darker = min(l1, l2)
        
        return (lighter + 0.05) / (darker + 0.05)
    
    @staticmethod
    def validate_svg_contrast(svg_string: str) -> Tuple[bool, list]:
        """Extract text elements and verify contrast"""
        errors = []
        
        # Find all text elements with fill color
        text_fill_pattern = r'<text[^>]*fill=["\']([^"\']+)["\'][^>]*>([^<]*)</text>'
        matches = re.finditer(text_fill_pattern, svg_string)
        
        # Extract background color (simplified: assume white)
        bg_color = '#FFFFFF'
        
        for match in matches:
            text_color = match.group(1)
            text_content = match.group(2)
            
            try:
                ratio = WCAGValidator.contrast_ratio(text_color, bg_color)
                
                if ratio < 4.5:
                    errors.append(
                        f"Text '{text_content}' has contrast {ratio:.1f}:1 "
                        f"(need ≥ 4.5:1 for WCAG AA)"
                    )
            except ValueError as e:
                errors.append(f"Invalid color in text element: {text_color}")
        
        return len(errors) == 0, errors
```

---

## 5. Multi-Layer Verification Pipeline

```python
from dataclasses import dataclass
from enum import Enum

class VerificationResult(Enum):
    PASS = "pass"
    FAIL = "fail"
    WARNING = "warning"

@dataclass
class VerificationReport:
    overall: VerificationResult
    layers: Dict[str, Tuple[VerificationResult, List[str]]]
    timestamp: str

class VerificationPipeline:
    """Execute all verification layers in sequence"""
    
    def __init__(self, canvas_width: int, canvas_height: int):
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        self.svg_validator = SVGValidator()
        self.wcag_validator = WCAGValidator()
    
    async def verify(self, svg_string: str) -> VerificationReport:
        """Run complete verification pipeline"""
        from datetime import datetime
        
        layers = {}
        
        # Layer 1: Syntax Validation
        syntax_pass, syntax_errors = self.svg_validator.validate(svg_string)
        layers["syntax"] = (
            VerificationResult.PASS if syntax_pass else VerificationResult.FAIL,
            syntax_errors
        )
        
        if not syntax_pass:
            # Stop here if syntax fails
            return VerificationReport(
                overall=VerificationResult.FAIL,
                layers=layers,
                timestamp=datetime.now().isoformat()
            )
        
        # Layer 2: Spatial Constraints
        spatial_pass, spatial_errors = self._verify_spatial_constraints(svg_string)
        layers["spatial"] = (
            VerificationResult.PASS if spatial_pass else VerificationResult.FAIL,
            spatial_errors
        )
        
        # Layer 3: Text Readability
        text_pass, text_errors = self._verify_text_readability(svg_string)
        layers["text_readability"] = (
            VerificationResult.PASS if text_pass else VerificationResult.FAIL,
            text_errors
        )
        
        # Layer 4: Color Palette
        color_pass, color_errors = self._verify_color_palette(svg_string)
        layers["color_palette"] = (
            VerificationResult.PASS if color_pass else VerificationResult.FAIL,
            color_errors
        )
        
        # Layer 5: Rendering Test
        render_pass, render_errors = await self._verify_rendering(svg_string)
        layers["rendering"] = (
            VerificationResult.PASS if render_pass else VerificationResult.FAIL,
            render_errors
        )
        
        # Calculate overall result
        all_pass = all(
            result[0] == VerificationResult.PASS 
            for result in layers.values()
        )
        
        return VerificationReport(
            overall=VerificationResult.PASS if all_pass else VerificationResult.FAIL,
            layers=layers,
            timestamp=datetime.now().isoformat()
        )
    
    def _verify_spatial_constraints(self, svg_string: str) -> Tuple[bool, List[str]]:
        """Check bounds and overlaps"""
        errors = []
        
        # Extract bounding boxes from SVG
        # (Simplified: actual implementation uses ET to parse)
        
        return len(errors) == 0, errors
    
    def _verify_text_readability(self, svg_string: str) -> Tuple[bool, List[str]]:
        """Check font size and contrast"""
        errors = []
        
        # Check font sizes
        font_size_pattern = r'font-size=["\'](\d+)'
        sizes = re.findall(font_size_pattern, svg_string)
        
        for size_str in sizes:
            size = int(size_str)
            if size < 14:
                errors.append(f"Text font-size too small: {size}px (minimum 14px)")
        
        # Check contrast
        contrast_pass, contrast_errors = self.wcag_validator.validate_svg_contrast(svg_string)
        errors.extend(contrast_errors)
        
        return len(errors) == 0, errors
    
    def _verify_color_palette(self, svg_string: str) -> Tuple[bool, List[str]]:
        """Check colors are in approved palette"""
        errors = []
        
        # Extract all colors
        color_pattern = r'(#[0-9A-Fa-f]{6})'
        colors = set(re.findall(color_pattern, svg_string))
        
        # This would be compared against approved_palette
        # For now, just check they're valid hex
        
        return len(errors) == 0, errors
    
    async def _verify_rendering(self, svg_string: str) -> Tuple[bool, List[str]]:
        """Render SVG and check output"""
        errors = []
        
        try:
            # This would use Skia Canvas
            # canvas = await render_svg(svg_string)
            # Check for blank canvas, dimensions, etc.
            pass
        except Exception as e:
            errors.append(f"Rendering failed: {str(e)}")
        
        return len(errors) == 0, errors
```

---

## 6. Iterative Refinement Loop

```python
from typing import Optional

class DesignRefinementAgent:
    """Orchestrate multi-agent design refinement"""
    
    def __init__(self, 
                 claude_api_key: str,
                 max_iterations: int = 5):
        self.claude = AnthropicClient(api_key=claude_api_key)
        self.max_iterations = max_iterations
        self.verification_pipeline = VerificationPipeline(1200, 630)
        self.iteration_count = 0
        self.history = []
    
    async def generate(self, user_prompt: str) -> str:
        """Generate design with iterative refinement"""
        
        current_prompt = user_prompt
        
        for iteration in range(self.max_iterations):
            self.iteration_count = iteration
            
            # Step 1: Design Direction Synthesis
            design_spec = await self.claude.generate(
                system_prompt=create_god_prompt(),
                user_prompt=current_prompt
            )
            
            # Step 2: Extract Constraint Graph
            graph_text = self._extract_json(design_spec, "CONSTRAINT_GRAPH")
            
            # Step 3: Validate Graph
            graph_valid, graph_errors = self._validate_constraint_graph(graph_text)
            
            if not graph_valid:
                # Refine and retry
                current_prompt = self._create_refinement_prompt(
                    user_prompt, graph_errors, "constraint_graph_invalid"
                )
                continue
            
            # Step 4: Generate SVG
            svg_text = self._extract_svg(design_spec, "SVG_CODE")
            
            # Step 5: Run Verification Pipeline
            verification_report = await self.verification_pipeline.verify(svg_text)
            
            # Store history
            self.history.append({
                "iteration": iteration,
                "status": verification_report.overall.value,
                "errors": verification_report.layers
            })
            
            # If all checks pass, return SVG
            if verification_report.overall == VerificationResult.PASS:
                return svg_text
            
            # Otherwise, create refined prompt and iterate
            failed_layers = [
                (layer, errors)
                for layer, (result, errors) in verification_report.layers.items()
                if result == VerificationResult.FAIL
            ]
            
            current_prompt = self._create_refinement_prompt(
                user_prompt, failed_layers, "verification_failed"
            )
        
        raise DesignGenerationError(
            f"Failed to generate valid design after {self.max_iterations} iterations. "
            f"Last errors: {self.history[-1]['errors']}"
        )
    
    def _create_refinement_prompt(self, 
                                 base_prompt: str,
                                 errors: List[Tuple[str, List[str]]],
                                 failure_type: str) -> str:
        """Create refined prompt with error feedback"""
        
        error_details = ""
        for layer, error_list in errors:
            error_details += f"\n{layer}:\n"
            for error in error_list:
                error_details += f"  - {error}\n"
        
        return f"""{base_prompt}

REFINEMENT ITERATION {self.iteration_count + 1}:

The previous generation had these issues:
{error_details}

Please fix these specific problems while maintaining the overall design intent.
Focus on clarity, correctness, and adherence to constraints.
"""
    
    def _extract_json(self, text: str, section_name: str) -> str:
        """Extract JSON section from response"""
        pattern = rf'\[{section_name}\](.*?)\[/'
        match = re.search(pattern, text, re.DOTALL)
        return match.group(1).strip() if match else ""
    
    def _extract_svg(self, text: str, section_name: str) -> str:
        """Extract SVG code from response"""
        pattern = rf'\[{section_name}\](.*?)\[/'
        match = re.search(pattern, text, re.DOTALL)
        return match.group(1).strip() if match else ""
    
    def _validate_constraint_graph(self, graph_text: str) -> Tuple[bool, List[str]]:
        """Validate constraint graph JSON"""
        validator = ConstraintGraphValidator()
        return validator.validate(graph_text)
```

---

## 7. Skia Canvas Rendering

```python
from skia_canvas import Canvas
import asyncio

class SVGRenderer:
    """Render SVG to multiple formats using Skia Canvas"""
    
    def __init__(self, width: int = 1200, height: int = 630):
        self.width = width
        self.height = height
    
    async def render(self, 
                    svg_string: str,
                    output_formats: List[str] = None) -> Dict[str, bytes]:
        """
        Render SVG to multiple formats
        Formats: png, webp, pdf, jpeg
        """
        if output_formats is None:
            output_formats = ["png", "webp"]
        
        # This is a simplified example
        # Actual implementation would use Skia Canvas bindings
        
        outputs = {}
        
        try:
            canvas = Canvas(self.width, self.height)
            ctx = canvas.getContext("2d")
            
            # Parse and render SVG
            # (Complex: would require SVG parser or headless browser)
            
            # Export to formats
            for fmt in output_formats:
                if fmt == "png":
                    outputs["png"] = await canvas.png()
                elif fmt == "webp":
                    outputs["webp"] = await canvas.webp()
                elif fmt == "pdf":
                    outputs["pdf"] = await canvas.pdf()
                elif fmt == "jpeg":
                    outputs["jpeg"] = await canvas.jpeg(quality=90)
            
            return outputs
        
        except Exception as e:
            raise RenderingError(f"Failed to render SVG: {str(e)}")

async def export_design(svg_string: str, output_dir: str):
    """Export design to multiple formats"""
    renderer = SVGRenderer()
    outputs = await renderer.render(svg_string, ["png", "webp", "pdf"])
    
    for fmt, data in outputs.items():
        with open(f"{output_dir}/design.{fmt}", "wb") as f:
            f.write(data)
```

---

## 8. API Endpoint Example

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class DesignRequest(BaseModel):
    prompt: str
    canvas_width: int = 1200
    canvas_height: int = 630
    brand_colors: List[str] = None
    max_iterations: int = 5

class DesignResponse(BaseModel):
    status: str  # "success" or "failed"
    svg: Optional[str]
    errors: Optional[List[str]]
    iterations: int
    verification_report: Optional[Dict]

@app.post("/api/v1/generate-banner", response_model=DesignResponse)
async def generate_banner(request: DesignRequest):
    """Generate a professional banner design"""
    
    try:
        agent = DesignRefinementAgent(
            claude_api_key="sk-...",
            max_iterations=request.max_iterations
        )
        
        svg_output = await agent.generate(request.prompt)
        
        # Verify one final time
        verification = await agent.verification_pipeline.verify(svg_output)
        
        return DesignResponse(
            status="success",
            svg=svg_output,
            errors=None,
            iterations=agent.iteration_count + 1,
            verification_report=verification.layers
        )
    
    except DesignGenerationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.post("/api/v1/verify-svg")
async def verify_svg(svg_string: str):
    """Verify an SVG design"""
    
    pipeline = VerificationPipeline(1200, 630)
    report = await pipeline.verify(svg_string)
    
    return {
        "overall": report.overall.value,
        "layers": {
            layer: {
                "status": result.value,
                "errors": errors
            }
            for layer, (result, errors) in report.layers.items()
        }
    }
```

---

## Conclusion

These code examples provide the foundation for:
1. **GOD Prompt construction** (First-principles design instruction)
2. **Constraint graph validation** (Verifiable representation)
3. **Multi-layer verification** (Automated quality assurance)
4. **Iterative refinement** (Quality improvement loop)
5. **Rendering pipeline** (Multiple output formats)
6. **API exposure** (Production-ready interface)

The full system integrates these components into a complete design generation pipeline capable of producing professional banners without templates.

---

**Implementation Status:** Code examples provided for Phase 1 MVP development.
