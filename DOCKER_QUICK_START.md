# 🚀 Docker Quick Start - 5 Minutes to Deploy

## 📋 What Got Created

✅ **Dockerfile** - Production-ready container definition  
✅ **.dockerignore** - Keeps image small (excludes 100+ unnecessary files)  
✅ **docker-compose.yml** - One-command local testing  
✅ **DOCKER_DEPLOYMENT.md** - Complete guide (read this for details)

---

## ⚡ Quick Local Test (If Docker is Installed)

```bash
# 1. Create .env file with your secrets
cp env.example .env
# Edit .env with your actual API keys

# 2. Run with docker-compose (easiest)
docker-compose up

# OR run with docker directly
docker build -t keey-voice-assistant .
docker run -p 3000:3000 --env-file .env keey-voice-assistant
```

**Test it:** Open `http://localhost:3000/health` - should return `{"status":"healthy"}`

---

## ☁️ AWS ECS Fargate Deployment (3 Steps)

### Step 1: Push to ECR (AWS Container Registry)

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t keey-voice-assistant .
docker tag keey-voice-assistant:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/keey-voice-assistant:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/keey-voice-assistant:latest
```

### Step 2: Create ECS Service (AWS Console)

1. **Create Cluster**: ECS → Clusters → Create → "Networking only (Fargate)"
2. **Create Task Definition**:
   - Launch type: Fargate
   - CPU: 512, Memory: 1024 MB
   - Container image: Your ECR image URI
   - Port: 3000
   - Environment: Add variables from `env.example`
3. **Create Service**:
   - Launch type: Fargate
   - Desired tasks: 1
   - Load balancer: Yes (Application Load Balancer)
   - Health check: `/health`

### Step 3: Update Webhook URL

After deployment, update your Vapi and GHL webhooks to point to:
```
https://your-alb-url.amazonaws.com/webhook/vapi
https://your-alb-url.amazonaws.com/webhook/ghl-trigger-call
```

---

## 🔐 Required Environment Variables (AWS Secrets Manager)

Store these in AWS Secrets Manager, then reference in ECS task definition:

```
VAPI_API_KEY                    # From Vapi dashboard
GHL_API_KEY                     # From GHL settings
GHL_LOCATION_ID                 # GHL location ID
GHL_CALENDAR_ID                 # GHL calendar ID
WEBHOOK_BASE_URL                # Your public ALB URL
VAPI_INBOUND_ASSISTANT_ID       # From Vapi
VAPI_OUTBOUND_PHONE_NUMBER_ID   # From Vapi
```

---

## 💰 Cost Estimate (AWS ECS Fargate)

| Setup | CPU | Memory | Tasks | Monthly Cost |
|-------|-----|--------|-------|--------------|
| **Dev** | 256 (.25) | 512 MB | 1 | ~$8 |
| **Prod Low** | 512 (.5) | 1 GB | 1 | ~$15 |
| **Prod Med** | 1024 (1) | 2 GB | 1 | ~$30 |
| **Prod High** | 1024 (1) | 2 GB | 2-5 | ~$60-150 |

*Prices exclude data transfer and ALB costs (~$15/month for ALB)*

---

## 🎯 Image Specifications

- **Base**: `node:18-alpine` (smallest official Node image)
- **Size**: ~80MB compressed, ~200MB uncompressed
- **Security**: Runs as non-root user (nodejs:1001)
- **Signal handling**: dumb-init for graceful shutdowns
- **Health check**: Built-in `/health` endpoint
- **Startup time**: ~5-10 seconds on Fargate

---

## ✅ Pre-Deployment Checklist

Before deploying to AWS:

- [ ] Docker Desktop installed and running (for testing)
- [ ] AWS CLI configured (`aws configure`)
- [ ] ECR repository created
- [ ] Built and tested image locally
- [ ] Health endpoint returns 200 OK
- [ ] All required env vars collected
- [ ] AWS Secrets Manager secrets created
- [ ] ECS cluster created
- [ ] Application Load Balancer configured
- [ ] Security groups allow port 3000
- [ ] CloudWatch logs enabled

---

## 🆘 Troubleshooting

### "Docker daemon not running"
- **Windows**: Start Docker Desktop
- **Mac**: Start Docker Desktop
- **Linux**: `sudo systemctl start docker`

### "Health check failing"
```bash
# Test locally
docker run -p 3000:3000 --env-file .env keey-voice-assistant
curl http://localhost:3000/health
```

### "Container exits immediately"
```bash
# Check logs
docker logs container_name

# Common issue: Missing env vars
docker run --env-file .env keey-voice-assistant
```

### "Can't push to ECR"
```bash
# Re-authenticate
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
```

---

## 📚 Full Documentation

**Read `DOCKER_DEPLOYMENT.md` for:**
- Detailed AWS ECS setup
- Security best practices
- Auto-scaling configuration
- CI/CD pipeline examples
- Complete troubleshooting guide

---

## 🎉 That's It!

Your Node.js webhook server is now containerized and ready for AWS ECS Fargate.

**Need help?** Check `DOCKER_DEPLOYMENT.md` for the complete guide.

