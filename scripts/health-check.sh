#!/bin/bash

# Restaurant Booking System - Health Check Script
# Comprehensive health and integration testing

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
MINIKUBE_IP=$(minikube ip)
API_GATEWAY_URL="http://${MINIKUBE_IP}:30000"
FRONTEND_URL="http://${MINIKUBE_IP}:30080"

# Test results
PASSED=0
FAILED=0
WARNINGS=0

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

test_kubernetes_cluster() {
    print_header "Testing Kubernetes Cluster"
    
    # Check cluster connectivity
    if kubectl cluster-info &> /dev/null; then
        print_success "Kubernetes cluster is accessible"
    else
        print_error "Cannot connect to Kubernetes cluster"
        return 1
    fi
    
    # Check namespaces
    if kubectl get namespace $NAMESPACE &> /dev/null; then
        print_success "Application namespace exists"
    else
        print_error "Application namespace not found"
    fi
    
    if kubectl get namespace $MONITORING_NAMESPACE &> /dev/null; then
        print_success "Monitoring namespace exists"
    else
        print_warning "Monitoring namespace not found"
    fi
}

test_pod_health() {
    print_header "Testing Pod Health"
    
    local pods=$(kubectl get pods -n $NAMESPACE -o json)
    
    # Check if any pods exist
    local pod_count=$(echo "$pods" | jq '.items | length')
    if [ "$pod_count" -eq 0 ]; then
        print_error "No pods found in namespace $NAMESPACE"
        return 1
    fi
    
    print_info "Found $pod_count pods"
    
    # Check each pod
    echo "$pods" | jq -r '.items[] | "\(.metadata.name) \(.status.phase)"' | while read -r pod_name phase; do
        if [ "$phase" = "Running" ]; then
            print_success "Pod $pod_name is running"
        else
            print_error "Pod $pod_name is in $phase state"
        fi
    done
    
    # Check for restarts
    local restarts=$(kubectl get pods -n $NAMESPACE -o json | jq '[.items[].status.containerStatuses[].restartCount] | add')
    if [ "$restarts" -eq 0 ]; then
        print_success "No pod restarts detected"
    else
        print_warning "$restarts total pod restarts detected"
    fi
}

test_service_endpoints() {
    print_header "Testing Service Endpoints"
    
    # API Gateway Health
    print_info "Testing API Gateway..."
    if curl -s -f "${API_GATEWAY_URL}/health" &> /dev/null; then
        print_success "API Gateway health endpoint is responding"
    else
        print_error "API Gateway health endpoint is not responding"
    fi
    
    # API Gateway Ready
    if curl -s -f "${API_GATEWAY_URL}/ready" &> /dev/null; then
        print_success "API Gateway ready endpoint is responding"
    else
        print_error "API Gateway ready endpoint is not responding"
    fi
    
    # Frontend
    print_info "Testing Frontend..."
    if curl -s -f "${FRONTEND_URL}" &> /dev/null; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend is not accessible"
    fi
}

test_internal_services() {
    print_header "Testing Internal Services"
    
    # Test each internal service through port-forward
    local services=("ai-service:8001" "restaurant-service:3001" "booking-service:8002" "notification-service:3003")
    
    for service_port in "${services[@]}"; do
        local service="${service_port%%:*}"
        local port="${service_port##*:}"
        
        print_info "Testing $service..."
        
        # Start port-forward in background
        kubectl port-forward -n $NAMESPACE svc/$service $port:$port &> /dev/null &
        local pf_pid=$!
        sleep 2
        
        # Test health endpoint
        if curl -s -f "http://localhost:$port/health" &> /dev/null; then
            print_success "$service health endpoint is responding"
        else
            print_error "$service health endpoint is not responding"
        fi
        
        # Kill port-forward
        kill $pf_pid &> /dev/null || true
    done
}

test_database_connectivity() {
    print_header "Testing Database Connectivity"
    
    # Test PostgreSQL
    print_info "Testing PostgreSQL..."
    local postgres_pod=$(kubectl get pods -n $NAMESPACE -l app=postgres -o jsonpath='{.items[0].metadata.name}')
    if [ -n "$postgres_pod" ]; then
        if kubectl exec -n $NAMESPACE $postgres_pod -- pg_isready &> /dev/null; then
            print_success "PostgreSQL is ready"
        else
            print_error "PostgreSQL is not ready"
        fi
    else
        print_error "PostgreSQL pod not found"
    fi
    
    # Test MongoDB
    print_info "Testing MongoDB..."
    local mongo_pod=$(kubectl get pods -n $NAMESPACE -l app=mongodb -o jsonpath='{.items[0].metadata.name}')
    if [ -n "$mongo_pod" ]; then
        if kubectl exec -n $NAMESPACE $mongo_pod -- mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
            print_success "MongoDB is ready"
        else
            print_error "MongoDB is not ready"
        fi
    else
        print_error "MongoDB pod not found"
    fi
    
    # Test Redis
    print_info "Testing Redis..."
    local redis_pod=$(kubectl get pods -n $NAMESPACE -l app=redis -o jsonpath='{.items[0].metadata.name}')
    if [ -n "$redis_pod" ]; then
        if kubectl exec -n $NAMESPACE $redis_pod -- redis-cli ping &> /dev/null; then
            print_success "Redis is ready"
        else
            print_error "Redis is not ready"
        fi
    else
        print_error "Redis pod not found"
    fi
}

test_hpa() {
    print_header "Testing Horizontal Pod Autoscalers"
    
    local hpas=$(kubectl get hpa -n $NAMESPACE -o json)
    local hpa_count=$(echo "$hpas" | jq '.items | length')
    
    if [ "$hpa_count" -eq 0 ]; then
        print_warning "No HPAs found"
        return
    fi
    
    print_info "Found $hpa_count HPAs"
    
    echo "$hpas" | jq -r '.items[] | "\(.metadata.name) \(.status.currentReplicas) \(.spec.minReplicas) \(.spec.maxReplicas)"' | \
    while read -r name current min max; do
        if [ "$current" -ge "$min" ] && [ "$current" -le "$max" ]; then
            print_success "HPA $name has $current replicas (min: $min, max: $max)"
        else
            print_warning "HPA $name has $current replicas (outside range: $min-$max)"
        fi
    done
}

test_prometheus() {
    print_header "Testing Prometheus"
    
    local prom_pod=$(kubectl get pods -n $MONITORING_NAMESPACE -l app.kubernetes.io/name=prometheus -o jsonpath='{.items[0].metadata.name}')
    
    if [ -z "$prom_pod" ]; then
        print_warning "Prometheus pod not found (monitoring may not be installed)"
        return
    fi
    
    print_success "Prometheus pod is running"
    
    # Check Prometheus targets
    kubectl port-forward -n $MONITORING_NAMESPACE svc/prometheus-kube-prometheus-prometheus 9090:9090 &> /dev/null &
    local pf_pid=$!
    sleep 3
    
    local targets=$(curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets | length')
    if [ "$targets" -gt 0 ]; then
        print_success "Prometheus has $targets active targets"
    else
        print_warning "Prometheus has no active targets"
    fi
    
    kill $pf_pid &> /dev/null || true
}

test_metrics() {
    print_header "Testing Metrics Collection"
    
    # Test metrics server
    if kubectl top nodes &> /dev/null; then
        print_success "Metrics server is working"
    else
        print_error "Metrics server is not working"
    fi
    
    # Test pod metrics
    if kubectl top pods -n $NAMESPACE &> /dev/null; then
        print_success "Pod metrics are available"
    else
        print_warning "Pod metrics are not available"
    fi
}

test_integration() {
    print_header "Testing Integration Flows"
    
    # Test AI Service integration
    print_info "Testing AI Service through API Gateway..."
    local ai_response=$(curl -s -X POST "${API_GATEWAY_URL}/api/ai/analyze" \
        -H "Content-Type: application/json" \
        -d '{"message": "I want to book a table for 2 people"}')
    
    if echo "$ai_response" | jq -e '.intent' &> /dev/null; then
        print_success "AI Service integration is working"
    else
        print_warning "AI Service integration test returned unexpected response"
    fi
    
    # Test Restaurant Service
    print_info "Testing Restaurant Service through API Gateway..."
    local restaurants=$(curl -s -f "${API_GATEWAY_URL}/api/restaurants")
    
    if echo "$restaurants" | jq -e '.[0]' &> /dev/null; then
        local count=$(echo "$restaurants" | jq 'length')
        print_success "Restaurant Service is working (found $count restaurants)"
    else
        print_error "Restaurant Service integration failed"
    fi
}

test_resource_usage() {
    print_header "Testing Resource Usage"
    
    # Get resource usage
    local output=$(kubectl top pods -n $NAMESPACE 2>/dev/null)
    
    if [ -n "$output" ]; then
        echo "$output" | tail -n +2 | while read -r pod cpu memory; do
            # Extract numeric values
            local cpu_value=$(echo $cpu | sed 's/m//')
            local mem_value=$(echo $memory | sed 's/Mi//')
            
            # Check if values exceed thresholds
            if [ "$cpu_value" -gt 1000 ]; then
                print_warning "Pod $pod is using high CPU: $cpu"
            fi
            
            if [ "$mem_value" -gt 1024 ]; then
                print_warning "Pod $pod is using high memory: $memory"
            fi
        done
        print_success "Resource usage check complete"
    else
        print_warning "Could not retrieve resource usage"
    fi
}

print_summary() {
    print_header "Health Check Summary"
    
    local total=$((PASSED + FAILED + WARNINGS))
    
    echo -e "${GREEN}Passed:   $PASSED${NC}"
    echo -e "${RED}Failed:   $FAILED${NC}"
    echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
    echo -e "Total:    $total"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All critical checks passed!${NC}"
        if [ $WARNINGS -gt 0 ]; then
            echo -e "${YELLOW}⚠ There are $WARNINGS warnings that should be reviewed${NC}"
        fi
        return 0
    else
        echo -e "${RED}✗ $FAILED critical checks failed!${NC}"
        echo -e "${RED}Please review the errors above and fix them.${NC}"
        return 1
    fi
}

main() {
    print_header "Restaurant Booking System - Health Check"
    
    test_kubernetes_cluster
    test_pod_health
    test_service_endpoints
    test_internal_services
    test_database_connectivity
    test_hpa
    test_prometheus
    test_metrics
    test_integration
    test_resource_usage
    
    print_summary
}

# Run main function
main
exit $?
