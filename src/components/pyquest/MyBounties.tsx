"use client"

import { useState, useEffect } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useNavigate } from "react-router-dom"
import { formatUnits } from "viem"
import { useNotification } from "@blockscout/app-sdk"
import { contractConfig, apiConfig } from "../../config"
import { abi } from "../../../utils/Abi"

interface Bounty {
  id: number
  creator: string
  amount: bigint
  taskDescription: string
  hunter: string
  isCompleted: boolean
  isCancelled: boolean
  timestamp: number
  castHash?: string
}

interface Submission {
  hash: string
  author: {
    username: string
    display_name: string
    pfp_url: string
    verified_addresses: {
      eth_addresses: string[]
    }
  }
  text: string
  timestamp: string
}

export default function MyBounties() {
  const { address } = useAccount()
  const navigate = useNavigate()
  const { openTxToast } = useNotification()
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)

  // Contract write hook for completeBounty
  const { writeContract: writeCompleteBounty, data: completeHash } = useWriteContract()
  
  const { isSuccess: isCompleteSuccess } = useWaitForTransactionReceipt({
    hash: completeHash,
  })

  // Contract write hook for cancelBounty
  const { writeContract: writeCancelBounty, data: cancelHash } = useWriteContract()
  
  const { isSuccess: isCancelSuccess } = useWaitForTransactionReceipt({
    hash: cancelHash,
  })

  // Handle successful completion
  useEffect(() => {
    if (isCompleteSuccess && completeHash && selectedBounty) {
      console.log('✅ Bounty completed!', completeHash)
      // Show Blockscout transaction notification
      openTxToast("42161", completeHash) // 42161 = Arbitrum mainnet chain ID
      
      // Announce winner on Farcaster (async, don't block UI)
      if (selectedBounty.castHash) {
        announceWinner(selectedBounty, completeHash)
      }
      
      // Close dialog and refresh bounties
      setSelectedBounty(null)
      // Force refetch from contract after a delay
      setTimeout(async () => {
        await refetch() // Force refetch bounty IDs
      }, 3000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleteSuccess, completeHash, openTxToast])

  const announceWinner = async (bounty: Bounty, txHash: string) => {
    try {
      console.log('🔍 DEBUG: Looking for winner...')
      console.log('  - Hunter address:', bounty.hunter)
      console.log('  - Bounty cast hash:', bounty.castHash)

      // Fetch submissions for THIS specific bounty (not relying on current state)
      let currentSubmissions: Submission[] = []
      
      if (bounty.castHash) {
        console.log('📡 Fetching fresh submissions for winner announcement...')
        
        try {
          const response = await fetch(
            `https://api.neynar.com/v2/farcaster/cast/conversation/?reply_depth=1&limit=20&identifier=${bounty.castHash}&type=hash`,
            {
              headers: {
                'x-api-key': import.meta.env.VITE_NEYNAR_API_KEY,
                'x-neynar-experimental': 'true'
              }
            }
          )

          if (response.ok) {
            const data = await response.json()
            currentSubmissions = data.conversation?.cast?.direct_replies || []
            console.log('✅ Fetched submissions for winner announcement:', currentSubmissions.length)
          }
        } catch (error) {
          console.error('❌ Error fetching submissions for winner announcement:', error)
        }
      }

      console.log('  - Total submissions for this bounty:', currentSubmissions.length)
      console.log('  - Submissions data:', currentSubmissions.map(s => ({
        username: s.author.username,
        ethAddresses: s.author.verified_addresses?.eth_addresses,
        allVerifiedAddresses: s.author.verified_addresses
      })))

      // Find the winner's submission to get their username
      const winnerSubmission = currentSubmissions.find(s => 
        s.author.verified_addresses?.eth_addresses?.some(addr => 
          addr.toLowerCase() === bounty.hunter.toLowerCase()
        )
      )
      
      console.log('🎯 Winner submission found:', winnerSubmission ? {
        username: winnerSubmission.author.username,
        displayName: winnerSubmission.author.display_name,
        ethAddresses: winnerSubmission.author.verified_addresses?.eth_addresses
      } : 'NOT FOUND')
      
      const winnerUsername = winnerSubmission?.author.username || 'winner'
      const amount = formatUnits(bounty.amount, 6)
      
      console.log('📢 Announcing winner on Farcaster...')
      
      const response = await fetch(`${apiConfig.baseUrl}/api/announce-winner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          castHash: bounty.castHash,
          winnerUsername,
          amount,
          txHash,
          bountyId: bounty.id,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Winner announced on Farcaster:', data.castUrl)
      } else {
        console.error('Failed to announce winner:', await response.text())
      }
    } catch (error) {
      console.error('Error announcing winner:', error)
    }
  }

  // Handle successful cancellation
  useEffect(() => {
    if (isCancelSuccess && cancelHash) {
      console.log('✅ Bounty cancelled!', cancelHash)
      // Show Blockscout transaction notification
      openTxToast("42161", cancelHash) // 42161 = Arbitrum mainnet chain ID
      // Force refetch from contract after a delay
      setTimeout(async () => {
        await refetch() // Force refetch bounty IDs
      }, 3000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCancelSuccess, cancelHash, openTxToast])

  // Use wagmi to read contract - MUCH SIMPLER!
  const { data: bountyIds, isLoading, refetch } = useReadContract({
    address: contractConfig.address as `0x${string}`,
    abi: abi,
    functionName: 'getOwnerBounties',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address, // Only run when address is available
      refetchInterval: false, // Disable auto-refetch
      staleTime: 0, // Always consider data stale
    }
  })

  console.log('🎯 Bounty IDs from contract:', bountyIds)

  // Fetch details for each bounty when bountyIds change
  useEffect(() => {
    if (bountyIds && Array.isArray(bountyIds) && bountyIds.length > 0) {
      // Convert BigInt[] to number[]
      const ids = bountyIds.map(id => Number(id))
      console.log('🔄 Fetching details for bounties:', ids)
      fetchBountyDetails(ids)
    } else if (bountyIds && Array.isArray(bountyIds) && bountyIds.length === 0) {
      console.log('✅ No bounties found for this address')
      setBounties([])
    }
  }, [bountyIds])

  const fetchBountyDetails = async (ids: number[]) => {
    try {
      console.log('📦 Fetching details for bounty IDs:', ids)
      
      // Also fetch MongoDB data for castHash
      const mongoResponse = await fetch(`${apiConfig.baseUrl}/api/bounties/${address}`)
      const mongoData = await mongoResponse.json()
      const mongoBounties = mongoData.bounties || []
      
      const bountyPromises = ids.map(async (id) => {
        const response = await fetch(
          `https://arb1.arbitrum.io/rpc`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_call',
              params: [{
                to: contractConfig.address,
                data: `0xee8c4bbf${id.toString(16).padStart(64, '0')}`, // getBounty(uint256) selector
              }, 'latest']
            })
          }
        )
        
        const bountyData = await response.json()
        
        if (bountyData.error) {
          console.error(`❌ Error fetching bounty ${id}:`, bountyData.error)
          return null
        }
        
        const result = bountyData.result
        
        // Decode bounty data - struct fields are 32 bytes (64 hex chars) each
        // Remove '0x' prefix for easier indexing
        const hexData = result.slice(2)
        
        // Position 0: owner (bytes 0-31)
        const owner = '0x' + hexData.slice(24, 64)
        // Position 1: amount (bytes 32-63)
        const amount = BigInt('0x' + hexData.slice(64, 128))
        // Position 2: description offset pointer (bytes 64-95) - skip for now
        // Position 3: hunter (bytes 96-127)
        const hunter = '0x' + hexData.slice(216, 256)
        // Position 4: isCompleted (bytes 128-159)
        const isCompleted = hexData.slice(318, 320) === '01'
        // Position 5: isCancelled (bytes 160-191)
        const isCancelled = hexData.slice(382, 384) === '01'
        // Position 6: timestamp (bytes 192-223)
        const timestamp = Number.parseInt(hexData.slice(384, 448), 16)
        
        console.log(`📊 Bounty #${id} hex check: isCompleted=${hexData.slice(318, 320)}, isCancelled=${hexData.slice(382, 384)}`)
        console.log(`📊 Bounty #${id} status: completed=${isCompleted}, cancelled=${isCancelled}`)
        
        // Extract task description (it's a dynamic string)
        const descOffset = Number.parseInt(result.slice(130, 194), 16)
        const descLength = Number.parseInt(result.slice(descOffset * 2 + 2, descOffset * 2 + 66), 16)
        const descHex = result.slice(descOffset * 2 + 66, descOffset * 2 + 66 + descLength * 2)
        
        // Decode hex to string (browser-compatible way)
        let taskDescription = ''
        for (let i = 0; i < descHex.length; i += 2) {
          taskDescription += String.fromCharCode(parseInt(descHex.substr(i, 2), 16))
        }
        
        // Find matching MongoDB bounty for castHash
        const mongoBounty = mongoBounties.find((b: any) => b.bountyId === id)
        
        return {
          id,
          creator: owner,
          amount,
          taskDescription,
          hunter,
          isCompleted,
          isCancelled,
          timestamp: timestamp * 1000,
          castHash: mongoBounty?.castHash
        }
      })
      
      const fetchedBounties = await Promise.all(bountyPromises)
      // Filter out null AND filter out completed/cancelled bounties
      const validBounties = fetchedBounties.filter(b => b !== null && !b.isCompleted && !b.isCancelled) as Bounty[]
      console.log('✅ Fetched bounty details:', validBounties)
      console.log('🎯 Active bounties only:', validBounties.length)
      setBounties(validBounties)
      
    } catch (error) {
      console.error("❌ Failed to fetch bounty details:", error)
    }
  }

  const fetchSubmissions = async (bounty: Bounty) => {
    if (!bounty.castHash) {
      console.error('❌ No cast hash found for bounty:', bounty)
      setSelectedBounty(bounty) // Still open dialog to show error
      setSubmissions([])
      return
    }

    setIsLoadingSubmissions(true)
    setSelectedBounty(bounty)
    setSubmissions([]) // Clear previous submissions

    try {
      console.log('📡 Fetching submissions for cast hash:', bounty.castHash)
      
      const response = await fetch(
        `https://api.neynar.com/v2/farcaster/cast/conversation/?reply_depth=1&limit=20&identifier=${bounty.castHash}&type=hash`,
        {
          headers: {
            'x-api-key': import.meta.env.VITE_NEYNAR_API_KEY,
            'x-neynar-experimental': 'true'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch submissions: ${response.status}`)
      }

      const data = await response.json()
      console.log('📦 Neynar response:', data)
      
      const replies = data.conversation?.cast?.direct_replies || []
      console.log('✅ Found submissions:', replies.length)
      
      setSubmissions(replies)
    } catch (error) {
      console.error('❌ Error fetching submissions:', error)
      setSubmissions([])
    } finally {
      setIsLoadingSubmissions(false)
    }
  }

  const handleRewardHunter = (hunterAddress: string) => {
    if (!selectedBounty) return
    
    console.log('🏆 Rewarding hunter:', hunterAddress, 'for bounty:', selectedBounty.id)
    
    writeCompleteBounty({
      address: contractConfig.address as `0x${string}`,
      abi: abi,
      functionName: 'completeBounty',
      args: [BigInt(selectedBounty.id), hunterAddress as `0x${string}`],
    })
  }

  const handleCancelBounty = (bountyId: number) => {
    console.log('❌ Cancelling bounty:', bountyId)
    
    writeCancelBounty({
      address: contractConfig.address as `0x${string}`,
      abi: abi,
      functionName: 'cancelBounty',
      args: [BigInt(bountyId)],
    })
  }

  const getStatusBadge = (bounty: Bounty) => {
    if (bounty.isCompleted) {
      return (
        <span className="text-[10px] font-black px-2 py-1 bg-green-300 border-2 border-slate-900 rounded">
          ✅ COMPLETED
        </span>
      )
    }
    if (bounty.isCancelled) {
      return (
        <span className="text-[10px] font-black px-2 py-1 bg-red-300 border-2 border-slate-900 rounded">
          ❌ CANCELLED
        </span>
      )
    }
    return (
      <span className="text-[10px] font-black px-2 py-1 bg-yellow-300 border-2 border-slate-900 rounded">
        ⏳ ACTIVE
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-100 to-purple-50 p-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-400 to-pink-500 text-white font-black text-2xl p-3 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4 text-center rounded">
        <div className="flex items-center justify-between">
          <span></span>
          <span>
            <span className="text-2xl mr-2">📋</span>
            MY BOUNTIES
          </span>
          <button
            onClick={async () => {
              console.log('🔄 Manual refresh triggered')
              await refetch()
            }}
            className="text-white hover:bg-white/20 rounded px-3 py-1 text-sm font-black"
          >
            🔄
          </button>
        </div>
      </div>



      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-sm font-bold text-slate-600">Loading bounties...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && bounties.length === 0 && (
        <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-6 rounded text-center">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-sm font-black text-slate-900 mb-2">
            No bounties yet
          </p>
          <p className="text-xs text-slate-600">
            Your active Quests will appear here.
          </p>
        </div>
      )}

      {/* Bounties List */}
      {!isLoading && bounties.length > 0 && (
        <div className="space-y-3">
          {bounties.map((bounty) => (
            <div
              key={bounty.id}
              className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
            >
              {/* Bounty Header */}
              <div className="bg-gradient-to-r from-cyan-200 to-blue-200 p-3 border-b-2 border-slate-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-900">
                    BOUNTY #{bounty.id}
                  </span>
                  {getStatusBadge(bounty)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-slate-900">
                    {formatUnits(bounty.amount, 6)} PYUSD
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {new Date(bounty.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Bounty Description */}
              <div className="p-3">
                <p className="text-xs text-slate-700 mb-3 line-clamp-2">
                  {bounty.taskDescription}
                </p>

                {/* Actions - only show for active bounties */}
                <div className="space-y-2">
                  <button
                    onClick={() => fetchSubmissions(bounty)}
                    className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-black py-2 px-3 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] text-xs rounded transition-all duration-200 hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    VIEW SUBMISSIONS
                  </button>
                  <button
                    onClick={() => handleCancelBounty(bounty.id)}
                    disabled={!!cancelHash}
                    className="w-full bg-red-300 text-slate-900 font-black py-2 px-3 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] text-xs rounded transition-all duration-200 hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelHash ? '⏳ CANCELLING...' : 'CANCEL BOUNTY'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submissions Dialog */}
      {selectedBounty && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3" onClick={() => setSelectedBounty(null)}>
          <div className="bg-white border-2 border-slate-900 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] rounded max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Dialog Header */}
            <div className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-black text-xl p-3 border-b-2 border-slate-900 sticky top-0">
              <div className="flex items-center justify-between">
                <span>📨 SUBMISSIONS - BOUNTY #{selectedBounty.id}</span>
                <button
                  onClick={() => setSelectedBounty(null)}
                  className="text-white hover:bg-white/20 rounded px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isLoadingSubmissions && (
              <div className="p-6 text-center">
                <p className="text-sm font-bold text-slate-600">Loading submissions...</p>
              </div>
            )}

            {/* No Submissions */}
            {!isLoadingSubmissions && submissions.length === 0 && (
              <div className="p-6 text-center">
                {!selectedBounty.castHash ? (
                  <>
                    <p className="text-sm font-bold text-red-600 mb-2">⚠️ No cast hash found</p>
                    <p className="text-xs text-slate-600">This bounty was created before cast hash tracking was added.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-900 mb-2">No submissions yet</p>
                    <p className="text-xs text-slate-600">Waiting for hunters to reply...</p>
                  </>
                )}
              </div>
            )}

            {/* Submissions List */}
            {!isLoadingSubmissions && submissions.length > 0 && (
              <div className="p-3 space-y-3">
                {submissions.map((submission) => {
                  const ethAddress = submission.author.verified_addresses?.eth_addresses?.[0]
                  return (
                    <div
                      key={submission.hash}
                      className="bg-slate-50 border-2 border-slate-900 rounded p-3"
                    >
                      {/* Submission Header */}
                      <div className="flex items-start gap-2 mb-2">
                        <img
                          src={submission.author.pfp_url}
                          alt={submission.author.username}
                          className="w-10 h-10 rounded-full border-2 border-slate-900"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-black text-slate-900">
                            @{submission.author.username}
                          </p>
                          {ethAddress && (
                            <p className="text-[10px] text-slate-600 font-mono">
                              {ethAddress.substring(0, 6)}...{ethAddress.substring(38)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Submission Text */}
                      <p className="text-xs text-slate-700 mb-3 whitespace-pre-wrap">
                        {submission.text}
                      </p>

                      {/* Reward Button */}
                      {ethAddress ? (
                        <button
                          onClick={() => handleRewardHunter(ethAddress)}
                          disabled={!!completeHash}
                          className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black py-2 px-3 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] text-xs rounded transition-all duration-200 hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {completeHash ? '⏳ SENDING REWARD...' : '🏆 REWARD THIS HUNTER'}
                        </button>
                      ) : (
                        <p className="text-[10px] text-red-600 font-bold">
                          ⚠️ No verified ETH address
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
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
