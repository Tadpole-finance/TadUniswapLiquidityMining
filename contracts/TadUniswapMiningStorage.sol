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

  bool constant public isTadGenesisMining = true;
  bool public initiated = false;

  // proxy storage
  address public admin;
  address public implementation;
  
  ERC20 public TenToken;
  ERC20 public TadToken;
  
  uint public startMiningBlockNum = 0;
  uint public totalGenesisBlockNum = 172800;
  uint public endMiningBlockNum = startMiningBlockNum + totalGenesisBlockNum;
  uint public tadPerBlock = 1150000000000000000;
  
  uint public constant stakeInitialIndex = 1e36;
  
  uint public miningStateBlock = startMiningBlockNum;
  uint public miningStateIndex = stakeInitialIndex;
  
  mapping (address => uint) public stakeHolders;
  uint public totalStaked;

  mapping (address => uint) public stakerIndexes;
  mapping (address => uint) public stakerClaimed;
  uint public totalClaimed;

}