//SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./TadUniswapMiningStorage.sol";


contract TadUniswapMining is Ownable, Pausable, TadUniswapMiningStorage {
  
  event Staked(address indexed user, uint256 amount, uint256 total);
  event Unstaked(address indexed user, uint256 amount, uint256 total);
  event ClaimedTad(address indexed user, uint amount, uint total);

  function initiate(uint _startMiningBlocknum, uint _totalMiningBlockNum, uint _tadPerBlock, ERC20 _tad, ERC20 _lp) public onlyOwner{
    require(initiated==false, "contract is already initiated");
    initiated = true;

    require(_totalMiningBlockNum >= 100, "_totalMiningBlockNum is too small");

    if(_startMiningBlocknum == 0){
      _startMiningBlocknum = block.number;
    }

    _tad.totalSupply(); //sanity check
    _lp.totalSupply(); //sanity check

    startMiningBlockNum = _startMiningBlocknum;
    totalMiningBlockNum = _totalMiningBlockNum;
    endMiningBlockNum = startMiningBlockNum + totalMiningBlockNum;
    miningStateBlock = startMiningBlockNum;
    tadPerBlock = _tadPerBlock;
    TadToken = _tad;
    LPToken = _lp;

  }

  // @notice stake some LP tokens
  // @param _amount some amount of LP tokens, requires enought allowence from LP token smart contract
  function stake(uint256 _amount) public whenNotPaused{
      
      createStake(msg.sender, _amount);
  }
  
  // @notice internal function for staking
  function createStake(
    address _address,
    uint256 _amount
  )
    internal
  {

    claimTad();
    
    require(block.number<endMiningBlockNum, "staking period has ended");
      
    require(
      LPToken.transferFrom(_address, address(this), _amount),
      "Stake required");

    stakeHolders[_address] = stakeHolders[_address].add(_amount);


    totalStaked = totalStaked.add(_amount);
    

    emit Staked(
      _address,
      _amount,
      stakeHolders[_address]);
  }
  
  // @notice unstake LP token
  // @param _amount if 0, unstake all LP token available
  function unstake(uint256 _amount) public whenNotPaused{
  
    if(_amount==0){
      _amount = stakeHolders[msg.sender];
    }

    if(_amount == 0){ // if staking balance == 0, do nothing
      return;
    }

    withdrawStake(msg.sender, _amount);
      
  }
  
  // @notice internal function for unstaking
  function withdrawStake(
    address _address,
    uint256 _amount
  )
    internal
  {

    claimTad();

    if(_amount > stakeHolders[_address]){ //if amount is larger than owned
      _amount = stakeHolders[_address];
    }

    require(
      LPToken.transfer(_address, _amount),
      "Unable to withdraw stake");

    stakeHolders[_address] = stakeHolders[_address].sub(_amount);
    totalStaked = totalStaked.sub(_amount);

    updateMiningState();

    emit Unstaked(
      _address,
      _amount,
      stakeHolders[_address]);
  }
  
  // @notice internal function for updating mining state
  function updateMiningState() internal{
    
    if(miningStateBlock == endMiningBlockNum){ //if miningStateBlock is already the end of program, dont update state
        return;
    }
    
    (miningStateIndex, miningStateBlock) = getMiningState(block.number);
    
  }
  
  // @notice calculate current mining state
  function getMiningState(uint _blockNum) public view returns(uint, uint){

    require(_blockNum >= miningStateBlock, "_blockNum must be >= miningStateBlock");
      
    uint blockNumber = _blockNum;
      
    if(_blockNum>endMiningBlockNum){ //if current block.number is bigger than the end of program, only update the state to endMiningBlockNum
        blockNumber = endMiningBlockNum;   
    }
      
    uint deltaBlocks = blockNumber.sub(miningStateBlock);
    
    uint _miningStateBlock = miningStateBlock;
    uint _miningStateIndex = miningStateIndex;
    
    if (deltaBlocks > 0 && totalStaked > 0) {
        uint tadAccrued = deltaBlocks.mul(tadPerBlock);
        uint ratio = tadAccrued.mul(1e18).div(totalStaked); //multiple ratio to 1e18 to prevent rounding error
        _miningStateIndex = miningStateIndex.add(ratio); //index is 1e18 precision
        _miningStateBlock = blockNumber;
    } 
    
    return (_miningStateIndex, _miningStateBlock);
    
  }
  
  // @notice claim TAD based on current state 
  function claimTad() public whenNotPaused {
      
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
  
  // @notice calculate claimable tad based on current state
  function claimableTad(address _address) public view returns(uint){
      uint stakerIndex = stakerIndexes[_address];
        
        // if it's the first stake for user and the first stake for entire mining program, set stakerIndex as stakeInitialIndex
        if (stakerIndex == 0 && totalStaked == 0) {
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

    // @notice test function
    function doNothing() public{
    }

    /*======== admin functions =========*/

    // @notice admin function to pause the contract
    function pause() public onlyOwner{
      _pause();
    }

    // @notice admin function to unpause the contract
    function unpause() public onlyOwner{
      _unpause();
    }

    // @notice admin function to send TAD to external address, for emergency use
    function sendTad(address _to, uint _amount) public onlyOwner{
      TadToken.transfer(_to, _amount);
    }
    
}
