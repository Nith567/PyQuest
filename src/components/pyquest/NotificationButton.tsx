"use client"

import { useState, useCallback } from "react"
import { Button } from "../ui/button"
import sdk, { AddMiniApp } from "@farcaster/miniapp-sdk"

export default function NotificationButton() {
  const [notificationDetails, setNotificationDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const addFrame = useCallback(async () => {
    try {
      setIsLoading(true)
      setNotificationDetails(null)

      const result = await sdk.actions.addFrame()

      if (result.notificationDetails) {
        setNotificationDetails(result.notificationDetails)
        console.log('✅ Notifications enabled:', result.notificationDetails)
      }
    } catch (error) {
      if (error instanceof AddMiniApp.RejectedByUser) {
        console.log('❌ User rejected:', error.message)
      } else if (error instanceof AddMiniApp.InvalidDomainManifest) {
        console.log('❌ Invalid manifest:', error.message)
      } else {
        console.log('❌ Error:', error)
      }
      console.error('❌ Error enabling notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <Button 
      onClick={addFrame} 
      disabled={!!notificationDetails || isLoading}
      className={`w-full text-sm py-3 rounded-xl transition-all duration-300 ${
        notificationDetails 
          ? 'bg-green-900/30 border border-green-500/30 text-green-300 cursor-not-allowed' 
          : 'bg-gradient-to-r from-yellow-600/80 to-orange-600/80 hover:from-yellow-600 hover:to-orange-600 text-white border border-yellow-500/30 hover:scale-105'
      }`}
    >
      <span className="flex items-center justify-center gap-2">
        <span>{notificationDetails ? "✅" : isLoading ? "⏳" : "🔔"}</span>
        <span>
          {notificationDetails ? "Notifications Active" : isLoading ? "Enabling..." : "Enable Bounty Alerts"}
        </span>
      </span>
    </Button>
  )
}
