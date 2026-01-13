"""
Color Palette Validator
Validates that only approved colors are used
"""

import re
from typing import Tuple, Optional


class ColorValidator:
    """Validates color palette adherence in SVG"""
    
    # Common named colors with hex equivalents
    NAMED_COLORS = {
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
        "cyan": "#00FFFF",
        "magenta": "#FF00FF",
        "lime": "#00FF00",
        "navy": "#000080",
        "teal": "#008080",
        "maroon": "#800000",
        "olive": "#808000",
        "silver": "#C0C0C0",
        "aqua": "#00FFFF",
        "fuchsia": "#FF00FF",
        "transparent": None,
        "none": None,
    }
    
    def __init__(self, approved_palette: Optional[list[str]] = None):
        """
        Initialize with approved color palette.
        
        Args:
            approved_palette: List of approved hex colors
        """
        self.approved_palette = set()
        
        if approved_palette:
            for color in approved_palette:
                normalized = self._normalize_color(color)
                if normalized:
                    self.approved_palette.add(normalized.upper())
    
    def validate(self, svg_string: str) -> Tuple[bool, list[str]]:
        """
        Check colors are in approved palette.
        
        Args:
            svg_string: SVG string to validate
            
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        # If no palette specified, skip validation
        if not self.approved_palette:
            return True, []
        
        # Extract all colors from SVG
        colors_used = self._extract_colors(svg_string)
        
        # Check each color
        for color in colors_used:
            normalized = self._normalize_color(color)
            
            if normalized is None:
                continue  # Skip transparent/none
            
            if normalized.upper() not in self.approved_palette:
                errors.append(f"Unapproved color: {color} (normalized: {normalized})")
        
        return len(errors) == 0, errors
    
    def _extract_colors(self, svg_string: str) -> set[str]:
        """Extract all color values from SVG"""
        colors = set()
        
        # Match hex colors
        hex_pattern = r'#[0-9A-Fa-f]{3,6}'
        colors.update(re.findall(hex_pattern, svg_string))
        
        # Match rgb() colors
        rgb_pattern = r'rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)'
        colors.update(re.findall(rgb_pattern, svg_string, re.IGNORECASE))
        
        # Match rgba() colors (ignore alpha)
        rgba_pattern = r'rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)'
        colors.update(re.findall(rgba_pattern, svg_string, re.IGNORECASE))
        
        # Match color attributes (fill, stroke, stop-color)
        attr_pattern = r'(?:fill|stroke|stop-color)\s*[=:]\s*["\']?([^"\';\s>]+)'
        for match in re.finditer(attr_pattern, svg_string, re.IGNORECASE):
            color_value = match.group(1)
            if color_value.lower() not in ('none', 'url(', 'transparent'):
                colors.add(color_value)
        
        return colors
    
    def _normalize_color(self, color: str) -> Optional[str]:
        """Normalize color to hex format"""
        color = color.strip().lower()
        
        # Handle named colors
        if color in self.NAMED_COLORS:
            return self.NAMED_COLORS[color]
        
        # Handle hex colors
        if color.startswith('#'):
            hex_val = color[1:]
            
            # Expand shorthand (#RGB -> #RRGGBB)
            if len(hex_val) == 3:
                hex_val = ''.join([c*2 for c in hex_val])
            
            if len(hex_val) == 6:
                return f"#{hex_val.upper()}"
        
        # Handle rgb() format
        rgb_match = re.match(r'rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)', color)
        if rgb_match:
            r = min(255, max(0, int(rgb_match.group(1))))
            g = min(255, max(0, int(rgb_match.group(2))))
            b = min(255, max(0, int(rgb_match.group(3))))
            return f"#{r:02X}{g:02X}{b:02X}"
        
        # Handle rgba() format (ignore alpha)
        rgba_match = re.match(
            r'rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)',
            color
        )
        if rgba_match:
            r = min(255, max(0, int(rgba_match.group(1))))
            g = min(255, max(0, int(rgba_match.group(2))))
            b = min(255, max(0, int(rgba_match.group(3))))
            return f"#{r:02X}{g:02X}{b:02X}"
        
        return None
