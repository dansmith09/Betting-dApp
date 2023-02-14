// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract Betting {
    // State variables to store market data
    string public marketTitle;
    string public marketType;
    string public selectionOneTitle;
    string public selectionTwoTitle;
    bool public takingBets;
    // State variable to store contract deployer
    address public owner;
    // Betting State
    uint256 public outcomeOneBetAmount;
    uint256 public outcomeTwoBetAmount;
    address[] public addressesThatBetOnEventOne;
    address[] public addressesThatBetOnEventTwo;
    mapping(address => uint256) public betsOnOutcomeOne;
    mapping(address => uint256) public betsOnOutcomeTwo;
    // For paying out bets and resetting contract
    address[] public paidAddresses;
    mapping(address => bool) public addressPaid;

    // Constructor to set owner of contract to contract deployer
    constructor () {
        owner = msg.sender;
    }
    // Function for owner to set market data
    function initializeMarket(
        string memory _marketTitle,
        string memory _marketType,
        string memory _selectionOneTitle,
        string memory _selectionTwoTitle) public {
            require(!takingBets, "Cannot initialize market while bets are being taken");
            require(msg.sender == owner, "Only the owner can set market data");
            require(outcomeOneBetAmount == 0 && outcomeTwoBetAmount == 0, "Cannot change market data whith bets outstanding");
            marketTitle = _marketTitle;
            marketType = _marketType;
            selectionOneTitle = _selectionOneTitle;
            selectionTwoTitle = _selectionTwoTitle;
            takingBets = true;
    }

    function betOnOutcomeOne() public payable {
        require(msg.value > 0.01 ether, "Bet amount must be greater than 0.01 ETH");
        require(takingBets, "Not currently taking bets");
        require(msg.sender != owner, "The owner cannot bet");
        outcomeOneBetAmount += msg.value;
        betsOnOutcomeOne[msg.sender] += msg.value;
        addressesThatBetOnEventOne.push(msg.sender);
    }

    function betOnOutcomeTwo() public payable {
        require(msg.value > 0.01 ether, "Bet amount must be greater than 0.01 ETH");
        require(takingBets, "Not currently taking bets");
        require(msg.sender != owner, "The owner cannot bet");
        outcomeTwoBetAmount += msg.value;
        betsOnOutcomeTwo[msg.sender] += msg.value;
        addressesThatBetOnEventTwo.push(msg.sender);
    }

    function stopTakingBets() public {
        require(msg.sender == owner, "Only the owner can stop taking bets");
        takingBets = false;
    }

    function startTakingBets() public {
        require(msg.sender == owner, "Only the owner can start taking bets");
        takingBets = true;
    }

    function determineWinner(uint256 winningOutcome) public payable {
        require(msg.sender == owner, "Only the owner can determine winner");
        require(takingBets == false, "Stop taking bets to determine winner");
        // If outcome one wins payout those who bet on it
        if(winningOutcome == 1) {
            // defines the total bet between both outcomes
            uint totalBet = outcomeOneBetAmount + outcomeTwoBetAmount;
            // loops over addressesThatBetOnEventOne
            for (uint256 i = 0; i < addressesThatBetOnEventOne.length; i++) {
                // defines the current address
                address currentAddress = addressesThatBetOnEventOne[i];
                // if address hasnt already been paid
                if(addressPaid[currentAddress] == false) {
                    // defines how much the address has bet
                    uint256 betAmount = betsOnOutcomeOne[addressesThatBetOnEventOne[i]];
                    // sends the address their bet amount plus the winnings entitled
                    (bool success, ) = currentAddress.call{value: (betAmount * totalBet) / outcomeOneBetAmount}("");
                    require(success, "Call failed");
                    // marks the address as having been paid
                    addressPaid[currentAddress] = true;
                    // Adds address to paid Addressses Array
                    paidAddresses.push(currentAddress);
                }
            }
        }
        // If outcome two wins payout those who bet on it
        if(winningOutcome == 2) {
            // defines the total bet between both outcomes
            uint totalBet = outcomeOneBetAmount + outcomeTwoBetAmount;
            // loops over addressesThatBetOnEventOne
            for (uint256 i = 0; i < addressesThatBetOnEventTwo.length; i++) {
                // defines the current address
                address currentAddress = addressesThatBetOnEventTwo[i];
                // if address hasnt already been paid
                if(addressPaid[currentAddress] == false) {
                    // defines how much the address has bet
                    uint256 betAmount = betsOnOutcomeTwo[addressesThatBetOnEventTwo[i]];
                    // sends the address their bet amount plus the winnings entitled
                    (bool success, ) = currentAddress.call{value: (betAmount * totalBet) / outcomeTwoBetAmount}("");
                    require(success, "Call failed");
                    // marks the address as having been paid
                    addressPaid[currentAddress] = true;
                    // Adds address to paid Addressses Array
                    paidAddresses.push(currentAddress);
                }
            }
        }
        // Loop over addressesThatBetOnEventOne array to delete betsOnOutcomeOne mapping
        for (uint256 i = 0; i < addressesThatBetOnEventOne.length; i++) {
            address currentAddress = addressesThatBetOnEventOne[i];
            if (betsOnOutcomeOne[currentAddress] != 0){
                delete betsOnOutcomeOne[currentAddress];
            }
        }
        // Loop over addressesThatBetOnEventTwo array to delete betsOnOutcomeTwo mapping
        for (uint256 i = 0; i < addressesThatBetOnEventTwo.length; i++) {
            address currentAddress = addressesThatBetOnEventTwo[i];
            if (betsOnOutcomeTwo[currentAddress] != 0){
                delete betsOnOutcomeTwo[currentAddress];
            }
        }
        // Loop over paidAddresses array to delete addressesPaid mapping
        for (uint256 i = 0; i < paidAddresses.length; i++) {
            address currentAddress = paidAddresses[i];
            if (addressPaid[currentAddress]){
                delete addressPaid[currentAddress];
            }
        }
        // Reset arrays
        delete addressesThatBetOnEventOne;
        delete addressesThatBetOnEventTwo;
        delete paidAddresses;
        // Reset total bet amounts
        outcomeOneBetAmount = 0;
        outcomeTwoBetAmount = 0;
        // Reset Market Info
        marketTitle = '';
        marketType = '';
        selectionOneTitle = '';
        selectionTwoTitle = '';
    }
}

// TODO: Incorporate fee
// TODO: Add Events for bets and payouts?