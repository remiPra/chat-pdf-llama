const express = require('express');
const fs = require('fs').promises;
const {ContextChatEngine, Document, OpenAI, SimpleDirectoryReader, VectorStoreIndex, serviceContextFromDefaults } = require('llamaindex');
const dotenv = require('dotenv');
const app = express();
const cors = require('cors');


// Parse JSON bodies of incoming requests
app.use(express.json());
app.use('/css', express.static(__dirname + '/css'));


app.use(cors());
console.log(cors)
let chatEngine=null

async function initialize() {
    dotenv.config();
    const essay = await fs.readFile("assets/lettre.txt", "utf-8");
    const document = new Document({ text: essay });
    console.log('le doculent est : ' + JSON.stringify(document))
    console.log(process.env.OPENAI_API_KEY)
    const serviceContext = serviceContextFromDefaults({
        llm: new OpenAI({
            model: "gpt-4",
            apiKey: process.env.OPENAI_API_KEY,
            temperature: 0.8
        }),
    });
    const index = await VectorStoreIndex.fromDocuments([document], { serviceContext });
    const retriever = index.asRetriever();
    chatEngine = new ContextChatEngine({ retriever });
    console.log(chatEngine)
}

initialize().catch(console.error);

app.post('/retriever', async (req, res) => {

    try {
        const userQuery = req.body.query;
        const response = await chatEngine.chat(userQuery);
        res.status(200).json({ response: response.toString() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/is-ready', (req, res) => {
    res.status(200).json({ isReady: chatEngine,hello:"hello" });
});

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
