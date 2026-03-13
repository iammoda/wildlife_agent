export const DOCUMENT_UPLOAD_ACCEPT = "image/*,application/pdf";

const PDF_MIME_TYPE = "application/pdf";
const PDF_EXTENSION = /\.pdf$/i;

type DocumentLike = {
  type?: string | null;
  name?: string | null;
};

export type SupportedDocumentKind = "image" | "pdf";

export function getSupportedDocumentKind(
  document: DocumentLike
): SupportedDocumentKind | null {
  const type = document.type?.toLowerCase() ?? "";

  if (type.startsWith("image/")) {
    return "image";
  }

  if (type === PDF_MIME_TYPE) {
    return "pdf";
  }

  if (PDF_EXTENSION.test(document.name ?? "")) {
    return "pdf";
  }

  return null;
}

export function isSupportedDocument(document: DocumentLike): boolean {
  return getSupportedDocumentKind(document) !== null;
}
