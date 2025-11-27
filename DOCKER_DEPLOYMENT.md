# 🐳 Docker Deployment Guide for AWS ECS Fargate

## 📦 What's Inside

This Dockerfile creates a **production-ready, lightweight Node.js container** optimized for AWS ECS Fargate:

- **Base Image**: `node:18-alpine` (~50MB compressed)
- **Multi-stage build**: Separates dependencies for better caching
- **Non-root user**: Runs as `nodejs:nodejs` (UID 1001) for security
- **Signal handling**: Uses `dumb-init` for graceful shutdowns
- **Health checks**: Built-in endpoint for ECS health monitoring

---

## 🚀 Local Testing

### 1. Build the Docker Image

```bash
docker build -t keey-voice-assistant:latest .
```

**Build time**: ~2-3 minutes (first time), ~10 seconds (cached)

### 2. Run Locally with Environment Variables

```bash
docker run -d \
  --name keey-voice-assistant \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e VAPI_API_KEY=your_vapi_key_here \
  -e GHL_API_KEY=your_ghl_key_here \
  -e GHL_LOCATION_ID=your_location_id \
  -e GHL_CALENDAR_ID=your_calendar_id \
  -e WEBHOOK_BASE_URL=https://your-domain.com \
  -e VAPI_INBOUND_ASSISTANT_ID=your_inbound_assistant_id \
  -e VAPI_OUTBOUND_PHONE_NUMBER_ID=your_outbound_phone_id \
  -e DEFAULT_TIMEZONE=Europe/London \
  -e COMPANY_NAME=Keey \
  -e COMPANY_PHONE="0203 967 3687" \
  -e COMPANY_WEBSITE=https://keey.co.uk \
  keey-voice-assistant:latest
```

### 3. Test the Container

```bash
# Check if container is running
docker ps

# View logs
docker logs -f keey-voice-assistant

# Test health endpoint
curl http://localhost:3000/health

# Stop container
docker stop keey-voice-assistant

# Remove container
docker rm keey-voice-assistant
```

---

## ☁️ AWS ECS Fargate Deployment

### Required Environment Variables

**🔴 CRITICAL (Application won't work without these):**
```
VAPI_API_KEY                    # Your Vapi API key
GHL_API_KEY                     # GoHighLevel API key
GHL_LOCATION_ID                 # GoHighLevel location ID
GHL_CALENDAR_ID                 # GoHighLevel calendar ID
WEBHOOK_BASE_URL                # Your public URL (e.g., https://your-app.com)
```

**🟡 IMPORTANT (Required for full functionality):**
```
VAPI_INBOUND_ASSISTANT_ID       # Inbound assistant ID
VAPI_OUTBOUND_PHONE_NUMBER_ID   # Outbound phone number ID
VAPI_SQUAD_ID                   # Squad ID for outbound calls (optional)
```

**🟢 OPTIONAL (Have defaults):**
```
PORT=3000                       # Application port
NODE_ENV=production             # Environment
DEFAULT_TIMEZONE=Europe/London  # Default timezone
DEFAULT_COUNTRY_CODE=GB         # Default country
COMPANY_NAME=Keey              # Company name
COMPANY_PHONE=0203 967 3687    # Company phone
COMPANY_WEBSITE=https://keey.co.uk  # Company website
LOG_LEVEL=info                  # Logging level
```

### ECS Task Definition Example

```json
{
  "family": "keey-voice-assistant",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "keey-voice-assistant",
      "image": "your-ecr-repo/keey-voice-assistant:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        },
        {
          "name": "DEFAULT_TIMEZONE",
          "value": "Europe/London"
        }
      ],
      "secrets": [
        {
          "name": "VAPI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:vapi-key"
        },
        {
          "name": "GHL_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:ghl-key"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/keey-voice-assistant",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

---

## 🔐 Security Best Practices

✅ **What we're doing:**
- Running as non-root user (nodejs:1001)
- Using Alpine Linux (minimal attack surface)
- No unnecessary packages installed
- Secrets via AWS Secrets Manager (not hardcoded)
- Health checks enabled
- Proper signal handling for graceful shutdown

❌ **What NOT to do:**
- Don't commit `.env` files with secrets
- Don't use environment variables for secrets in production (use AWS Secrets Manager)
- Don't expose unnecessary ports
- Don't run as root user

---

## 📊 Resource Recommendations

### Development/Testing
```
CPU: 256 (.25 vCPU)
Memory: 512 MB
Cost: ~$5-10/month
```

### Production (Low Traffic)
```
CPU: 512 (.5 vCPU)
Memory: 1024 MB (1 GB)
Cost: ~$15-25/month
```

### Production (High Traffic)
```
CPU: 1024 (1 vCPU)
Memory: 2048 MB (2 GB)
Auto-scaling: 2-5 tasks
Cost: ~$50-150/month
```

---

## 🛠️ Troubleshooting

### Container won't start
```bash
# Check logs
docker logs keey-voice-assistant

# Common issues:
# 1. Missing environment variables
# 2. Port already in use
# 3. Invalid API keys
```

### Health check failing
```bash
# Test health endpoint manually
curl http://localhost:3000/health

# Should return: {"status":"ok"}
```

### Application crashes
```bash
# Check if all required env vars are set
docker exec keey-voice-assistant env | grep -E "VAPI|GHL|WEBHOOK"
```

---

## 📝 Quick Reference

| Command | Description |
|---------|-------------|
| `docker build -t keey-voice-assistant .` | Build image |
| `docker run -d -p 3000:3000 keey-voice-assistant` | Run container |
| `docker logs -f keey-voice-assistant` | View logs |
| `docker exec -it keey-voice-assistant sh` | Shell into container |
| `docker stop keey-voice-assistant` | Stop container |
| `docker system prune -a` | Clean up all Docker resources |

---

## 🔄 CI/CD Integration

### Push to AWS ECR

```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t keey-voice-assistant:latest .
docker tag keey-voice-assistant:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/keey-voice-assistant:latest

# Push
docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/keey-voice-assistant:latest
```

### GitHub Actions Example

```yaml
name: Deploy to AWS ECS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build, tag, and push image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: keey-voice-assistant
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster keey-cluster --service keey-voice-assistant --force-new-deployment
```

---

## ✅ Pre-Deployment Checklist

- [ ] Built Docker image successfully
- [ ] Tested container locally with all env vars
- [ ] Health endpoint returns 200 OK
- [ ] All webhook endpoints responding
- [ ] Created AWS ECR repository
- [ ] Pushed image to ECR
- [ ] Created ECS task definition
- [ ] Configured secrets in AWS Secrets Manager
- [ ] Set up Application Load Balancer
- [ ] Configured security groups (allow 3000)
- [ ] Set up CloudWatch logs
- [ ] Tested webhook URLs are publicly accessible
- [ ] Updated WEBHOOK_BASE_URL to production URL
- [ ] Configured auto-scaling (optional)

---

## 📞 Support

If you encounter issues:
1. Check logs: `docker logs keey-voice-assistant`
2. Verify env vars: All required variables set?
3. Test health: `curl http://localhost:3000/health`
4. Check network: Can webhooks reach your server?

**Remember**: The self-ping mechanism (`RENDER` env var) won't activate on AWS ECS - it's designed for Render.com free tier only.

