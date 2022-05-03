// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract VotingContract {

  address payable public owner;
  uint private commissionCounter;
  mapping(uint => Voting) private voting; 
  uint private votingNumber;
  event VotingCreated(uint _votingId);

      struct Voter{
          bool isVoted;
      }

      struct Candidate{       
        uint countVote;
        bool isCandidate;
      }

      struct Voting{

        string nameVoting;  
        uint endDate;
        mapping(address => Candidate) candidates;
        mapping(address => Voter) voters;
        bool isOpen;
        uint countVote; 
        address winner;
        uint numberVoters;
    }

  constructor() {
    owner = payable(msg.sender);
  }

    function addCandidate (uint votingId, address candidate) public {
        require(msg.sender == owner, "Only owner!");
        voting[votingId].candidates[candidate].isCandidate = true;
        voting[votingId].candidates[candidate].countVote = 0;
    }

    function addVoting(string memory _name) public returns(uint _id){
      require(msg.sender == owner, "Only owner!");
      _id = votingNumber;
      Voting storage votingObj = voting[_id];     
      votingObj.nameVoting = _name;
      votingObj.endDate = block.timestamp + 3 days;
      votingObj.isOpen = true;
      votingObj.countVote = 0;
      votingObj.numberVoters = 0;
      votingNumber++;
      emit VotingCreated(_id);
    }

    function vote(uint _idVoting, address _elected) public payable {
      require(voting[_idVoting].isOpen, "Voting is over!");
      require(voting[_idVoting].candidates[_elected].isCandidate, "Is not a candidate!");
      require(!voting[_idVoting].voters[msg.sender].isVoted, "You have already cast your vote!");
      require(msg.value == 0.01 ether, "Pay 0.01 ether to participate!");

      voting[_idVoting].voters[msg.sender].isVoted = true;
      voting[_idVoting].candidates[_elected].countVote++;
      voting[_idVoting].numberVoters++;

      if(voting[_idVoting].candidates[_elected].countVote > voting[_idVoting].countVote){
        voting[_idVoting].countVote = voting[_idVoting].candidates[_elected].countVote;
        voting[_idVoting].winner = _elected;
      }
    }
    function finish(uint _idVoting) public {
      require(voting[_idVoting].isOpen, "The voting is already closed!");
      require(voting[_idVoting].endDate < block.timestamp, "Less than three days have passed!");
      voting[_idVoting].isOpen = false;
      payable(voting[_idVoting].winner).transfer((address(this).balance - commissionCounter));
    }

    function withDrawCommission() public {
      require(msg.sender == owner, "Only owner!");
      owner.transfer(commissionCounter);
      commissionCounter = 0;
    }

    function votingInfo(uint _idVoting) public view returns(string memory name, 
                                                    uint endDate, bool status_voting, 
                                                    address leader, uint numberVoters) {                                                
      return (voting[_idVoting].nameVoting, voting[_idVoting].endDate,
             voting[_idVoting].isOpen, voting[_idVoting].winner, voting[_idVoting].numberVoters);
    }
}
