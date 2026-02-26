import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { requireAuth, setAuthCookies } from "@/lib/auth";

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
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return jsonResponse(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "You are a document OCR assistant. Extract all text from the image exactly as it appears, preserving structure. For forms, identify field labels and their corresponding values.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this wildlife intake form image. Preserve the structure and identify all field names with their values.",
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
  } catch (error) {
    console.error("Document extraction error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to extract text from document" },
      { status: 500 }
    );
  }
}
