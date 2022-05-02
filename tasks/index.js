const deployedContractAddr = "0x4102Ead442cD689597C4DB07506decd6A338eF6B";

task("deploy", "Развертывает контракт в сети").setAction(async () => {
    const [deployer] = await ethers.getSigners();

    console.log("Развертывание контрактов с учетной записью:", deployer.address);
    console.log("Баланс счета:", (await deployer.getBalance()).toString());

    const VotingContract = await ethers.getContractFactory("VotingContract");
    const votingContract = await VotingContract.deploy();

    console.log(`Voting service address: ${votingContract.address}`,);
});

task("addVoting", "Creates a new voting")
    .addParam("name", "name of the vote")
    .setAction(async (args) => {
    const VotingContract = await ethers.getContractFactory("VotingContract");
    const votingContract = await VotingContract.attach(deployedContractAddr);
    const votingTransaction = await votingContract.addVoting(args['name']);
    const rc = await votingTransaction.wait();

    const votingCreatedEvent = rc.events.find(event => event.event === 'VotingCreated');
    const [_id] = votingCreatedEvent.args;

    console.log(`Your voting id: ${_id}`);
});

task("withDrawCommission", "Withdraws commission").setAction(async () => {
    const VotingContract = await ethers.getContractFactory("VotingContract");
    const votingContract = await VotingContract.attach(deployedContractAddr);
    const transaction = await votingContract.withDrawCommission();
    await transaction.wait();
    console.log('Commission successfully withdrawed');
});

task("joinVoting", "Join the voting")
    .addParam("votingId", "Voting to vote id")
    .setAction(async (args) => {
        const VotingContract = await ethers.getContractFactory("VotingContract");
        const votingContract = await VotingContract.attach(deployedContractAddr);
        const transaction = await votingContract.vote(args['votingId'], { value: ethers.utils.parseEther("0.01") });
        await transaction.wait();
        console.log(`Successfully joined`);
    });

task("vote", "Vote to a specific voting")
    .addParam("votingId", "Voting to vote id")
    .addParam("elected", "Address of candidate to vote")
    .setAction(async (args) => {
        const VotingContract = await ethers.getContractFactory("VotingContract");
        const votingContract = await VotingContract.attach(deployedContractAddr);
        const transaction = await votingContract.vote(args['votingId'], args['elected']);
        await transaction.wait();
        console.log(`Successfully voted`);
    });


task("finishVoting", "Vote to the specific voting")
    .addParam("votingId", "Voting to vote id")
    .setAction(async (args) => {
        const VotingContract = await ethers.getContractFactory("VotingContract");
        const votingContract = await VotingContract.attach(deployedContractAddr);
        const transaction = await votingContract.finishVoting(args['votingId']);
        await transaction.wait();
        console.log('Successfully closed');
    });

task("getParticipants", "Shows the list of voting participants")
    .addParam("votingId", "Voting to vote id")
    .setAction(async (args) => {
        const VotingContract = await ethers.getContractFactory("VotingContract");
        const votingContract = await VotingContract.attach(deployedContractAddr);
        const array = await votingContract.getParticipants(args['votingId']);
        console.log(`List participants: ${array}`);
    });


task("votingInfo", "Shows the information of a specific voting")
    .addParam("votingId", "Voting to vote id")
    .setAction(async (args) => {
        const VotingContract = await ethers.getContractFactory("VotingContract");
        const votingContract = await VotingContract.attach(deployedContractAddr);
        const response = await votingContract.votingInfo(args['votingId']);

        const nameVote = response[1];
        const endDate = new Date(response[2] * 1000);
        const isOpen = response[3];
        const leader = response[4];

        console.log(`Voting info:\nname of the vote: ${response}\nDate end: ${endDate}\nIs open: ${isOpen}\nLeader: ${leader}`);
    });