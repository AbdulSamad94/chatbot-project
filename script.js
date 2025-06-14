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
            }

            formGroup.appendChild(input);
            formContainer.appendChild(formGroup);
        });

        questionDiv.appendChild(formContainer);

        const submitBtn = document.createElement("button");
        submitBtn.className = "submit-btn";
        submitBtn.textContent = "Get My Free Quote";
        submitBtn.onclick = handleSubmit;

        questionDiv.appendChild(submitBtn);
    }

    container.appendChild(questionDiv);
}

async function handleSubmit() {
    const inputs = container.querySelectorAll("input");
    const formData = {};
    let allFilled = true;
    let errorMessage = "";

    // Clear any existing error messages
    const existingError = container.querySelector(".error-message");
    if (existingError) {
        existingError.remove();
    }

    inputs.forEach(input => {
        const value = input.value.trim();
        formData[input.name] = value;
        if (!value) {
            allFilled = false;
            errorMessage = "Please fill out all fields.";
        } else if (input.type === "email" && !isValidEmail(value)) {
            allFilled = false;
            errorMessage = "Please enter a valid email address.";
        } else if (input.type === "tel" && !isValidPhone(value)) {
            allFilled = false;
            errorMessage = "Please enter a valid phone number.";
        }
    });

    if (!allFilled) {
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        errorDiv.textContent = errorMessage;
        container.querySelector(".question").insertBefore(errorDiv, container.querySelector(".submit-btn"));
        return;
    }

    const payload = {
        firstName: formData.first_name,
        lastName: formData.last_name,
        phone: formData.telephone_number,
        email: formData.email,
        selectedAnswers: answers
    };

    try {
        const res = await fetch("https://chatbot-project-tau.vercel.app/api/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error("Failed to send data.");
        }

        showThankYou();
    } catch (err) {
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        errorDiv.textContent = "Something went wrong. Please try again later.";
        container.querySelector(".question").insertBefore(errorDiv, container.querySelector(".submit-btn"));
        console.error(err);
    }
}

function showThankYou() {
    progressFill.style.width = '100%';
    container.innerHTML = `
                <div class="success-message">
                    <h2 class="success-title">Thank You!</h2>
                    <p class="success-text">We've received your information and will reach out to you shortly with your personalized medical alert system recommendation.</p>
                </div>
            `;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

// Initialize the quiz
renderQuestion();
