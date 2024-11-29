import { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "../config/postgres";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

dotenv.config();

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "YOUR_API_KEY";
const ASSISTANT_NAME = "example-assistant";

export const createAssistantApi: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await axios.post(
      "https://api.pinecone.io/assistant/assistants",
      {
        name: "My Assistant",
        instructions:
          "You are ABC company's assistant and are extremely polite.",
      },
      {
        headers: {
          "Api-Key": PINECONE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response.data);
    return res.status(200).json({
      success: true,
      message: "Assistant created",
      response: response.data,
    });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const uploadFiletoAssistant: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream("machinelearningfile.pdf"));

    const response = await axios.post(
      `https://prod-1-data.ke.pinecone.io/assistant/files/${ASSISTANT_NAME}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          "Api-Key": PINECONE_API_KEY,
        },
      }
    );
    return res.status(200).json({ success: true, message: response.data });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const chatWithAssistant: RequestHandler = async (
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

    const payload = {
      messages: [
        {
          role: "user",
          content: previousQuestion,
        },
        {
          role: "assistant",
          content: previousChat,
        },
        {
          role: "user",
          content: messageContent,
        },
      ],
      stream: true,
      model: "gpt-4o",
    };

    const response = await axios.post(
      `https://prod-1-data.ke.pinecone.io/assistant/chat/${ASSISTANT_NAME}`,
      payload,
      {
        headers: {
          "Api-Key": PINECONE_API_KEY,
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

              if (chunkObject.type === "content_chunk" && chunkObject.delta) {
                const content = chunkObject.delta.content;
                console.log("Received content:", content);
              } else {
                console.log("Ignored chunk:", chunkObject);
              }
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

export const getStreamingChatbotResponse = async (
  messageContent: string,
  previousQuestion: string,
  previousChat: string,
  assistant_name: string,
  callback: (chunk: string, isFinal: Boolean) => void
): Promise<void> => {
  try {
    const payload = {
      messages: [
        {
          role: "user",
          content: previousQuestion,
        },
        {
          role: "assistant",
          content: previousChat,
        },
        {
          role: "user",
          content: messageContent,
        },
      ],
      stream: true,
      model: "gpt-4o",
    };

    const response = await axios.post(
      `https://prod-1-data.ke.pinecone.io/assistant/chat/${assistant_name}`,
      payload,
      {
        headers: {
          "Api-Key": PINECONE_API_KEY,
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

              if (chunkObject.type === "content_chunk" && chunkObject.delta) {
                const content = chunkObject.delta.content;
                callback(content, false);
              }
            } catch (error) {
              // console.error("Error parsing chunk part:", part, error);
            }
          }
        });
      } catch (error) {}
    });

    stream.on("end", () => {
      callback("", true);
    });

    stream.on("error", (error: any) => {
      callback("\nSomething went wrong try again...", true);
    });
  } catch (err) {
    callback("\nSomething went wrong try again...", true);
  }
};

export const createAssistant = async (
  assistant_name: string,
  assistant_instruction: string
) => {
  try {
    const response = await axios.post(
      "https://api.pinecone.io/assistant/assistants",
      {
        name: assistant_name,
        instructions: assistant_instruction,
      },
      {
        headers: {
          "Api-Key": PINECONE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    return { error: true, message: err.response.data.message };
  }
};

export const uploadDocumentsToAssistant: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      document_name,
      document_id,
      assistantId,
      status,
      percent_done,
      signed_url,
    } = req.body;

    if (
      !document_name.trim() ||
      !document_id.trim() ||
      !assistantId.trim() ||
      !status.trim() ||
      !percent_done.trim()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    const assistant = await prisma.assistant.findUnique({
      where: { id: parseInt(assistantId) },
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        message: "Assistant with this id does not exists",
      });
    }

    await prisma.assistantDocuments.create({
      data: {
        name: document_name,
        assistant_id: assistant.id,
        document_id: document_id,
        status: status,
        percent_done: percent_done,
        signed_url: signed_url,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "Documents data saved successfully" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getAssistantDocuments: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { assistant_id } = req.params;

    if (!assistant_id.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Assistant id is not valid" });
    }

    const assistant = await prisma.assistant.findUnique({
      where: { id: parseInt(assistant_id) },
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        message: "Assistant with this id does not exists",
      });
    }

    const documents = await prisma.assistantDocuments.findMany({
      where: { assistant_id: assistant.id },
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

export const deleteDocumentsFromAssistant: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      file_id,
      assistantId,
      id,
    }: { file_id: string; assistantId: string; id: string } = req.body;

    if (!file_id.trim() || !assistantId.trim() || !id.trim()) {
      return res.status(400).json({
        success: false,
        message: "File id or assistant id are not valid",
      });
    }

    const assistant = await prisma.assistant.findUnique({
      where: { id: parseInt(assistantId) },
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        message: "Assistant with this id does not exists",
      });
    }

    const document = await prisma.assistantDocuments.findUnique({
      where: { id: parseInt(id) },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document with this id does not exists",
      });
    }

    const response = await axios.delete(
      `https://prod-1-data.ke.pinecone.io/assistant/files/${assistant.name}/${file_id}`,
      {
        headers: {
          "Api-Key": PINECONE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    await prisma.assistantDocuments.delete({ where: { id: document.id } });

    return res
      .status(200)
      .json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getAssistantDocumentStatus: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { file_id, assistantId }: { file_id: string; assistantId: string } =
      req.body;

    if (!file_id.trim() || !assistantId.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    const assistant = await prisma.assistant.findUnique({
      where: { id: parseInt(assistantId) },
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        message: "Assistant with this id does not exists",
      });
    }

    const response = await axios.get(
      `https://prod-1-data.ke.pinecone.io/assistant/files/${assistant.name}/${file_id}`,
      {
        headers: {
          "Api-Key": PINECONE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const document = await prisma.assistantDocuments.findFirst({
      where: { document_id: file_id },
    });

    await prisma.assistantDocuments.update({
      where: { id: document.id },
      data: {
        status: response.data.status,
        percent_done: response.data.percent_done,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "Document status updated" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const updateAssistant: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { assistantId, instructions } = req.body;

    if (!assistantId.trim() || !instructions.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    const assistant = await prisma.assistant.findUnique({
      where: { id: parseInt(assistantId) },
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        message: "Assistant with this id does not exists",
      });
    }

    const response = await axios.patch(
      `https://prod-1-data.ke.pinecone.io/assistant/assistants/${assistant.name}`,
      {
        instructions: instructions,
      },
      {
        headers: {
          "Api-Key": PINECONE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    await prisma.assistant.update({
      where: { id: assistant.id },
      data: { instructions: instructions },
    });

    return res
      .status(200)
      .json({ success: true, message: "Assistant updated successfully" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const checkAssistantStatus: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { assistantId } = req.body;
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const deleteAssistant: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { assistantId } = req.body;
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};
