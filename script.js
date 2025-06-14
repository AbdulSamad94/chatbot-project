const container = document.getElementById('chat-container');
const progressFill = document.getElementById('progress-fill');

const questions = [
    {
        question: "Who are you looking to protect?",
        options: ["Myself", "Someone Else"]
    },
    {
        question: "Where do you need protection?",
        options: ["In-Home", "On-the-Go"]
    },
    {
        question: "Which device would you prefer?",
        options: ["Necklace Device", "Wristwatch Device"]
    },
    {
        question: "You're almost done! Enter your details",
        fields: ["First Name", "Last Name", "Telephone Number", "Email"]
    }
];

let answers = [];
let step = 0;

function updateProgress() {
    const progress = ((step + 1) / questions.length) * 100;
    progressFill.style.width = progress + '%';
}

function renderQuestion() {
    container.innerHTML = "";
    updateProgress();

    const q = questions[step];

    const questionDiv = document.createElement("div");
    questionDiv.className = "question";

    const title = document.createElement("h2");
    title.className = "question-title";
    title.textContent = q.question;
    questionDiv.appendChild(title);

    if (q.options) {
        const optionsContainer = document.createElement("div");
        optionsContainer.className = "options-container";

        q.options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.textContent = opt;
            btn.onclick = () => {
                answers.push(opt);
                step++;
                if (step < questions.length) {
                    renderQuestion();
                } else {
                    showThankYou();
                }
            };
            optionsContainer.appendChild(btn);
        });

        questionDiv.appendChild(optionsContainer);

        // Add help section for option questions
        const helpSection = document.createElement("div");
        helpSection.className = "help-section";

        const helpText = document.createElement("p");
        helpText.className = "help-text";
        helpText.textContent = "Question? Call us";

        const helpCallBtn = document.createElement("a");
        helpCallBtn.className = "help-call-btn";
        helpCallBtn.href = "tel:+18007805433";
        helpCallBtn.innerHTML = '<i class="fas fa-phone"></i> +1-800-780-5433';

        helpSection.appendChild(helpText);
        helpSection.appendChild(helpCallBtn);
        questionDiv.appendChild(helpSection);

    } else {
        const formContainer = document.createElement("div");
        formContainer.className = "form-container";

        q.fields.forEach((field, index) => {
            const formGroup = document.createElement("div");
            formGroup.className = "form-group";
            if (field === "Email") {
                formGroup.classList.add("full-width");
            }

            const input = document.createElement("input");
            input.className = "form-input";
            input.placeholder = field;
            input.name = field.toLowerCase().replace(/ /g, "_");
            input.required = true;

            if (field === "Email") {
                input.type = "email";
            } else if (field === "Telephone Number") {
                input.type = "tel";
            } else {
                input.type = "text"; // Explicitly set type for other inputs
            }

            formGroup.appendChild(input);
            formContainer.appendChild(formGroup);
        });

        questionDiv.appendChild(formContainer);

        // Add terms and conditions section
        const termsContainer = document.createElement("div");
        termsContainer.className = "terms-container";

        const termsWrapper = document.createElement("div");
        termsWrapper.className = "terms-checkbox-wrapper";

        const termsCheckbox = document.createElement("input");
        termsCheckbox.type = "checkbox";
        termsCheckbox.id = "terms-checkbox";
        termsCheckbox.className = "terms-checkbox";
        termsCheckbox.required = true;

        const termsText = document.createElement("label");
        termsText.htmlFor = "terms-checkbox";
        termsText.className = "terms-text";
        termsText.innerHTML = `
            <strong>By submitting my information, I authorize Life Alarm Services, its accredited members, authorized dealers, and agents to communicate with me regarding product and service options, including via automated systems such as artificial intelligence chat tools, pre-recorded messages, and text messages. I agree to Life Alarm Services's <a href="#terms" target="_blank">Terms of Use</a> & <a href="#privacy" target="_blank">Privacy Policy</a>, including the use of an electronic record to document my agreement.</strong>
        `;

        termsWrapper.appendChild(termsCheckbox);
        termsWrapper.appendChild(termsText);
        termsContainer.appendChild(termsWrapper);
        questionDiv.appendChild(termsContainer);

        const submitBtn = document.createElement("button");
        submitBtn.className = "submit-btn";
        submitBtn.textContent = "Get My Free Quote";
        submitBtn.disabled = true; // Initially disabled
        submitBtn.onclick = handleSubmit;

        // Enable/disable submit button based on checkbox
        termsCheckbox.addEventListener('change', function () {
            submitBtn.disabled = !this.checked;
        });

        questionDiv.appendChild(submitBtn);
    }

    container.appendChild(questionDiv);
}

async function handleSubmit() {
    const inputs = container.querySelectorAll("input[type='text'], input[type='email'], input[type='tel']");
    const termsCheckbox = container.querySelector("#terms-checkbox");
    const formData = {};
    let allFilled = true;
    let errorMessage = "";

    // Clear any existing error messages
    const existingError = container.querySelector(".error-message");
    if (existingError) {
        existingError.remove();
    }

    // Check if terms are agreed
    if (!termsCheckbox || !termsCheckbox.checked) {
        allFilled = false;
        errorMessage = "Please agree to the terms and conditions to continue.";
    }

    inputs.forEach(input => {
        const value = input.value.trim();
        formData[input.name] = value;
        if (!value) {
            allFilled = false;
            if (!errorMessage) errorMessage = "Please fill out all fields.";
        } else if (input.type === "email" && !isValidEmail(value)) {
            allFilled = false;
            errorMessage = "Please enter a valid email address.";
        } else if (input.type === "tel" && !isValidPhone(value)) {
            allFilled = false;
            errorMessage = "Please enter a valid phone number.";
        }
    });

    if (!allFilled) {
        showError(errorMessage);
        return;
    }

    // Disable submit button to prevent double submission
    const submitBtn = container.querySelector(".submit-btn");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
    }

    const payload = {
        firstName: formData.first_name || "",
        lastName: formData.last_name || "",
        phone: formData.telephone_number || "",
        email: formData.email || "",
        selectedAnswers: answers || [],
        termsAgreed: termsCheckbox ? termsCheckbox.checked : false
    };

    // Debug log to see what's being sent
    console.log("Sending payload:", payload);

    try {
        const res = await fetch("https://chatbot-project-tau.vercel.app/api/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });

        // Get response text first to debug
        const responseText = await res.text();
        console.log("Response status:", res.status);
        console.log("Response text:", responseText);

        if (!res.ok) {
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData = { message: responseText || "Failed to send data." };
            }
            throw new Error(errorData.message || "Failed to send data.");
        }

        // Try to parse as JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            result = { success: true }; // Assume success if we can't parse
        }

        showThankYou();
    } catch (err) {
        console.error("Submit error:", err);
        showError("Something went wrong. Please try again later.");

        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Get My Free Quote";
        }
    }
}

function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #ff4444;
        background: rgba(255, 68, 68, 0.1);
        padding: 12px;
        border-radius: 8px;
        margin: 15px 0;
        border: 1px solid rgba(255, 68, 68, 0.3);
        font-size: 14px;
    `;

    const question = container.querySelector(".question");
    const termsContainer = container.querySelector(".terms-container");
    if (question && termsContainer) {
        question.insertBefore(errorDiv, termsContainer);
    }
}

function showThankYou() {
    progressFill.style.width = '100%';
    container.innerHTML = `
        <div class="success-message">
            <h2 class="success-title">Thank You!</h2>
            <p class="success-text">We've received your information and will reach out to you shortly with your personalized medical alert system recommendation.</p>
            <div style="margin-top: 30px;">
                <p style="font-size: 1.1rem; color: rgba(255, 255, 255, 0.9); margin-bottom: 20px; font-weight: 500;">Skip the wait and get instant assistance:</p>
                <a href="tel:+18007805433" class="call-btn">
                     Call Now: +1-800-780-5433
                </a>
            </div>
        </div>
    `;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    // More flexible phone validation
    const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
    return phoneRegex.test(phone);
}

// Initialize the quiz
renderQuestion();