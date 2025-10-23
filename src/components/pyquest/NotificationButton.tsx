"use client"

import { useState, useCallback } from "react"
import { Button } from "../ui/button"
import sdk, { AddMiniApp } from "@farcaster/miniapp-sdk"

export default function NotificationButton() {
  const [notificationDetails, setNotificationDetails] = useState<any>(null)
  const [addFrameResult, setAddFrameResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const addFrame = useCallback(async () => {
    try {
      setIsLoading(true)
      setNotificationDetails(null)

      const result = await sdk.actions.addFrame()

      if (result.notificationDetails) {
        setNotificationDetails(result.notificationDetails)
        setAddFrameResult(
          `Added, got notification token ${result.notificationDetails.token} and url ${result.notificationDetails.url}`
        )
        console.log('✅ Notifications enabled:', result.notificationDetails)
      } else {
        setAddFrameResult("Added, got no notification details")
      }
    } catch (error) {
      if (error instanceof AddMiniApp.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`)
      } else if (error instanceof AddMiniApp.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`)
      } else {
        setAddFrameResult(`Error: ${error}`)
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
