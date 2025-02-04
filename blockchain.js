const crypto = require("crypto");

class Block {
  constructor(index, timestamp, data, prevHash = "", difficulty = 2) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.prevHash = prevHash;
    this.nonce = 0;
    this.difficulty = difficulty;
    this.hash = "";
  }

  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
          this.timestamp +
          JSON.stringify(this.data) +
          this.prevHash +
          this.nonce
      )
      .digest("hex");
  }

  mineBlock() {
    do {
      this.nonce++;
      this.hash = this.calculateHash();
    } while (
      this.hash.substring(0, this.difficulty) !==
      Array(this.difficulty + 1).join("0")
    );
  }
}

class Blockchain {
  constructor(difficulty = 2) {
    this.chain = [this.createFirstBlock()];
    this.difficulty = difficulty;
  }

  createFirstBlock() {
    return new Block(
      0,
      new Date().toLocaleString(),
      "First Block",
      "0",
      this.difficulty
    );
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlockToChain(newBlock) {
    newBlock.prevHash = this.getLatestBlock().hash;
    newBlock.mineBlock(); // Mine the block before adding it to the chain
    this.chain.push(newBlock);
  }

  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const prevBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) return false;
      if (currentBlock.prevHash !== prevBlock.hash) return false;
    }
    return true;
  }
}

const ticketChain = new Blockchain(3);

function generateTicketBlock(
  name,
  email,
  ticketType,
  transactionID,
  phoneNo,
  ticketID
) {
  const ticketData = {
    name,
    email,
    ticketType,
    transactionID,
    phoneNo,
    ticketID,
  };
  const newBlock = new Block(
    ticketChain.chain.length,
    new Date().toLocaleString(),
    ticketData,
    ticketChain.getLatestBlock().hash,
    ticketChain.difficulty
  );

  console.log(`Mining block ${newBlock.index}...`);
  ticketChain.addBlockToChain(newBlock);
  console.log(`Block ${newBlock.index} mined: ${newBlock.hash}`);
}

generateTicketBlock(
  "Naresh",
  "naresh@example.com",
  "VIP",
  "123456",
  "9876543210",
  "TICKET123"
);
generateTicketBlock(
  "Bharath",
  "bharath@example.com",
  "Regular",
  "654321",
  "9123456789",
  "TICKET456"
);

console.log("\nBlockchain:", JSON.stringify(ticketChain, null, 4));
console.log("\nBlockchain valid:", ticketChain.isValid());

