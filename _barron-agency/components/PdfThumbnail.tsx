"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { FileIcon } from "../icons/FileIcon";
import { SpinnerIcon } from "../icons/SpinnerIcon";

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfThumbnailProps {
  url: string;
  width?: number;
  className?: string;
}

export function PdfThumbnail({
  url,
  width = 150,
  className = "",
}: PdfThumbnailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  function onLoadSuccess() {
    setIsLoading(false);
    setHasError(false);
  }

  function onLoadError() {
    setIsLoading(false);
    setHasError(true);
  }

  if (hasError) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center p-4 ${className}`}>
        <FileIcon className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-xs text-center text-muted-foreground">PDF</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex items-center justify-center overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <SpinnerIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <Document
        file={url}
        onLoadSuccess={onLoadSuccess}
        onLoadError={onLoadError}
        loading={null}
        error={null}
      >
        <Page
          pageNumber={1}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    </div>
  );
}
