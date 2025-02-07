const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',  // or your email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

async function generateQRCode(data) {
    try {
        return await QRCode.toDataURL(JSON.stringify(data));
    } catch (err) {
        console.error('Error generating QR code:', err);
        throw err;
    }
}

async function sendTicketEmail(userEmail, ticketDetails) {
    try {
        // Generate QR code - only include essential data
        let qrCodeDataUrl = await generateQRCode(ticketDetails.ticketID);
        const qrdata = JSON.stringify(qrCodeDataUrl);

        // Read HTML template
        let htmlTemplate = `<html>
	<head>
		<meta name="color-scheme" content="light" />
		<meta name="supported-color-schemes" content="light" />
	</head>
	<body
		style="
			background-color: black;
			margin: 0;
			max-width: 500px;
			padding: 0;
			color: white;
			font-family: 'Courier New', monospace;
		"
	>
		<table width="100%" border="0" cellspacing="0" cellpadding="0">
			<tr>
				<td align="center">
					<img
						width="100%"
						style="margin-left: auto; margin-right: auto"
						src="https://lh7-us.googleusercontent.com/B_UxeLxGJ3YZEFpbQYO86w4TI3DCpkwGGNYFMh0Wk0x7GaL0wTV_utNVGyBjNvqcGOdmhpjCiiLwT01vJT6DKnaruglFMx8ZSs6SGzj8BzJwL5yxIuYBvjs0HJKo-K0WElQyz23jb26R1VFEFjQg1aw"
					/>
				</td>
			</tr>
		</table>
		<table>
			<tr align="left">
				<td style="padding-right: 10%; padding-left: 10%; font-size: 12px">
					Dear <span style="font-size: 16px">{{Name}}</span>,
				</td>
			</tr>
			<tr>
				<td style="padding-right: 10%; padding-left: 10%; font-size: 12px; text-align: justify">
					<br />
					Greetings from TEDxCITBengaluru!
					<br />
					<br />
					Thank you for reserving your seat at our event, "Aether." We're thrilled to have you join us.Your registration
					is confirmed, and attached is your e-ticket with a personalized QR code for easy entry.
					<br />
					<br />
					We eagerly await your presence at the event!
				</td>
			</tr>
		</table>
		<table style="width: 100%">
			<tr>
				<td align="center" style="padding-top: 5%; padding-bottom: 5%; padding-left: 10%; padding-right: 10%">
					<img
						style="width: 80%; background-color: white; border: 10px solid white; border-radius: 10px"
						src="https://api.qrserver.com/v1/create-qr-code/?size=500x500&data={{QR_DATA}}"
						alt="{{QR_DATA}}"
					/>
				</td>
			</tr>
		</table>
		<table style="padding: 5%" cellpadding="0" cellspacing="0">
			<tr>
				<th style="width: 50%"></th>
				<th></th>
			</tr>
			<tr>
				<td style="border-width: 2px; padding: 2.5%; border-color: white; border-style: solid">
					Date & Time: <br />
					May 06th 2024 <br />
					11 AM Onwards
				</td>
				<td style="border-width: 2px; padding: 2.5%; border-color: white; border-style: solid">
					Venue: <br />
					Camridge Institute Of Technology
				</td>
			</tr>
			<tr>
				<td style="border-width: 2px; padding: 2.5%; border-color: white; border-style: solid">Name: {{Name}}</td>
				<td style="border-width: 2px; padding: 2.5%; border-color: white; border-style: solid">TRNO: {{TRNO}}</td>
			</tr>
		</table>
		<table style="width: 100%">
			<tr>
				<td style="padding-right: 10%; padding-left: 10%; font-size: 12px; text-align: justify">
					For any inquiries, feel free to contact us:
					<br />
					Snehith Reddy: +91-79939 19979
					<br />
					Srinidhi G G: +91-80733 77202
				</td>
			</tr>
		</table>
		<table>
			<tr>
				<td align="center">
					<img
						width="100%"
						src="https://lh7-us.googleusercontent.com/ZYFaDzTCg5bfMVrUIlHLXahToK2n_xfrkwtGTlrlcl3Zk9K3-8MFTrfeZt7kQ-nJBKUaoCC-NwalCxQdfb21_MFtvqFL6mUgc1R6z7e2p71iV_LMnVl7IIatIes5EDKHqwn0dund5F0jzoNlm_fDiGM"
					/>
				</td>
			</tr>
		</table>
	</body>
</html>`

        console.log(htmlTemplate);
        console.log("balls")
        
        // Replace template variables
        htmlTemplate = htmlTemplate
            .replace('{{Name}}', ticketDetails.name)
            .replace('{{Name}}', ticketDetails.name)  // Replace twice as in the example
            .replace('{{TicketType}}', ticketDetails.ticketType)
            .replace('{{TicketID}}', ticketDetails.ticketID)
            .replace('{{TransactionID}}', ticketDetails.transactionID)
            .replace('{{QR_CODE}}', qrdata);

        // Email content with QR code
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Your Blockchain Event Ticket Confirmation',
            html: htmlTemplate
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

module.exports = { sendTicketEmail };