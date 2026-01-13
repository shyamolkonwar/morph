# MorphV2 Generative Banner System

## Architecture

This project implements a **5-Pillar First-Principles Design Engine** for generating professional banners:

1. **First-Principles Design Engine** - GOD Prompt with Creative Director + Layout Engineer personas
2. **Constraint-Based Synthesis** - Constraint Graph JSON + mathematical validation
3. **High-Performance Rendering** - SVG to PNG/WebP export
4. **Verification & Validation Layer** - 5-layer automated QA
5. **Iterative Refinement Loop** - Self-correcting design generation

## Project Structure

```
banner-generator/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── agents/         # Design refinement agent
│   │   ├── pipeline/       # Verification pipeline
│   │   ├── prompts/        # GOD Prompt system
│   │   ├── render/         # SVG renderer
│   │   └── validators/     # 5 validation layers
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # Next.js frontend
│   └── src/
│       ├── app/api/v2/    # MorphV2 API routes
│       ├── components/     # React components
│       └── lib/           # Utilities & types
├── docs/                   # Architecture documentation
└── docker-compose.yml
```

## Quick Start

### Backend (Python)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Copy environment template and add API keys
cp env.example .env
# Edit .env with your ANTHROPIC_API_KEY or OPENAI_API_KEY

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

### Docker (Full Stack)

```bash
# Set environment variables
export ANTHROPIC_API_KEY=your-key-here

# Run both services
docker-compose up -d
```

## API Endpoints

### Backend (Python)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Detailed health status |
| `/api/v1/generate-banner` | POST | Generate banner with first-principles design |
| `/api/v1/verify-svg` | POST | Validate SVG against 5-layer QA |

### Frontend (Next.js)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/generate` | POST | Proxies to Python backend with auth |
| `/api/generate` | POST | Legacy V1 template-based generation |

## Generation Request

```json
{
  "prompt": "Create a professional tech startup banner",
  "canvas_width": 1200,
  "canvas_height": 630,
  "brand_colors": ["#FF6B35", "#FFFFFF", "#004E89"],
  "max_iterations": 5
}
```

## Response

```json
{
  "status": "success",
  "svg": "<svg>...</svg>",
  "verification_report": {
    "overall": "pass",
    "layers": {
      "syntax": {"status": "pass", "errors": []},
      "spatial": {"status": "pass", "errors": []},
      "text_readability": {"status": "pass", "errors": []},
      "color_palette": {"status": "pass", "errors": []},
      "rendering": {"status": "pass", "errors": []}
    }
  },
  "iterations": 1
}
```

## Configuration

Environment variables (backend `.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | - | Claude API key |
| `OPENAI_API_KEY` | - | OpenAI API key |
| `DEFAULT_AI_PROVIDER` | `anthropic` | `anthropic` or `openai` |
| `MAX_ITERATIONS` | `5` | Max refinement iterations |
| `CORS_ORIGINS` | `localhost:3000` | Allowed origins |

## License

Proprietary - All rights reserved.
