import { Request, Response, NextFunction, RequestHandler } from "express";
import dotenv from "dotenv";
import {
  DynamicRetrievalMode,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import axios from "axios";
import { redisClient } from "../config/redisClient";
import { getTokenFunc } from "./usercontroller";
import jwt_decode from "jwt-decode";
import { prisma } from "../config/postgres";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "GEMINI_API_KEY";

export const searchTheweb: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { prompt }: { prompt: string } = req.body;

    if (!prompt.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid input" });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const model = genAI.getGenerativeModel(
      {
        model: "models/gemini-1.5-flash-001",
        tools: [
          {
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: DynamicRetrievalMode.MODE_DYNAMIC,
                dynamicThreshold: 0.7,
              },
            },
          },
        ],
      },
      { apiVersion: "v1beta" }
    );

    const result = await model.generateContent(prompt);

    return res.status(200).json({
      success: true,
      message: result.response.candidates[0].content.parts[0].text,
    });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const chatWithDocument: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const chatWithGemini: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageContent, previousChat, previousQuestion } = req.body;

    if (!messageContent) {
      return res
        .status(400)
        .json({ success: false, message: "Message content is required" });
    }

    const API_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent";

    const requestBody = {
      contents: [
        {
          parts: [{ text: "Explain how AI works" }],
        },
      ],
    };

    const response = await axios.post(
      `${API_URL}?alt=sse&key=${GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
        responseType: "stream",
      }
    );

    const stream = response.data;

    stream.on("data", (chunk: Buffer) => {
      try {
        const chunkString = chunk.toString();

        const chunkParts = chunkString.split("\n").filter(Boolean);

        chunkParts.forEach((part) => {
          const cleanedChunk = part.replace(/^data:/, "").trim();

          if (cleanedChunk) {
            try {
              const chunkObject = JSON.parse(cleanedChunk);
              console.log(
                "Recieved chunk:",
                chunkObject.candidates[0].content.parts
              );
            } catch (error) {
              console.error("Error parsing chunk part:", part, error);
            }
          }
        });
      } catch (error) {
        console.error("Error processing stream data:", error);
      }
    });

    stream.on("end", () => {
      console.log("done now");
    });

    stream.on("error", (error: any) => {
      console.error("Error in stream:", error);
      if (!res.headersSent) {
        return res
          .status(500)
          .json({ success: false, message: "Stream error" });
      }
    });
    return res.status(200).json({ success: true, message: "Done baby" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getYouTubeSummary: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { youtubeUrl }: { youtubeUrl: string } = req.body;

    if (!youtubeUrl.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    const response = await axios.get(
      `https://api.supadata.ai/v1/youtube/transcript?url=${youtubeUrl}&text=true`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.SUPADATA_API_KEY,
        },
      }
    );

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Summarize this one: ${response.data.content}`;

    const result = await model.generateContent(prompt);

    return res
      .status(200)
      .json({ success: true, message: result.response.text() });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getWebPageSummary: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { webPageUrl }: { webPageUrl: string } = req.body;

    if (!webPageUrl.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    const response = await axios.get(
      `https://api.supadata.ai/v1/web/scrape?url=${webPageUrl}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.SUPADATA_API_KEY,
        },
      }
    );

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Summarize this one: ${response.data.content}`;

    const result = await model.generateContent(prompt);

    return res
      .status(200)
      .json({ success: true, message: result.response.text() });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getDocumentSummary: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { document_url }: { document_url: string } = req.body;

    if (!document_url.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.5-flash",
    });

    const pdfResp = await fetch(document_url);

    if (!pdfResp.ok) {
      return res.status(400).json({
        success: false,
        message: `Failed to fetch document: ${pdfResp.statusText}`,
      });
    }

    const pdfData = await pdfResp.arrayBuffer();

    const data = Buffer.from(pdfData).toString("base64");

    await redisClient.setEx(document_url, 1800, JSON.stringify(data));

    const result = await model.generateContent([
      {
        inlineData: {
          data: data,
          mimeType: "application/pdf",
        },
      },
      "Summarize this document",
    ]);

    return res
      .status(200)
      .json({ success: true, message: result.response.text() });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const addDocument: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, document_url }: { name: string; document_url: string } =
      req.body;

    if (!name.trim() || !document_url.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await prisma.documents.create({
      data: { name: name, document_url: document_url, user_id: user.id },
    });

    return res
      .status(200)
      .json({ success: true, message: "Document created successfully" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getDocuments: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const documents = await prisma.documents.findMany({
      where: { user_id: user.id },
    });

    return res.status(200).json({ success: true, message: documents });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const searchTheWebFunction = async (
  messageContent: string,
  firstChat: Array<any>,
  callback: (chunk: string, isFinal: Boolean) => void
) => {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const model = genAI.getGenerativeModel(
      {
        model: "models/gemini-1.5-flash-001",
        tools: [
          {
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: DynamicRetrievalMode.MODE_DYNAMIC,
                dynamicThreshold: 0.7,
              },
            },
          },
        ],
      },
      { apiVersion: "v1beta" }
    );

    const history = firstChat.map((message, index) => {
      if (index % 2 === 0) {
        return {
          role: "user",
          parts: [
            {
              text: `${message}`,
            },
          ],
        };
      } else {
        return {
          role: "model",
          parts: [
            {
              text: `${message}`,
            },
          ],
        };
      }
    });

    const chat = model.startChat({
      history: history,
    });

    let result = await chat.sendMessageStream(messageContent);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      callback(chunkText, false);
    }

    callback("", true);
  } catch (err) {
    callback("\nSomething went wrong try again...", true);
  }
};

export const chatWithDocumentFunction = async (
  messageContent: string,
  document_url: string,
  callback: (chunk: string, isFinal: Boolean) => void
) => {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.5-flash",
    });

    const cachedpdfData = await redisClient.get(document_url);

    if (!cachedpdfData) {
      callback("\nSomething went wrong try again...", true);
    }

    const pdfData = JSON.parse(cachedpdfData);

    const result = await model.generateContentStream([
      {
        inlineData: {
          data: pdfData,
          mimeType: "application/pdf",
        },
      },
      messageContent,
    ]);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      callback(chunkText, false);
    }

    callback("", true);
  } catch (err) {
    callback("\nSomething went wrong try again...", true);
  }
};

export const chatWithGeminiFunction = async (
  messageContent: string,
  previousQuestion: string,
  previousChat: string,
  callback: (chunk: string, isFinal: Boolean) => void
) => {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: `this is the summary of link now remember this i will ask you questions about it: ${previousChat}`,
            },
          ],
        },
      ],
    });

    let result = await chat.sendMessageStream(messageContent);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      callback(chunkText, false);
    }

    callback("", true);
  } catch (err) {
    callback("\nSomething went wrong try again...", true);
  }
};
