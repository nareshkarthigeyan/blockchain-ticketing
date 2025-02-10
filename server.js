const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { generateTicketBlock, ticketChain } = require("./blockchain");
const { sendTicketEmail } = require('./mail');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// Most permissive CORS configuration for development
app.use(cors());

// Middleware
app.use(bodyParser.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Test route to check if server is running
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// API Routes
app.post("/api/add-transaction", async (req, res) => {
    console.log('Received request:', req.body); // Debug log
    try {
        const { name, email, ticketType, transactionID, phoneNo, ticketID } = req.body;

        if (!name || !email || !ticketType || !transactionID || !phoneNo || !ticketID) {
            return res.status(400).json({ 
                error: "Missing required fields!",
                success: false 
            });
        }

        const hash = await generateTicketBlock(name, email, ticketType, transactionID, phoneNo, ticketID);
        
        if (!hash) {
            return res.status(500).json({ 
                error: "Failed to generate blockchain hash",
                success: false 
            });
        }

        res.json({ 
            message: "Transaction added to blockchain!",
            success: true,
            hash: hash
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ 
            error: "Internal Server Error",
            details: error.message,
            success: false 
        });
    }
});

app.get("/api/verify-block/:hash", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
        const { hash } = req.params;
        
        if (!hash) {
            return res.status(400).json({ 
                error: "Hash parameter is required",
                success: false 
            });
        }

        const block = await ticketChain.getBlockByHash(hash);
        
        if (!block) {
            return res.status(404).json({ 
                error: "Block not found",
                success: false 
            });
        }

        res.json({ 
            message: "Block verified successfully",
            success: true,
            block: {
                index: block.blockIndex,
                timestamp: block.timestamp,
                data: block.data,
                hash: block.hash
            }
        });
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ 
            error: "Internal Server Error", 
            details: error.message,
            success: false 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
