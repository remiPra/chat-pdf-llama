const express = require('express');
const fs = require('fs').promises;
const {ContextChatEngine, Document, OpenAI, SimpleDirectoryReader, VectorStoreIndex, serviceContextFromDefaults } = require('llamaindex');
const dotenv = require('dotenv');

const app = express();

// Parse JSON bodies of incoming requests
app.use(express.json());



app.post('/query', async (req, res) => {
    try {
        dotenv.config();


        const essay = await fs.readFile(
            "sophie.txt",
            "utf-8",
        );

        // Create Document object with essay
        const document = new Document({ text: essay });

        const serviceContext = serviceContextFromDefaults({
            llm: new OpenAI({
                model: "gpt-4",
                apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
                temperature: 0.8
            }),
        });
        //simple avec un txt
        const index = await VectorStoreIndex.fromDocuments([document], { serviceContext });
        // console.log(index)

        const queryEngine = index.asQueryEngine();


        const userQuery = req.body.query;
        const response = await queryEngine.query(userQuery);

        res.status(200).json({ response: response.toString() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/retriever', async (req, res) => {
    try {
        dotenv.config();
        console.log("retriver")

        const essay = await fs.readFile(
            "sophie.txt",
            "utf-8",
        );

        // Create Document object with essay
        const document = new Document({ text: essay });

        const serviceContext = serviceContextFromDefaults({
            llm: new OpenAI({
                model: "gpt-4",
                apiKey: process.env.OPENAI_API_KEY,
                temperature: 0.8
            }),
        });
        //simple avec un txt
        const index = await VectorStoreIndex.fromDocuments([document], { serviceContext });
        // console.log(index)

        const retriever = index.asRetriever();
        // retriever.similarityTopK = 5;
        
        const chatEngine = new ContextChatEngine({ retriever });

        // start chatting
        const userQuery = req.body.query;
        const response = await chatEngine.chat(userQuery);
        
        
        // const queryEngine = index.asQueryEngine();
        // const response = await retriever.retrieve(userQuery);
        console.log(response)
        // const response = await queryEngine.query(userQuery);

        res.status(200).json({ response: response.toString() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/chat.html');
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
