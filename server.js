const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { generateTicketBlock } = require("./blockchain");
const { sendTicketEmail } = require('./mail');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API Route to add a transaction
app.post("/api/add-transaction", async (req, res) => {
  try {
    const { name, email, ticketType, transactionID, phoneNo, ticketID } =
      req.body;

    if (
      !name ||
      !email ||
      !ticketType ||
      !transactionID ||
      !phoneNo ||
      !ticketID
    ) {
      return res.status(400).json({ error: "Missing required fields!" });
    }

    const blockHash = await generateTicketBlock(
      name,
      email,
      ticketType,
      transactionID,
      phoneNo,
      ticketID
    );
    
    // Then send confirmation email
    try {
        await sendTicketEmail(email, {
            name,
            ticketType,
            ticketID,
            transactionID,
            blockHash
        });
        console.log('Confirmation email sent to:', email);
    } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue execution even if email fails
    }

    res.json({ 
        message: "✅ Transaction added to the blockchain and confirmation email sent!",
        success: true,
        blockHash
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ 
        error: "Internal Server Error", 
        details: error.message 
    });
  }
});

// Serve static files (for frontend)
app.use(express.static("public"));

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
