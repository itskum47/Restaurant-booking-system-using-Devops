# System Architecture

## Overview
The Enterprise AI Restaurant Booking System is a modern, microservices-based application running on Kubernetes, designed to handle high concurrency, ensure high availability, and leverage AI for dynamic and personalized booking experiences.

## Core Services
1. **Frontend:** React-based web application.
2. **Booking Service:** Handles reservations, inventory, and restaurant availability. Uses PostgreSQL for ACID compliance.
3. **AI Service:** Python service integrating with LLMs to provide conversational booking and recommendations. Uses MongoDB for unstructured conversation context and vectors.
4. **Notification Service:** Handles asynchronous Email/SMS alerts for bookings.

## Data Layer
- **PostgreSQL:** Primary relational database for booking records, user accounts, and restaurant metadata. Deployed via StatefulSet.
- **MongoDB:** NoSQL database for flexible AI interaction logs, chat histories, and unstructured preferences. Deployed via StatefulSet.
- **Redis (Optional):** Used for caching restaurant availability and rate limiting.

## Infrastructure & DevOps
- **Kubernetes:** Orchestrates all containerized workloads.
- **Helm:** Manages application deployments and lifecycle (including initContainers, and PreSync/PostSync hooks).
- **Ingress Controller:** NGINX for routing external HTTP/HTTPS traffic.
- **Monitoring:** Prometheus, Grafana, and Alertmanager for observability and alerting.
- **Secrets Management:** External Secrets Operator integrating with cloud secret stores.

## AI Integration Flow
1. User asks the Assistant for recommendations.
2. Frontend sends request to the AI Service.
3. AI Service retrieves context from MongoDB and queries the Booking Service for real-time availability.
4. LLM formulates a response based on the inventory and user preferences.
5. User confirms booking, which is durably stored in PostgreSQL.
