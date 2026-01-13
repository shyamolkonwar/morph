"""
Unit Tests for Layout Solver
"""

import pytest
from app.solver.layout_graph import (
    LayoutGraph, LayoutNode, LayoutEdge, EdgeType, AnchorPoint
)
from app.solver.constraint_solver import ConstraintSolver, SolvedLayout
from app.solver.relaxation import RelaxationEngine, ConstraintPriority, solve_layout
from app.solver.layout_export import export_solved_layout, generate_svg_from_layout


class TestLayoutGraph:
    """Test layout graph construction"""
    
    def test_create_graph(self):
        graph = LayoutGraph(canvas_width=1200, canvas_height=630)
        assert graph.canvas_width == 1200
        assert graph.canvas_height == 630
    
    def test_add_node(self):
        graph = LayoutGraph()
        node = LayoutNode(id="headline", node_type="text", min_width=100, min_height=50)
        graph.add_node(node)
        
        assert "headline" in graph.nodes
        assert graph.nodes["headline"].node_type == "text"
    
    def test_add_edge(self):
        graph = LayoutGraph()
        graph.add_node(LayoutNode(id="a", node_type="text"))
        graph.add_node(LayoutNode(id="b", node_type="text"))
        
        edge = LayoutEdge(source_id="a", target_id="b", edge_type=EdgeType.BELOW, value=24)
        graph.add_edge(edge)
        
        assert len(graph.edges) == 1
        assert graph.edges[0].edge_type == EdgeType.BELOW
    
    def test_add_edge_invalid_node(self):
        graph = LayoutGraph()
        graph.add_node(LayoutNode(id="a", node_type="text"))
        
        edge = LayoutEdge(source_id="a", target_id="nonexistent", edge_type=EdgeType.BELOW)
        
        with pytest.raises(ValueError):
            graph.add_edge(edge)
    
    def test_from_constraint_graph(self):
        constraint_json = {
            "elements": [
                {"id": "headline", "type": "text", "constraints": {"minWidth": 200}},
                {"id": "subheadline", "type": "text"},
            ],
            "relationships": [
                {"type": "spacing", "source": "headline", "target": "subheadline", "distance": 32, "relation": "below"}
            ]
        }
        
        graph = LayoutGraph.from_constraint_graph(constraint_json)
        
        assert len(graph.nodes) == 2
        assert "headline" in graph.nodes
        assert len(graph.edges) == 1
        assert graph.edges[0].edge_type == EdgeType.BELOW


class TestConstraintSolver:
    """Test CP-SAT constraint solving"""
    
    def test_simple_solve(self):
        graph = LayoutGraph(canvas_width=400, canvas_height=200)
        graph.add_node(LayoutNode(id="box", node_type="shape", fixed_width=100, fixed_height=50))
        
        solver = ConstraintSolver(graph)
        layout = solver.solve()
        
        assert layout.success is True
        assert "box" in layout.elements
        assert layout.elements["box"]["width"] == 100
        assert layout.elements["box"]["height"] == 50
    
    def test_boundary_constraints(self):
        graph = LayoutGraph(canvas_width=200, canvas_height=100)
        graph.add_node(LayoutNode(id="box", node_type="shape", fixed_width=150, fixed_height=80))
        
        solver = ConstraintSolver(graph)
        layout = solver.solve()
        
        assert layout.success is True
        # Element should be within canvas bounds
        x, y, w, h = (
            layout.elements["box"]["x"],
            layout.elements["box"]["y"],
            layout.elements["box"]["width"],
            layout.elements["box"]["height"],
        )
        assert x >= 0
        assert y >= 0
        assert x + w <= 200
        assert y + h <= 100
    
    def test_non_overlap(self):
        graph = LayoutGraph(canvas_width=300, canvas_height=200)
        graph.add_node(LayoutNode(id="a", node_type="shape", fixed_width=100, fixed_height=100))
        graph.add_node(LayoutNode(id="b", node_type="shape", fixed_width=100, fixed_height=100))
        
        solver = ConstraintSolver(graph)
        layout = solver.solve()
        
        assert layout.success is True
        
        # Check that boxes don't overlap
        a = layout.elements["a"]
        b = layout.elements["b"]
        
        # At least one separation must be true
        left_sep = a["x"] + a["width"] <= b["x"]
        right_sep = b["x"] + b["width"] <= a["x"]
        top_sep = a["y"] + a["height"] <= b["y"]
        bottom_sep = b["y"] + b["height"] <= a["y"]
        
        assert left_sep or right_sep or top_sep or bottom_sep
    
    def test_below_constraint(self):
        graph = LayoutGraph(canvas_width=400, canvas_height=200)
        graph.add_node(LayoutNode(id="top", node_type="text", fixed_width=200, fixed_height=40))
        graph.add_node(LayoutNode(id="bottom", node_type="text", fixed_width=200, fixed_height=40))
        
        graph.add_edge(LayoutEdge(
            source_id="top", target_id="bottom",
            edge_type=EdgeType.BELOW, value=20, priority=1
        ))
        
        solver = ConstraintSolver(graph)
        layout = solver.solve()
        
        assert layout.success is True
        top = layout.elements["top"]
        bottom = layout.elements["bottom"]
        
        # Bottom should be below top with at least 20px margin
        assert top["y"] + top["height"] + 20 <= bottom["y"]


class TestRelaxationEngine:
    """Test auto-correction with relaxation"""
    
    def test_feasible_layout(self):
        graph = LayoutGraph(canvas_width=400, canvas_height=200)
        graph.add_node(LayoutNode(id="box", node_type="shape", fixed_width=100, fixed_height=50))
        
        engine = RelaxationEngine(graph)
        result = engine.solve_with_relaxation()
        
        assert result.layout.success is True
        assert result.iterations == 1
        assert len(result.adjustments) == 0
    
    def test_solve_layout_convenience(self):
        constraint_json = {
            "elements": [
                {"id": "headline", "type": "text", "constraints": {"width": 400, "height": 60}},
            ],
            "relationships": []
        }
        
        result = solve_layout(constraint_json, canvas_width=800, canvas_height=400)
        
        assert result.layout.success is True
        assert "headline" in result.layout.elements


class TestLayoutExport:
    """Test layout export utilities"""
    
    def test_export_solved_layout(self):
        graph = LayoutGraph(canvas_width=400, canvas_height=200)
        node = LayoutNode(id="test", node_type="text", content="Hello")
        graph.add_node(node)
        
        solver = ConstraintSolver(graph)
        layout = solver.solve()
        
        calculated = export_solved_layout(graph, layout)
        
        assert calculated.canvas_width == 400
        assert len(calculated.elements) == 1
        assert calculated.elements[0]["id"] == "test"
    
    def test_generate_svg(self):
        graph = LayoutGraph(canvas_width=400, canvas_height=200)
        graph.add_node(LayoutNode(
            id="headline", node_type="text",
            fixed_width=200, fixed_height=40,
            content="Hello World", font_size=24
        ))
        
        solver = ConstraintSolver(graph)
        layout = solver.solve()
        calculated = export_solved_layout(graph, layout)
        
        svg = generate_svg_from_layout(calculated)
        
        assert '<svg width="400" height="200"' in svg
        assert 'id="headline"' in svg


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
