/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');


// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const express = require('express');
const fs = require('fs').promises;
const {ContextChatEngine, Document, OpenAI, SimpleDirectoryReader, VectorStoreIndex, serviceContextFromDefaults } = require('llamaindex');
const dotenv = require('dotenv');
const app = express();

// Parse JSON bodies of incoming requests
app.use(express.json());
app.use('/css', express.static(__dirname + '/css'));



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

app.post(`/retriever`, async (req, res) => {

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
    res.sendFile(`${__dirname}/chat.html`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


exports.app = functions.https.onRequest(app);
