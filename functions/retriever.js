const { ContextChatEngine, Document, OpenAI, SimpleDirectoryReader, VectorStoreIndex, serviceContextFromDefaults } = require('llamaindex');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const cors = require('cors')

dotenv.config();

let chatEngine = null;
app.use(cors({
    origin: ['https://main--beautiful-puppy-1dbb7d.netlify.app', 'https://another-allowed-domain.com'],
}));

async function initialize() {
    const essay = await fs.readFile("assets/lettre.txt", "utf-8");
    const document = new Document({ text: essay });
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
}

initialize().catch(console.error);

exports.handler = async function(event, context) {
    try {
        const userQuery = JSON.parse(event.body).query;
        const response = await chatEngine.chat(userQuery);
        return {
            statusCode: 200,
            body: JSON.stringify({ response: response.toString() }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
