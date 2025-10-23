"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useNavigate } from "react-router-dom"
import { formatUnits } from "viem"

interface Submission {
  castHash: string
  authorFid: number
  authorUsername: string
  authorWallet: string
  text: string
  timestamp: number
  imageUrl?: string
}

interface BountySubmissionsProps {
  bountyId: number
  bountyAmount: bigint
  bountyDescription: string
}

export default function BountySubmissions({ bountyId, bountyAmount, bountyDescription }: BountySubmissionsProps) {
  const { address } = useAccount()
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rewardingId, setRewardingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSubmissions()
  }, [bountyId])

  const fetchSubmissions = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement Farcaster API integration
      // 1. Get the bounty cast hash from the bot
      // 2. Fetch all replies to that cast
      // 3. Extract wallet addresses from Farcaster profiles
      
      // Mock submissions
      const mockSubmissions: Submission[] = [
        {
          castHash: "0xabc123",
          authorFid: 12345,
          authorUsername: "cooldesigner",
          authorWallet: "0x1234567890123456789012345678901234567890",
          text: "I've completed your task! Here's the result: https://example.com/work",
          timestamp: Date.now() - 3600000,
          imageUrl: "https://picsum.photos/200/150"
        },
        {
          castHash: "0xdef456",
          authorFid: 67890,
          authorUsername: "creativehunter",
          authorWallet: "0x9876543210987654321098765432109876543210",
          text: "Check out my submission! I think you'll love it.",
          timestamp: Date.now() - 7200000
        }
      ]
      
      setSubmissions(mockSubmissions)
    } catch (error) {
      console.error("Failed to fetch submissions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReward = async (submission: Submission) => {
    if (!address) {
      alert("Please connect your wallet")
      return
    }

    setRewardingId(submission.castHash)

    try {
      // TODO: Implement contract interaction
      // Call completeBounty(bountyId, submission.authorWallet)
      
      console.log("Rewarding submission:", {
        bountyId,
        hunter: submission.authorWallet
      })

      alert(`Successfully rewarded ${submission.authorUsername}!`)
      
      // Refresh submissions or navigate back
      setTimeout(() => {
        window.history.back()
      }, 1000)
    } catch (error) {
      console.error("Failed to reward:", error)
      alert(error instanceof Error ? error.message : "Failed to reward submission")
    } finally {
      setRewardingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-100 to-purple-50 p-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-black text-2xl p-3 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4 text-center rounded">
        <span className="text-2xl mr-2">📥</span>
        SUBMISSIONS
      </div>

      {/* Bounty Info */}
      <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 rounded mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-slate-900">
            BOUNTY #{bountyId}
          </span>
          <span className="text-sm font-black text-pink-600">
            {formatUnits(bountyAmount, 6)} PYUSD
          </span>
        </div>
        <p className="text-xs text-slate-700 line-clamp-2">
          {bountyDescription}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-sm font-bold text-slate-600">Loading submissions...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && submissions.length === 0 && (
        <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-6 rounded text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-sm font-black text-slate-900 mb-2">
            No submissions yet
          </p>
          <p className="text-xs text-slate-600">
            Check back later for hunter submissions!
          </p>
        </div>
      )}

      {/* Submissions List */}
      {!isLoading && submissions.length > 0 && (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div
              key={submission.castHash}
              className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded overflow-hidden"
            >
              {/* Author Info */}
              <div className="bg-gradient-to-r from-purple-200 to-pink-200 p-3 border-b-2 border-slate-900">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <span className="text-xs font-black text-slate-900">
                      @{submission.authorUsername}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-600">
                    {new Date(submission.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-[9px] text-slate-600 truncate">
                  {submission.authorWallet}
                </p>
              </div>

              {/* Submission Content */}
              <div className="p-3">
                <p className="text-xs text-slate-700 mb-3">
                  {submission.text}
                </p>

                {/* Image Preview */}
                {submission.imageUrl && (
                  <img
                    src={submission.imageUrl}
                    alt="Submission"
                    className="w-full rounded border-2 border-slate-900 mb-3"
                  />
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleReward(submission)}
                    disabled={rewardingId === submission.castHash}
                    className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black py-2 px-3 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rewardingId === submission.castHash
                      ? "REWARDING..."
                      : `REWARD ${formatUnits(bountyAmount, 6)} PYUSD`}
                  </button>
                  <a
                    href={`https://warpcast.com/~/conversations/${submission.castHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-slate-200 text-slate-900 font-black py-2 px-3 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] text-xs rounded text-center"
                  >
                    VIEW ON WARPCAST →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-yellow-100 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 rounded mt-4">
        <p className="text-xs font-bold text-slate-700 mb-1">
          💡 How to reward:
        </p>
        <p className="text-[10px] text-slate-600">
          Review each submission and click "REWARD" to send the PYUSD to the hunter.
          This will complete the bounty and the transaction will be posted to Farcaster.
        </p>
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate("/my-bounties")}
        className="w-full mt-4 bg-slate-300 text-slate-900 font-black py-2 px-4 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] text-sm rounded"
      >
        ← BACK
      </button>
    </div>
  )
}
