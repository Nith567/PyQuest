"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "../ui/button"
import sdk, { AddMiniApp } from "@farcaster/miniapp-sdk"

export default function NotificationButton() {
  const [added, setAdded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fid, setFid] = useState<number | null>(null)

  // Check if notifications are already enabled and get FID
  useEffect(() => {
    const savedToken = localStorage.getItem('fcNotificationToken')
    if (savedToken) {
      setAdded(true)
    }
    
    // Get user FID from SDK
    sdk.context.then(context => {
      if (context.user?.fid) {
        setFid(context.user.fid)
      }
    })
  }, [])

  const addFrame = useCallback(async () => {
    try {
      setIsLoading(true)

      const result = await sdk.actions.addFrame()

      if (result.notificationDetails) {
        // Save notification details to localStorage
        localStorage.setItem('fcNotificationToken', result.notificationDetails.token)
        localStorage.setItem('fcNotificationUrl', result.notificationDetails.url)
        
        // Also send to backend to store in database
        await fetch('https://eighty-areas-itch.loca.lt/api/save-notification-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: result.notificationDetails.token,
            url: result.notificationDetails.url,
            fid: fid
          })
        })
        
        setAdded(true)
        console.log('✅ Notifications enabled:', result.notificationDetails)
      }
    } catch (error) {
      if (error instanceof AddMiniApp.RejectedByUser) {
        console.log('❌ User rejected notification permission')
      } else if (error instanceof AddMiniApp.InvalidDomainManifest) {
        console.log('❌ Invalid domain manifest')
      } else {
        console.error('❌ Error enabling notifications:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [fid])

  return (
    <Button 
      onClick={addFrame} 
      disabled={added || isLoading}
      className={`w-full text-sm py-3 rounded-xl transition-all duration-300 ${
        added 
          ? 'bg-green-900/30 border border-green-500/30 text-green-300 cursor-not-allowed' 
          : 'bg-gradient-to-r from-yellow-600/80 to-orange-600/80 hover:from-yellow-600 hover:to-orange-600 text-white border border-yellow-500/30 hover:scale-105'
      }`}
    >
      <span className="flex items-center justify-center gap-2">
        <span>{added ? "✅" : isLoading ? "⏳" : "🔔"}</span>
        <span>
          {added ? "Notifications Active" : isLoading ? "Enabling..." : "Enable Bounty Alerts"}
        </span>
      </span>
    </Button>
  )
}
