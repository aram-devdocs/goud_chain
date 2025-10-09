# Goud Chain API Testing with Jupyter

Comprehensive testing environment for the Goud Chain API using Jupyter notebooks with Docker integration.

## Overview

This directory contains a Jupyter Lab environment for testing and experimenting with the Goud Chain API. The setup provides:

- **Interactive testing** of all API endpoints
- **Performance metrics** and timing analysis
- **Bulk data submission** testing
- **Visual reports** with charts and graphs
- **Persistent scratch space** for experiments

## Architecture

### Directory Structure

```
python/
├── notebooks/          # Git-tracked notebooks (READ-ONLY in Jupyter)
│   └── test_goud_chain.ipynb  # Main API test suite
├── scratch/            # Experimental notebooks (READ-WRITE, not in git)
│   └── .gitkeep
├── requirements.txt    # Python dependencies
├── Dockerfile          # Jupyter Lab container
└── README.md           # This file
```

### File Management Strategy

**Git-tracked notebooks (`notebooks/`):**
- Committed to version control
- **Read-only** when viewed in Jupyter web UI
- Edit these files in VS Code, execute in Jupyter browser
- Changes must be committed via git

**Scratch notebooks (`scratch/`):**
- Created in Jupyter web UI
- Persistent across Docker restarts
- **Not tracked in git** (for experiments)
- To promote a scratch notebook to git: manually copy to `notebooks/` in VS Code

## Getting Started

### 1. Start the Development Environment

From the project root:

```bash
./run dev
```

This starts:
- Blockchain nodes (node1, node2, node3)
- NGINX load balancer
- Dashboard
- **Jupyter Lab** at `http://localhost:8888`

### 2. Access Jupyter Lab

Open your browser to: **http://localhost:8888**

You'll see two directories:
- `notebooks/` - Main test suite (read-only)
- `scratch/` - Your experimental space (read-write)

### 3. Run the Test Notebook

1. Navigate to `notebooks/test_goud_chain.ipynb`
2. Run the cells in order (Shift + Enter)
3. The notebook will:
   - Create an API key
   - Submit data to the blockchain
   - Retrieve and decrypt collections
   - Generate performance reports

### 4. Edit Notebooks (Hybrid Workflow)

**Option A: Execute in Browser** (Recommended)
- Open notebook in Jupyter Lab
- Run cells to execute tests
- View outputs, charts, and results

**Option B: Edit in VS Code**
- Open `/python/notebooks/test_goud_chain.ipynb` in VS Code
- Use Jupyter extension to edit cells
- Changes sync to Jupyter container automatically
- Switch to browser to execute and view results

**Option C: Create Experiments**
- Create new notebooks in Jupyter Lab (saved to `scratch/`)
- These are automatically persisted
- Not tracked in git (prevents conflicts)

## Test Notebook Features

The main test notebook (`test_goud_chain.ipynb`) includes:

### Configuration (Cell 1)
```python
BASE_URL = "http://nginx:8080"  # Load balancer endpoint
BULK_SUBMISSION_COUNT = 100     # Number of blocks to create
VERBOSE_LOGGING = True          # Enable detailed logs
```

### API Tests (Cells 3-13)
1. **Create Account** - Generate API key
2. **Login** - Obtain session token
3. **Submit Data (Single)** - Test basic submission
4. **Bulk Submission** - Create multiple blocks (configurable count)
5. **List Collections** - Retrieve all user collections
6. **Decrypt Collection** - Verify data integrity
7. **View Blockchain** - Inspect chain state
8. **Chain Statistics** - Analytics and metrics
9. **Node Metrics** - Performance data
10. **P2P Peers** - Network status
11. **Health Check** - Load balancer health

### Reports & Visualizations (Cell 14)
- Summary statistics table
- Timing analysis per endpoint
- Success/failure rates
- Performance charts (latency, throughput)
- Export to CSV/JSON in `/scratch` directory

## Configuration Options

Edit the configuration cell in the notebook to customize:

| Setting | Default | Description |
|---------|---------|-------------|
| `BASE_URL` | `http://nginx:8080` | API endpoint (load balancer) |
| `BULK_SUBMISSION_COUNT` | `100` | Number of blocks to create in bulk test |
| `API_TIMEOUT` | `30` | Request timeout (seconds) |
| `VERBOSE_LOGGING` | `True` | Print detailed logs |
| `EXPORT_TO_CSV` | `True` | Export results to CSV |
| `EXPORT_TO_JSON` | `True` | Export results to JSON |
| `GENERATE_CHARTS` | `True` | Generate performance charts |

## Global State

The notebook maintains a global state dictionary:

```python
GLOBAL_STATE = {
    "api_key": None,           # Generated API key (save this!)
    "account_id": None,        # User account ID
    "session_token": None,     # JWT token
    "collection_ids": [],      # All created collection IDs
    "test_results": [],        # Test execution results
    "timing_data": {},         # Performance metrics
}
```

Access these values in any cell after running the tests.

## Docker Integration

### Internal Network Access

The Jupyter container runs on the same Docker network (`goud_network`) as the blockchain nodes:

```yaml
networks:
  - goud_network
```

This allows direct access to:
- `http://nginx:8080` - Load balancer (recommended)
- `http://node1:8080` - Direct node access (debugging)
- `http://node2:8080`
- `http://node3:8080`

### Volume Mounts

**Production mode** (`./run start`):
- `notebooks/` → Read-only mount
- `scratch/` → Persistent Docker volume

**Development mode** (`./run dev`):
- `notebooks/` → Read-write mount (for live editing)
- `scratch/` → Persistent Docker volume

### Stopping Jupyter

```bash
./run stop  # Stops all services including Jupyter
```

Data in `/scratch` is persisted in a Docker volume (`jupyter_scratch`).

## Cloud Deployment (Optional)

To expose Jupyter on a subdomain like `dev-notebook.goudchain.com`:

### 1. Update NGINX Configuration

Add to your NGINX config:

```nginx
upstream jupyter {
    server jupyter:8888;
}

server {
    listen 443 ssl;
    server_name dev-notebook.goudchain.com;

    location / {
        proxy_pass http://jupyter;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # WebSocket support for Jupyter kernels
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 2. Configure DNS

Point `dev-notebook.goudchain.com` to your server IP.

### 3. Enable Authentication (Production)

Edit `python/Dockerfile` to add a token:

```dockerfile
CMD ["start-notebook.sh", "--NotebookApp.token='your-secret-token'"]
```

Or use Jupyter's built-in password authentication.

## Troubleshooting

### Jupyter container won't start

```bash
# View logs
docker logs goud_jupyter

# Rebuild container
docker compose -f docker-compose.local.yml build jupyter
./run dev
```

### Can't connect to API

Check that the blockchain nodes are running:

```bash
./run status
```

Ensure `BASE_URL` in the notebook matches your environment:
- Docker internal: `http://nginx:8080`
- External: `http://localhost:8080`

### Notebooks not syncing

- Git-tracked notebooks in `notebooks/` sync via volume mount (instant)
- Scratch notebooks in `scratch/` are stored in Docker volume
- If you don't see changes, try refreshing the Jupyter browser tab

### Permission errors

The Jupyter container runs as user `jovyan` (UID 1000). If you encounter permission issues:

```bash
# Fix ownership
sudo chown -R 1000:1000 python/notebooks python/scratch
```

## Tips & Best Practices

### Performance Testing

1. Start with small `BULK_SUBMISSION_COUNT` (10-20)
2. Gradually increase to find throughput limits
3. Monitor node logs: `./run logs node1`
4. Check load balancer distribution: `./run lb-status`

### Data Management

- Save your API key from Cell 3 (can't be recovered)
- Export reports regularly (stored in `/scratch`)
- Copy important experiments from `/scratch` to `/notebooks` for git tracking

### Development Workflow

1. **Prototyping:** Create new notebook in Jupyter `/scratch`
2. **Testing:** Run cells, iterate quickly
3. **Refining:** Edit in VS Code for better IDE support
4. **Sharing:** Copy polished notebook to `/notebooks` and commit

### VS Code Integration

Install the Jupyter extension in VS Code:

```bash
code --install-extension ms-toolsai.jupyter
```

Then open any `.ipynb` file in VS Code for:
- Syntax highlighting
- IntelliSense
- Inline execution
- Git integration

## Dependencies

The Docker image includes:

- `jupyter/scipy-notebook` base (pandas, matplotlib, numpy, scipy)
- `requests` - HTTP client
- `ipywidgets` - Interactive widgets
- `plotly` - Interactive charts
- `seaborn` - Statistical visualizations
- `tabulate` - Pretty tables
- `python-dotenv` - Environment variables

See [requirements.txt](requirements.txt) for versions.

## Examples

### Quick Test

```python
# Cell 1: Import and configure
import requests
BASE_URL = "http://nginx:8080"

# Cell 2: Health check
response = requests.get(f"{BASE_URL}/health")
print(response.json())
```

### Bulk Performance Test

```python
# Set high volume in config cell
BULK_SUBMISSION_COUNT = 1000

# Run cells 3-6 to create account and submit data
# Cell 14 generates performance report
```

### Custom Endpoint Test

```python
# In a scratch notebook
import requests

headers = {"Authorization": f"Bearer {GLOBAL_STATE['api_key']}"}
response = requests.get(f"{BASE_URL}/data/list", headers=headers)
print(f"Collections: {len(response.json()['collections'])}")
```

## Support

For issues or questions:

1. Check the [main README](../README.md) for project overview
2. Review the [CLAUDE.md](../CLAUDE.md) for architecture details
3. Inspect logs: `./run logs jupyter`
4. Open an issue on GitHub

## License

Same as the main Goud Chain project.
