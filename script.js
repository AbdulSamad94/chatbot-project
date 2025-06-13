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
            input.name = field.toLowerCase().replace(" ", "_");
            input.required = true;
            div.appendChild(document.createElement("br"));
            div.appendChild(input);
        });

        const submit = document.createElement("button");
        submit.textContent = "Submit";
        submit.onclick = async () => {
            const inputs = div.querySelectorAll("input");
            const formData = {};
            inputs.forEach(input => {
                formData[input.name] = input.value;
            });

            const product = answers.join(" > ");
            const payload = {
                name: formData.first_name + " " + formData.last_name,
                phone: formData.telephone_number,
                email: formData.email,
                product,
            };

            await fetch("/api/email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            container.innerHTML = `<h2>Thank you! We will reach out shortly.</h2>`;
        };

        div.appendChild(document.createElement("br"));
        div.appendChild(submit);
    }

    container.appendChild(div);
}

renderQuestion();
