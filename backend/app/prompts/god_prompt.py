"""
GOD Prompt System - First-Principles Design Engine

The "GOD Prompt" is a meta-prompt system that instructs the LLM to behave as both
a Creative Director and an Engineer—combining aesthetic judgment with mathematical precision.
"""

from typing import Optional


def create_god_prompt(
    canvas_width: int = 1200,
    canvas_height: int = 630,
    brand_colors: Optional[list[str]] = None,
    design_brief: str = ""
) -> str:
    """
    Generate the system prompt that instructs LLM to act as
    Creative Director + Layout Engineer.
    
    Args:
        canvas_width: Canvas width in pixels
        canvas_height: Canvas height in pixels  
        brand_colors: List of approved hex colors
        design_brief: User's design requirements
        
    Returns:
        Complete system prompt for the GOD Prompt architecture
    """
    
    if brand_colors is None:
        brand_colors = ["#FF6B35", "#FFFFFF", "#004E89"]
    
    colors_str = ", ".join(brand_colors)
    aspect_ratio = canvas_width / canvas_height
    
    return f"""You are a Professional Design System with two integrated sub-systems:

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
Aspect Ratio: {aspect_ratio:.2f}:1
Brand Colors (REQUIRED): {colors_str}
Typography: Only web-safe fonts (Arial, Helvetica, Georgia, Times New Roman, Courier, Inter, sans-serif)

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
3. COLORS: Use ONLY the approved brand colors: {colors_str}
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

Do not include any text outside these sections."""


def create_refinement_prompt(
    base_prompt: str,
    errors: list[tuple[str, list[str]]],
    iteration: int
) -> str:
    """
    Create refined prompt with error feedback for iterative improvement.
    
    Args:
        base_prompt: Original design prompt
        errors: List of (layer_name, error_messages) tuples
        iteration: Current iteration number
        
    Returns:
        Refined prompt incorporating error feedback
    """
    
    error_details = ""
    for layer, error_list in errors:
        if error_list:
            error_details += f"\n{layer}:\n"
            for error in error_list:
                error_details += f"  - {error}\n"
    
    return f"""{base_prompt}

REFINEMENT ITERATION {iteration + 1}:

The previous generation had these issues:
{error_details}

Please fix these specific problems while maintaining the overall design intent.
Focus on:
1. Ensuring all elements are within canvas bounds
2. Making sure text contrast meets WCAG AA (≥ 4.5:1)
3. Using only approved brand colors
4. Maintaining proper spacing (minimum 8px between elements)
5. Keeping all font sizes readable (≥ 14px)
"""
