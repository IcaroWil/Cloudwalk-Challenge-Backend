# Cloudwalk Challenge — Backend (NestJS + DDD)

Backend API that **routes messages to specialized agents** and persists **conversation history in Redis**.  
Built with **NestJS + TypeScript**, packaged with **Docker**, and deployable to **Kubernetes (Minikube + Ingress)**.

---

## 1. Run locally (Docker + docker-compose)

```bash
# build & start backend + redis
docker compose up -d --build

# healthchecks (compose maps container :3000 → host :3001)
curl http://localhost:3001/health/ready
curl http://localhost:3001/health/live
```

Seed the knowledge base (recommended for KnowledgeAgent):
```bash
npm ci
npm run seed:docs    # or: npx ts-node scripts/seed.docs.ts
```

Call the API
```bash
# Math example
curl -s -X POST http://localhost:3001/chat \
  -H "content-type: application/json" \
  -d '{"user_id":"u1","conversation_id":"c1","message":"2+2"}'
```

---

## 2. Run on Kubernetes (kubectl apply -f)
Tested on Minikube with ingress-nginx.
```bash
# cluster & ingress
minikube start --cpus=2 --memory=4g
minikube addons enable ingress

# build the image inside Minikube's Docker (Git Bash):
eval $(minikube -p minikube docker-env)
docker build -t backend-backend:local .

# apply manifests (plain -f order)
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/redis-service.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml
```

Ingress access (Windows/Minikube):
```bash
# keep this running in an admin terminal
minikube tunnel
```

Add to `etc\hosts`:
```bash
127.0.0.1  backend.local
```

Test:
```bash
curl http://backend.local/health/ready
```

Dev loop:
```bash
docker build -t backend-backend:local .
kubectl -n cloudwalk rollout restart deploy/backend
kubectl -n cloudwalk rollout status deploy/backend
```

---

## 3. Architecture (Router, Agents, Logs, Redis)
```bash
Client → /chat (ChatController)
          └─ RouterAgent → MathAgent                      → answer
                         └→ KnowledgeAgent (RAG via Redis) → answer

Persist: Conversation history in Redis
```
- **RouterAgent** – chooses Math vs Knowledge based on the message; emits a decision log.
- **MathAgent** – evaluates safe arithmetic (`+ - * / ( )`) without `eval`.
- **KnowledgeAgent** – retrieves snippets from a small knowledge base seeded into Redis (RAG-lite).
- **Logs** – structured JSON (nestjs-pino) including agent, decision, timing, user & conversation IDs.
- **Health** – `/health/live` and /health/ready used by Kubernetes probes.

Folder highlights:
```bash
src/
  common/{config,logging,security}
  infrastructure/redis
  modules/{chat,router,math,knowledge,conversation}
k8s/ (namespace, cm/secret, deployments, services, ingress, hpa)
scripts/seed.docs.ts
test/{unit,e2e}
```

---

## 4. Front-end access & testing multiple conversations
- When a front-end is deployed, open `http://frontend.local` (configured to call `http://backend.local`).
- To simulate multiple conversations without the UI, vary the `conversation_id`:
```bash
# conversation A
curl -s -X POST http://backend.local/chat \
  -H "content-type: application/json" \
  -d '{"user_id":"u1","conversation_id":"conv-1","message":"2+2"}'

# conversation B
curl -s -X POST http://backend.local/chat \
  -H "content-type: application/json" \
  -d '{"user_id":"u1","conversation_id":"conv-2","message":"2+2"}'
```
Each `conversation_id` is tracked independently in Redis.

---

## 5. Example logs (JSON)
```bash
{"agent":"RouterAgent","decision":"MathAgent","conversation_id":"c1","user_id":"u1","timestamp":"2025-09-23T19:18:41.053Z","level":"INFO"}
{"agent":"MathAgent","execution_time_ms":15,"conversation_id":"c1","user_id":"u1","timestamp":"2025-09-23T19:18:41.067Z","level":"INFO"}
{"agent":"KnowledgeAgent","execution_time_ms":3,"conversation_id":"c2","user_id":"u2","timestamp":"2025-09-23T19:18:51.419Z","level":"INFO"}
```

---

## 6. Sanitization & prompt-injection protection
- **HTML** sanitization on `message` (strips tags/scripts/attrs).
- **Heuristics** that block suspicious directives (e.g., “ignore previous instructions”, “act as…”, `<script>`, etc.).
- **DTO validation** – required fields `user_id`, `conversation_id`, `message` with types enforced.
- **Safe math** – uses parsing/evaluation libraries (no `eval`).
- **Error hygiene** – safe error payloads (no stack traces); security headers via Helmet.

---

## 7. Run the tests
    E2E tests require Redis. Start it with Compose.
```bash
npm ci

# Unit tests
npm run test

# E2E (/chat)
docker compose up -d redis
npm run test:e2e
```

### Environment variables (reference)
```bash
NODE_ENV=development
PORT=3000
REDIS_HOST=localhost   # docker-compose: "redis" | k8s: "redis"
REDIS_PORT=6379
REDIS_PASSWORD=
```
