const express = require('express');
const fs = require('fs')
const axios =require('axios')
const cors = require('cors');

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

app.use(cors());

// Parse JSON bodies of incoming requests
app.use(express.json());
app.use('/css', express.static(__dirname + '/css'));

let chatEngine = null

async function initialize(textFile) {
    dotenv.config();


    const document = new Document({ text: textFile });
    console.log("le document c'est bon")
    console.log(document)
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
async function fetchFileContent(url) {
    try {
        let response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Erreur complète:", error.response ? error.response.data : error.message);
        throw new Error('Erreur de réseau lors de la tentative');
    }
}


app.post('/upload', async (req, res) => {
    try {
        const { fileName } = req.body;
        console.log(fileName)
        //const file = req.file;
        const fileRef = getStorage().bucket().file(fileName);
        console.log('le fichier est ' + fileRef)
        const firebaseMetadata = await fileRef.getMetadata();

        

        const downloadURL = await getDownloadURL(fileRef)
        console.log(downloadURL)
        let fileContent = await fetchFileContent(downloadURL);
        console.log(fileContent)
        // const data = await readFileAsync(downloadURL);
       
        // console.log('le downloadURL est + ' +  data)
        //const text = await fs.readFile(downloadURL)
        const resto = await initialize(fileContent); // initialise avec le nouveau doc

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


app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/chattest.html`);
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// app.listen(3000, () => {
//     console.log('Server is running on http://localhost:3000');
// });
