import { Response } from "express";
import XLSX from "xlsx";
import PDFDocument from "pdfkit";

type Row = Record<string, string | number | boolean | null | undefined>;

interface ExcelExportOptions {
  rows: Row[];
  sheetName: string;
  fileName: string;
}

interface PdfExportOptions {
  title: string;
  headers: string[];
  widths: number[];
  rows: Row[];
  fileName: string;
}

const pad = (value: number) => String(value).padStart(2, "0");

const isDateOnlyString = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
const isTimeOnlyString = (value: string) => /^\d{2}:\d{2}(:\d{2})?$/.test(value.trim());

const toDateValue = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

export const formatExportDate = (value: unknown): string => {
  if (!value) return "-";
  if (typeof value === "string" && isDateOnlyString(value)) return value.trim();

  const date = toDateValue(value);
  if (!date) return String(value);

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

export const formatExportTime = (value: unknown): string => {
  if (!value) return "-";
  if (typeof value === "string" && isTimeOnlyString(value)) {
    const trimmed = value.trim();
    return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
  }

  const date = toDateValue(value);
  if (!date) return String(value);

  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
};

export const formatExportDateTime = (value: unknown): string => {
  if (!value) return "-";
  return `${formatExportDate(value)} ${formatExportTime(value)}`;
};

export const formatExportDateAndTime = (dateValue: unknown, timeValue: unknown): string => {
  const date = formatExportDate(dateValue);
  const time = formatExportTime(timeValue);

  if (date === "-" && time === "-") return "-";
  if (date === "-") return time;
  if (time === "-") return date;
  return `${date} ${time}`;
};

export const sendExcelExport = (res: Response, { rows, sheetName, fileName }: ExcelExportOptions) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  return res.send(buffer);
};

export const sendPdfTableExport = (
  res: Response,
  { title, headers, widths, rows, fileName }: PdfExportOptions
) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 20 });
  doc.pipe(res);

  const startX = 20;
  const maxY = doc.page.height - 30;
  let currentY = 20;

  const renderHeader = () => {
    doc.fontSize(14).font("Helvetica-Bold").text(title, startX, currentY);
    currentY += 24;
    doc.fontSize(8).font("Helvetica-Bold");

    let x = startX;
    headers.forEach((header, index) => {
      doc.text(header, x, currentY, { width: widths[index] });
      x += widths[index];
    });

    currentY += 16;
    doc
      .moveTo(startX, currentY - 4)
      .lineTo(startX + widths.reduce((total, width) => total + width, 0), currentY - 4)
      .stroke();
    doc.font("Helvetica");
  };

  renderHeader();

  rows.forEach((row) => {
    const values = headers.map((header) => String(row[header] ?? "-"));
    const rowHeight =
      Math.max(...values.map((value, index) => doc.heightOfString(value, { width: widths[index], align: "left" }))) + 6;

    if (currentY + rowHeight > maxY) {
      doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
      currentY = 20;
      renderHeader();
    }

    let x = startX;
    values.forEach((value, index) => {
      doc.fontSize(7).text(value, x, currentY, { width: widths[index] });
      x += widths[index];
    });

    currentY += rowHeight;
  });

  doc.end();
};
