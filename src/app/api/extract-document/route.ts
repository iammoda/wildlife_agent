import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { requireAuth, setAuthCookies } from "@/lib/auth";
import { getSupportedDocumentKind } from "@/lib/document-upload";

const DOCUMENT_EXTRACTION_SYSTEM_PROMPT =
  "You are a document OCR assistant. Extract all text from the document exactly as it appears, preserving structure. For forms, identify field labels and their corresponding values.";

const DOCUMENT_EXTRACTION_USER_PROMPT =
  "Extract all text from this wildlife intake form document. Preserve the structure and identify all field names with their values.";

const PDF_EXTRACTION_MODELS = [
  process.env.OPENAI_PDF_EXTRACTION_MODEL,
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4.1",
].filter((model, index, models): model is string => {
  return Boolean(model) && models.indexOf(model) === index;
});

function formatProviderError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Unknown provider error";
  }

  const status =
    "status" in error && typeof error.status === "number"
      ? `status ${error.status}`
      : null;
  const code =
    "code" in error && typeof error.code === "string"
      ? `code ${error.code}`
      : null;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "Unknown provider error";

  return [status, code, message].filter(Boolean).join(" - ");
}

function shouldTryNextPdfModel(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const status = "status" in error ? error.status : null;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";

  if (status !== 400 && status !== 403 && status !== 404) {
    return false;
  }

  return [
    "model",
    "access",
    "permission",
    "unsupported",
    "not found",
    "does not support",
  ].some((snippet) => message.includes(snippet));
}

export async function POST(request: NextRequest) {
  try {
    const { tokens } = await requireAuth(request);
    const jsonResponse = (body: unknown, init?: ResponseInit) => {
      const response = NextResponse.json(body, init);
      if (tokens) {
        setAuthCookies(response, tokens);
      }
      return response;
    };

    const formData = await request.formData();
    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      return jsonResponse(
        { success: false, error: "No document file provided" },
        { status: 400 }
      );
    }

    const documentKind = getSupportedDocumentKind(fileEntry);

    if (!documentKind) {
      return jsonResponse(
        { success: false, error: "Only images and PDFs are supported right now." },
        { status: 400 }
      );
    }

    if (documentKind === "image") {
      const bytes = await fileEntry.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mimeType = fileEntry.type || "image/jpeg";

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: DOCUMENT_EXTRACTION_USER_PROMPT,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
      });

      const extractedText = response.choices[0]?.message?.content || "";

      return jsonResponse({
        success: true,
        data: { text: extractedText },
      });
    }

    const bytes = await fileEntry.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const pdfDataUrl = `data:application/pdf;base64,${base64}`;

    let lastPdfError: unknown;

    for (const model of PDF_EXTRACTION_MODELS) {
      try {
        const response = await openai.responses.create({
          model,
          instructions: DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_file",
                  filename: fileEntry.name || "document.pdf",
                  file_data: pdfDataUrl,
                },
                {
                  type: "input_text",
                  text: DOCUMENT_EXTRACTION_USER_PROMPT,
                },
              ],
            },
          ],
          max_output_tokens: 4096,
        });

        return jsonResponse({
          success: true,
          data: { text: response.output_text || "" },
        });
      } catch (error) {
        lastPdfError = error;
        console.warn(`PDF extraction failed with model ${model}:`, formatProviderError(error));

        if (!shouldTryNextPdfModel(error)) {
          throw error;
        }
      }
    }

    throw lastPdfError ?? new Error("No PDF extraction models were available.");
  } catch (error) {
    const errorMessage = formatProviderError(error);
    console.error("Document extraction error:", errorMessage, error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : "Failed to extract text from document",
      },
      { status: 500 }
    );
  }
}
