//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

pragma solidity ^0.6.0;

contract OwnableStorage{
    address internal _owner;
}

contract PausableStorage{
    bool internal _paused;
}

contract TadUniswapMiningStorage {
  using SafeMath for uint256;

  bool constant public isTadUniswapMining = true;
  bool public initiated = false;

  // proxy storage
  address public admin;
  address public implementation;
  
  ERC20 public LPToken;
  ERC20 public TadToken;
  
  uint public startMiningBlockNum = 0;
  uint public totalMiningBlockNum = 2400000;
  uint public endMiningBlockNum = startMiningBlockNum + totalMiningBlockNum;
  uint public tadPerBlock = 83333333333333333;
  
  uint public constant stakeInitialIndex = 1e36;
  
  uint public miningStateBlock = startMiningBlockNum;
  uint public miningStateIndex = stakeInitialIndex;
  
  mapping (address => uint) public stakeHolders;
  uint public totalStaked;

  mapping (address => uint) public stakerIndexes;
  mapping (address => uint) public stakerClaimed;
  uint public totalClaimed;

}