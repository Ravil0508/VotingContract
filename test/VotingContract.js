const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingContract", function () {
    let VotingContract;
    let votingContract;
    let votingId;
    let owner;
    let user1;
    let user2;
    let users;

    beforeEach(async function () {
        VotingContract = await ethers.getContractFactory("VotingContract");
        [owner, user1, user2, ...users] = await ethers.getSigners();
        votingContract = await VotingContract.deploy();
        const votingTransaction = await votingContract.addVoting("Elections");
        const rc = await votingTransaction.wait();

        const votingCreatedEvent = rc.events.find(event => event.event === 'VotingCreated');
        [votingId] = votingCreatedEvent.args;

    })

    describe("VotingContract", function () {

        it("Проверка владельца", async function () {
            expect(await votingContract.owner()).to.equal(owner.address)
        })

        it("Проверка уникальности idVoting", async function () {
            const voting2Transaction = await votingContract.addVoting("Elections2");
            const rc2 = await voting2Transaction.wait();
    
            const voting2CreatedEvent = rc2.events.find(event => event.event === 'VotingCreated');
            const [voting2Id] = voting2CreatedEvent.args;
    
            expect(voting2Id).to.equal(1);
        });
    });

    describe("addVoting", async function () {

        it("Только владелец может создать новое голосование", async function () {
            await expect(votingContract.connect(user1).addVoting("Elections")).to.be.revertedWith("Only owner!");
        });

        it("Проверка инициализированного состояния", async function () {

            expect(votingId).to.equal(0);
            var response = await votingContract.votingInfo(votingId);
            expect(response[0]).to.equal(0);
            expect(response[1]).to.equal("Elections");
            expect(response[3]).to.equal(true);
        });
    });


    describe("joinVoting", async function () {

        it("Нельзя присоединится к голосованию после закрытия", async function () {
            await votingContract.connect(user1).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") }); // Some user vote
            await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]); // Add 3 days
            await votingContract.finishVoting(votingId);
            await expect(votingContract.connect(user2).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") })).to.be.revertedWith("Voting is over!");
        });

        it("Нельзя присоединится к голосованию без оплаты", async function () {
            await expect(votingContract.connect(user1).joinVoting(votingId)).to.be.revertedWith("Pay 0.01 ether to participate!");
        });

        it("Нельзя присоединиться к голосованию если присоединился ранее", async function () {
            await votingContract.connect(user1).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") });
            await expect(votingContract.connect(user1).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") })).to.be.revertedWith("You joined the voting earlier");
        });
    });

    describe("vote", async function () {

        it("Голосование после закрытия", async function () {
            await votingContract.connect(user1).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") }); // Some user vote
            await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]); // Add 3 days
            await votingContract.finishVoting(votingId);
            await expect(votingContract.connect(user1).vote(votingId, user2.address)).to.be.revertedWith("Voting is over!");

        });

        it("Нельзя проголосовать не присоединившись к голосованию", async function () {
            await expect(votingContract.connect(user2).vote(votingId, user1.address)).to.be.revertedWith("You are not a voting participant! Please join!");
        });

        it("Нельзя проголосовать за не участника", async function () {
            await votingContract.connect(user1).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") });
            await expect(votingContract.connect(user1).vote(votingId, user2.address)).to.be.revertedWith("There is no such candidate on the list!");
        });

        it("Нельзя проголосовать повторно", async function () {
            await votingContract.connect(user1).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") });
            await votingContract.connect(user2).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") });
            await votingContract.connect(user1).vote(votingId, user2.address);
            await expect(votingContract.connect(user1).vote(votingId, user1.address)).to.be.revertedWith("You have already cast your vote!");
        })

        it("Проверка состояния после голосования", async function () {
            await votingContract.connect(user1).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") });
            await votingContract.connect(user2).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") });
            await votingContract.connect(user1).vote(votingId, user2.address);

            expect(votingId).to.equal(0);
            var response = await votingContract.votingInfo(votingId);
            expect(response[0]).to.equal(0);
            expect(response[1]).to.equal("Elections");
            expect(response[3]).to.equal(true);
            expect(response[4]).to.equal(user2.address);
        });

        it("Проверка корректности подсчета голосов", async function () {
            await votingContract.connect(user1).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") });
            await votingContract.connect(user2).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") });

            for (let i = 0; i < 3; i++) {
                await votingContract.connect(users[i]).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") });
                await votingContract.connect(users[i]).vote(votingId, user1.address);
            }

            for (let i = 3; i < 9; i++) {
                await votingContract.connect(users[i]).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") });
                await votingContract.connect(users[i]).vote(votingId, user2.address);
            }

            for (let i = 9; i < 12; i++) {
                await votingContract.connect(users[i]).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") });
                await votingContract.connect(users[i]).vote(votingId, users[0].address);
            }
            var response = await votingContract.votingInfo(votingId);
            expect(response[4]).to.equal(user2.address);
            var array = await votingContract.getParticipants(votingId);
            expect(array.length).to.equal(14);

        });
    });

    describe("finishVoting", async function () {

        it("Закрытие голосования раньше положенного", async function () {
            await expect(votingContract.finishVoting(votingId)).to.be.revertedWith("Less than three days have passed!");
        });

        it("Закрытие голосования по прошествии положенного срока", async function () {
            await votingContract.connect(user1).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") });
            await votingContract.connect(user2).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") });
            await votingContract.connect(user1).vote(votingId, user2.address); // Some user vote

            await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]); // Add 3 days

            var response = await votingContract.votingInfo(votingId);
            expect(response[3]).to.equal(true)  // Голосование открыто

            const leaderInitialBalance = await user2.getBalance();

            await votingContract.finishVoting(votingId);

            expect(await user2.getBalance() > leaderInitialBalance); // Деньги были успешно переведены лидеру
            var response = await votingContract.votingInfo(votingId);
            expect(await response[3]).to.equal(false);  // голосование закрыто isOpen равно false

        });

        it("Повторное закрытие голосования", async function () {
            await votingContract.connect(user1).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") }); // Some user vote
            await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]); // Add 3 days
            await votingContract.finishVoting(votingId);

            expect(votingContract.finishVoting(votingId)).to.be.revertedWith("The voting is already closed!");
        });
    });

    describe("withDrawCommission", async function() {

        it("Вывод комиссии не владельцем", async function () {
        await expect(votingContract.connect(user1).withDrawCommission()).to.be.revertedWith("Only owner!");
        });

        it("Вывод комиссии владельцем", async function () {
            const owner_initial_balance = await owner.getBalance();

            await votingContract.connect(user1).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") }); // Some user vote

            await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]); // Add 3 days
            await votingContract.finishVoting(votingId);

            await votingContract.withDrawCommission();

            expect(await owner.getBalance() > owner_initial_balance);

        });
    });

    describe("getParticipants", async function() {

        it("Вывод участников голосования", async function () {
        await votingContract.connect(user1).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") });
        await votingContract.connect(user2).joinVoting(votingId, { value: ethers.utils.parseEther("0.01") });
        var array = await votingContract.getParticipants(votingId);
        expect(await array[0]).to.equal(user1.address);
        expect(await array[1]).to.equal(user2.address);
        });
    });

});