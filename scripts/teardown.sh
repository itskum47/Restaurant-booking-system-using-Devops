#!/bin/bash

# Restaurant Booking System - Teardown Script
# Clean up all resources

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

confirm_teardown() {
    print_header "WARNING: This will delete all resources!"
    
    echo -e "${RED}This action will:${NC}"
    echo "  - Delete all application pods and services"
    echo "  - Delete all monitoring components"
    echo "  - Delete all persistent data"
    echo "  - Remove all Kubernetes resources"
    echo "  - Stop Minikube cluster"
    echo ""
    
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Teardown cancelled"
        exit 0
    fi
}

delete_application() {
    print_header "Deleting Application Resources"
    
    print_info "Deleting frontend..."
    kubectl delete -f k8s/frontend/ --ignore-not-found=true
    
    print_info "Deleting notification service..."
    kubectl delete -f k8s/notification-service/ --ignore-not-found=true
    
    print_info "Deleting booking service..."
    kubectl delete -f k8s/booking-service/ --ignore-not-found=true
    
    print_info "Deleting restaurant service..."
    kubectl delete -f k8s/restaurant-service/ --ignore-not-found=true
    
    print_info "Deleting AI service..."
    kubectl delete -f k8s/ai-service/ --ignore-not-found=true
    
    print_info "Deleting API gateway..."
    kubectl delete -f k8s/api-gateway/ --ignore-not-found=true
    
    print_info "Deleting ingress..."
    kubectl delete -f k8s/ingress.yaml --ignore-not-found=true
    
    print_success "Application resources deleted"
}

delete_databases() {
    print_header "Deleting Database Resources"
    
    print_info "Deleting databases..."
    kubectl delete -f k8s/databases/ --ignore-not-found=true
    
    print_info "Deleting secrets..."
    kubectl delete -f k8s/secrets.yaml --ignore-not-found=true
    
    print_success "Database resources deleted"
}

delete_monitoring() {
    print_header "Deleting Monitoring Resources"
    
    print_info "Deleting ServiceMonitors and Alert Rules..."
    kubectl delete -f monitoring/service-monitors.yaml --ignore-not-found=true
    kubectl delete -f monitoring/alert-rules.yaml --ignore-not-found=true
    
    print_info "Uninstalling Prometheus stack..."
    helm uninstall prometheus -n $MONITORING_NAMESPACE --ignore-not-found 2>/dev/null || true
    
    print_info "Deleting monitoring namespace..."
    kubectl delete namespace $MONITORING_NAMESPACE --ignore-not-found=true --timeout=60s
    
    print_success "Monitoring resources deleted"
}

delete_helm_release() {
    print_header "Deleting Helm Release"
    
    if helm list -n $NAMESPACE | grep -q restaurant-booking; then
        print_info "Uninstalling Helm release..."
        helm uninstall restaurant-booking -n $NAMESPACE
        print_success "Helm release deleted"
    else
        print_info "No Helm release found"
    fi
}

delete_namespace() {
    print_header "Deleting Application Namespace"
    
    if kubectl get namespace $NAMESPACE &> /dev/null; then
        print_info "Deleting namespace $NAMESPACE..."
        kubectl delete namespace $NAMESPACE --timeout=120s
        print_success "Namespace deleted"
    else
        print_info "Namespace $NAMESPACE does not exist"
    fi
}

delete_docker_images() {
    print_header "Deleting Docker Images"
    
    eval $(minikube docker-env 2>/dev/null || true)
    
    local images=$(docker images | grep "restaurant-booking" | awk '{print $1":"$2}')
    
    if [ -n "$images" ]; then
        print_info "Deleting Docker images..."
        echo "$images" | xargs docker rmi -f 2>/dev/null || true
        print_success "Docker images deleted"
    else
        print_info "No Docker images found"
    fi
}

stop_minikube() {
    print_header "Stopping Minikube"
    
    if minikube status &> /dev/null; then
        read -p "Do you want to stop Minikube? (yes/no): " -r
        echo
        
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            print_info "Stopping Minikube..."
            minikube stop
            print_success "Minikube stopped"
            
            read -p "Do you want to delete the Minikube cluster? (yes/no): " -r
            echo
            
            if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
                print_info "Deleting Minikube cluster..."
                minikube delete
                print_success "Minikube cluster deleted"
            fi
        else
            print_info "Minikube left running"
        fi
    else
        print_info "Minikube is not running"
    fi
}

cleanup_helm_repos() {
    print_header "Cleaning Up Helm Repositories"
    
    read -p "Do you want to remove Helm repositories? (yes/no): " -r
    echo
    
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Removing Helm repositories..."
        helm repo remove bitnami 2>/dev/null || true
        helm repo remove prometheus-community 2>/dev/null || true
        print_success "Helm repositories removed"
    else
        print_info "Helm repositories kept"
    fi
}

print_cleanup_summary() {
    print_header "Cleanup Summary"
    
    echo -e "${GREEN}Cleanup Complete!${NC}"
    echo ""
    echo "The following have been removed:"
    echo "  ✓ Application services and pods"
    echo "  ✓ Database resources"
    echo "  ✓ Monitoring components"
    echo "  ✓ Kubernetes namespaces"
    echo "  ✓ Docker images"
    echo ""
    
    if minikube status &> /dev/null; then
        echo -e "${YELLOW}Note: Minikube is still running${NC}"
        echo "To stop it manually, run: minikube stop"
        echo "To delete it completely, run: minikube delete"
    fi
}

quick_teardown() {
    print_header "Quick Teardown (No Confirmations)"
    
    delete_application
    delete_databases
    delete_monitoring
    delete_helm_release
    delete_namespace
    delete_docker_images
    
    print_success "Quick teardown complete!"
}

interactive_teardown() {
    confirm_teardown
    
    delete_application
    delete_databases
    delete_monitoring
    delete_helm_release
    delete_namespace
    delete_docker_images
    stop_minikube
    cleanup_helm_repos
    
    print_cleanup_summary
}

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -f, --force     Force teardown without confirmations"
    echo "  -q, --quick     Quick teardown (keeps Minikube running)"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              Interactive teardown with confirmations"
    echo "  $0 --quick      Quick teardown without stopping Minikube"
    echo "  $0 --force      Force complete teardown"
}

main() {
    case "${1:-}" in
        -f|--force)
            print_warning "Force mode: Skipping confirmations"
            delete_application
            delete_databases
            delete_monitoring
            delete_helm_release
            delete_namespace
            delete_docker_images
            minikube stop 2>/dev/null || true
            minikube delete 2>/dev/null || true
            print_cleanup_summary
            ;;
        -q|--quick)
            quick_teardown
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        "")
            interactive_teardown
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
}

main "$@"
