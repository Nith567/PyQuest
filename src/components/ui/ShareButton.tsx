"use client"

import { Button } from "./button"
import { ShareIcon } from "../core/icons"

interface ShareButtonProps {
  score: number
  lines: number
  level: number
  timeTaken: number
  tokenReward: number
  onShare?: () => void
}

export function ShareButton({ 
  score, 
  lines, 
  level, 
  timeTaken, 
  tokenReward,
  onShare
}: ShareButtonProps) {
  const formatTime = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000))
    const m = String(Math.floor(total / 60)).padStart(2, "0")
    const s = String(total % 60).padStart(2, "0")
    return `${m}:${s}`
  }

  const shareScore = async () => {
    try {
      // Create the share message
      const gameUrl = window.location.origin
      
      const shareText = `🎮 Just scored ${score} points in ArbiBlocks! 🎮\n\n` +
        `📊 Stats:\n` +
        `• ${lines} lines cleared\n` +
        `• Level ${level} reached\n` +
        `• ${formatTime(timeTaken)} time\n` +
        `• ${tokenReward} tokens earned\n\n` +
        `Play now: ${gameUrl}\n\n` +
        `#ArbiBlocks #Tetris #Arbitrum #Gaming`

      // Try to use Web Share API first (mobile)
      if (navigator.share) {
        await navigator.share({
          title: 'ArbiBlocks - My Score',
          text: shareText,
          url: gameUrl
        })
      } else {
        // Fallback: Copy to clipboard and show notification
        await navigator.clipboard.writeText(shareText)
        
        // Show temporary notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300'
        notification.textContent = '📋 Score copied to clipboard!'
        document.body.appendChild(notification)
        
        setTimeout(() => {
          notification.style.opacity = '0'
          setTimeout(() => {
            document.body.removeChild(notification)
          }, 300)
        }, 2000)
      }
    } catch (error) {
      console.error('Share failed:', error)
      
      // Final fallback: Open in new window for manual sharing
      const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
        `🎮 Just scored ${score} points in ArbiBlocks! Play now: ${window.location.origin}`
      )}`
      window.open(shareUrl, '_blank')
    }
  }

  return (
    <Button
      onClick={onShare || shareScore}
      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 flex items-center justify-center gap-2"
    >
      <ShareIcon className="w-4 h-4" />
      Share Score
    </Button>
  )
}
