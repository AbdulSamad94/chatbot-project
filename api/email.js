import nodemailer from "nodemailer";

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
        res.setHeader(
            "Access-Control-Allow-Headers",
            "X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization"
        );
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { firstName, lastName, email, phone, selectedAnswers, termsAgreed } = req.body;

    if (!firstName || !lastName || !email || !phone || !selectedAnswers || termsAgreed === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,      // e.g., your_email@gmail.com
                pass: process.env.EMAIL_PASS       // app password or SMTP pass
            }
        });

        const mailOptions = {
            from: `"Life Alarm Bot" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: "New Lead from Chatbot",
            html: `
        <h2>New Lead Info</h2>
        <p><strong>First Name:</strong> ${firstName}</p>
        <p><strong>Last Name:</strong> ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <h3>Answers:</h3>
        <ul>
          ${selectedAnswers.map(ans => `<li>${ans}</li>`).join("")}
        </ul>
      `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: "Email sent" });
    } catch (error) {
        console.error("Email send failed:", error);
        res.status(500).json({ success: false, message: "Email failed to send" });
    }
}
