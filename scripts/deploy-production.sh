#!/bin/bash
# ==========================================
# yanbot-claw - Production 环境部署脚本
# ==========================================
# 用途：在服务器上执行 Docker 容器部署
#
# 环境变量要求：
# - DOCKER_PASSWORD: Docker Registry 密码
# - DOCKER_USERNAME: Docker Registry 用户名
# - REGISTRY: Docker Registry 地址
# - IMAGE_NAME: 镜像名称
# - IMAGE_TAG: 镜像标签（可选，默认 production-latest）
# ==========================================

set -u  # 使用未定义变量时报错

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

rollback() {
  local reason="$1"
  echo -e "${RED}❌ Deployment failed: $reason${NC}"
  echo -e "${YELLOW}Starting rollback...${NC}"

  if [ -z "$ROLLBACK_IMAGE" ]; then
    echo -e "${RED}❌ No rollback point available (this might be the first deployment)${NC}"
    exit 1
  fi

  echo "Stopping failed container..."
  docker compose -f docker-compose.production.yml down || true

  echo "Starting rollback to previous version..."
  IMAGE_TAG=production-rollback docker compose -f docker-compose.production.yml up -d

  sleep 10

  if docker ps --filter name=yanbot-claw-production | grep -q yanbot-claw-production; then
    echo -e "${GREEN}✓ Rollback completed successfully${NC}"
    docker logs --tail 20 yanbot-claw-production
    exit 1
  else
    echo -e "${RED}❌ Rollback failed! Please investigate manually${NC}"
    exit 1
  fi
}

echo "=== Starting production deployment ==="

echo "REGISTRY: ${REGISTRY:-<not set>}"
echo "IMAGE_NAME: ${IMAGE_NAME:-<not set>}"
echo "DOCKER_USERNAME: ${DOCKER_USERNAME:-<not set>}"
if [ -z "${REGISTRY:-}" ] || [ -z "${IMAGE_NAME:-}" ] || [ -z "${DOCKER_USERNAME:-}" ] || [ -z "${DOCKER_PASSWORD:-}" ]; then
  echo -e "${RED}❌ Error: Required environment variables not set${NC}"
  exit 1
fi

mkdir -p /www/yanbot-claw-production/{logs,env}
cd /www/yanbot-claw-production

if [ ! -f "env/.env.production" ]; then
  echo -e "${RED}❌ Error: env/.env.production not found!${NC}"
  echo -e "${YELLOW}Please create /www/yanbot-claw-production/env/.env.production on the server${NC}"
  exit 1
fi

echo "Logging in to Docker Registry: $REGISTRY"
if ! echo "$DOCKER_PASSWORD" | docker login "$REGISTRY" -u "$DOCKER_USERNAME" --password-stdin 2>&1; then
  echo -e "${RED}❌ Failed to login to Docker Registry${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Logged in to $REGISTRY${NC}"

ROLLBACK_IMAGE=""
CURRENT_IMAGE=$(docker inspect yanbot-claw-production --format='{{.Image}}' 2>/dev/null || echo "")
if [ -n "$CURRENT_IMAGE" ]; then
  echo "Saving current image as rollback point..."
  if docker tag "$CURRENT_IMAGE" "${IMAGE_NAME}:production-rollback"; then
    ROLLBACK_IMAGE="${IMAGE_NAME}:production-rollback"
    echo -e "${GREEN}✓ Saved rollback point${NC}"
  else
    echo -e "${YELLOW}⚠️  Warning: Failed to save rollback point${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  No existing container found (first deployment)${NC}"
fi

echo "Pulling latest Docker image..."
if ! docker pull "${IMAGE_NAME}:production-latest"; then
  echo -e "${RED}❌ Failed to pull Docker image${NC}"
  exit 1
fi

if [ ! -f "docker-compose.production.yml" ]; then
  echo -e "${RED}❌ Error: docker-compose.production.yml not found!${NC}"
  exit 1
fi

echo "Stopping old container..."
docker compose -f docker-compose.production.yml down || true

echo "Starting new container..."
if ! docker compose -f docker-compose.production.yml up -d; then
  rollback "docker compose up failed"
fi

echo "Waiting for service to be ready..."
HEALTHY=false
MAX_HEALTH_WAIT_SECONDS=${MAX_HEALTH_WAIT_SECONDS:-180}
HEALTH_POLL_INTERVAL_SECONDS=5
MAX_HEALTH_POLLS=$((MAX_HEALTH_WAIT_SECONDS / HEALTH_POLL_INTERVAL_SECONDS))
if [ "$MAX_HEALTH_POLLS" -lt 1 ]; then
  MAX_HEALTH_POLLS=1
fi

for i in $(seq 1 "$MAX_HEALTH_POLLS"); do
  if ! docker ps --filter name=yanbot-claw-production | grep -q yanbot-claw-production; then
    rollback "Container not running after startup"
  fi

  HEALTH_STATUS=$(docker inspect yanbot-claw-production --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' 2>/dev/null || echo "unknown")

  if [ "$HEALTH_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✓ Container is healthy${NC}"
    HEALTHY=true
    break
  fi

  if [ "$HEALTH_STATUS" = "unhealthy" ]; then
    docker logs --tail 50 yanbot-claw-production
    rollback "Container health check failed (unhealthy)"
  fi

  echo "Waiting health... ($i/$MAX_HEALTH_POLLS, status=$HEALTH_STATUS)"
  sleep "$HEALTH_POLL_INTERVAL_SECONDS"
done

if [ "$HEALTHY" = false ]; then
  docker logs --tail 50 yanbot-claw-production
  rollback "Container health check timeout (still not healthy after ${MAX_HEALTH_WAIT_SECONDS}s, status=${HEALTH_STATUS:-unknown})"
fi

echo "Testing API health endpoint..."
MAX_RETRIES=5
API_HEALTHY=false
for i in $(seq 1 $MAX_RETRIES); do
  if curl -f -s http://localhost:3002/api/health > /dev/null; then
    echo -e "${GREEN}✓ API is responding${NC}"
    API_HEALTHY=true
    break
  fi
  echo "Retry $i/$MAX_RETRIES..."
  sleep 3
done

if [ "$API_HEALTHY" = false ]; then
  echo -e "${RED}❌ API health check failed after $MAX_RETRIES attempts${NC}"
  docker logs --tail 50 yanbot-claw-production
  rollback "API health check failed"
fi

echo "Cleaning up old images..."
docker images "${IMAGE_NAME}" --format "{{.Tag}}" | grep "^production-" | grep -v "rollback" | tail -n +4 | xargs -r -I {} docker rmi "${IMAGE_NAME}:{}" || true

echo -e "${GREEN}=== Production deployment completed successfully ===${NC}"
docker logs --tail 20 yanbot-claw-production
