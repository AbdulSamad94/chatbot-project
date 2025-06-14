import nodemailer from "nodemailer";

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization"
    );

    // Handle preflight requests
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed. Use POST."
        });
    }

    console.log("Received request body:", req.body);
    console.log("Request headers:", req.headers);

    try {
        const { firstName, lastName, email, phone, selectedAnswers, termsAgreed } = req.body;

        // Enhanced validation with detailed error messages
        const errors = [];

        if (!firstName || typeof firstName !== 'string' || firstName.trim() === '') {
            errors.push("First name is required");
        }

        if (!lastName || typeof lastName !== 'string' || lastName.trim() === '') {
            errors.push("Last name is required");
        }

        if (!email || typeof email !== 'string' || email.trim() === '') {
            errors.push("Email is required");
        } else {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                errors.push("Invalid email format");
            }
        }

        if (!phone || typeof phone !== 'string' || phone.trim() === '') {
            errors.push("Phone number is required");
        }

        if (!selectedAnswers || !Array.isArray(selectedAnswers) || selectedAnswers.length === 0) {
            errors.push("Selected answers are required");
        }

        if (termsAgreed !== true) {
            errors.push("Terms must be agreed to");
        }

        if (errors.length > 0) {
            console.log("Validation errors:", errors);
            return res.status(400).json({
                success: false,
                message: "Validation failed: " + errors.join(", "),
                errors: errors
            });
        }

        // Check for required environment variables
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("Missing email configuration");
            return res.status(500).json({
                success: false,
                message: "Server configuration error"
            });
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Verify transporter configuration
        try {
            await transporter.verify();
        } catch (verifyError) {
            console.error("SMTP verification failed:", verifyError);
            return res.status(500).json({
                success: false,
                message: "Email service configuration error"
            });
        }

        const mailOptions = {
            from: `"Life Alarm Bot" <${process.env.EMAIL_USER}>`,
            to: process.env.TOSEND_EMAIL,
            subject: "New Lead from Chatbot",
            html: `
                <h2>New Lead Information</h2>
                <p><strong>First Name:</strong> ${firstName.trim()}</p>
                <p><strong>Last Name:</strong> ${lastName.trim()}</p>
                <p><strong>Email:</strong> ${email.trim()}</p>
                <p><strong>Phone:</strong> ${phone.trim()}</p>
                <h3>Quiz Answers:</h3>
                <ul>
                    ${selectedAnswers.map(ans => `<li>${String(ans).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join("")}
                </ul>
                <hr>
                <p><small>Submitted at: ${new Date().toISOString()}</small></p>
            `
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.messageId);

        res.status(200).json({
            success: true,
            message: "Email sent successfully",
            messageId: info.messageId
        });

    } catch (error) {
        console.error("Email send failed:", error);

        // Don't expose internal error details to client
        res.status(500).json({
            success: false,
            message: "Failed to send email. Please try again later."
        });
    }
}