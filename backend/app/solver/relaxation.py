"""
Relaxation Engine for Auto-Correction
Handles infeasible layouts by progressively relaxing constraints
"""

from enum import IntEnum
from dataclasses import dataclass
from typing import Optional

from .layout_graph import LayoutGraph, LayoutEdge
from .constraint_solver import ConstraintSolver, SolvedLayout


class ConstraintPriority(IntEnum):
    """Priority levels for constraint relaxation"""
    HARD = 0      # Canvas bounds, no overlap - NEVER relax
    STRUCTURAL = 1  # Essential relationships (headline above body)
    AESTHETIC = 2   # Ideal padding, perfect alignment


@dataclass
class RelaxationResult:
    """Result of relaxation attempt"""
    layout: SolvedLayout
    iterations: int
    relaxed_levels: set[int]
    adjustments: list[str]


class RelaxationEngine:
    """
    Auto-correction engine for infeasible layouts.
    
    Progressively relaxes constraints from lowest to highest priority
    until a feasible solution is found.
    """
    
    def __init__(
        self,
        graph: LayoutGraph,
        max_iterations: int = 5,
        timeout_ms: int = 500,
    ):
        self.graph = graph
        self.max_iterations = max_iterations
        self.timeout_ms = timeout_ms
    
    def solve_with_relaxation(self) -> RelaxationResult:
        """
        Attempt to solve the layout, relaxing constraints if needed.
        
        Relaxation order:
        1. Try full solve with all constraints
        2. If infeasible, drop AESTHETIC (Level 2) constraints
        3. If still infeasible, drop STRUCTURAL (Level 1) constraints
        4. If still infeasible, apply content adjustments
        
        Returns:
            RelaxationResult with final layout and list of adjustments made
        """
        adjustments = []
        relaxed_levels: set[int] = set()
        
        for iteration in range(self.max_iterations):
            solver = ConstraintSolver(
                graph=self.graph,
                timeout_ms=self.timeout_ms,
            )
            
            layout = solver.solve(skip_priorities=relaxed_levels)
            
            if layout.success:
                return RelaxationResult(
                    layout=layout,
                    iterations=iteration + 1,
                    relaxed_levels=relaxed_levels,
                    adjustments=adjustments,
                )
            
            # Progressively relax constraints
            if iteration == 0:
                # First relaxation: drop aesthetic constraints
                relaxed_levels.add(ConstraintPriority.AESTHETIC)
                adjustments.append("Relaxed aesthetic constraints (padding, alignment)")
            
            elif iteration == 1:
                # Second relaxation: drop structural constraints
                relaxed_levels.add(ConstraintPriority.STRUCTURAL)
                adjustments.append("Relaxed structural constraints (spacing relationships)")
            
            elif iteration == 2:
                # Third relaxation: reduce element sizes
                self._reduce_element_sizes()
                adjustments.append("Reduced element sizes by 20%")
            
            elif iteration == 3:
                # Fourth relaxation: reduce margins
                self._reduce_margins()
                adjustments.append("Reduced all margins by 50%")
            
            else:
                # Final fallback: force minimal layout
                self._apply_minimal_layout()
                adjustments.append("Applied minimal fallback layout")
        
        # Final attempt after all relaxations
        solver = ConstraintSolver(
            graph=self.graph,
            timeout_ms=self.timeout_ms,
        )
        layout = solver.solve(skip_priorities=relaxed_levels)
        
        return RelaxationResult(
            layout=layout,
            iterations=self.max_iterations,
            relaxed_levels=relaxed_levels,
            adjustments=adjustments,
        )
    
    def _reduce_element_sizes(self) -> None:
        """Reduce max dimensions of all elements by 20%"""
        for node in self.graph.nodes.values():
            if node.max_width:
                node.max_width = int(node.max_width * 0.8)
            if node.max_height:
                node.max_height = int(node.max_height * 0.8)
            if node.fixed_width:
                node.fixed_width = int(node.fixed_width * 0.8)
            if node.fixed_height:
                node.fixed_height = int(node.fixed_height * 0.8)
    
    def _reduce_margins(self) -> None:
        """Reduce all edge margins by 50%"""
        for edge in self.graph.edges:
            if edge.value > 0:
                edge.value = max(4, edge.value // 2)
    
    def _apply_minimal_layout(self) -> None:
        """
        Apply minimal layout as final fallback.
        Stack elements vertically with minimal spacing.
        """
        # Set all elements to minimal fixed dimensions
        min_height = max(40, self.graph.canvas_height // len(self.graph.nodes))
        
        for i, node in enumerate(self.graph.nodes.values()):
            node.fixed_width = self.graph.canvas_width - 32  # 16px margin on each side
            node.fixed_height = min(min_height, 80)
        
        # Clear all edges except containment
        self.graph.edges = [
            e for e in self.graph.edges
            if e.priority == ConstraintPriority.HARD
        ]


def solve_layout(
    constraint_json: dict,
    canvas_width: int = 1200,
    canvas_height: int = 630,
) -> RelaxationResult:
    """
    Convenience function to solve a layout from constraint JSON.
    
    Args:
        constraint_json: LLM-generated constraint graph
        canvas_width: Canvas width in pixels
        canvas_height: Canvas height in pixels
        
    Returns:
        RelaxationResult with solved layout
    """
    graph = LayoutGraph.from_constraint_graph(
        constraint_json,
        canvas_width=canvas_width,
        canvas_height=canvas_height,
    )
    
    engine = RelaxationEngine(graph)
    return engine.solve_with_relaxation()
