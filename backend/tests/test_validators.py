"""
Unit Tests for MorphV2 Validators
"""

import pytest
from app.validators.svg_validator import SVGValidator
from app.validators.wcag_validator import WCAGValidator
from app.validators.constraint_graph import ConstraintGraphValidator
from app.validators.spatial_validator import SpatialValidator
from app.validators.color_validator import ColorValidator


class TestSVGValidator:
    """Test SVG syntax validation"""

    def test_valid_svg(self):
        svg = '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect fill="#FF0000" width="100" height="100"/></svg>'
        validator = SVGValidator()
        valid, errors = validator.validate(svg)
        assert valid is True
        assert len(errors) == 0

    def test_missing_width(self):
        svg = '<svg height="100" xmlns="http://www.w3.org/2000/svg"><rect/></svg>'
        validator = SVGValidator()
        valid, errors = validator.validate(svg)
        assert valid is False
        assert any("width" in e.lower() for e in errors)

    def test_invalid_xml(self):
        svg = '<svg width="100" height="100"><rect'
        validator = SVGValidator()
        valid, errors = validator.validate(svg)
        assert valid is False
        assert any("parse" in e.lower() for e in errors)

    def test_empty_svg(self):
        validator = SVGValidator()
        valid, errors = validator.validate("")
        assert valid is False
        assert len(errors) > 0

    def test_extract_dimensions(self):
        svg = '<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"></svg>'
        validator = SVGValidator()
        width, height = validator.extract_dimensions(svg)
        assert width == 1200
        assert height == 630


class TestWCAGValidator:
    """Test WCAG contrast validation"""

    def test_black_white_contrast(self):
        ratio = WCAGValidator.contrast_ratio("#000000", "#FFFFFF")
        assert ratio == pytest.approx(21.0, rel=0.01)

    def test_same_color_contrast(self):
        ratio = WCAGValidator.contrast_ratio("#FF0000", "#FF0000")
        assert ratio == pytest.approx(1.0, rel=0.01)

    def test_hex_to_rgb(self):
        r, g, b = WCAGValidator.hex_to_rgb("#FF8800")
        assert r == pytest.approx(1.0, rel=0.01)
        assert g == pytest.approx(0.533, rel=0.01)
        assert b == pytest.approx(0.0, rel=0.01)

    def test_shorthand_hex(self):
        r, g, b = WCAGValidator.hex_to_rgb("#F00")
        assert r == pytest.approx(1.0, rel=0.01)
        assert g == pytest.approx(0.0, rel=0.01)
        assert b == pytest.approx(0.0, rel=0.01)


class TestConstraintGraphValidator:
    """Test constraint graph validation"""

    def test_valid_graph(self):
        graph = '{"elements": [{"id": "headline", "type": "text"}]}'
        validator = ConstraintGraphValidator()
        valid, errors = validator.validate(graph)
        assert valid is True
        assert len(errors) == 0

    def test_missing_elements(self):
        graph = '{"relationships": []}'
        validator = ConstraintGraphValidator()
        valid, errors = validator.validate(graph)
        assert valid is False
        assert any("elements" in e.lower() for e in errors)

    def test_invalid_element_type(self):
        graph = '{"elements": [{"id": "test", "type": "invalid_type"}]}'
        validator = ConstraintGraphValidator()
        valid, errors = validator.validate(graph)
        assert valid is False
        assert any("invalid type" in e.lower() for e in errors)

    def test_invalid_json(self):
        validator = ConstraintGraphValidator()
        valid, errors = validator.validate("{invalid json")
        assert valid is False


class TestSpatialValidator:
    """Test spatial constraints validation"""

    def test_element_within_bounds(self):
        svg = '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="50" height="50"/></svg>'
        validator = SpatialValidator(canvas_width=100, canvas_height=100)
        valid, errors = validator.validate(svg)
        assert valid is True
        assert len(errors) == 0

    def test_element_exceeds_width(self):
        svg = '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect x="80" y="10" width="50" height="50"/></svg>'
        validator = SpatialValidator(canvas_width=100, canvas_height=100)
        valid, errors = validator.validate(svg)
        assert valid is False
        assert any("exceeds" in e.lower() and "width" in e.lower() for e in errors)


class TestColorValidator:
    """Test color palette validation"""

    def test_approved_colors(self):
        svg = '<svg><rect fill="#FF0000"/></svg>'
        validator = ColorValidator(approved_palette=["#FF0000", "#FFFFFF"])
        valid, errors = validator.validate(svg)
        assert valid is True

    def test_unapproved_color(self):
        svg = '<svg><rect fill="#00FF00"/></svg>'
        validator = ColorValidator(approved_palette=["#FF0000", "#FFFFFF"])
        valid, errors = validator.validate(svg)
        assert valid is False
        assert any("unapproved" in e.lower() for e in errors)

    def test_no_palette_skips_validation(self):
        svg = '<svg><rect fill="#00FF00"/></svg>'
        validator = ColorValidator(approved_palette=None)
        valid, errors = validator.validate(svg)
        assert valid is True

    def test_normalize_color(self):
        validator = ColorValidator()
        assert validator._normalize_color("#abc") == "#AABBCC"
        assert validator._normalize_color("rgb(255, 0, 0)") == "#FF0000"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
