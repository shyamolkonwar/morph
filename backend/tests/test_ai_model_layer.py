"""
Unit Tests for AI Model Layer
"""

import pytest
from app.agents.vision_observer import (
    VisionObserver, LayoutExtraction, VisualQAResult, VisionTask
)
from app.agents.model_orchestrator import (
    ModelOrchestrator, ArchitectConfig, ObserverConfig, 
    OrchestrationResult, ModelRole
)


class TestVisionObserver:
    """Test VisionObserver"""
    
    def test_observer_creation(self):
        observer = VisionObserver()
        assert observer.model == "gpt-4o"
    
    def test_custom_model(self):
        observer = VisionObserver(model="gpt-4o-mini")
        assert observer.model == "gpt-4o-mini"
    
    def test_fallback_layout(self):
        observer = VisionObserver()
        layout = observer._fallback_layout()
        
        assert layout.layout_pattern == "centered"
        assert layout.confidence == 0.0
        assert len(layout.elements) == 2
    
    def test_fallback_qa(self):
        observer = VisionObserver()
        qa = observer._fallback_qa()
        
        assert qa.score == 7
        assert qa.passed is False


class TestLayoutExtraction:
    """Test LayoutExtraction dataclass"""
    
    def test_create_extraction(self):
        extraction = LayoutExtraction(
            layout_pattern="split_screen",
            text_position="left_col",
            elements=[{"id": "headline", "type": "text"}],
            relationships=[],
            confidence=0.9,
        )
        
        assert extraction.layout_pattern == "split_screen"
        assert extraction.confidence == 0.9


class TestVisualQAResult:
    """Test VisualQAResult dataclass"""
    
    def test_passing_result(self):
        result = VisualQAResult(
            score=9,
            passed=True,
            issues=[],
            suggestions=[],
        )
        
        assert result.passed is True
        assert result.score >= 8
    
    def test_failing_result(self):
        result = VisualQAResult(
            score=5,
            passed=False,
            issues=["Poor contrast", "Unbalanced layout"],
            suggestions=[{"element": "headline", "action": "move"}],
        )
        
        assert result.passed is False
        assert len(result.issues) == 2


class TestArchitectConfig:
    """Test ArchitectConfig"""
    
    def test_default_config(self):
        config = ArchitectConfig()
        
        assert config.model == "claude-3-5-sonnet-20241022"
        assert config.temperature == 0.2
        assert config.force_json is True
    
    def test_custom_config(self):
        config = ArchitectConfig(
            temperature=0.1,
            max_tokens=2048,
        )
        
        assert config.temperature == 0.1
        assert config.max_tokens == 2048


class TestModelOrchestrator:
    """Test ModelOrchestrator"""
    
    def test_orchestrator_creation(self):
        orchestrator = ModelOrchestrator()
        
        assert orchestrator.architect_config.model == "claude-3-5-sonnet-20241022"
        assert orchestrator.observer_config.model == "gpt-4o"
    
    def test_config_summary(self):
        orchestrator = ModelOrchestrator()
        summary = orchestrator.get_config_summary()
        
        assert "architect" in summary
        assert "observer" in summary
        assert "verifier" in summary
        assert summary["architect"]["temperature"] == 0.2
    
    def test_position_to_constraints_center(self):
        orchestrator = ModelOrchestrator()
        constraints = orchestrator._position_to_constraints("center", "medium")
        
        assert constraints["width"] == 300
        assert constraints["height"] == 60
        assert constraints["x"] == (1200 - 300) // 2
    
    def test_position_to_constraints_top_left(self):
        orchestrator = ModelOrchestrator()
        constraints = orchestrator._position_to_constraints("top_left", "large")
        
        assert constraints["x"] == 40
        assert constraints["y"] == 40
        assert constraints["width"] == 600


class TestOrchestrationResult:
    """Test OrchestrationResult"""
    
    def test_success_result(self):
        result = OrchestrationResult(
            success=True,
            constraint_graph={"elements": []},
        )
        
        assert result.success is True
        assert result.errors == []
    
    def test_failure_result(self):
        result = OrchestrationResult(
            success=False,
            errors=["Vision model failed"],
        )
        
        assert result.success is False
        assert len(result.errors) == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
