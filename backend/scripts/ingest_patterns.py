#!/usr/bin/env python
"""
Design Pattern Ingestion Script

Ingest sample design patterns into the vector store.
Run with: python scripts/ingest_patterns.py --sample
"""

import asyncio
import json
import argparse
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.vector_store import get_vector_store


# Sample patterns for initial seeding
SAMPLE_PATTERNS = [
    {
        "content": json.dumps({
            "style": "tech_minimalist",
            "layout": {
                "headline": {"x": 60, "y": 180, "fontSize": 48, "fontWeight": "bold"},
                "subheadline": {"x": 60, "y": 240, "fontSize": 24},
                "accent": {"type": "gradient_bar", "position": "left", "width": 8}
            },
            "colors": {"primary": "#2563EB", "secondary": "#1E40AF", "text": "#FFFFFF"},
            "description": "Clean tech startup banner with left-aligned text and accent bar"
        }),
        "category": "tech",
        "metadata": {"style": "minimalist", "industry": "technology", "platform": "linkedin"},
        "source": "curated"
    },
    {
        "content": json.dumps({
            "style": "healthcare_professional",
            "layout": {
                "headline": {"x": "center", "y": 160, "fontSize": 42, "fontWeight": "600"},
                "subheadline": {"x": "center", "y": 220, "fontSize": 20},
                "badge": {"position": "top-right", "type": "credentials"}
            },
            "colors": {"primary": "#059669", "secondary": "#10B981", "text": "#FFFFFF"},
            "description": "Medical professional banner with centered text and credential badge"
        }),
        "category": "healthcare",
        "metadata": {"style": "professional", "industry": "medical", "platform": "linkedin"},
        "source": "curated"
    },
    {
        "content": json.dumps({
            "style": "creative_gradient",
            "layout": {
                "headline": {"x": 80, "y": 200, "fontSize": 52, "fontWeight": "black"},
                "subheadline": {"x": 80, "y": 270, "fontSize": 22},
                "shapes": [
                    {"type": "blob", "position": "top-right", "color": "accent"},
                    {"type": "circle", "position": "bottom-left", "opacity": 0.3}
                ]
            },
            "colors": {"primary": "#7C3AED", "secondary": "#A855F7", "accent": "#F472B6", "text": "#FFFFFF"},
            "description": "Creative designer banner with gradient background and abstract shapes"
        }),
        "category": "creative",
        "metadata": {"style": "bold", "industry": "design", "platform": "linkedin"},
        "source": "curated"
    },
    {
        "content": json.dumps({
            "style": "finance_corporate",
            "layout": {
                "headline": {"x": 100, "y": 170, "fontSize": 44, "fontWeight": "600"},
                "subheadline": {"x": 100, "y": 230, "fontSize": 20},
                "logo_area": {"position": "top-left", "size": 60}
            },
            "colors": {"primary": "#1E3A5F", "secondary": "#2E5077", "accent": "#C5A572", "text": "#FFFFFF"},
            "description": "Corporate finance banner with navy blue and gold accents"
        }),
        "category": "finance",
        "metadata": {"style": "corporate", "industry": "finance", "platform": "linkedin"},
        "source": "curated"
    },
    {
        "content": json.dumps({
            "style": "startup_bold",
            "layout": {
                "headline": {"x": 60, "y": 150, "fontSize": 56, "fontWeight": "900"},
                "subheadline": {"x": 60, "y": 220, "fontSize": 24},
                "cta": {"position": "bottom-right", "style": "pill_button"}
            },
            "colors": {"primary": "#FF6B35", "secondary": "#FF8C5A", "accent": "#FFB088", "text": "#FFFFFF"},
            "description": "Bold startup banner with orange gradient and call-to-action"
        }),
        "category": "startup",
        "metadata": {"style": "bold", "industry": "startup", "platform": "linkedin"},
        "source": "curated"
    },
    {
        "content": json.dumps({
            "style": "educator_friendly",
            "layout": {
                "headline": {"x": "center", "y": 170, "fontSize": 40, "fontWeight": "600"},
                "subheadline": {"x": "center", "y": 230, "fontSize": 22},
                "icons": {"type": "education_symbols", "position": "corners", "opacity": 0.2}
            },
            "colors": {"primary": "#2563EB", "secondary": "#60A5FA", "accent": "#FCD34D", "text": "#FFFFFF"},
            "description": "Educator banner with friendly colors and educational symbols"
        }),
        "category": "education",
        "metadata": {"style": "friendly", "industry": "education", "platform": "linkedin"},
        "source": "curated"
    },
    {
        "content": json.dumps({
            "style": "developer_dark",
            "layout": {
                "headline": {"x": 80, "y": 180, "fontSize": 44, "fontWeight": "bold", "font": "monospace"},
                "subheadline": {"x": 80, "y": 240, "fontSize": 20},
                "code_snippet": {"position": "right", "opacity": 0.15, "content": "const success = true;"}
            },
            "colors": {"primary": "#0D1117", "secondary": "#161B22", "accent": "#58A6FF", "text": "#C9D1D9"},
            "description": "Developer banner with dark theme and code accent"
        }),
        "category": "tech",
        "metadata": {"style": "dark", "industry": "software", "platform": "linkedin", "role": "developer"},
        "source": "curated"
    },
    {
        "content": json.dumps({
            "style": "consultant_elegant",
            "layout": {
                "headline": {"x": 100, "y": 190, "fontSize": 42, "fontWeight": "500"},
                "subheadline": {"x": 100, "y": 250, "fontSize": 18},
                "divider": {"type": "thin_line", "below": "headline", "width": 100}
            },
            "colors": {"primary": "#1F2937", "secondary": "#374151", "accent": "#D97706", "text": "#F9FAFB"},
            "description": "Business consultant banner with elegant typography and subtle accent"
        }),
        "category": "consulting",
        "metadata": {"style": "elegant", "industry": "consulting", "platform": "linkedin"},
        "source": "curated"
    }
]


async def ingest_sample_patterns():
    """Ingest sample patterns into vector store"""
    print("🚀 Starting pattern ingestion...")
    
    vector_store = get_vector_store()
    
    try:
        # Batch insert all patterns
        pattern_ids = await vector_store.store_patterns_batch(SAMPLE_PATTERNS)
        
        print(f"✅ Successfully ingested {len(pattern_ids)} patterns")
        for i, pid in enumerate(pattern_ids):
            print(f"   - {SAMPLE_PATTERNS[i]['category']}: {pid}")
        
        # Get stats
        stats = await vector_store.get_stats()
        print(f"\n📊 Vector Store Stats:")
        print(f"   Total patterns: {stats['total_patterns']}")
        print(f"   Categories: {json.dumps(stats['categories'], indent=2)}")
        
    except Exception as e:
        print(f"❌ Ingestion failed: {e}")
        raise


async def test_search():
    """Test semantic search"""
    print("\n🔍 Testing semantic search...")
    
    vector_store = get_vector_store()
    
    queries = [
        "tech startup minimal design",
        "medical professional healthcare",
        "creative designer portfolio",
        "software engineer developer",
    ]
    
    for query in queries:
        print(f"\n   Query: \"{query}\"")
        patterns = await vector_store.search_patterns(query, match_count=2)
        for p in patterns:
            print(f"     → {p.category} (similarity: {p.similarity:.3f})")


def main():
    parser = argparse.ArgumentParser(description="Ingest design patterns")
    parser.add_argument("--sample", action="store_true", help="Ingest sample patterns")
    parser.add_argument("--test", action="store_true", help="Test search after ingestion")
    parser.add_argument("--file", type=str, help="JSON file with patterns to ingest")
    
    args = parser.parse_args()
    
    if not any([args.sample, args.file]):
        parser.print_help()
        return
    
    async def run():
        if args.sample:
            await ingest_sample_patterns()
        
        if args.file:
            with open(args.file) as f:
                patterns = json.load(f)
            vector_store = get_vector_store()
            ids = await vector_store.store_patterns_batch(patterns)
            print(f"✅ Ingested {len(ids)} patterns from {args.file}")
        
        if args.test:
            await test_search()
    
    asyncio.run(run())


if __name__ == "__main__":
    main()
