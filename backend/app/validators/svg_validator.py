"""
SVG Syntax Validator
Validates SVG structure and element validity
"""

import xml.etree.ElementTree as ET
from typing import Tuple


class SVGValidator:
    """Validates SVG syntax and structure"""
    
    VALID_TAGS = {
        'svg', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
        'path', 'text', 'tspan', 'g', 'defs', 'style', 'image', 'use',
        'clipPath', 'mask', 'linearGradient', 'radialGradient', 'stop',
        'filter', 'feGaussianBlur', 'feOffset', 'feBlend', 'feMerge',
        'feMergeNode', 'pattern', 'symbol', 'marker', 'title', 'desc',
    }
    
    REQUIRED_SVG_ATTRS = ['width', 'height']
    
    def validate(self, svg_string: str) -> Tuple[bool, list[str]]:
        """
        Validate SVG syntax.
        
        Args:
            svg_string: Raw SVG string
            
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        if not svg_string or not svg_string.strip():
            return False, ["Empty SVG string"]
        
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
            width_str = root.attrib.get('width', '0')
            height_str = root.attrib.get('height', '0')
            
            # Remove 'px' suffix if present
            width = float(width_str.replace('px', ''))
            height = float(height_str.replace('px', ''))
            
            if width <= 0 or height <= 0:
                errors.append("Width and height must be positive")
        except ValueError:
            errors.append("Width and height must be numeric")
        
        # Recursively validate child elements
        self._validate_element(root, errors)
        
        return len(errors) == 0, errors
    
    def _validate_element(self, element: ET.Element, errors: list[str]) -> None:
        """Recursively validate SVG elements"""
        tag = element.tag.split('}')[-1]  # Strip namespace
        
        # Skip validation for 'svg' root (already handled)
        if tag != 'svg' and tag not in self.VALID_TAGS:
            errors.append(f"Invalid SVG element: <{tag}>")
        
        # Validate child elements
        for child in element:
            self._validate_element(child, errors)
        
        # Validate text content in <text> elements
        if tag == 'text':
            has_content = bool(element.text and element.text.strip())
            has_tspan = any(child.tag.split('}')[-1] == 'tspan' for child in element)
            
            if not has_content and not has_tspan:
                errors.append("Text element is empty")
    
    def extract_dimensions(self, svg_string: str) -> Tuple[float, float]:
        """Extract width and height from SVG"""
        try:
            root = ET.fromstring(svg_string)
            width_str = root.attrib.get('width', '0')
            height_str = root.attrib.get('height', '0')
            
            width = float(width_str.replace('px', ''))
            height = float(height_str.replace('px', ''))
            
            return width, height
        except Exception:
            return 0, 0
