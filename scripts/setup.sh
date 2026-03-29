#!/bin/bash

# Restaurant Booking System - Setup Script
# This script sets up the entire environment from scratch

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="restaurant-system"
MONITORING_NAMESPACE="monitoring"
MINIKUBE_CPUS=4
MINIKUBE_MEMORY=8192
MINIKUBE_DISK_SIZE="50g"

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_tools=()
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    else
        print_success "Docker is installed"
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        missing_tools+=("kubectl")
    else
        print_success "kubectl is installed"
    fi
    
    # Check Minikube
    if ! command -v minikube &> /dev/null; then
        missing_tools+=("minikube")
    else
        print_success "Minikube is installed"
    fi
    
    # Check Helm
    if ! command -v helm &> /dev/null; then
        missing_tools+=("helm")
    else
        print_success "Helm is installed"
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo ""
        echo "Installation instructions:"
        echo "  - Docker: https://docs.docker.com/get-docker/"
        echo "  - kubectl: https://kubernetes.io/docs/tasks/tools/"
        echo "  - Minikube: https://minikube.sigs.k8s.io/docs/start/"
        echo "  - Helm: https://helm.sh/docs/intro/install/"
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

start_minikube() {
    print_header "Starting Minikube"
    
    if minikube status &> /dev/null; then
        print_warning "Minikube is already running"
        return
    fi
    
    print_info "Starting Minikube with ${MINIKUBE_CPUS} CPUs, ${MINIKUBE_MEMORY}MB RAM, and ${MINIKUBE_DISK_SIZE} disk..."
    minikube start \
        --cpus=${MINIKUBE_CPUS} \
        --memory=${MINIKUBE_MEMORY} \
        --disk-size=${MINIKUBE_DISK_SIZE} \
        --driver=docker \
        --kubernetes-version=v1.28.0
    
    print_success "Minikube started successfully"
    
    # Enable required addons
    print_info "Enabling Minikube addons..."
    minikube addons enable metrics-server
    minikube addons enable ingress
    
    print_success "Minikube addons enabled"
}

setup_helm_repos() {
    print_header "Setting up Helm Repositories"
    
    print_info "Adding Bitnami repository..."
    helm repo add bitnami https://charts.bitnami.com/bitnami
    
    print_info "Adding Prometheus Community repository..."
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    
    print_info "Updating Helm repositories..."
    helm repo update
    
    print_success "Helm repositories configured"
}

build_docker_images() {
    print_header "Building Docker Images"
    
    # Configure Docker to use Minikube's Docker daemon
    eval $(minikube docker-env)
    
    local services=("api-gateway" "ai-service" "restaurant-service" "booking-service" "notification-service" "frontend")
    
    for service in "${services[@]}"; do
        print_info "Building $service..."
        docker build -t restaurant-booking/$service:1.0.0 ./services/$service
        print_success "$service built successfully"
    done
    
    print_success "All Docker images built successfully"
}

create_namespaces() {
    print_header "Creating Kubernetes Namespaces"
    
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    kubectl label namespace $NAMESPACE monitoring=true --overwrite
    print_success "Namespace $NAMESPACE created"
    
    kubectl create namespace $MONITORING_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    print_success "Namespace $MONITORING_NAMESPACE created"
}

install_monitoring() {
    print_header "Installing Prometheus & Grafana"
    
    print_info "Installing Prometheus Operator Stack..."
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        -f monitoring/prometheus-values.yaml \
        -n $MONITORING_NAMESPACE \
        --wait \
        --timeout 10m
    
    print_success "Monitoring stack installed successfully"
    
    # Apply ServiceMonitors and Alert Rules
    print_info "Applying ServiceMonitors and Alert Rules..."
    kubectl apply -f monitoring/service-monitors.yaml
    kubectl apply -f monitoring/alert-rules.yaml
    
    print_success "Monitoring configuration applied"
}

deploy_application() {
    print_header "Deploying Application"
    
    print_info "Creating secrets..."
    kubectl apply -f k8s/secrets.yaml
    
    print_info "Deploying databases..."
    kubectl apply -f k8s/databases/
    
    print_info "Waiting for databases to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s
    kubectl wait --for=condition=ready pod -l app=mongodb -n $NAMESPACE --timeout=300s
    kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=300s
    
    print_info "Deploying API Gateway..."
    kubectl apply -f k8s/api-gateway/
    
    print_info "Deploying AI Service..."
    kubectl apply -f k8s/ai-service/
    
    print_info "Deploying Restaurant Service..."
    kubectl apply -f k8s/restaurant-service/
    
    print_info "Deploying Booking Service..."
    kubectl apply -f k8s/booking-service/
    
    print_info "Deploying Notification Service..."
    kubectl apply -f k8s/notification-service/
    
    print_info "Deploying Frontend..."
    kubectl apply -f k8s/frontend/
    
    print_info "Applying Ingress..."
    kubectl apply -f k8s/ingress.yaml
    
    print_success "Application deployed successfully"
    
    print_info "Waiting for all pods to be ready..."
    kubectl wait --for=condition=ready pod --all -n $NAMESPACE --timeout=600s
    
    print_success "All pods are ready"
}

import_grafana_dashboards() {
    print_header "Importing Grafana Dashboards"
    
    local grafana_pod=$(kubectl get pods -n $MONITORING_NAMESPACE -l app.kubernetes.io/name=grafana -o jsonpath='{.items[0].metadata.name}')
    
    print_info "Copying dashboard files to Grafana pod..."
    kubectl cp monitoring/dashboards $MONITORING_NAMESPACE/$grafana_pod:/var/lib/grafana/
    
    print_success "Grafana dashboards imported"
}

print_access_info() {
    print_header "Access Information"
    
    local minikube_ip=$(minikube ip)
    
    echo -e "${GREEN}Application URLs:${NC}"
    echo -e "  Frontend:      http://$minikube_ip:30080"
    echo -e "  API Gateway:   http://$minikube_ip:30000"
    echo -e "  Grafana:       http://$minikube_ip:30300"
    echo -e "                 Username: admin"
    echo -e "                 Password: admin123"
    echo ""
    echo -e "${GREEN}Prometheus:${NC}"
    echo -e "  Port Forward:  kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090"
    echo -e "  Then access:   http://localhost:9090"
    echo ""
    echo -e "${GREEN}Useful Commands:${NC}"
    echo -e "  Check pods:           kubectl get pods -n $NAMESPACE"
    echo -e "  Check services:       kubectl get svc -n $NAMESPACE"
    echo -e "  View logs:            kubectl logs -f <pod-name> -n $NAMESPACE"
    echo -e "  Check HPA:            kubectl get hpa -n $NAMESPACE"
    echo -e "  Check metrics:        kubectl top pods -n $NAMESPACE"
    echo ""
    echo -e "${GREEN}Architecture Diagram:${NC}"
    echo -e "  See README.md for complete architecture and component details"
    echo ""
}

main() {
    print_header "Restaurant Booking System Setup"
    
    check_prerequisites
    start_minikube
    setup_helm_repos
    build_docker_images
    create_namespaces
    install_monitoring
    deploy_application
    import_grafana_dashboards
    
    print_header "Setup Complete!"
    print_success "Restaurant Booking System is now running!"
    
    print_access_info
}

# Run main function
main
