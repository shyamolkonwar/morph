"""
Layout Export
Convert solved layout to various output formats
"""

from dataclasses import dataclass
from typing import Optional

from .layout_graph import LayoutGraph, LayoutNode
from .constraint_solver import SolvedLayout


@dataclass
class CalculatedLayout:
    """
    Standardized layout format for rendering engines.
    Contains precise coordinates for all elements.
    """
    canvas_width: int
    canvas_height: int
    elements: list[dict]
    metadata: dict
    
    def to_dict(self) -> dict:
        return {
            "canvas": {
                "width": self.canvas_width,
                "height": self.canvas_height,
            },
            "elements": self.elements,
            "metadata": self.metadata,
        }
    
    def to_svg_transforms(self) -> list[dict]:
        """
        Generate SVG transform attributes for each element.
        
        Returns list of dicts with id, x, y, width, height suitable
        for SVG element positioning.
        """
        transforms = []
        for elem in self.elements:
            transforms.append({
                "id": elem["id"],
                "transform": f"translate({elem['x']}, {elem['y']})",
                "width": elem["width"],
                "height": elem["height"],
            })
        return transforms


def export_solved_layout(
    graph: LayoutGraph,
    layout: SolvedLayout,
) -> CalculatedLayout:
    """
    Export a solved layout as CalculatedLayout.
    
    Args:
        graph: The original LayoutGraph with node metadata
        layout: The solved layout with coordinates
        
    Returns:
        CalculatedLayout ready for rendering
    """
    elements = []
    
    for node_id, coords in layout.elements.items():
        node = graph.nodes.get(node_id)
        
        element = {
            "id": node_id,
            "type": node.node_type if node else "unknown",
            "x": coords["x"],
            "y": coords["y"],
            "width": coords["width"],
            "height": coords["height"],
        }
        
        # Add node-specific properties
        if node:
            if node.content:
                element["content"] = node.content
            if node.font_size:
                element["fontSize"] = node.font_size
        
        elements.append(element)
    
    return CalculatedLayout(
        canvas_width=graph.canvas_width,
        canvas_height=graph.canvas_height,
        elements=elements,
        metadata={
            "solveTimeMs": layout.solve_time_ms,
            "status": layout.status,
            "relaxedConstraints": layout.relaxed_constraints,
        },
    )


def generate_svg_from_layout(layout: CalculatedLayout) -> str:
    """
    Generate a basic SVG structure from the calculated layout.
    
    This produces a structural SVG with positioned elements.
    The content (text, images) should be filled in by the rendering engine.
    """
    svg_parts = [
        f'<svg width="{layout.canvas_width}" height="{layout.canvas_height}" '
        f'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {layout.canvas_width} {layout.canvas_height}">'
    ]
    
    for elem in layout.elements:
        x, y, w, h = elem["x"], elem["y"], elem["width"], elem["height"]
        elem_id = elem["id"]
        elem_type = elem.get("type", "rect")
        
        if elem_type == "text":
            content = elem.get("content", "")
            font_size = elem.get("fontSize", 24)
            # Text is positioned at baseline, adjust y
            text_y = y + font_size
            svg_parts.append(
                f'  <text id="{elem_id}" x="{x}" y="{text_y}" '
                f'font-size="{font_size}" fill="currentColor">{content}</text>'
            )
        
        elif elem_type == "image":
            svg_parts.append(
                f'  <image id="{elem_id}" x="{x}" y="{y}" '
                f'width="{w}" height="{h}" preserveAspectRatio="xMidYMid slice"/>'
            )
        
        elif elem_type == "container":
            svg_parts.append(
                f'  <g id="{elem_id}" transform="translate({x}, {y})">'
                f'    <rect width="{w}" height="{h}" fill="none" stroke="#ccc"/>'
                f'  </g>'
            )
        
        else:  # shape, rect, etc.
            svg_parts.append(
                f'  <rect id="{elem_id}" x="{x}" y="{y}" '
                f'width="{w}" height="{h}" fill="#E5E5E5"/>'
            )
    
    svg_parts.append('</svg>')
    return '\n'.join(svg_parts)
