const express = require('express');
const fs = require('fs')
const axios = require('axios')
const cors = require('cors');
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
const path = require('path');

pdfMake.vfs = pdfFonts.pdfMake.vfs;


const { ContextChatEngine, Document, OpenAI, SimpleDirectoryReader, VectorStoreIndex, serviceContextFromDefaults } = require('llamaindex');
const dotenv = require('dotenv');

const { initializeApp, cert } = require('firebase-admin/app');
var admin = require("firebase-admin");
const { getStorage, getDownloadURL } = require('firebase-admin/storage');
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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

app.post('/facturesoin', async (req, res) => {

    
        const userQuery = req.body.hello;
        console.log(userQuery)
        // const documentDefinition = {
        //     content: [
        //         { text: 'PRADERE Remi', fontSize: 20, bold: true, margin: [0, 0, 0, 10] },
        //         { text: 'Pédicure Podologue', fontSize: 18, margin: [0, 0, 0, 5] },
        //         { text: '4 Bis Rue Honoré Cazaubon 32100 CONDOM', fontSize: 16, margin: [0, 0, 0, 5] },
        //         { text: 'Siret : 491525261', fontSize: 16, margin: [0, 0, 0, 5] },
        //         { text: 'Tel : 05.62.68.25.58', fontSize: 16, margin: [0, 0, 0, 20] },
        
        //         { text: 'Le 6 OCTOBRE 2023 à CONDOM', fontSize: 16, margin: [0, 0, 0, 10] },
        //         { text: 'HENRIOT juliette', fontSize: 18, bold: true, margin: [0, 0, 0, 20] },
        
        //         { text: 'Application une fois par jour pendant 7 jours sur ongle incarné', fontSize: 16, margin: [0, 0, 0, 10] },
        //         { text: '- Betadine Gel dermique', fontSize: 16, margin: [20, 0, 0, 5] },
        //         { text: '- Omnifix pansement 7cm x 5m', fontSize: 16, margin: [20, 0, 0, 5] },
        //         { text: '- Compresses stériles 7.5cm x 7.5cm', fontSize: 16, margin: [20, 0, 0, 20] },
        
        //         { text: 'Rémi PRADERE', fontSize: 18, bold: true, margin: [0, 20, 0, 10] }
        //     ]
        // };
        
        const documentDefinition = {
            content: [
                { text: 'Test PDF', fontSize: 30 }
            ]
        };
        





        const pdfDoc = pdfMake.createPdf(documentDefinition);
        pdfDoc.getBuffer((buffer) => {
            res.type('application/pdf');
            res.send(buffer);
        });
        
        
    
    
})
app.post('/retriever', async (req, res) => {

    try {
        const userQuery = req.body.query;
        const response = await chatEngine.chat(userQuery);
        // const htmlCode = response.toString();  // Assumons que le code HTML est envoyé dans le corps de la requête
        // const documentDefinition = { content: htmlCode };
        // const pdfDoc = pdfMake.createPdf(documentDefinition);
        // pdfDoc.getBuffer((buffer) => {
        //     res.type('pdf');
        //     res.send(buffer);
        // });
        res.status(200).json({ response: response.toString() });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/chattest.html`);
});

// Assuming you'll have an 'about.ejs' in 'views' directory
app.get('/about', (req, res) => {
    res.render('about');
});
app.get('/facturesoinpedicurie', (req, res) => {
    res.render('facturesoinpedicurie');
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// app.listen(3000, () => {
//     console.log('Server is running on http://localhost:3000');
// });
