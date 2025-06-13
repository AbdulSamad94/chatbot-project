import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method not allowed');

    const { messages } = req.body;

    try {
        const chat = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages,
        });

        res.status(200).json({ reply: chat.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: 'OpenAI error', detail: error.message });
    }
}
