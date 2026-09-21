"use client";

import { useEffect, useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  pageNumber: number;
}

export default function PdfViewer({ url, pageNumber }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="w-full flex justify-center bg-gray-200 rounded overflow-hidden">
      <Document file={url} loading={<div className="p-10 text-gray-500">Đang tải slide PDF...</div>}>
        <Page 
          pageNumber={pageNumber} 
          width={containerWidth > 0 ? containerWidth : undefined}
          renderTextLayer={false} 
          renderAnnotationLayer={false} 
        />
      </Document>
    </div>
  );
}
