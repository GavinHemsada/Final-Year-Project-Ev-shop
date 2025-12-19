import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileTextIcon } from "@/assets/icons/icons";

interface ReportGeneratorProps {
  data: any[];
  columns: { header: string; dataKey: string }[];
  title: string;
  filename: string;
  className?: string;
}

export const ReportGeneratorButton: React.FC<ReportGeneratorProps> = ({
  data,
  columns,
  title,
  filename,
  className,
}) => {
  const generatePDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    // Date
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Prepare data
    const tableData = data.map((row) =>
      columns.map((col) => {
        // Handle nested properties (e.g., 'user.name')
        const keys = col.dataKey.split(".");
        let value = row;
        for (const key of keys) {
            value = value ? value[key] : "";
        }
        return value;
      })
    );

    const tableHeaders = columns.map((col) => col.header);

    // Generate Table
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
    });

    // Save
    doc.save(`${filename}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors ${className}`}
      disabled={!data || data.length === 0}
      title="Generate PDF Report"
    >
      <FileTextIcon className="w-5 h-5" />
      <span>Generate Report</span>
    </button>
  );
};
