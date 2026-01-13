"""
Spatial Constraints Validator
Checks bounds, overlaps, and spacing
"""

import re
import xml.etree.ElementTree as ET
from typing import Tuple, Dict, List
from dataclasses import dataclass


@dataclass
class BoundingBox:
    """Represents an element's bounding box"""
    element_id: str
    x: float
    y: float
    width: float
    height: float
    
    @property
    def right(self) -> float:
        return self.x + self.width
    
    @property
    def bottom(self) -> float:
        return self.y + self.height


class SpatialValidator:
    """Validates spatial constraints in SVG"""
    
    def __init__(self, canvas_width: int, canvas_height: int, min_spacing: int = 0):
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        self.min_spacing = min_spacing
    
    def validate(self, svg_string: str) -> Tuple[bool, list[str]]:
        """
        Check bounds and overlaps.
        
        Args:
            svg_string: SVG string to validate
            
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        # Extract bounding boxes from SVG
        try:
            bboxes = self._extract_bounding_boxes(svg_string)
        except Exception as e:
            return False, [f"Failed to parse SVG: {str(e)}"]
        
        # Check each element
        for bbox in bboxes:
            # Check bounds
            if bbox.x < 0 or bbox.y < 0:
                errors.append(f"Element '{bbox.element_id}' has negative position ({bbox.x}, {bbox.y})")
            
            if bbox.right > self.canvas_width:
                errors.append(
                    f"Element '{bbox.element_id}' exceeds canvas width "
                    f"(right edge at {bbox.right}px, canvas is {self.canvas_width}px)"
                )
            
            if bbox.bottom > self.canvas_height:
                errors.append(
                    f"Element '{bbox.element_id}' exceeds canvas height "
                    f"(bottom edge at {bbox.bottom}px, canvas is {self.canvas_height}px)"
                )
        
        # Check for overlaps (optional, only if enabled)
        if self.min_spacing > 0:
            overlap_errors = self._check_overlaps(bboxes)
            errors.extend(overlap_errors)
        
        return len(errors) == 0, errors
    
    def _extract_bounding_boxes(self, svg_string: str) -> List[BoundingBox]:
        """Extract element bounding boxes from SVG"""
        bboxes = []
        
        try:
            root = ET.fromstring(svg_string)
        except ET.ParseError:
            return bboxes
        
        # Process all elements
        element_counter = 0
        
        for elem in root.iter():
            tag = elem.tag.split('}')[-1]
            elem_id = elem.attrib.get('id', f'{tag}_{element_counter}')
            element_counter += 1
            
            bbox = self._get_element_bbox(elem, elem_id)
            if bbox:
                bboxes.append(bbox)
        
        return bboxes
    
    def _get_element_bbox(self, elem: ET.Element, elem_id: str) -> BoundingBox | None:
        """Get bounding box for an element"""
        tag = elem.tag.split('}')[-1]
        
        try:
            if tag == 'rect':
                x = float(elem.attrib.get('x', 0))
                y = float(elem.attrib.get('y', 0))
                width = float(elem.attrib.get('width', 0))
                height = float(elem.attrib.get('height', 0))
                
                if width > 0 and height > 0:
                    return BoundingBox(elem_id, x, y, width, height)
            
            elif tag == 'circle':
                cx = float(elem.attrib.get('cx', 0))
                cy = float(elem.attrib.get('cy', 0))
                r = float(elem.attrib.get('r', 0))
                
                if r > 0:
                    return BoundingBox(elem_id, cx - r, cy - r, r * 2, r * 2)
            
            elif tag == 'ellipse':
                cx = float(elem.attrib.get('cx', 0))
                cy = float(elem.attrib.get('cy', 0))
                rx = float(elem.attrib.get('rx', 0))
                ry = float(elem.attrib.get('ry', 0))
                
                if rx > 0 and ry > 0:
                    return BoundingBox(elem_id, cx - rx, cy - ry, rx * 2, ry * 2)
            
            elif tag == 'text':
                # Approximate text bounding box
                x = float(elem.attrib.get('x', 0))
                y = float(elem.attrib.get('y', 0))
                
                # Extract font size for height estimate
                font_size = 16  # default
                font_size_attr = elem.attrib.get('font-size', '16')
                font_size_match = re.match(r'(\d+)', str(font_size_attr))
                if font_size_match:
                    font_size = int(font_size_match.group(1))
                
                # Estimate text width (rough approximation)
                text_content = elem.text or ""
                estimated_width = len(text_content) * font_size * 0.6
                
                return BoundingBox(elem_id, x, y - font_size, estimated_width, font_size * 1.2)
        
        except (ValueError, TypeError):
            pass
        
        return None
    
    def _check_overlaps(self, bboxes: List[BoundingBox]) -> list[str]:
        """Check for element overlaps"""
        errors = []
        
        for i, bbox1 in enumerate(bboxes):
            for bbox2 in bboxes[i+1:]:
                if self._boxes_overlap(bbox1, bbox2):
                    errors.append(
                        f"Elements '{bbox1.element_id}' and '{bbox2.element_id}' overlap"
                    )
        
        return errors
    
    def _boxes_overlap(self, box1: BoundingBox, box2: BoundingBox) -> bool:
        """Check if two bounding boxes overlap"""
        # Add minimum spacing to create buffer
        buffer = self.min_spacing
        
        # Check for separation
        if box1.right + buffer < box2.x:
            return False
        if box2.right + buffer < box1.x:
            return False
        if box1.bottom + buffer < box2.y:
            return False
        if box2.bottom + buffer < box1.y:
            return False
        
        return True
