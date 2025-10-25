
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

const DEFAULT_MODEL_NAME = process.env.OPENAI_MODEL;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? process.env.DASHSCOPE_API_KEY ?? "";

export function createChatModel() {
    return new ChatOpenAI({
        model: DEFAULT_MODEL_NAME,
        temperature: 0.5,
        openAIApiKey: OPENAI_API_KEY,
        configuration: OPENAI_BASE_URL ? { baseURL: OPENAI_BASE_URL } : undefined,
    });
}

export function createEmbeddingModel() {
    return new OpenAIEmbeddings({
        model: "text-embedding-v4",
    });
}