# 🍽️ AI-Powered Restaurant Booking System

Enterprise-grade microservices application for restaurant bookings with AI-powered natural language interface.

## 🎯 Features

- **AI-Powered Bookings**: Natural language chat interface using GPT-3.5-turbo
- **Microservices Architecture**: 6 independent services (API Gateway, AI Service, Restaurant Service, Booking Service, Notification Service, Frontend)
- **Full DevOps Automation**: Docker, Kubernetes, Helm, CI/CD ready
- **Production Monitoring**: Prometheus metrics, Grafana dashboards, AlertManager
- **Auto-scaling**: Horizontal Pod Autoscaler configured for all services
- **High Availability**: Rolling deployments, health checks, self-healing

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │ (React + Vite)
└──────┬──────┘
       │
┌──────▼──────────┐
│  API Gateway    │ (Node.js + Express)
│  - Auth         │
│  - Rate Limit   │
│  - Metrics      │
└────┬────┬───┬───┘
     │    │   │
┌────▼─┐ ┌▼──┐┌▼────────┐
│ AI   │ │Res││ Booking │
│Service│ │trt││ Service │
│      │ │Svc││         │
└──────┘ └───┘└────┬────┘
                   │
              ┌────▼────────┐
              │Notification │
              │  Service    │
              └─────────────┘

Databases: PostgreSQL, MongoDB, Redis
Monitoring: Prometheus + Grafana
Orchestration: Kubernetes + Helm
```

## 🚀 Quick Start

### Prerequisites

- Docker Desktop (4.20+)
- Minikube (1.30+) or any Kubernetes cluster
- kubectl (1.27+)
- Helm (3.12+)
- 8GB+ RAM available

### One-Command Setup

```bash
chmod +x setup.sh
./setup.sh
```

This will:
1. Start Minikube with required addons
2. Build all Docker images
3. Install Prometheus + Grafana
4. Deploy the application via Helm
5. Configure monitoring (ServiceMonitors, Alerts, Dashboards)

### Access the System

After setup completes:

```bash
# Get Minikube IP
export MINIKUBE_IP=$(minikube ip)

# Add to /etc/hosts
echo "$MINIKUBE_IP restaurant.local" | sudo tee -a /etc/hosts

# Access endpoints
open http://$MINIKUBE_IP:30000                    # Frontend
open http://$MINIKUBE_IP:30000/api/v1/restaurants # API
```

**Grafana**: 
```bash
kubectl port-forward svc/prometheus-grafana 3001:80 -n monitoring
# Open http://localhost:3001 (admin/admin123)
```

**Prometheus**:
```bash
kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n monitoring
# Open http://localhost:9090
```

## 📦 Services

| Service | Port | Language | Database | Description |
|---------|------|----------|----------|-------------|
| **API Gateway** | 3000 | Node.js | Redis | Auth, rate limiting, routing |
| **AI Service** | 8001 | Python/FastAPI | - | Natural language processing |
| **Restaurant Service** | 3001 | Node.js | PostgreSQL | Restaurant catalog & availability |
| **Booking Service** | 8002 | Python/FastAPI | MongoDB | Booking management |
| **Notification Service** | 3003 | Node.js | Redis | Email notifications |
| **Frontend** | 80 | React/Vite | - | User interface |

## 🐳 Docker Commands

```bash
# Build all images
make build

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## ☸️ Kubernetes Commands

```bash
# Deploy to dev environment
make deploy-dev

# Deploy to production
make deploy-prod

# Check pod status
kubectl get pods -n restaurant-system

# View HPA status
kubectl get hpa -n restaurant-system

# Rollback deployment
make rollback

# View logs
make logs

# Run health checks
make test
```

## 📊 Monitoring

### Metrics Endpoints

All services expose Prometheus metrics at `/metrics`:

```bash
curl http://$MINIKUBE_IP:30000/metrics  # API Gateway
```

### Custom Metrics

**AI Service**:
- `ai_requests_total` - Total AI requests by intent type
- `ai_inference_duration_seconds` - AI inference latency
- `llm_tokens_used_total` - OpenAI token usage
- `booking_recommendations_total` - Recommendations by cuisine

**Booking Service**:
- `bookings_created_total` - Total bookings created
- `bookings_cancelled_total` - Total cancellations
- `booking_processing_duration_seconds` - Booking processing time
- `active_bookings_total` - Current active bookings

**API Gateway**:
- `http_requests_total` - HTTP requests by method, route, status
- `http_request_duration_seconds` - Request latency
- `rate_limit_exceeded_total` - Rate limit violations

### Grafana Dashboards

4 pre-built dashboards in "Restaurant Booking" folder:
1. **System Overview** - Overall health, traffic, resource usage
2. **AI Service** - AI performance, token usage, intent distribution
3. **Booking Operations** - Booking metrics, success rates, trends
4. **Infrastructure Health** - Node/pod health, HPA status, restarts

### Alerts

7 alert rules configured:
- `HighErrorRate` - 5xx errors > 5% for 5m
- `HighLatency` - P99 latency > 2s for 5m
- `PodCrashLooping` - Pod restarts > 5 in 10m
- `AIServiceDown` - AI service unavailable
- `HighMemoryUsage` - Memory > 85% for 5m
- `DatabaseConnectionsHigh` - PostgreSQL connections > 90
- `HPAMaxReplicas` - HPA at maximum replicas

## 🧪 Testing the AI Booking

### Via API

```bash
curl -X POST http://$MINIKUBE_IP:30000/api/v1/ai/booking \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need a table for 4 at an Italian restaurant this Friday at 7pm in downtown"
  }'
```

### Via Frontend

1. Open http://restaurant.local
2. Use the chat interface:
   - "Book me 2 seats at a sushi place tonight"
   - "Find me a romantic French restaurant for 2 people on Saturday evening"
   - "Table for 6 at a family-friendly place this weekend"

### Expected Response

```json
{
  "intent": "booking_request",
  "extracted": {
    "party_size": 4,
    "cuisine": "Italian",
    "date": "2026-03-07",
    "time": "19:00",
    "location": "downtown"
  },
  "recommendations": [
    {
      "restaurant_id": "uuid",
      "name": "Bella Italia",
      "cuisine": "Italian",
      "rating": 4.5,
      "available_slots": ["18:30", "19:00", "19:30"]
    }
  ]
}
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `OPENAI_API_KEY` - OpenAI API key (optional, falls back to mock)
- `JWT_SECRET` - Secret for JWT token signing
- `POSTGRES_PASSWORD` - PostgreSQL password
- `MONGO_PASSWORD` - MongoDB password

### Helm Values

Edit values for different environments:
- `helm/restaurant-booking/values-dev.yaml` - Development
- `helm/restaurant-booking/values-prod.yaml` - Production

## 📈 Scaling

### Manual Scaling

```bash
kubectl scale deployment api-gateway --replicas=5 -n restaurant-system
```

### Auto-Scaling (HPA)

HPA is pre-configured for all services:
- **Min replicas**: 2
- **Max replicas**: 10
- **Target CPU**: 70%
- **Target Memory**: 80%

Watch auto-scaling:
```bash
kubectl get hpa -n restaurant-system -w
```

Load test to trigger scaling:
```bash
kubectl run load-test --image=busybox -it --rm --restart=Never -- \
  sh -c "while true; do wget -q -O- http://api-gateway:3000/api/v1/restaurants; done"
```

## 🛠️ Development

### Local Development

Run individual services:

```bash
# API Gateway
cd services/api-gateway
npm install
npm run dev

# AI Service
cd services/ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload

# Restaurant Service
cd services/restaurant-service
npm install
npm run dev
```

### Building Images

```bash
# Build specific service
docker build -t restaurant-booking/api-gateway:1.0.0 ./services/api-gateway

# Build all services
make build
```

## 🗑️ Cleanup

```bash
# Remove application
make clean

# Or manually
helm uninstall restaurant-booking -n restaurant-system
helm uninstall prometheus -n monitoring
kubectl delete namespace restaurant-system
kubectl delete namespace monitoring
minikube stop
minikube delete
```

## 📚 Project Structure

```
restaurant-booking-system/
├── services/           # Microservices source code
├── k8s/               # Kubernetes manifests
├── helm/              # Helm charts
├── monitoring/        # Prometheus & Grafana configs
├── scripts/           # Automation scripts
├── docker-compose.yml # Local development
├── Makefile          # Common commands
└── README.md         # This file
```

## 🔒 Security

- All services run as non-root user (uid: 1001)
- JWT authentication on all API routes
- Rate limiting: 100 req/min per IP
- Secrets stored in Kubernetes Secrets
- Network policies enforced
- Security context configured for all pods

## 🚀 CI/CD Integration

This project is CI/CD ready. Example GitHub Actions workflow:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build images
        run: make build
      - name: Push to registry
        run: make push
      - name: Deploy
        run: make deploy-prod
```

## 📞 Support

- Check health: `make test`
- View logs: `make logs`
- Monitor dashboard: `make monitor`
- Rollback: `make rollback`

## 📄 License

MIT License - Enterprise-grade production system built for demonstration purposes.

---

Built with ❤️ by DevOps Team
