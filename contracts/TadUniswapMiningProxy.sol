//SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./TadUniswapMining.sol";
import "./TadUniswapMiningStorage.sol";

contract TadUniswapMiningProxy is OwnableStorage, PausableStorage, TadUniswapMiningStorage {

    event NewImplementation(address oldImplementation, address newImplementation);

    event NewAdmin(address oldAdmin, address newAdmin);

    constructor(TadUniswapMining newImplementation) public {

        admin = msg.sender;
        _owner = msg.sender;

        require(newImplementation.isTadUniswapMining() == true, "invalid implementation");
        implementation = address(newImplementation);

        emit NewImplementation(address(0), implementation);
    }

    /*** Admin Functions ***/
    function _setImplementation(TadUniswapMining  newImplementation) public {

        require(msg.sender==admin, "UNAUTHORIZED");

        require(newImplementation.isTadUniswapMining() == true, "invalid implementation");

        address oldImplementation = implementation;

        implementation = address(newImplementation);

        emit NewImplementation(oldImplementation, implementation);

    }


    /**
      * @notice Transfer of admin rights
      * @dev Admin function to change admin
      * @param newAdmin New admin.
      */
    function _setAdmin(address newAdmin) public {
        // Check caller = admin
        require(msg.sender==admin, "UNAUTHORIZED");

        // Save current value, if any, for inclusion in log
        address oldAdmin = admin;

        admin = newAdmin;

        emit NewAdmin(oldAdmin, newAdmin);

    }

    /**
     * @dev Delegates execution to an implementation contract.
     * It returns to the external caller whatever the implementation returns
     * or forwards reverts.
     */
    fallback() external {
        // delegate all other functions to current implementation
        (bool success, ) = implementation.delegatecall(msg.data);

        assembly {
              let free_mem_ptr := mload(0x40)
              returndatacopy(free_mem_ptr, 0, returndatasize())

              switch success
              case 0 { revert(free_mem_ptr, returndatasize()) }
              default { return(free_mem_ptr, returndatasize()) }
        }
    }
}
