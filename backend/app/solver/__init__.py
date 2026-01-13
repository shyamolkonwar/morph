"""
Layout Solver Package
Constraint satisfaction for mathematically validated layouts
"""

from .layout_graph import LayoutGraph, LayoutNode, LayoutEdge, EdgeType
from .constraint_solver import ConstraintSolver, SolvedLayout
from .relaxation import RelaxationEngine, ConstraintPriority
