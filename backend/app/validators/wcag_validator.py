"""
WCAG Contrast Validator
Validates color contrast ratios for accessibility
"""

import re
from typing import Tuple


class WCAGValidator:
    """Validates color contrast ratios per WCAG guidelines"""
    
    @staticmethod
    def hex_to_rgb(hex_color: str) -> Tuple[float, float, float]:
        """
        Convert hex color to RGB (0-1 range).
        
        Args:
            hex_color: Hex color string (#RRGGBB or #RGB)
            
        Returns:
            Tuple of (r, g, b) values in 0-1 range
        """
        hex_color = hex_color.lstrip('#')
        
        # Handle shorthand hex (#RGB)
        if len(hex_color) == 3:
            hex_color = ''.join([c*2 for c in hex_color])
        
        if len(hex_color) != 6:
            raise ValueError(f"Invalid hex color: #{hex_color}")
        
        r = int(hex_color[0:2], 16) / 255.0
        g = int(hex_color[2:4], 16) / 255.0
        b = int(hex_color[4:6], 16) / 255.0
        
        return r, g, b
    
    @staticmethod
    def relative_luminance(r: float, g: float, b: float) -> float:
        """
        Calculate WCAG relative luminance.
        
        Args:
            r, g, b: Color values in 0-1 range
            
        Returns:
            Relative luminance value
        """
        def linear(val: float) -> float:
            if val <= 0.03928:
                return val / 12.92
            else:
                return ((val + 0.055) / 1.055) ** 2.4
        
        r = linear(r)
        g = linear(g)
        b = linear(b)
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    
    @staticmethod
    def contrast_ratio(color1: str, color2: str) -> float:
        """
        Calculate WCAG contrast ratio between two colors.
        
        Args:
            color1: First hex color
            color2: Second hex color
            
        Returns:
            Contrast ratio (1.0 to 21.0)
        """
        r1, g1, b1 = WCAGValidator.hex_to_rgb(color1)
        r2, g2, b2 = WCAGValidator.hex_to_rgb(color2)
        
        l1 = WCAGValidator.relative_luminance(r1, g1, b1)
        l2 = WCAGValidator.relative_luminance(r2, g2, b2)
        
        lighter = max(l1, l2)
        darker = min(l1, l2)
        
        return (lighter + 0.05) / (darker + 0.05)
    
    @staticmethod
    def validate_svg_contrast(
        svg_string: str,
        bg_color: str = "#FFFFFF"
    ) -> Tuple[bool, list[str]]:
        """
        Extract text elements and verify contrast.
        
        Args:
            svg_string: SVG string to validate
            bg_color: Default background color
            
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        # Find all text elements with fill color
        # Pattern matches both fill="..." and fill='...'
        text_pattern = r'<text[^>]*fill=["\']([^"\']+)["\'][^>]*>([^<]*)</text>'
        matches = re.finditer(text_pattern, svg_string, re.IGNORECASE)
        
        for match in matches:
            text_color = match.group(1)
            text_content = match.group(2).strip()
            
            # Skip if no content
            if not text_content:
                continue
            
            try:
                # Handle named colors
                text_color = WCAGValidator._normalize_color(text_color)
                ratio = WCAGValidator.contrast_ratio(text_color, bg_color)
                
                if ratio < 4.5:
                    errors.append(
                        f"Text '{text_content[:30]}...' has contrast {ratio:.2f}:1 "
                        f"(need ≥ 4.5:1 for WCAG AA)"
                    )
            except ValueError:
                # Skip invalid colors
                pass
        
        return len(errors) == 0, errors
    
    @staticmethod
    def _normalize_color(color: str) -> str:
        """Normalize color string to hex"""
        # Common named colors
        named_colors = {
            "white": "#FFFFFF",
            "black": "#000000",
            "red": "#FF0000",
            "green": "#00FF00",
            "blue": "#0000FF",
            "yellow": "#FFFF00",
            "orange": "#FFA500",
            "purple": "#800080",
            "gray": "#808080",
            "grey": "#808080",
        }
        
        if color.lower() in named_colors:
            return named_colors[color.lower()]
        
        if color.startswith('#'):
            return color
        
        # Try rgb() format
        rgb_match = re.match(r'rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)', color)
        if rgb_match:
            r, g, b = int(rgb_match.group(1)), int(rgb_match.group(2)), int(rgb_match.group(3))
            return f"#{r:02x}{g:02x}{b:02x}"
        
        return color
