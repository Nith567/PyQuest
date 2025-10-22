// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CastBounties-PYQuest
 * @dev Decentralized bounty board for Farcaster with PYUSD rewards
 * @notice Owners create bounties → Bot posts to Farcaster → Hunters submit → Owners reward on-chain
 */
contract CastBounties is ReentrancyGuard {
    IERC20 public immutable pyusd;
    
    struct Bounty {
        address owner;
        uint256 amount;
        string taskDescription;
        address hunter;
        bool isCompleted;
        bool isCancelled;
        uint256 createdAt;
    }
    
    mapping(uint256 => Bounty) public bounties;
    uint256 public bountyCount;
    
    mapping(address => uint256[]) public ownerBounties;
    mapping(address => uint256) public hunterCompletedCount;
    mapping(address => uint256) public hunterTotalEarned;
    
    event BountyCreated(
        uint256 indexed bountyId, 
        address indexed owner, 
        uint256 amount, 
        string taskDescription
    );
    
    event BountyCompleted(
        uint256 indexed bountyId, 
        address indexed hunter, 
        uint256 amount
    );
    
    event BountyCancelled(
        uint256 indexed bountyId, 
        address indexed owner, 
        uint256 refundAmount
    );
    
    constructor(address _pyusdAddress) {
        pyusd = IERC20(_pyusdAddress);
    }
    
    /**
     * @dev Create a new bounty and lock PYUSD funds
     * @param amount Amount of PYUSD to reward (6 decimals for PYUSD)
     * @param taskDescription Clear description of the task
     * @return bountyId The ID of the created bounty
     * 
     * @notice Requires prior PYUSD approval for this contract
     * @notice Bot will automatically post this bounty to Farcaster after creation
     */
    function createBounty(
        uint256 amount,
        string calldata taskDescription
    ) external nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(taskDescription).length > 0, "Task description required");
        require(bytes(taskDescription).length <= 500, "Description too long");
        
        require(
            pyusd.transferFrom(msg.sender, address(this), amount),
            "PYUSD transfer failed - check approval"
        );
        
        uint256 bountyId = bountyCount++;
        
        bounties[bountyId] = Bounty({
            owner: msg.sender,
            amount: amount,
            taskDescription: taskDescription,
            hunter: address(0),
            isCompleted: false,
            isCancelled: false,
            createdAt: block.timestamp
        });
        
        ownerBounties[msg.sender].push(bountyId);
        
        emit BountyCreated(bountyId, msg.sender, amount, taskDescription);
        
        return bountyId;
    }
    
    /**
     * @dev Complete a bounty and release payment to hunter
     * @param bountyId ID of the bounty to complete
     * @param hunter Farcaster-verified wallet address of the winning hunter
     * 
     * @notice Only the bounty owner can complete their bounty
     * @notice Updates leaderboard stats for the hunter
     */
    function completeBounty(
        uint256 bountyId, 
        address hunter
    ) external nonReentrant {
        Bounty storage bounty = bounties[bountyId];
        
        require(msg.sender == bounty.owner, "Only owner can complete bounty");
        require(!bounty.isCompleted, "Bounty already completed");
        require(!bounty.isCancelled, "Bounty is cancelled");
        require(hunter != address(0), "Invalid hunter address");
        require(hunter != bounty.owner, "Owner cannot be the hunter");
        
        bounty.isCompleted = true;
        bounty.hunter = hunter;
        
        hunterCompletedCount[hunter]++;
        hunterTotalEarned[hunter] += bounty.amount;
        
        require(
            pyusd.transfer(hunter, bounty.amount),
            "PYUSD transfer to hunter failed"
        );
        
        emit BountyCompleted(bountyId, hunter, bounty.amount);
    }
    
    /**
     * @dev Cancel an active bounty and refund the owner
     * @param bountyId ID of the bounty to cancel
     * 
     * @notice Can only cancel bounties that are not completed
     * @notice Refunds full PYUSD amount back to owner
     */
    function cancelBounty(uint256 bountyId) external nonReentrant {
        Bounty storage bounty = bounties[bountyId];
        
        require(msg.sender == bounty.owner, "Only owner can cancel bounty");
        require(!bounty.isCompleted, "Cannot cancel completed bounty");
        require(!bounty.isCancelled, "Bounty already cancelled");
        
        bounty.isCancelled = true;
        
        require(
            pyusd.transfer(bounty.owner, bounty.amount),
            "PYUSD refund failed"
        );
        
        emit BountyCancelled(bountyId, bounty.owner, bounty.amount);
    }
    

    
    /**
     * @dev Get detailed information about a specific bounty
     * @param bountyId ID of the bounty
     * @return owner Address of the bounty creator
     * @return amount PYUSD reward amount
     * @return taskDescription Description of the task
     * @return hunter Address of the hunter (if completed)
     * @return isCompleted Whether bounty is completed
     * @return isCancelled Whether bounty is cancelled
     * @return createdAt Timestamp of bounty creation
     */
    function getBounty(uint256 bountyId) external view returns (
        address owner,
        uint256 amount,
        string memory taskDescription,
        address hunter,
        bool isCompleted,
        bool isCancelled,
        uint256 createdAt
    ) {
        require(bountyId < bountyCount, "Bounty does not exist");
        Bounty memory bounty = bounties[bountyId];
        return (
            bounty.owner,
            bounty.amount,
            bounty.taskDescription,
            bounty.hunter,
            bounty.isCompleted,
            bounty.isCancelled,
            bounty.createdAt
        );
    }
    
    /**
     * @dev Get leaderboard stats for a hunter
     * @param hunter Address of the hunter
     * @return completedCount Number of bounties completed
     * @return totalEarned Total PYUSD earned across all bounties
     */
    function getHunterStats(address hunter) external view returns (
        uint256 completedCount,
        uint256 totalEarned
    ) {
        return (hunterCompletedCount[hunter], hunterTotalEarned[hunter]);
    }
    
    /**
     * @dev Get all bounty IDs created by a specific owner
     * @param owner Address of the bounty creator
     * @return Array of bounty IDs
     */
    function getOwnerBounties(address owner) external view returns (uint256[] memory) {
        return ownerBounties[owner];
    }
    
    /**
     * @dev Get total number of bounties ever created
     * @return Total bounty count
     */
    function getTotalBounties() external view returns (uint256) {
        return bountyCount;
    }
    
    /**
     * @dev Get top hunters by completed count (for leaderboard)
     * @param limit Maximum number of hunters to return
     * @return hunters Array of hunter addresses
     * @return counts Array of completed bounty counts
     * @return earnings Array of total PYUSD earned
     * 
     * @notice This is a gas-intensive function, use cautiously
     * @notice Consider using Blockscout API for production leaderboard
     */
    function getTopHunters(uint256 limit) external view returns (
        address[] memory hunters,
        uint256[] memory counts,
        uint256[] memory earnings
    ) {
        require(limit > 0 && limit <= 100, "Limit must be between 1 and 100");
        
        // For hackathon: Use Blockscout API to index events off-chain
        // This function exists for demo purposes but should not be called on-chain
        
        hunters = new address[](limit);
        counts = new uint256[](limit);
        earnings = new uint256[](limit);
        
        return (hunters, counts, earnings);
    }
}