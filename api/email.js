import nodemailer from "nodemailer";

const submissions = new Map();


export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization"
    );

    function sanitizeInput(str) {
        if (typeof str !== 'string') return '';
        return str.trim().replace(/[<>]/g, '');
    }


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

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    if (submissions.has(ip)) {
        const lastSubmit = submissions.get(ip);
        if (now - lastSubmit < 60000) { // 1 minute cooldown
            return res.status(429).json({
                success: false,
                message: "Please wait 1 minute before submitting again"
            });
        }
    }
    submissions.set(ip, now);

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

        if (req.body.website && req.body.website.trim() !== '') {
            console.log("Bot detected - honeypot filled");
            return res.status(400).json({
                success: false,
                message: "Invalid submission"
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
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #35265f; border-bottom: 2px solid #35265f; padding-bottom: 10px;">New Life Alarm Lead</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${sanitizeInput(firstName)} ${sanitizeInput(lastName)}</p>
            <p><strong>Email:</strong> <a href="mailto:${sanitizeInput(email)}">${sanitizeInput(email)}</a></p>
            <p><strong>Phone:</strong> <a href="tel:${sanitizeInput(phone)}">${sanitizeInput(phone)}</a></p>
        </div>
        <h3 style="color: #35265f;">Questions Responses:</h3>
        <ol style="background: #fff; padding: 20px; border-left: 4px solid #35265f;">
            ${selectedAnswers.map(ans => `<li style="margin: 5px 0;">${String(ans).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join("")}
        </ol>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px; text-align: center;">Submitted: ${new Date().toLocaleString()}</p>
    </div>
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