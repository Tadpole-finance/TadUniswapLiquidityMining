//SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract TadGenesisMining {
  using SafeMath for uint256;
  
  ERC20 public TenToken;
  ERC20 public TadToken;
  
  mapping (address => uint) public stakeHolders;
  
  uint public totalStaked;
  
  uint constant public startMiningBlockNum = 0; //dev env
  uint constant public endMiningBlockNum = startMiningBlockNum+ 172800;
  uint constant public tadPerBlock = 1150000000000000000;
  
  uint public miningStateBlock = startMiningBlockNum;
  uint public miningStateIndex;
  
  mapping (address => uint) public stakerIndexes;
  mapping (address => uint) public tadClaimed;
  
  event Staked(address indexed user, uint256 amount, uint256 total);
  event Unstaked(address indexed user, uint256 amount, uint256 total);
  event ClaimedTad(address indexed user, uint amount, uint total);

  constructor(ERC20 _tad, ERC20 _ten) public{
    TadToken = _tad;
    TenToken = _ten;
  }

  function stake(uint256 _amount) public{
      
      createStake(msg.sender, _amount);
  }
  
  
  function createStake(
    address _address,
    uint256 _amount
  )
    internal
  {
      
    require(
      TenToken.transferFrom(_address, address(this), _amount),
      "Stake required");

    stakeHolders[_address] = stakeHolders[_address].add(_amount);
    totalStaked = totalStaked.add(_amount);
    
    updateMiningState();

    emit Staked(
      _address,
      _amount,
      stakeHolders[_address]);
  }
  
  
  function unstake(uint256 _amount) public{
    withdrawStake(msg.sender, _amount);
      
  }

  function withdrawStake(
    address _address,
    uint256 _amount
  )
    internal
  {
    
    claimTad();

    require(
      stakeHolders[_address] >= _amount,
      "The unstake amount is bigger than the current stake");

    require(
      TenToken.transfer(msg.sender, _amount),
      "Unable to withdraw stake");

    stakeHolders[_address] = stakeHolders[_address].sub(_amount);
    totalStaked = totalStaked.sub(_amount);
    
    updateMiningState();

    emit Unstaked(
      _address,
      _amount,
      stakeHolders[_address]);
  }
  

  
  
  function updateMiningState() internal{
      
    uint blockNumber = block.number;
      
    if(block.number>endMiningBlockNum){
        blockNumber = endMiningBlockNum;   
    }
      
    uint deltaBlocks = blockNumber.sub(uint(miningStateBlock));
    
    if (deltaBlocks > 0) {
        uint tadAccrued = deltaBlocks.mul(tadPerBlock);
        uint ratio = tadAccrued.mul(1e18).div(totalStaked); //multiple ratio to 1e18 to prevent rounding error
        miningStateIndex = miningStateIndex.add(ratio); //index is 1e18 precision
    } 
    
    miningStateBlock = blockNumber;
    
  }
  
  function claimTad() public {
      
      uint claimableTad = claimableTad(msg.sender);
      
      stakerIndexes[msg.sender] = miningStateIndex;
      
      if(claimableTad > 0){
          
          tadClaimed[msg.sender] = tadClaimed[msg.sender].add(claimableTad);
          TadToken.transfer(msg.sender, claimableTad);
          emit ClaimedTad(msg.sender, claimableTad, tadClaimed[msg.sender]);
          
      }
  }
  
  function claimableTad(address _address) public view returns(uint){
      uint stakerIndex = stakerIndexes[_address];
      
      uint deltaIndex = miningStateIndex.sub(stakerIndex);
      uint tadDelta = deltaIndex.mul(stakeHolders[_address]).div(1e18);
      
      return tadDelta;
          
  }
    
}
