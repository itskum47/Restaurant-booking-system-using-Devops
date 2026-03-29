#!/bin/bash

# 🚀 Gemini Integration Deployment Script
# Automates deployment of Google Gemini API replacement to Kubernetes
# Usage: ./deploy-gemini.sh <gemini-api-key> [prod|dev]

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="restaurant-system"
SERVICE_NAME="ai-service"
IMAGE_NAME="restaurant-booking/ai-service"
IMAGE_TAG="1.0.0"
SECRET_NAME="restaurant-secrets"
ENVIRONMENT="${2:-dev}"  # default to 'dev'

# Functions
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl not found. Please install kubectl."
        exit 1
    fi
    print_success "kubectl found"
    
    # Check docker
    if ! command -v docker &> /dev/null; then
        print_error "docker not found. Please install docker."
        exit 1
    fi
    print_success "docker found"
    
    # Check helm
    if ! command -v helm &> /dev/null; then
        print_error "helm not found. Please install helm."
        exit 1
    fi
    print_success "helm found"
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster. Is kubectl configured?"
        exit 1
    fi
    print_success "Connected to Kubernetes cluster"
    
    # Check namespace exists
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        print_warning "Namespace '$NAMESPACE' not found. Creating it..."
        kubectl create namespace $NAMESPACE
        print_success "Namespace created"
    fi
}

# Validate Gemini API Key
validate_api_key() {
    print_header "Validating Gemini API Key"
    
    if [ -z "$1" ]; then
        print_error "Gemini API key is required!"
        echo "Usage: ./deploy-gemini.sh <gemini-api-key> [prod|dev]"
        exit 1
    fi
    
    # Basic validation (should start with 'AIza')
    if [[ ! $1 =~ ^AIza[a-zA-Z0-9_-]{30,}$ ]]; then
        print_warning "API key format may be incorrect. Continuing anyway..."
    fi
    
    print_success "API key validation passed"
}

# Update Kubernetes secret
update_secret() {
    print_header "Updating Kubernetes Secret"
    
    GEMINI_KEY_B64=$(echo -n "$1" | base64)
    
    # Check if secret exists
    if kubectl get secret $SECRET_NAME -n $NAMESPACE &> /dev/null; then
        print_warning "Secret already exists. Updating..."
        
        kubectl patch secret $SECRET_NAME -n $NAMESPACE \
            --type='json' \
            -p="[
                {\"op\": \"remove\", \"path\": \"/data/OPENAI_API_KEY\"},
                {\"op\": \"add\", \"path\": \"/data/GEMINI_API_KEY\", \"value\": \"$GEMINI_KEY_B64\"}
            ]" 2>/dev/null || {
                # If patch fails, try alternative approach
                kubectl create secret generic $SECRET_NAME \
                    --from-literal=GEMINI_API_KEY="$1" \
                    --from-literal=JWT_SECRET=dev-secret \
                    --from-literal=POSTGRES_PASSWORD=postgres \
                    --from-literal=MONGO_PASSWORD=mongodb \
                    -n $NAMESPACE \
                    --dry-run=client -o yaml | kubectl apply -f -
            }
    else
        print_warning "Secret not found. Creating new secret..."
        kubectl create secret generic $SECRET_NAME \
            --from-literal=GEMINI_API_KEY="$1" \
            --from-literal=JWT_SECRET=dev-secret \
            --from-literal=POSTGRES_PASSWORD=postgres \
            --from-literal=MONGO_PASSWORD=mongodb \
            -n $NAMESPACE
    fi
    
    print_success "Secret updated successfully"
}

# Build Docker image
build_docker_image() {
    print_header "Building Docker Image"
    
    # Check if we're in a Minikube environment
    if command -v minikube &> /dev/null && minikube status &> /dev/null; then
        print_warning "Minikube detected. Loading image into Minikube..."
        eval $(minikube docker-env)
    fi
    
    docker build \
        --tag "$IMAGE_NAME:$IMAGE_TAG" \
        --file ./services/ai-service/Dockerfile \
        ./services/ai-service/
    
    if [ $? -eq 0 ]; then
        print_success "Docker image built: $IMAGE_NAME:$IMAGE_TAG"
    else
        print_error "Docker build failed"
        exit 1
    fi
}

# Update Helm chart
deploy_helm_chart() {
    print_header "Deploying Helm Chart"
    
    HELM_VALUES_FILE="helm/restaurant-booking/values-${ENVIRONMENT}.yaml"
    
    if [ ! -f "$HELM_VALUES_FILE" ]; then
        print_warning "Environment-specific values file not found: $HELM_VALUES_FILE"
        HELM_VALUES_FILE="helm/restaurant-booking/values.yaml"
        print_warning "Using default values file: $HELM_VALUES_FILE"
    fi
    
    # Check if release already exists
    if helm list -n $NAMESPACE 2>/dev/null | grep -q "restaurant-booking"; then
        print_warning "Helm release already exists. Upgrading..."
        helm upgrade restaurant-booking ./helm/restaurant-booking \
            --namespace $NAMESPACE \
            --values $HELM_VALUES_FILE \
            --set aiService.image.tag=$IMAGE_TAG
    else
        print_warning "Creating new Helm release..."
        helm install restaurant-booking ./helm/restaurant-booking \
            --namespace $NAMESPACE \
            --values $HELM_VALUES_FILE \
            --set aiService.image.tag=$IMAGE_TAG
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Helm chart deployed successfully"
    else
        print_error "Helm deployment failed"
        exit 1
    fi
}

# Wait for deployment to be ready
wait_for_deployment() {
    print_header "Waiting for Deployment to be Ready"
    
    print_warning "Waiting for $SERVICE_NAME to be ready (timeout: 5 minutes)..."
    
    if kubectl rollout status deployment/$SERVICE_NAME -n $NAMESPACE --timeout=5m; then
        print_success "Deployment is ready"
    else
        print_error "Deployment timeout or failure"
        echo "Checking pod status..."
        kubectl get pods -n $NAMESPACE -l app=$SERVICE_NAME
        echo "Checking pod logs..."
        kubectl logs -n $NAMESPACE -l app=$SERVICE_NAME --tail=50
        exit 1
    fi
}

# Verify Gemini integration
verify_integration() {
    print_header "Verifying Gemini Integration"
    
    # Port-forward to service
    print_warning "Setting up port-forward (port 8001)..."
    kubectl port-forward -n $NAMESPACE svc/$SERVICE_NAME 8001:8001 &
    PF_PID=$!
    sleep 2
    
    # Test health endpoint
    print_warning "Testing /health endpoint..."
    HEALTH_RESPONSE=$(curl -s http://localhost:8001/health)
    
    kill $PF_PID 2>/dev/null || true
    
    if echo "$HEALTH_RESPONSE" | grep -q "Google Gemini"; then
        print_success "✅ Gemini integration verified!"
        echo "Response: $HEALTH_RESPONSE"
        return 0
    else
        print_warning "⚠️  Health check returned:"
        echo "$HEALTH_RESPONSE"
        print_warning "This may be normal if pod is still warming up. Check logs with:"
        echo "kubectl logs -n $NAMESPACE -l app=$SERVICE_NAME"
        return 1
    fi
}

# Show summary
show_summary() {
    print_header "Deployment Summary"
    
    echo "📊 Deployment Details:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Namespace: $NAMESPACE"
    echo "  Service: $SERVICE_NAME"
    echo "  Image: $IMAGE_NAME:$IMAGE_TAG"
    echo "  Helm Values: helm/restaurant-booking/values-${ENVIRONMENT}.yaml"
    echo ""
    echo "Next steps:"
    echo "  1. Verify all pods are running:"
    echo "     kubectl get pods -n $NAMESPACE"
    echo ""
    echo "  2. View service logs:"
    echo "     kubectl logs -n $NAMESPACE -l app=$SERVICE_NAME --follow"
    echo ""
    echo "  3. Test the API:"
    echo "     kubectl port-forward -n $NAMESPACE svc$SERVICE_NAME 8001:8001"
    echo "     curl -X POST http://localhost:8001/api/v1/ai/booking \\"
    echo "       -H 'Content-Type: application/json' \\"
    echo "       -d '{\"message\": \"Book me Italian for 2\", \"conversation_history\": []}'"
    echo ""
    echo "  4. View metrics in Prometheus:"
    echo "     kubectl port-forward -n $NAMESPACE svc/prometheus 9090:9090"
    echo "     Open: http://localhost:9090"
    echo ""
    echo "  5. View dashboards in Grafana:"
    echo "     kubectl port-forward -n $NAMESPACE svc/grafana 3000:3000"
    echo "     Open: http://localhost:3000 (default user: admin)"
}

# Main execution
main() {
    print_header "🎉 Google Gemini API Integration Deployment"
    echo "Environment: $ENVIRONMENT"
    echo ""
    
    # Validate arguments
    if [ -z "$1" ]; then
        print_error "Gemini API key is required!"
        echo ""
        echo "Usage: $0 <gemini-api-key> [prod|dev]"
        echo ""
        echo "Example:"
        echo "  $0 'AIza1234567890abcdefghijklmnopqrst' dev"
        echo ""
        echo "To get your Gemini API key:"
        echo "  1. Go to https://aistudio.google.com/app/apikey"
        echo "  2. Click 'Get API Key' → 'Create API Key in new project'"
        echo "  3. Copy the key (starts with 'AIza')"
        exit 1
    fi
    
    check_prerequisites
    validate_api_key "$1"
    update_secret "$1"
    build_docker_image
    deploy_helm_chart
    wait_for_deployment
    verify_integration
    show_summary
    
    print_header "✅ Deployment Complete!"
}

# Run main function
main "$@"
