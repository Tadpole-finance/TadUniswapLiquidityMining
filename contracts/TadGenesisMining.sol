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
  
  uint constant public totalGenesisBlockNum = 172800;
  uint constant public tadPerBlock = 1150000000000000000;

  uint public startMiningBlockNum;
  uint public endMiningBlockNum;
  
  uint public constant stakeInitialIndex = 1e36;
  
  uint public miningStateBlock = startMiningBlockNum;
  uint public miningStateIndex = stakeInitialIndex;
  
  mapping (address => uint) public stakerIndexes;
  mapping (address => uint) public stakerClaimed;
  uint public totalClaimed;
  
  event Staked(address indexed user, uint256 amount, uint256 total);
  event Unstaked(address indexed user, uint256 amount, uint256 total);
  event ClaimedTad(address indexed user, uint amount, uint total);


  constructor(uint _startMiningBlocknum, ERC20 _tad, ERC20 _ten) public{
    if(_startMiningBlocknum == 0){
      _startMiningBlocknum = block.number;
    }

    _tad.totalSupply(); //sanity check
    _ten.totalSupply(); //sanity check

    startMiningBlockNum = _startMiningBlocknum;
    endMiningBlockNum = startMiningBlockNum + totalGenesisBlockNum;
    miningStateBlock = startMiningBlockNum;
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
    
    claimTad();

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
    
    if(miningStateBlock == endMiningBlockNum){ //if miningStateBlock is already the end of program, dont update state
        return;
    }
    
    (miningStateIndex, miningStateBlock) = getMiningState(block.number);
    
  }
  
  
  function getMiningState(uint _blockNum) public view returns(uint, uint){
      
    uint blockNumber = _blockNum;
      
    if(_blockNum>endMiningBlockNum){ //if current block.number is bigger than the end of program, only update the state to endMiningBlockNum
        blockNumber = endMiningBlockNum;   
    }
      
    uint deltaBlocks = blockNumber.sub(uint(miningStateBlock));
    
    uint _miningStateIndex = miningStateIndex;
    
    if (deltaBlocks > 0) {
        uint tadAccrued = deltaBlocks.mul(tadPerBlock);
        uint ratio = tadAccrued.mul(1e18).div(totalStaked); //multiple ratio to 1e18 to prevent rounding error
        _miningStateIndex = miningStateIndex.add(ratio); //index is 1e18 precision
    } 
    
    uint _miningStateBlock = blockNumber;
    
    return (_miningStateIndex, _miningStateBlock);
    
  }
  
  function claimTad() public {
      
      updateMiningState();
      
      uint claimableTad = claimableTad(msg.sender);
      
      stakerIndexes[msg.sender] = miningStateIndex;
      
      if(claimableTad > 0){
          
          stakerClaimed[msg.sender] = stakerClaimed[msg.sender].add(claimableTad);
          totalClaimed = totalClaimed.add(claimableTad);
          TadToken.transfer(msg.sender, claimableTad);
          emit ClaimedTad(msg.sender, claimableTad, stakerClaimed[msg.sender]);
          
      }
  }
  
  function claimableTad(address _address) public view returns(uint){
      uint stakerIndex = stakerIndexes[_address];
        
        //if it's the first stake for user and the first stake for entire mining program, set stakerIndex as stakeInitialIndex
        if (stakerIndex == 0 && totalClaimed == 0) {
            stakerIndex = stakeInitialIndex;
        }
        
        //else if it's the first stake for user, set stakerIndex as current miningStateIndex
        if(stakerIndex == 0){
            stakerIndex = miningStateIndex;
        }
      
      uint deltaIndex = miningStateIndex.sub(stakerIndex);
      uint tadDelta = deltaIndex.mul(stakeHolders[_address]).div(1e18);
      
      return tadDelta;
          
  }
    
}
