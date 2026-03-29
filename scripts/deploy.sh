#!/bin/bash

# Restaurant Booking System - Deployment Script
# Deploy or update the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="restaurant-system"
ENVIRONMENT="${1:-dev}"

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

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

build_images() {
    print_header "Building Docker Images"
    
    eval $(minikube docker-env)
    
    local services=("api-gateway" "ai-service" "restaurant-service" "booking-service" "notification-service" "frontend")
    
    for service in "${services[@]}"; do
        print_info "Building $service..."
        docker build -t restaurant-booking/$service:1.0.0 ./services/$service
        print_success "$service built"
    done
}

deploy_with_kubectl() {
    print_header "Deploying with kubectl (Environment: $ENVIRONMENT)"
    
    # Apply secrets
    kubectl apply -f k8s/secrets.yaml
    
    # Deploy databases
    kubectl apply -f k8s/databases/
    
    print_info "Waiting for databases..."
    kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s
    kubectl wait --for=condition=ready pod -l app=mongodb -n $NAMESPACE --timeout=300s
    kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=300s
    
    # Deploy services
    kubectl apply -f k8s/api-gateway/
    kubectl apply -f k8s/ai-service/
    kubectl apply -f k8s/restaurant-service/
    kubectl apply -f k8s/booking-service/
    kubectl apply -f k8s/notification-service/
    kubectl apply -f k8s/frontend/
    kubectl apply -f k8s/ingress.yaml
    
    print_info "Waiting for all pods to be ready..."
    kubectl wait --for=condition=ready pod --all -n $NAMESPACE --timeout=600s
    
    print_success "Deployment complete!"
}

deploy_with_helm() {
    print_header "Deploying with Helm (Environment: $ENVIRONMENT)"
    
    local values_file="helm/restaurant-booking/values.yaml"
    
    if [ "$ENVIRONMENT" = "dev" ]; then
        values_file="helm/restaurant-booking/values-dev.yaml"
    elif [ "$ENVIRONMENT" = "prod" ]; then
        values_file="helm/restaurant-booking/values-prod.yaml"
    fi
    
    print_info "Using values file: $values_file"
    
    helm upgrade --install restaurant-booking helm/restaurant-booking \
        -f helm/restaurant-booking/values.yaml \
        -f $values_file \
        -n $NAMESPACE \
        --create-namespace \
        --wait \
        --timeout 10m
    
    print_success "Helm deployment complete!"
}

rollback_deployment() {
    print_header "Rolling Back Deployment"
    
    print_info "Rolling back all deployments..."
    
    kubectl rollout undo deployment/api-gateway -n $NAMESPACE
    kubectl rollout undo deployment/ai-service -n $NAMESPACE
    kubectl rollout undo deployment/restaurant-service -n $NAMESPACE
    kubectl rollout undo deployment/booking-service -n $NAMESPACE
    kubectl rollout undo deployment/notification-service -n $NAMESPACE
    kubectl rollout undo deployment/frontend -n $NAMESPACE
    
    print_success "Rollback complete!"
}

restart_services() {
    print_header "Restarting Services"
    
    kubectl rollout restart deployment -n $NAMESPACE
    
    print_info "Waiting for rollout to complete..."
    kubectl rollout status deployment -n $NAMESPACE
    
    print_success "All services restarted!"
}

show_status() {
    print_header "Deployment Status"
    
    echo -e "${GREEN}Pods:${NC}"
    kubectl get pods -n $NAMESPACE
    
    echo -e "\n${GREEN}Services:${NC}"
    kubectl get svc -n $NAMESPACE
    
    echo -e "\n${GREEN}HPA Status:${NC}"
    kubectl get hpa -n $NAMESPACE
    
    echo -e "\n${GREEN}Ingress:${NC}"
    kubectl get ingress -n $NAMESPACE
}

usage() {
    echo "Usage: $0 [ENVIRONMENT] [COMMAND]"
    echo ""
    echo "Environments:"
    echo "  dev      - Development environment (default)"
    echo "  prod     - Production environment"
    echo ""
    echo "Commands:"
    echo "  kubectl  - Deploy using kubectl manifests (default)"
    echo "  helm     - Deploy using Helm chart"
    echo "  rollback - Rollback to previous version"
    echo "  restart  - Restart all services"
    echo "  status   - Show deployment status"
    echo ""
    echo "Examples:"
    echo "  $0 dev kubectl    - Deploy to dev using kubectl"
    echo "  $0 prod helm      - Deploy to prod using Helm"
    echo "  $0 dev rollback   - Rollback dev deployment"
    echo "  $0 status         - Show current status"
}

main() {
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        usage
        exit 0
    fi
    
    local command="${2:-kubectl}"
    
    case $command in
        kubectl)
            build_images
            deploy_with_kubectl
            show_status
            ;;
        helm)
            build_images
            deploy_with_helm
            show_status
            ;;
        rollback)
            rollback_deployment
            ;;
        restart)
            restart_services
            ;;
        status)
            show_status
            ;;
        *)
            print_error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac
}

main "$@"
