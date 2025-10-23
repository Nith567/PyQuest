#!/bin/bash

echo "🚀 PyQuest Vercel Deployment Script"
echo "===================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "📦 Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✅ Vercel CLI ready"
echo ""

# Check git status
echo "📝 Checking git status..."
if [[ `git status --porcelain` ]]; then
  echo "⚠️  You have uncommitted changes:"
  git status --short
  echo ""
  read -p "Commit changes now? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]
  then
    read -p "Enter commit message: " commit_msg
    git add .
    git commit -m "$commit_msg"
    git push origin main
    echo "✅ Changes committed and pushed"
  else
    echo "⏭️  Skipping commit"
  fi
else
  echo "✅ Working directory clean"
fi

echo ""
echo "🚀 Deploying to Vercel..."
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "✨ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Vercel dashboard to set environment variables"
echo "2. Update Farcaster manifest URLs with your Vercel domain"
echo "3. Regenerate account association signature"
echo ""
echo "📖 See DEPLOYMENT.md for full instructions"
n