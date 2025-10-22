"use client"

import { useState, useEffect } from "react"
import { useAccount, useReadContract } from "wagmi"
import { useNavigate } from "react-router-dom"
import { sdk } from "@farcaster/frame-sdk"
import { formatUnits } from "viem"
import { apiConfig } from "../../config"
import NotificationButton from "./NotificationButton"

const PYUSD_ADDRESS = "0x46850ad61c2b7d64d08c9c754f45254596696984" as `0x${string}`

// ERC20 ABI for balanceOf
const erc20Abi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const

export default function PyQuestHome() {
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [liveStats, setLiveStats] = useState<any>(null)

  // Fetch PYUSD balance
  const { data: pyusdBalance } = useReadContract({
    address: PYUSD_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  })

  // Get user info from Farcaster SDK
  useEffect(() => {
    const initUserInfo = async () => {
      try {
        await sdk.actions.ready()
        const context = await sdk.context
        if (context?.user) {
          setUserInfo({
            username: context.user.username || `user_${context.user.fid}`,
            displayName: context.user.displayName || context.user.username || `User ${context.user.fid}`,
            pfpUrl: context.user.pfpUrl || ''
          })
        }
      } catch (error) {
        console.error('Failed to get user info:', error)
      }
    }
    initUserInfo()
  }, [])

  // Fetch live stats from Hypersync
  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const response = await fetch(`${apiConfig.baseUrl}/api/hypersync-stats`)
        if (response.ok) {
          const data = await response.json()
          setLiveStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch live stats:', error)
      }
    }
    fetchLiveStats()
    // Refetch every 30 seconds
    const interval = setInterval(fetchLiveStats, 30000)
    return () => clearInterval(interval)
  }, [])

  // Set document title
  useEffect(() => {
    document.title = "PyQuest - Earn PYUSD"
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-100 to-purple-50 p-3">
      {/* Header */}
      <header className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              PYQUEST
            </h1>
            <p className="text-xs text-slate-600 font-semibold">
              Post. Hunt. Earn PYUSD.
            </p>
          </div>
          {isConnected && (
            <div className="bg-white rounded px-2 py-1 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] text-slate-600 font-semibold">CONNECTED</p>
              <p className="text-xs font-bold text-slate-900">
                {address?.slice(0, 4)}...{address?.slice(-3)}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Info Pills - Compact */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {/* Account Pill */}
        <div className="bg-pink-300 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-2 rounded text-center transition-all duration-200 hover:bg-pink-400 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xl mb-1">👤</div>
          <p className="text-[10px] font-black text-slate-900 truncate">
            {userInfo?.username || "Guest"}
          </p>
        </div>

        {/* Balance Pill */}
        <div className="bg-cyan-300 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-2 rounded text-center transition-all duration-200 hover:bg-cyan-400 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xl mb-1">💰</div>
          <p className="text-xs font-black text-slate-900">
            {pyusdBalance ? parseFloat(formatUnits(pyusdBalance, 6)).toFixed(2) : "0"}
          </p>
          <p className="text-[8px] font-bold text-slate-700">PYUSD</p>
        </div>
      </div>

      {/* Main Post Bounty Card */}
      <div 
        onClick={() => navigate("/bounty")}
        className="bg-gradient-to-br from-pink-400 to-purple-500 border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-6 mb-4 cursor-pointer active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="flex items-center justify-center mb-3">
          <div className="w-16 h-16 bg-white rounded-full border-4 border-slate-900 flex items-center justify-center">
            <span className="text-3xl">🎯</span>
          </div>
        </div>
        <h2 className="text-2xl font-black text-white text-center mb-2">
          POST BOUNTY
        </h2>
        <p className="text-sm text-white/90 text-center font-bold">
          Create a task and offer PYUSD rewards
        </p>
      </div>

      {/* Action Buttons - Mobile First */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Hunt Bounties Button */}
        <button
          onClick={() => navigate("/hunt")}
          className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-black py-3 px-3 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] text-xs rounded flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <span className="text-2xl">🔍</span>
          <span>HUNT</span>
        </button>

        {/* My Bounties Button */}
        <button
          onClick={() => navigate("/my-bounties")}
          className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white font-black py-3 px-3 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] text-xs rounded flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <span className="text-2xl">📋</span>
          <span>MY BOUNTIES</span>
        </button>

        {/* Leaderboard Button */}
        <button
          onClick={() => navigate("/leaderboard")}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black py-3 px-3 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] text-xs rounded flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <span className="text-2xl">🏆</span>
          <span className="text-[10px] leading-tight">LEADER<br/>BOARD</span>
        </button>
      </div>

      {/* Notification Button */}
      <div className="mb-4">
        <NotificationButton />
      </div>

      {/* Live Stats - Powered by Hypersync */}
      <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded p-2 mb-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black text-slate-900">⚡ LIVE STATS</p>
          <p className="text-[8px] font-bold text-purple-600">Envio HyperSync</p>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div className="bg-purple-100 border border-slate-900 rounded p-1.5 text-center transition-all duration-200 hover:bg-purple-200 hover:-translate-y-0.5">
            <p className="text-base font-black text-slate-900">{liveStats?.totalVolume || '0'}</p>
            <p className="text-[8px] font-bold text-slate-600">PYUSD PAID</p>
          </div>
          <div className="bg-pink-100 border border-slate-900 rounded p-1.5 text-center transition-all duration-200 hover:bg-pink-200 hover:-translate-y-0.5">
            <p className="text-base font-black text-slate-900">{liveStats?.uniqueHunters || '0'}</p>
            <p className="text-[8px] font-bold text-slate-600">HUNTERS</p>
          </div>
          <div className="bg-cyan-100 border border-slate-900 rounded p-1.5 text-center transition-all duration-200 hover:bg-cyan-200 hover:-translate-y-0.5">
            <p className="text-base font-black text-slate-900">{liveStats?.totalBounties || '0'}</p>
            <p className="text-[8px] font-bold text-slate-600">COMPLETED</p>
          </div>
        </div>
      </div>
    </div>
  )
}
