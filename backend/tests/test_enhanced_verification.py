"""
Unit Tests for Enhanced Verification Layer
"""

import pytest
from app.validators.error_report import (
    ValidationError, ValidationReport, ErrorType, Severity,
    create_contrast_error, create_overlap_error, create_bounds_error,
    create_blank_canvas_error, create_balance_warning
)
from app.validators.pixel_inspector import PixelInspector, PixelAnalysis
from app.validators.visual_balance import VisualBalanceAnalyzer, BalanceAnalysis


class TestErrorReport:
    """Test structured error reporting"""
    
    def test_create_validation_error(self):
        error = ValidationError(
            error_type=ErrorType.LOW_CONTRAST,
            severity=Severity.ERROR,
            message="Test error",
            element_id="headline",
            current_value=2.5,
            required_value=4.5,
        )
        
        assert error.error_type == ErrorType.LOW_CONTRAST
        assert error.severity == Severity.ERROR
        assert error.element_id == "headline"
    
    def test_error_to_dict(self):
        error = ValidationError(
            error_type=ErrorType.OUT_OF_BOUNDS,
            severity=Severity.CRITICAL,
            message="Element out of bounds",
            element_id="logo",
        )
        
        d = error.to_dict()
        assert d["type"] == "out_of_bounds"
        assert d["severity"] == "critical"
        assert d["elementId"] == "logo"
    
    def test_error_to_prompt(self):
        error = ValidationError(
            error_type=ErrorType.LOW_CONTRAST,
            severity=Severity.ERROR,
            message="Low contrast",
            element_id="headline",
            suggestion="Change color",
        )
        
        prompt = error.to_prompt()
        assert "LOW_CONTRAST" in prompt or "low_contrast" in prompt
        assert "headline" in prompt
        assert "Change color" in prompt
    
    def test_validation_report(self):
        report = ValidationReport(passed=True)
        assert report.passed is True
        assert len(report.errors) == 0
    
    def test_report_add_error(self):
        report = ValidationReport(passed=True)
        
        error = ValidationError(
            error_type=ErrorType.BLANK_CANVAS,
            severity=Severity.CRITICAL,
            message="Canvas is blank",
        )
        report.add_error(error)
        
        assert report.passed is False
        assert len(report.errors) == 1
    
    def test_report_add_warning(self):
        report = ValidationReport(passed=True)
        
        warning = ValidationError(
            error_type=ErrorType.UNBALANCED_LAYOUT,
            severity=Severity.WARNING,
            message="Layout unbalanced",
        )
        report.add_error(warning)
        
        # Warnings don't fail validation
        assert report.passed is True
        assert len(report.warnings) == 1
    
    def test_report_to_refinement_prompt(self):
        report = ValidationReport(passed=False)
        report.errors.append(ValidationError(
            error_type=ErrorType.LOW_CONTRAST,
            severity=Severity.ERROR,
            message="Contrast too low",
        ))
        
        prompt = report.to_refinement_prompt()
        assert "FAILED" in prompt
        assert "Contrast too low" in prompt


class TestErrorFactories:
    """Test error factory functions"""
    
    def test_create_contrast_error(self):
        error = create_contrast_error(
            element_id="headline",
            current_ratio=2.1,
            required_ratio=4.5,
            foreground="#333333",
            background="#555555",
        )
        
        assert error.error_type == ErrorType.LOW_CONTRAST
        assert error.current_value == 2.1
        assert error.required_value == 4.5
    
    def test_create_overlap_error(self):
        error = create_overlap_error(
            element_a="headline",
            element_b="subheadline",
        )
        
        assert error.error_type == ErrorType.ILLEGAL_OVERLAP
        assert "headline" in error.message
        assert "subheadline" in error.message
    
    def test_create_bounds_error(self):
        error = create_bounds_error(
            element_id="logo",
            location={"x": 1100, "y": 0, "width": 200, "height": 100},
            canvas_width=1200,
            canvas_height=630,
        )
        
        assert error.error_type == ErrorType.OUT_OF_BOUNDS
        assert error.severity == Severity.CRITICAL
    
    def test_create_blank_canvas_error(self):
        error = create_blank_canvas_error()
        
        assert error.error_type == ErrorType.BLANK_CANVAS
        assert error.severity == Severity.CRITICAL
    
    def test_create_balance_warning(self):
        warning = create_balance_warning(
            center_x=800,
            center_y=315,
            ideal_x=600,
            ideal_y=315,
        )
        
        assert warning.error_type == ErrorType.UNBALANCED_LAYOUT
        assert warning.severity == Severity.WARNING


class TestPixelInspector:
    """Test pixel inspection"""
    
    def test_inspector_creation(self):
        inspector = PixelInspector()
        assert inspector.blank_threshold == 0.98
    
    def test_custom_threshold(self):
        inspector = PixelInspector(blank_threshold=0.95)
        assert inspector.blank_threshold == 0.95


class TestVisualBalanceAnalyzer:
    """Test visual balance analysis"""
    
    def test_analyzer_creation(self):
        analyzer = VisualBalanceAnalyzer()
        assert analyzer.balance_threshold == 0.25
    
    def test_custom_threshold(self):
        analyzer = VisualBalanceAnalyzer(balance_threshold=0.3)
        assert analyzer.balance_threshold == 0.3


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
