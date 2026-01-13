"""
Layout Graph Representation
NetworkX-based graph for design element relationships
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
import networkx as nx


class EdgeType(str, Enum):
    """Types of relationships between layout elements"""
    # Spatial (Relative)
    BELOW = "below"
    RIGHT_OF = "right_of"
    ABOVE = "above"
    LEFT_OF = "left_of"
    
    # Alignment
    ALIGN_LEFT = "align_left"
    ALIGN_RIGHT = "align_right"
    ALIGN_CENTER_X = "align_center_x"
    ALIGN_CENTER_Y = "align_center_y"
    ALIGN_TOP = "align_top"
    ALIGN_BOTTOM = "align_bottom"
    
    # Containment
    INSIDE = "inside"
    
    # Spacing
    MARGIN = "margin"


class AnchorPoint(str, Enum):
    """Reference point for positioning"""
    TOP_LEFT = "top_left"
    TOP_CENTER = "top_center"
    TOP_RIGHT = "top_right"
    CENTER_LEFT = "center_left"
    CENTER = "center"
    CENTER_RIGHT = "center_right"
    BOTTOM_LEFT = "bottom_left"
    BOTTOM_CENTER = "bottom_center"
    BOTTOM_RIGHT = "bottom_right"


@dataclass
class LayoutNode:
    """A design element in the layout graph"""
    id: str
    node_type: str  # text, image, shape, container
    
    # Dimensions
    min_width: int = 0
    max_width: Optional[int] = None
    min_height: int = 0
    max_height: Optional[int] = None
    
    # Fixed dimensions (overrides min/max)
    fixed_width: Optional[int] = None
    fixed_height: Optional[int] = None
    
    # Positioning
    anchor: AnchorPoint = AnchorPoint.TOP_LEFT
    
    # Content properties
    content: Optional[str] = None
    font_size: Optional[int] = None
    
    # Solved coordinates (populated after solving)
    solved_x: Optional[int] = None
    solved_y: Optional[int] = None
    solved_width: Optional[int] = None
    solved_height: Optional[int] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "type": self.node_type,
            "x": self.solved_x,
            "y": self.solved_y,
            "width": self.solved_width,
            "height": self.solved_height,
            "content": self.content,
            "fontSize": self.font_size,
        }


@dataclass
class LayoutEdge:
    """A constraint between two layout elements"""
    source_id: str
    target_id: str
    edge_type: EdgeType
    
    # Constraint value (e.g., margin distance in pixels)
    value: int = 0
    
    # Priority for relaxation (0 = hard, 1 = structural, 2 = aesthetic)
    priority: int = 1


class LayoutGraph:
    """
    NetworkX-based directed graph for layout relationships.
    
    Nodes represent design elements.
    Edges represent spatial constraints.
    """
    
    def __init__(self, canvas_width: int = 1200, canvas_height: int = 630):
        self.graph = nx.DiGraph()
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        self.nodes: dict[str, LayoutNode] = {}
        self.edges: list[LayoutEdge] = []
    
    def add_node(self, node: LayoutNode) -> None:
        """Add a design element to the graph"""
        self.nodes[node.id] = node
        self.graph.add_node(
            node.id,
            node_type=node.node_type,
            min_width=node.min_width,
            max_width=node.max_width or self.canvas_width,
            min_height=node.min_height,
            max_height=node.max_height or self.canvas_height,
            fixed_width=node.fixed_width,
            fixed_height=node.fixed_height,
            anchor=node.anchor.value,
        )
    
    def add_edge(self, edge: LayoutEdge) -> None:
        """Add a constraint between two elements"""
        if edge.source_id not in self.nodes:
            raise ValueError(f"Source node '{edge.source_id}' not found")
        if edge.target_id not in self.nodes:
            raise ValueError(f"Target node '{edge.target_id}' not found")
        
        self.edges.append(edge)
        self.graph.add_edge(
            edge.source_id,
            edge.target_id,
            edge_type=edge.edge_type.value,
            value=edge.value,
            priority=edge.priority,
        )
    
    def get_node(self, node_id: str) -> Optional[LayoutNode]:
        """Get a node by ID"""
        return self.nodes.get(node_id)
    
    def validate(self) -> tuple[bool, list[str]]:
        """
        Validate the graph structure.
        Returns (is_valid, list of errors)
        """
        errors = []
        
        # Check for cycles in containment relationships
        containment_edges = [
            (e.source_id, e.target_id)
            for e in self.edges
            if e.edge_type == EdgeType.INSIDE
        ]
        containment_graph = nx.DiGraph(containment_edges)
        if containment_edges and not nx.is_directed_acyclic_graph(containment_graph):
            errors.append("Circular containment detected")
        
        # Check that all nodes have valid dimensions
        for node_id, node in self.nodes.items():
            if node.fixed_width and node.fixed_width > self.canvas_width:
                errors.append(f"Node '{node_id}' fixed_width exceeds canvas")
            if node.fixed_height and node.fixed_height > self.canvas_height:
                errors.append(f"Node '{node_id}' fixed_height exceeds canvas")
        
        return len(errors) == 0, errors
    
    @classmethod
    def from_constraint_graph(
        cls,
        constraint_json: dict,
        canvas_width: int = 1200,
        canvas_height: int = 630,
    ) -> "LayoutGraph":
        """
        Build LayoutGraph from LLM-generated constraint graph JSON.
        
        Expected format:
        {
            "elements": [
                {"id": "headline", "type": "text", "constraints": {...}},
                ...
            ],
            "relationships": [
                {"type": "alignment", "elements": ["a", "b"], ...},
                {"type": "spacing", "source": "a", "target": "b", "distance": 24},
                ...
            ]
        }
        """
        graph = cls(canvas_width, canvas_height)
        
        # Add nodes
        for element in constraint_json.get("elements", []):
            constraints = element.get("constraints", {})
            properties = element.get("properties", {})
            
            node = LayoutNode(
                id=element["id"],
                node_type=element.get("type", "text"),
                min_width=constraints.get("minWidth", 0),
                max_width=constraints.get("maxWidth"),
                min_height=constraints.get("minHeight", 0),
                max_height=constraints.get("maxHeight"),
                fixed_width=constraints.get("width"),
                fixed_height=constraints.get("height"),
                content=element.get("content"),
                font_size=properties.get("fontSize"),
            )
            graph.add_node(node)
        
        # Add edges from relationships
        for rel in constraint_json.get("relationships", []):
            rel_type = rel.get("type", "")
            
            if rel_type == "alignment":
                # Pairwise alignment between all listed elements
                elements = rel.get("elements", [])
                axis = rel.get("axis", "left")
                edge_type = {
                    "left": EdgeType.ALIGN_LEFT,
                    "right": EdgeType.ALIGN_RIGHT,
                    "center": EdgeType.ALIGN_CENTER_X,
                    "top": EdgeType.ALIGN_TOP,
                    "bottom": EdgeType.ALIGN_BOTTOM,
                }.get(axis, EdgeType.ALIGN_LEFT)
                
                for i, elem_a in enumerate(elements):
                    for elem_b in elements[i+1:]:
                        if elem_a in graph.nodes and elem_b in graph.nodes:
                            graph.add_edge(LayoutEdge(
                                source_id=elem_a,
                                target_id=elem_b,
                                edge_type=edge_type,
                                priority=2,  # Aesthetic
                            ))
            
            elif rel_type == "spacing":
                source = rel.get("source")
                target = rel.get("target")
                distance = rel.get("distance", 24)
                relation = rel.get("relation", "below")
                
                if source and target and source in graph.nodes and target in graph.nodes:
                    edge_type = {
                        "below": EdgeType.BELOW,
                        "above": EdgeType.ABOVE,
                        "left_of": EdgeType.LEFT_OF,
                        "right_of": EdgeType.RIGHT_OF,
                    }.get(relation, EdgeType.BELOW)
                    
                    graph.add_edge(LayoutEdge(
                        source_id=source,
                        target_id=target,
                        edge_type=edge_type,
                        value=distance,
                        priority=1,  # Structural
                    ))
            
            elif rel_type == "containment":
                container = rel.get("container")
                child = rel.get("child")
                if container and child and container in graph.nodes and child in graph.nodes:
                    graph.add_edge(LayoutEdge(
                        source_id=container,
                        target_id=child,
                        edge_type=EdgeType.INSIDE,
                        priority=0,  # Hard constraint
                    ))
        
        return graph
    
    def to_dict(self) -> dict:
        """Export graph structure as dictionary"""
        return {
            "canvas": {
                "width": self.canvas_width,
                "height": self.canvas_height,
            },
            "nodes": [
                {
                    "id": n.id,
                    "type": n.node_type,
                    "minWidth": n.min_width,
                    "maxWidth": n.max_width,
                    "minHeight": n.min_height,
                    "maxHeight": n.max_height,
                }
                for n in self.nodes.values()
            ],
            "edges": [
                {
                    "source": e.source_id,
                    "target": e.target_id,
                    "type": e.edge_type.value,
                    "value": e.value,
                    "priority": e.priority,
                }
                for e in self.edges
            ],
        }
