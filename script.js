const container = document.getElementById('chat-container');

const questions = [
    {
        question: "Is this medical alert to protect?",
        options: ["Yourself", "Someone Else"]
    },
    {
        question: "Where do you need protection?",
        options: ["In-Home", "On-the-Go"]
    },
    {
        question: "Would you prefer?",
        options: ["Necklace Device", "Wristwatch Device"]
    },
    {
        question: "You're almost done! Enter your details",
        fields: ["First Name", "Last Name", "Telephone Number", "Email"]
    }
];

let answers = [];
let step = 0;

function renderQuestion() {
    container.innerHTML = "";

    const q = questions[step];

    const div = document.createElement("div");
    div.className = "question";

    const title = document.createElement("h3");
    title.textContent = q.question;
    div.appendChild(title);

    if (q.options) {
        q.options.forEach(opt => {
            const btn = document.createElement("button");
            btn.textContent = opt;
            btn.onclick = () => {
                answers.push(opt);
                step++;
                renderQuestion();
            };
            div.appendChild(btn);
        });
    } else {
        q.fields.forEach(field => {
            const input = document.createElement("input");
            input.placeholder = field;
            input.name = field.toLowerCase().replace(/ /g, "_");
            input.required = true;
            div.appendChild(document.createElement("br"));
            div.appendChild(input);
        });

        const submit = document.createElement("button");
        submit.textContent = "Submit";
        submit.onclick = async () => {
            const inputs = div.querySelectorAll("input");
            const formData = {};
            let allFilled = true;

            inputs.forEach(input => {
                formData[input.name] = input.value.trim();
                if (!input.value.trim()) {
                    allFilled = false;
                }
            });

            if (!allFilled) {
                alert("Please fill out all fields.");
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

                container.innerHTML = `<h2>Thank you! We will reach out shortly.</h2>`;
            } catch (err) {
                container.innerHTML = `<h2>Something went wrong. Please try again later.</h2>`;
                console.error(err);
            }
        };

        div.appendChild(document.createElement("br"));
        div.appendChild(submit);
    }

    container.appendChild(div);
}

renderQuestion();
