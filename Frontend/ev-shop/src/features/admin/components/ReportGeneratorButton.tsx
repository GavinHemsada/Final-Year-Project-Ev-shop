import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { FileTextIcon, ChevronDownIcon } from "@/assets/icons/icons";

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getProcessedData = () => {
    return data.map((row) => {
      const rowData: { [key: string]: any } = {};
      columns.forEach((col) => {
        const keys = col.dataKey.split(".");
        let value = row;
        for (const key of keys) {
          value = value ? value[key] : "";
        }
        rowData[col.header] = value;
      });
      return rowData;
    });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = data.map((row) =>
      columns.map((col) => {
        const keys = col.dataKey.split(".");
        let value = row;
        for (const key of keys) {
          value = value ? value[key] : "";
        }
        return value;
      })
    );

    const tableHeaders = columns.map((col) => col.header);

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`${filename}.pdf`);
    setIsOpen(false);
  };

  const generateCSV = () => {
    const processedData = getProcessedData();
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  const generateExcel = () => {
    const processedData = getProcessedData();
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors ${className}`}
        disabled={!data || data.length === 0}
        title="Generate Report"
      >
        <FileTextIcon className="w-5 h-5" />
        <span>Generate Report</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <button
            onClick={generatePDF}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <span className="text-red-500 font-bold">PDF</span> Export as PDF
          </button>
          <button
            onClick={generateExcel}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <span className="text-green-600 font-bold">XLS</span> Export as Excel
          </button>
          <button
            onClick={generateCSV}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <span className="text-blue-500 font-bold">CSV</span> Export as CSV
          </button>
        </div>
      )}
    </div>
  );
};
