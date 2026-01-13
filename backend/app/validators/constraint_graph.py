"""
Constraint Graph Validator
Validates the constraint graph JSON structure
"""

import json
from typing import Tuple, Dict, Any


class ConstraintGraphValidator:
    """Validates constraint graphs before SVG generation"""
    
    REQUIRED_ELEMENT_KEYS = {"id", "type"}
    VALID_ELEMENT_TYPES = {"text", "rect", "circle", "path", "image", "group"}
    VALID_RELATIONSHIP_TYPES = {"alignment", "spacing", "containment", "relative"}
    
    def validate(self, graph_json: str) -> Tuple[bool, list[str]]:
        """
        Parse and validate constraint graph.
        
        Args:
            graph_json: JSON string of the constraint graph
            
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        # Parse JSON
        try:
            graph = json.loads(graph_json)
        except json.JSONDecodeError as e:
            return False, [f"Invalid JSON: {str(e)}"]
        
        # Handle nested structure if present
        if "design" in graph:
            graph = graph["design"]
        
        # Validate structure
        if "elements" not in graph:
            errors.append("Missing 'elements' key")
        
        # Relationships are optional but checked if present
        if "relationships" in graph and not isinstance(graph["relationships"], list):
            errors.append("'relationships' must be an array")
        
        # Validate elements
        elements: Dict[str, Any] = {}
        for elem in graph.get("elements", []):
            elem_errors = self._validate_element(elem)
            errors.extend(elem_errors)
            
            if "id" in elem:
                elements[elem["id"]] = elem
        
        # Validate relationships reference existing elements
        for rel in graph.get("relationships", []):
            rel_errors = self._validate_relationship(rel, elements)
            errors.extend(rel_errors)
        
        return len(errors) == 0, errors
    
    def _validate_element(self, elem: Dict[str, Any]) -> list[str]:
        """Validate a single element"""
        errors = []
        
        if not isinstance(elem, dict):
            return ["Element must be an object"]
        
        # Check required keys
        if "id" not in elem:
            errors.append("Element missing 'id'")
            return errors  # Can't continue without id
        
        elem_id = elem["id"]
        
        if "type" not in elem:
            errors.append(f"Element '{elem_id}' missing 'type'")
        elif elem["type"] not in self.VALID_ELEMENT_TYPES:
            errors.append(f"Element '{elem_id}' has invalid type: {elem['type']}")
        
        # Validate constraints if present
        if "constraints" in elem:
            if not isinstance(elem["constraints"], dict):
                errors.append(f"Element '{elem_id}' constraints must be an object")
        
        # Validate properties if present
        if "properties" in elem:
            if not isinstance(elem["properties"], dict):
                errors.append(f"Element '{elem_id}' properties must be an object")
        
        return errors
    
    def _validate_relationship(
        self,
        rel: Dict[str, Any],
        elements: Dict[str, Any]
    ) -> list[str]:
        """Validate a single relationship"""
        errors = []
        
        if not isinstance(rel, dict):
            return ["Relationship must be an object"]
        
        rel_type = rel.get("type")
        
        if not rel_type:
            errors.append("Relationship missing 'type'")
        elif rel_type not in self.VALID_RELATIONSHIP_TYPES:
            errors.append(f"Invalid relationship type: {rel_type}")
        
        # Validate alignment relationships
        if rel_type == "alignment":
            ref_elements = rel.get("elements", [])
            if not isinstance(ref_elements, list):
                errors.append("Alignment 'elements' must be an array")
            else:
                for elem_id in ref_elements:
                    if elem_id not in elements:
                        errors.append(f"Alignment references non-existent element: {elem_id}")
        
        # Validate spacing relationships
        elif rel_type == "spacing":
            source = rel.get("source")
            target = rel.get("target")
            
            if source and source not in elements:
                errors.append(f"Spacing references non-existent source: {source}")
            if target and target not in elements:
                errors.append(f"Spacing references non-existent target: {target}")
            
            if "distance" in rel:
                if not isinstance(rel["distance"], (int, float)):
                    errors.append("Spacing 'distance' must be a number")
        
        return errors
    
    def parse(self, graph_json: str) -> Dict[str, Any]:
        """Parse constraint graph JSON and return dict"""
        graph = json.loads(graph_json)
        if "design" in graph:
            return graph["design"]
        return graph
