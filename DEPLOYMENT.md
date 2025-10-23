# PyQuest - Vercel Deployment Guide 🚀

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "feat: prepare for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI (Fastest)
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy
vercel

# Follow prompts, then deploy to production
vercel --prod
```

#### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the settings
5. Click "Deploy"

### 3. Add Environment Variables in Vercel

Go to your project → Settings → Environment Variables and add:

```env
VITE_MONGODB_URI=mongodb+srv://nith:skill123@cluster0hl-bot.r4jy5bi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0hl-bot
VITE_NEYNAR_API_KEY=3D4F2112-0E0B-4955-A49D-540975BB75B7
VITE_NEYNAR_SIGNER_UUID=f9a18bae-f334-4a68-ba69-0bbea1680ee9
VITE_GAME_PRIVATE_KEY=2e456459a34055e435b89e6916e97a03a9933ea5172413925f3030a4e6276e34
VITE_THIRDWEB_CLIENT_ID=973cfa9af37d6a5d4c43a4aef23bdc60
VITE_THIRDWEB_SECRET_KEY=Hl7bYQOy06p6nSByodV-n4wIZANbD4jPUPw9COcK8BTbw16fcW3gD81oHoX6oCTYlUrTp7ujiHmrXs36yYyX_g
HYPER_SYNC_TOKEN=13ae3b0c-63f3-47bb-80c2-c51ee5433c89
SIGNER_PRIVATE_KEY=2e456459a34055e435b89e6916e97a03a9933ea5172413925f3030a4e6276e34
CONTRACT_ADDRESS=0x43e3eAfD0Fcc11452889f6fEF16A5646ae0E42eb
NODE_ENV=production
```

**Important:** Leave `VITE_API_URL` empty or unset - Vercel will use the same domain for API routes!

### 4. Update Farcaster Manifest URLs

Once deployed, update your Farcaster manifest file:

1. Get your Vercel URL (e.g., `pyquest.vercel.app`)
2. Update `public/.well-known/farcaster.json`:
   - Change all URLs from ngrok/localtunnel to your Vercel domain
   - Example: `https://pyquest.vercel.app`
3. Go to [warpcast.com/~/developers/frames](https://warpcast.com/~/developers/frames)
4. Regenerate account association signature for your new domain

### 5. Test Your Deployment

After deployment, test these endpoints:
- `https://your-app.vercel.app/` - Frontend
- `https://your-app.vercel.app/api/hypersync-stats` - API test
- `https://your-app.vercel.app/.well-known/farcaster.json` - Manifest

## How It Works

### Frontend
- React/Vite app builds to `/dist`
- Served as static files

### Backend (Serverless Functions)
- All files in `/api/` automatically become serverless functions
- `api/bounties.js` → `https://your-app.vercel.app/api/bounties`
- `api/hypersync-stats.js` → `https://your-app.vercel.app/api/hypersync-stats`
- No need to run `server.js` - Vercel handles routing!

### MongoDB
- Connection handled in each serverless function
- Uses connection pooling automatically

## Local Development

For local development, continue using:
```bash
npm run dev:full
```

This runs both Vite and Express locally with ngrok/localtunnel.

## Production vs Development

- **Development**: Uses `VITE_API_URL=https://eighty-areas-itch.loca.lt`
- **Production**: Uses same domain (Vercel routes `/api/*` automatically)

## Troubleshooting

### API routes not working?
- Check Environment Variables are set in Vercel dashboard
- Make sure all API files export `export default async function handler(req, res)`

### MongoDB connection issues?
- Verify `VITE_MONGODB_URI` is set in Vercel
- Check MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

### Farcaster notifications not working?
- Update manifest URLs to Vercel domain
- Regenerate account association signature

## Important Notes

⚠️ **DO NOT USE** ngrok or localtunnel in production!
✅ Vercel provides a permanent domain
✅ All secrets are in environment variables
✅ Automatic HTTPS and CDN

---

**Questions?** Check Vercel docs or ping me burh! 🚀
