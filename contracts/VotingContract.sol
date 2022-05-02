// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract VotingContract {

  address payable public owner;
  uint private commissionCounter;
  mapping(uint => Voting) private voting;
  uint private votingNumber;
  event VotingCreated(uint256 _votingId);

      struct Voter {
        bool isVoted;
        bool isParticipant;
        uint votingResult;
      }

      struct Voting{
        uint id;
        string nameVoting;
        uint endDate;
        mapping (address => Voter) voters;
        address[] listParticipants;
        bool isOpen; //закрыто ли голосование
       // uint countOfParticipants;
        uint countVote;//хранит макс количество голосов на текущий момент
        address winner;
    }

  constructor() {
    owner = payable(msg.sender);
  }

      //функция которая добавляет голосование
    function addVoting(string memory _name) public {
      require(msg.sender == owner, "Only owner!");
      uint _id = votingNumber;
      Voting storage voting = voting[_id];
      voting.id = _id;      
      voting.nameVoting = _name;
      voting.endDate = block.timestamp + 3 days;
      voting.isOpen = true;
      voting.countVote = 0;
      emit VotingCreated(_id);
      votingNumber++;
    }

    //Функция присоединения к голосованию без самого голосования, если госование закрыто надобно как то не допускать в него голосующих
    function joinVoting(uint _voitingId) public payable {
      require(voting[_voitingId].isOpen, "Voting is over!");
      require(!voting[_voitingId].voters[msg.sender].isParticipant, "You joined the voting earlier");
      require(msg.value == 0.01 ether, "Pay 0.01 ether to participate!");
      voting[_voitingId].voters[msg.sender].isParticipant = true;
      voting[_voitingId].voters[msg.sender].votingResult = 0;
      voting[_voitingId].listParticipants.push(msg.sender);
      commissionCounter += 0.001 ether;
    }

    //Функция голосования за кандидата надо сделать так чтобы исВотед нельзя было менять через эфер валлет, тоесть сделать приватным
    //если голосование закрыто то надобно запретить голосование
    //запретить голосовать за себя
    function vote(uint _idVoting, address _elected) public {
      require(voting[_idVoting].isOpen, "Voting is over!");
      require(voting[_idVoting].voters[msg.sender].isParticipant, "You are not a voting participant! Please join!");
      require(voting[_idVoting].voters[_elected].isParticipant, "There is no such candidate on the list!");
      require(!voting[_idVoting].voters[msg.sender].isVoted, "You have already cast your vote!");
      voting[_idVoting].voters[msg.sender].isVoted = true;
      voting[_idVoting].voters[_elected].votingResult++;
      //установка указателя на текущего лидера, обязательно протестировать!!!!
      if(voting[_idVoting].voters[_elected].votingResult > voting[_idVoting].countVote){
        voting[_idVoting].countVote = voting[_idVoting].voters[_elected].votingResult;
        voting[_idVoting].winner = _elected;
      }
    }
    //Закрыть голосование, пока закрываем просто при вызове этой функции а не через три дня
    // надобно все что нужно сделать приватным
    function finishVoting(uint _idVoting) public {
      require(voting[_idVoting].isOpen, "The voting is already closed!");
      require(voting[_idVoting].endDate < block.timestamp, "Less than three days have passed!");
      voting[_idVoting].isOpen = false;
      payable(voting[_idVoting].winner).transfer((address(this).balance - commissionCounter));
    }
    //Вывод комиссии
    function withDrawCommission() public {
      require(msg.sender == owner, "Only owner!");
      owner.transfer(commissionCounter);
      commissionCounter = 0;
    }

    function votingInfo(uint _idVoting) public view returns(uint id, string memory name, 
                                                    uint endDate, bool status_voting, 
                                                    address leader) {                                                
      return (voting[_idVoting].id, voting[_idVoting].nameVoting, voting[_idVoting].endDate, voting[_idVoting].isOpen, voting[_idVoting].winner);
    }

    //Возвращает список участников голосования
    function getParticipants(uint _idVoting) public view returns(address[] memory list_participants) {
     return voting[_idVoting].listParticipants;
    }
}
