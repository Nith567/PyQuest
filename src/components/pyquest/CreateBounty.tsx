"use client"

import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useNavigate } from "react-router-dom"
import { parseUnits, decodeEventLog } from "viem"
import { useNotification } from "@blockscout/app-sdk"
import { contractConfig, pyusdConfig, apiConfig } from "../../config"
import { abi } from "../../../utils/Abi"

export default function CreateBounty() {
  const { address } = useAccount()
  const navigate = useNavigate()
  const { openTxToast } = useNotification()
  const [taskDescription, setTaskDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState<"idle" | "approving" | "creating" | "posting" | "success">("idle")
  const [castUrl, setCastUrl] = useState("")

  const { writeContract: writeApprove, data: approveHash } = useWriteContract()
  const { writeContract: writeCreateBounty, data: createHash } = useWriteContract()

  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  const { isSuccess: isCreateSuccess, data: createReceipt } = useWaitForTransactionReceipt({
    hash: createHash,
  })

  // Handle approve success -> create bounty
  useEffect(() => {
    if (isApproveSuccess && step === "approving" && approveHash) {
      // Show approval notification
      openTxToast("42161", approveHash)
      handleCreateBountyCall()
    }
  }, [isApproveSuccess, step, approveHash, openTxToast])

  // Handle create success -> post to Farcaster
  useEffect(() => {
    if (isCreateSuccess && step === "creating" && createHash && createReceipt) {
      // Show bounty creation notification
      openTxToast("42161", createHash)
      postToFarcaster(createReceipt)
    }
  }, [isCreateSuccess, step, createHash, createReceipt, openTxToast])

  const postToFarcaster = async (receipt: any) => {
    setStep("posting")
    
    try {
      // Extract the real bounty ID from the BountyCreated event
      let bountyId = Date.now() // Fallback to timestamp
      
      if (receipt?.logs && receipt.logs.length > 0) {
        // Find and decode the BountyCreated event
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: abi,
              data: log.data,
              topics: log.topics,
            })
            
            if (decoded.eventName === 'BountyCreated') {
              bountyId = Number((decoded.args as any).bountyId)
              console.log('🎯 Real Bounty ID from contract event:', bountyId)
              break
            }
          } catch (e) {
            // Not the event we're looking for, continue
          }
        }
      }
      
      console.log('📝 Using Bounty ID:', bountyId)
      
      // Post to Farcaster
      const castResponse = await fetch(`${apiConfig.baseUrl}/api/post-bounty-cast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bountyId,
          taskDescription,
          amount,
          txHash: createHash,
          creatorAddress: address,
          // Note: creatorUsername can be added if you integrate Farcaster profile data
        }),
      })

      if (!castResponse.ok) {
        throw new Error('Failed to post to Farcaster')
      }

      const castData = await castResponse.json()
      setCastUrl(castData.castUrl)

      console.log('📡 Cast hash:', castData.castHash)

      // Save bounty to database with cast hash
      await fetch(`${apiConfig.baseUrl}/api/bounties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bountyId,
          creator: address,
          amount,
          taskDescription,
          txHash: createHash,
          castUrl: castData.castUrl,
          castHash: castData.castHash, // Save cast hash for fetching submissions
        }),
      })

      setStep("success")
      setIsLoading(false)
      
      // Clear form after a delay
      setTimeout(() => {
        setTaskDescription("")
        setAmount("")
      }, 1000)
      
    } catch (err) {
      console.error('Error posting to Farcaster:', err)
      setError('Bounty created but failed to post to Farcaster')
      setStep("success")
      setIsLoading(false)
    }
  }

  const handleCreateBountyCall = async () => {
    setStep("creating")
    const amountInWei = parseUnits(amount, 6)
    
    writeCreateBounty({
      address: contractConfig.address,
      abi: abi,
      functionName: "createBounty",
      args: [amountInWei, taskDescription],
    })
  }

  const handleCreateBounty = async () => {
    if (!address) {
      setError("Please connect your wallet")
      return
    }

    if (!taskDescription.trim()) {
      setError("Please enter a task description")
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid PYUSD amount")
      return
    }

    setIsLoading(true)
    setError("")
    setStep("approving")

    try {
      // Convert amount to 6 decimals (PYUSD uses 6 decimals)
      const amountInWei = parseUnits(amount, 6)

      // Step 1: Approve PYUSD token
      writeApprove({
        address: pyusdConfig.address,
        abi: [
          {
            name: "approve",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ name: "", type: "bool" }],
          },
        ],
        functionName: "approve",
        args: [contractConfig.address, amountInWei],
      })
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to create bounty")
      setIsLoading(false)
      setStep("idle")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-100 to-purple-50 p-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-500 text-white font-black text-2xl p-3 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4 text-center rounded">
        <span className="text-2xl mr-2">📝</span>
        CREATE BOUNTY
      </div>

      {/* Form Container */}
      <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-4 rounded mb-4">
        {/* Task Description */}
        <div className="mb-4">
          <label className="block text-xs font-black text-slate-900 mb-2">
            TASK DESCRIPTION
          </label>
          <textarea
            value={taskDescription}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                setTaskDescription(e.target.value)
              }
            }}
            placeholder="Describe what you need help with..."
            className="w-full h-32 p-2 text-sm text-slate-900 border-2 border-slate-900 rounded resize-none focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder:text-slate-400"
            disabled={isLoading}
          />
          <p className="text-[10px] text-slate-600 mt-1 text-right">
            {taskDescription.length}/500
          </p>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="block text-xs font-black text-slate-900 mb-2">
            REWARD AMOUNT (PYUSD)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10.00"
            step="0.01"
            min="0"
            className="w-full p-2 text-sm text-slate-900 border-2 border-slate-900 rounded focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder:text-slate-400"
            disabled={isLoading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 border-2 border-red-500 rounded text-xs font-bold text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Success Message */}
        {step === "success" && castUrl && (
          <div className="mb-4 p-2 bg-green-100 border-2 border-green-500 rounded">
            <p className="text-xs font-bold text-green-700 mb-1">
              ✅ Bounty created successfully!
            </p>
            <a
              href={castUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-purple-600 underline break-all block"
            >
              🎯 View on Warpcast
            </a>
          </div>
        )}

        {/* Status Message */}
        {step === "approving" && (
          <div className="mb-4 p-2 bg-blue-100 border-2 border-blue-500 rounded text-xs font-bold text-blue-700">
            ⏳ Step 1/3: Approving PYUSD...
          </div>
        )}
        {step === "creating" && (
          <div className="mb-4 p-2 bg-blue-100 border-2 border-blue-500 rounded text-xs font-bold text-blue-700">
            ⏳ Step 2/3: Creating bounty...
          </div>
        )}
        {step === "posting" && (
          <div className="mb-4 p-2 bg-blue-100 border-2 border-blue-500 rounded text-xs font-bold text-blue-700">
            ⏳ Step 3/3: Posting to Farcaster...
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={handleCreateBounty}
          disabled={isLoading || step !== "idle"}
          className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white font-black py-3 px-4 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        >
          {isLoading 
            ? (step === "approving" 
              ? "APPROVING PYUSD..." 
              : step === "creating" 
              ? "CREATING BOUNTY..." 
              : "POSTING TO FARCASTER...") 
            : "CREATE BOUNTY"}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-cyan-100 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 rounded">
        <p className="text-xs font-bold text-slate-700 mb-2">
          💡 How it works:
        </p>
        <ul className="text-[10px] text-slate-600 space-y-1">
          <li>• Your PYUSD will be locked in the smart contract</li>
          <li>• The bounty will be posted to Farcaster by our bot</li>
          <li>• Hunters can submit their work as replies</li>
          <li>• You review submissions and reward the winner</li>
          <li>• You can cancel and get your PYUSD back if no one completes it</li>
        </ul>
      </div>

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
