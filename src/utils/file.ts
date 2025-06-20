import { Attachment } from "ai";

export function file2DataUrl(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        contentType: file.type,
        url: reader.result as string,
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
