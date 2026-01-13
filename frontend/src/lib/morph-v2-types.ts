/**
 * MorphV2 Type Definitions
 * 
 * Types for the first-principles generative design system
 */

// Verification layer result
export interface VerificationLayer {
    status: "pass" | "fail" | "warning" | "skipped";
    errors: string[];
}

// Full verification report
export interface VerificationReport {
    overall: "pass" | "fail";
    layers: {
        syntax?: VerificationLayer;
        spatial?: VerificationLayer;
        text_readability?: VerificationLayer;
        color_palette?: VerificationLayer;
        rendering?: VerificationLayer;
    };
    timestamp: string;
}

// Constraint graph element
export interface ConstraintElement {
    id: string;
    type: "text" | "rect" | "circle" | "path" | "image" | "group";
    content?: string;
    properties?: {
        fontSize?: number;
        fontFamily?: string;
        fontWeight?: number | string;
        color?: string;
        fill?: string;
        stroke?: string;
        width?: number;
        height?: number;
        borderRadius?: number;
        opacity?: number;
    };
    constraints?: {
        minX?: number;
        minY?: number;
        maxX?: number;
        maxY?: number;
        maxWidth?: number;
        alignment?: "left" | "center" | "right";
        alignLeft?: string;
        alignRight?: string;
        alignTop?: string;
        alignBottom?: string;
        belowElement?: string;
        aboveElement?: string;
        offsetX?: number;
        offsetY?: number;
        centerVerticalWith?: string;
        centerHorizontalWith?: string;
    };
}

// Constraint graph relationship
export interface ConstraintRelationship {
    type: "alignment" | "spacing" | "containment" | "relative";
    elements?: string[];
    source?: string;
    target?: string;
    relation?: "left_of" | "right_of" | "above" | "below" | "center";
    distance?: number;
    axis?: "left" | "right" | "center" | "top" | "bottom";
}

// Full constraint graph
export interface ConstraintGraph {
    canvas?: {
        width: number;
        height: number;
        backgroundColor?: string;
    };
    elements: ConstraintElement[];
    relationships: ConstraintRelationship[];
}

// Complete MorphV2 generation result
export interface MorphV2DesignResult {
    status: "success" | "partial" | "failed";
    svg?: string;
    png_base64?: string;
    verification_report?: VerificationReport;
    constraint_graph?: ConstraintGraph;
    analysis?: string;
    iterations: number;
    warning?: string;
    error?: string;
}
