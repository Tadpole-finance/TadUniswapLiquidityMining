//SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TadTokenTest is ERC20, Ownable{
    constructor() public ERC20("Tadpole Finance", "Tad")  {

    }

    function mint(address _to, uint _amount) public onlyOwner{
        _mint(_to, _amount);
    }
}

