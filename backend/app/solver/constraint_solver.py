"""
Constraint Solver using Google OR-Tools CP-SAT
Converts layout graph to mathematical constraints and solves for coordinates
"""

from dataclasses import dataclass, field
from typing import Optional
from ortools.sat.python import cp_model

from .layout_graph import LayoutGraph, LayoutNode, LayoutEdge, EdgeType


@dataclass
class SolvedLayout:
    """Result of constraint solving"""
    success: bool
    elements: dict[str, dict]  # id -> {x, y, width, height}
    solve_time_ms: float = 0.0
    status: str = ""
    relaxed_constraints: list[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "elements": self.elements,
            "solveTimeMs": self.solve_time_ms,
            "status": self.status,
            "relaxedConstraints": self.relaxed_constraints,
        }


class ConstraintSolver:
    """
    OR-Tools CP-SAT solver for layout constraint satisfaction.
    
    Converts the LayoutGraph into algebraic constraints and finds
    optimal positions for all elements.
    """
    
    def __init__(
        self,
        graph: LayoutGraph,
        timeout_ms: int = 500,
        padding_margin: int = 16,
    ):
        self.graph = graph
        self.timeout_ms = timeout_ms
        self.padding_margin = padding_margin
        
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()
        
        # Variables for each node: x, y, width, height
        self.vars: dict[str, dict[str, cp_model.IntVar]] = {}
        
        # Track which constraints were added
        self.constraint_info: list[tuple[str, int]] = []  # (description, priority)
    
    def _create_variables(self) -> None:
        """Create CP-SAT variables for each node"""
        for node_id, node in self.graph.nodes.items():
            # Determine dimension domains
            if node.fixed_width:
                min_w = max_w = node.fixed_width
            else:
                min_w = max(1, node.min_width)
                max_w = min(node.max_width or self.graph.canvas_width, self.graph.canvas_width)
            
            if node.fixed_height:
                min_h = max_h = node.fixed_height
            else:
                min_h = max(1, node.min_height)
                max_h = min(node.max_height or self.graph.canvas_height, self.graph.canvas_height)
            
            # Create variables
            self.vars[node_id] = {
                "x": self.model.NewIntVar(0, self.graph.canvas_width, f"{node_id}_x"),
                "y": self.model.NewIntVar(0, self.graph.canvas_height, f"{node_id}_y"),
                "width": self.model.NewIntVar(min_w, max_w, f"{node_id}_w"),
                "height": self.model.NewIntVar(min_h, max_h, f"{node_id}_h"),
            }
    
    def _add_boundary_constraints(self) -> None:
        """Add constraints to keep elements within canvas (Hard - Level 0)"""
        for node_id, v in self.vars.items():
            # x + width <= canvas_width
            self.model.Add(v["x"] + v["width"] <= self.graph.canvas_width)
            # y + height <= canvas_height
            self.model.Add(v["y"] + v["height"] <= self.graph.canvas_height)
            # x >= 0 and y >= 0 (already enforced by variable domain)
            
            self.constraint_info.append((f"{node_id}_boundary", 0))
    
    def _add_non_overlap_constraints(self) -> None:
        """Add constraints to prevent element overlaps (Hard - Level 0)"""
        node_ids = list(self.vars.keys())
        
        for i, id_a in enumerate(node_ids):
            for id_b in node_ids[i+1:]:
                va = self.vars[id_a]
                vb = self.vars[id_b]
                
                # At least one of these must be true:
                # A is left of B, A is right of B, A is above B, A is below B
                left_of = self.model.NewBoolVar(f"{id_a}_left_of_{id_b}")
                right_of = self.model.NewBoolVar(f"{id_a}_right_of_{id_b}")
                above = self.model.NewBoolVar(f"{id_a}_above_{id_b}")
                below = self.model.NewBoolVar(f"{id_a}_below_{id_b}")
                
                # When left_of is true: A.x + A.width <= B.x
                self.model.Add(
                    va["x"] + va["width"] <= vb["x"]
                ).OnlyEnforceIf(left_of)
                
                # When right_of is true: B.x + B.width <= A.x
                self.model.Add(
                    vb["x"] + vb["width"] <= va["x"]
                ).OnlyEnforceIf(right_of)
                
                # When above is true: A.y + A.height <= B.y
                self.model.Add(
                    va["y"] + va["height"] <= vb["y"]
                ).OnlyEnforceIf(above)
                
                # When below is true: B.y + B.height <= A.y
                self.model.Add(
                    vb["y"] + vb["height"] <= va["y"]
                ).OnlyEnforceIf(below)
                
                # At least one must be true
                self.model.AddBoolOr([left_of, right_of, above, below])
                
                self.constraint_info.append((f"no_overlap_{id_a}_{id_b}", 0))
    
    def _add_edge_constraints(self, skip_priorities: set[int] = None) -> None:
        """Add constraints from graph edges"""
        skip_priorities = skip_priorities or set()
        
        for edge in self.graph.edges:
            if edge.priority in skip_priorities:
                continue
            
            va = self.vars.get(edge.source_id)
            vb = self.vars.get(edge.target_id)
            
            if not va or not vb:
                continue
            
            if edge.edge_type == EdgeType.BELOW:
                # Target is below source with margin
                # source.y + source.height + margin <= target.y
                self.model.Add(
                    va["y"] + va["height"] + edge.value <= vb["y"]
                )
                self.constraint_info.append((f"{edge.source_id}_above_{edge.target_id}", edge.priority))
            
            elif edge.edge_type == EdgeType.ABOVE:
                # Target is above source
                self.model.Add(
                    vb["y"] + vb["height"] + edge.value <= va["y"]
                )
                self.constraint_info.append((f"{edge.source_id}_below_{edge.target_id}", edge.priority))
            
            elif edge.edge_type == EdgeType.RIGHT_OF:
                # Target is right of source
                self.model.Add(
                    va["x"] + va["width"] + edge.value <= vb["x"]
                )
                self.constraint_info.append((f"{edge.source_id}_left_{edge.target_id}", edge.priority))
            
            elif edge.edge_type == EdgeType.LEFT_OF:
                # Target is left of source
                self.model.Add(
                    vb["x"] + vb["width"] + edge.value <= va["x"]
                )
                self.constraint_info.append((f"{edge.source_id}_right_{edge.target_id}", edge.priority))
            
            elif edge.edge_type == EdgeType.ALIGN_LEFT:
                # Same x coordinate
                self.model.Add(va["x"] == vb["x"])
                self.constraint_info.append((f"align_left_{edge.source_id}_{edge.target_id}", edge.priority))
            
            elif edge.edge_type == EdgeType.ALIGN_CENTER_X:
                # Same center x: a.x + a.width/2 == b.x + b.width/2
                # Rearranged: 2*a.x + a.width == 2*b.x + b.width
                self.model.Add(
                    2 * va["x"] + va["width"] == 2 * vb["x"] + vb["width"]
                )
                self.constraint_info.append((f"align_center_x_{edge.source_id}_{edge.target_id}", edge.priority))
            
            elif edge.edge_type == EdgeType.ALIGN_CENTER_Y:
                # Same center y
                self.model.Add(
                    2 * va["y"] + va["height"] == 2 * vb["y"] + vb["height"]
                )
                self.constraint_info.append((f"align_center_y_{edge.source_id}_{edge.target_id}", edge.priority))
            
            elif edge.edge_type == EdgeType.INSIDE:
                # Target is inside source (container)
                # container.x <= child.x
                # child.x + child.width <= container.x + container.width
                # Same for y
                self.model.Add(va["x"] <= vb["x"])
                self.model.Add(vb["x"] + vb["width"] <= va["x"] + va["width"])
                self.model.Add(va["y"] <= vb["y"])
                self.model.Add(vb["y"] + vb["height"] <= va["y"] + va["height"])
                self.constraint_info.append((f"inside_{edge.target_id}_in_{edge.source_id}", edge.priority))
    
    def solve(self, skip_priorities: set[int] = None) -> SolvedLayout:
        """
        Solve the constraint satisfaction problem.
        
        Args:
            skip_priorities: Set of priority levels to skip (for relaxation)
            
        Returns:
            SolvedLayout with element coordinates or failure status
        """
        import time
        start = time.time()
        
        # Reset model
        self.model = cp_model.CpModel()
        self.vars = {}
        self.constraint_info = []
        
        # Build model
        self._create_variables()
        self._add_boundary_constraints()
        self._add_non_overlap_constraints()
        self._add_edge_constraints(skip_priorities)
        
        # Configure solver
        self.solver.parameters.max_time_in_seconds = self.timeout_ms / 1000.0
        
        # Solve
        status = self.solver.Solve(self.model)
        solve_time = (time.time() - start) * 1000
        
        status_name = {
            cp_model.OPTIMAL: "optimal",
            cp_model.FEASIBLE: "feasible",
            cp_model.INFEASIBLE: "infeasible",
            cp_model.MODEL_INVALID: "invalid",
            cp_model.UNKNOWN: "unknown",
        }.get(status, "error")
        
        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            # Extract solution
            elements = {}
            for node_id, v in self.vars.items():
                elements[node_id] = {
                    "x": self.solver.Value(v["x"]),
                    "y": self.solver.Value(v["y"]),
                    "width": self.solver.Value(v["width"]),
                    "height": self.solver.Value(v["height"]),
                }
                
                # Update node with solved values
                node = self.graph.nodes.get(node_id)
                if node:
                    node.solved_x = elements[node_id]["x"]
                    node.solved_y = elements[node_id]["y"]
                    node.solved_width = elements[node_id]["width"]
                    node.solved_height = elements[node_id]["height"]
            
            return SolvedLayout(
                success=True,
                elements=elements,
                solve_time_ms=solve_time,
                status=status_name,
                relaxed_constraints=[
                    desc for desc, prio in self.constraint_info
                    if skip_priorities and prio in skip_priorities
                ],
            )
        
        return SolvedLayout(
            success=False,
            elements={},
            solve_time_ms=solve_time,
            status=status_name,
        )
