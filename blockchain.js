const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");

const db = new sqlite3.Database("blockchain.db", (err) => {
  if (err) console.error("Error opening DB:", err);
  else console.log("Connected to DB");
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS blocks (
        blockIndex INTEGER PRIMARY KEY, 
        timestamp TEXT, 
        data TEXT, 
        prevHash TEXT, 
        hash TEXT, 
        nonce INTEGER, 
        difficulty INTEGER
    )`);
});

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
      this.hash.substring(0, this.difficulty) !== "0".repeat(this.difficulty)
    );
  }
}

class Blockchain {
  constructor(difficulty = 2) {
    this.db = db;
    this.difficulty = difficulty;
    this.initDB();
  }

  initDB() {
    this.db.run(
      `CREATE TABLE IF NOT EXISTS blocks (
        blockIndex INTEGER PRIMARY KEY, 
        timestamp TEXT, 
        data TEXT, 
        prevHash TEXT, 
        hash TEXT, 
        nonce INTEGER, 
        difficulty INTEGER
    )`,
      (err) => {
        if (err) {
          console.error("Error creating table", err);
        } else {
          console.log("Table 'blocks' is ready");
          this.db.get("SELECT COUNT(*) AS count FROM blocks", (err, row) => {
            if (!err && row.count === 0) {
              this.createFirstBlock();
            }
          });
        }
      }
    );
  }

  async createFirstBlock() {
    const firstBlock = new Block(
      0,
      new Date().toISOString(),
      "First Block",
      "0",
      this.difficulty
    );
    firstBlock.mineBlock();
    await this.addBlockToDB(firstBlock);
  }

  getLatestBlock() {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT * FROM blocks ORDER BY blockIndex DESC LIMIT 1",
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async addBlockToChain(newBlock) {
    try {
      const latestBlock = await this.getLatestBlock();
      newBlock.index = latestBlock ? latestBlock.blockIndex + 1 : 0;
      newBlock.prevHash = latestBlock ? latestBlock.hash : "0";
      newBlock.mineBlock();
      await this.addBlockToDB(newBlock);
    } catch (err) {
      console.error("Error adding block to chain:", err);
    }
  }

  async addBlockToDB(block) {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT blockIndex FROM blocks WHERE blockIndex = ?",
        [block.index],
        (err, row) => {
          if (row) {
            console.log(`Block ${block.index} already exists, skipping.`);
            return resolve();
          }
          this.db.run(
            `INSERT INTO blocks (blockIndex, timestamp, data, prevHash, hash, nonce, difficulty)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              block.index,
              block.timestamp,
              JSON.stringify(block.data),
              block.prevHash,
              block.hash,
              block.nonce,
              block.difficulty,
            ],
            (err) => {
              if (err) {
                console.error("Failed to insert block", err);
                reject(err);
              } else {
                console.log(`Block ${block.index} stored in DB`);
                resolve();
              }
            }
          );
        }
      );
    });
  }

  isValid() {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM blocks ORDER BY blockIndex ASC",
        (err, rows) => {
          if (err) {
            console.error(err);
            return reject(false);
          }

          for (let i = 1; i < rows.length; i++) {
            const currentBlock = rows[i];
            const prevBlock = rows[i - 1];

            const calculatedHash = crypto
              .createHash("sha256")
              .update(
                currentBlock.blockIndex +
                  currentBlock.timestamp +
                  currentBlock.data +
                  currentBlock.prevHash +
                  currentBlock.nonce
              )
              .digest("hex");

            if (
              currentBlock.hash !== calculatedHash ||
              currentBlock.prevHash !== prevBlock.hash
            ) {
              return resolve(false);
            }
          }
          resolve(true);
        }
      );
    });
  }
}

const ticketChain = new Blockchain(3);

async function generateTicketBlock(
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

  try {
    const latestBlock = await ticketChain.getLatestBlock();
    const newBlock = new Block(
      latestBlock ? latestBlock.blockIndex + 1 : 0,
      new Date().toISOString(),
      ticketData,
      latestBlock ? latestBlock.hash : "0",
      ticketChain.difficulty
    );

    console.log(`Mining block ${newBlock.index}...`);
    await ticketChain.addBlockToChain(newBlock);
  } catch (err) {
    console.error("Error generating ticket block:", err);
  }
}

// (async function () {
//   await generateTicketBlock(
//     "Naresh",
//     "naresh@example.com",
//     "VIP",
//     "123456",
//     "9876543210",
//     "TICKET123"
//   );

//   console.log("\nBlockchain:", JSON.stringify(ticketChain, null, 4));
//   const valid = await ticketChain.isValid();
//   console.log("\nBlockchain valid:", valid);
// })();

function printAllBlocks() {
  db.all("SELECT * FROM blocks ORDER BY blockIndex ASC", (err, rows) => {
    if (err) {
      console.error("Error retrieving blocks:", err);
      return;
    }
    console.log("\n🛠 Blockchain Blocks:");
    rows.forEach((row) => {
      console.log(
        `\n\nBlock #${row.blockIndex}
         Timestamp: ${row.timestamp}
         PrevHash: ${row.prevHash}
         Data: ${row.data}
         Nonce: ${row.nonce}
         Hash: ${row.hash}\n\n`
      );
    });
  });
}

setTimeout(printAllBlocks, 2000);

module.exports = { generateTicketBlock };

