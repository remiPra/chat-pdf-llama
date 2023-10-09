const express = require('express');

const { ContextChatEngine, Document, OpenAI, SimpleDirectoryReader, VectorStoreIndex, serviceContextFromDefaults } = require('llamaindex');
const dotenv = require('dotenv');

const { initializeApp, cert } = require('firebase-admin/app');
var admin = require("firebase-admin");
const { getStorage, getDownloadURL } = require('firebase-admin/storage');



const app = express();
const serviceAccount = require('./service.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "chat-pdf-26609.appspot.com",


  });


// Parse JSON bodies of incoming requests
app.use(express.json());
app.use('/css', express.static(__dirname + '/css'));

let chatEngine = null

async function initialize(textFile) {
    dotenv.config();
    

    const document = new Document({ text: textFile   });

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

    return chatEngine
}
app.post('/upload', async (req, res) => {
    try {
        const { fileName } = req.body;
        console.log(fileName)
            //const file = req.file;
        const fileRef = getStorage().bucket().file(fileName);
        const downloadURL= await getDownloadURL(fileRef);
        console.log(downloadURL)
        

        const resto = await initialize(downloadURL); // initialise avec le nouveau doc

    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error uploading file');
    }

});


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
// app.get('/is-ready', (req, res) => {
//     res.status(200).json({ isReady: chatEngine, hello: "hello" });
// });

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/chattest.html`);
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
