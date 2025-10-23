"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { apiConfig } from "../../config"

interface HunterStats {
  address: string
  completedCount: number
  totalEarned: string
  fid?: number | null
  username?: string | null
  displayName?: string | null
  pfpUrl?: string | null
}

interface Stats {
  totalBounties: number
  totalVolume: string
  uniqueHunters: number
  leaderboard: HunterStats[]
}

export default function Leaderboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${apiConfig.baseUrl}/api/hypersync-stats`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      
      const data = await response.json()
      setStats(data)
      setError("")
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to load leaderboard')
    } finally {
      setIsLoading(false)
    }
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-100 to-purple-50 p-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black text-2xl p-3 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4 text-center rounded">
        <span className="text-2xl mr-2">🏆</span>
        LEADERBOARD
      </div>

      {/* Live Stats Banner */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gradient-to-br from-pink-400 to-red-500 text-white p-2 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-lg">
            <div className="text-[9px] font-black opacity-90 mb-1">TOTAL VOLUME</div>
            <div className="text-lg font-black mb-1">{stats.totalVolume}</div>
            <div className="text-[10px] font-bold">PYUSD</div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-purple-500 text-white p-2 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-lg">
            <div className="text-[9px] font-black opacity-90 mb-1">COMPLETED</div>
            <div className="text-lg font-black">{stats.totalBounties}</div>
            <div className="text-[10px] font-bold">Bounties</div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-teal-500 text-white p-2 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-lg">
            <div className="text-[9px] font-black opacity-90 mb-1">HUNTERS</div>
            <div className="text-lg font-black">{stats.uniqueHunters}</div>
            <div className="text-[10px] font-bold">Active</div>
          </div>
        </div>
      )}

      {/* Powered by Envio Badge */}
            {/* Envio HyperSync Badge */}
      <div className="mb-5 bg-gradient-to-r from-purple-100 to-pink-100 p-4 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="text-lg font-black">
            Powered by <span className="text-purple-600">Envio HyperSync</span>
          </span>
        </div>
        <div className="text-xs font-bold text-slate-600 mt-1">Real-time on-chain analytics</div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-6 rounded text-center">
          <p className="text-sm font-bold text-slate-600">⚡ Loading real-time stats...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-100 border-2 border-red-500 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-4 rounded mb-4">
          <p className="text-sm font-bold text-red-700">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-2 text-xs bg-red-500 text-white px-3 py-1 rounded font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Leaderboard */}
      {stats && stats.leaderboard.length > 0 && (
        <div className="bg-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 p-3 border-b-2 border-slate-900">
            <div className="flex justify-between items-center font-black text-[10px] uppercase text-slate-900">
              <div className="flex-1 text-left">🏆 RANK</div>
              <div className="flex-[2] text-left">HUNTER</div>
              <div className="flex-1 text-center">💰 EARNED</div>
              <div className="flex-1 text-right">✅ DONE</div>
            </div>
          </div>

          {/* Leaderboard Entries */}
          <div className="divide-y-2 divide-slate-900">
            {stats.leaderboard.map((hunter, index) => (
              <div
                key={hunter.address}
                className={`p-3 transition-all hover:bg-yellow-50 ${
                  index === 0 ? 'bg-yellow-50' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  {/* Rank */}
                  <div className="flex-1 text-left">
                    <span className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎯'}
                    </span>
                  </div>

                  {/* Hunter Info */}
                  <div className="flex-[2] text-left">
                    {hunter.username ? (
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {hunter.displayName || hunter.username}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          @{hunter.username}
                        </div>
                      </div>
                    ) : (
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        {shortenAddress(hunter.address)}
                      </div>
                    )}
                  </div>

                  {/* Earnings */}
                  <div className="flex-1 text-center">
                    <div className="font-black text-sm text-green-600">
                      {hunter.totalEarned}
                    </div>
                    <div className="text-[9px] text-slate-600 font-bold">PYUSD</div>
                  </div>

                  {/* Completed Count */}
                  <div className="flex-1 text-right">
                    <span className="inline-block bg-blue-500 text-white px-2 py-1 rounded-full font-bold text-[10px] whitespace-nowrap">
                      {hunter.completedCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats && stats.leaderboard.length === 0 && !isLoading && (
        <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-6 rounded text-center">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-sm font-black text-slate-900 mb-2">
            No hunters yet
          </p>
          <p className="text-xs text-slate-600">
            Complete a bounty to be the first on the leaderboard!
          </p>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="w-full mt-4 bg-slate-300 text-slate-900 font-black py-2 px-4 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] text-sm rounded transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        ← BACK TO HOME
      </button>
    </div>
  )
}
