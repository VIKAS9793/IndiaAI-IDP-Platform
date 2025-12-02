import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { TextBlock } from '../lib/api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker - use unpkg CDN with react-pdf's specific version to avoid mismatch
// react-pdf uses pdfjs-dist 5.4.296 internally, so we must match that version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentViewerProps {
    fileUrl: string;
    fileType: string;
    textBlocks?: TextBlock[];
    onBlockClick?: (block: TextBlock) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
    fileUrl,
    fileType,
    textBlocks = [],
    onBlockClick
}) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    // Draw bounding boxes on canvas
    useEffect(() => {
        if (!canvasRef.current || !pageRef.current || textBlocks.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Get the rendered PDF page dimensions
        const pageElement = pageRef.current.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement;
        if (!pageElement) return;

        // Set canvas size to match PDF rendering
        canvas.width = pageElement.width;
        canvas.height = pageElement.height;
        canvas.style.width = `${pageElement.offsetWidth}px`;
        canvas.style.height = `${pageElement.offsetHeight}px`;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw each bounding box
        textBlocks.forEach((block, index) => {
            const bbox = block.bbox;
            const isHovered = hoveredBlock === index;

            // Scale coordinates
            const scaleX = canvas.width / 1000; // Adjust based on your image dimensions
            const scaleY = canvas.height / 1000;

            const x = bbox.x * scaleX;
            const y = bbox.y * scaleY;
            const width = bbox.width * scaleX;
            const height = bbox.height * scaleY;

            // Draw rectangle
            ctx.strokeStyle = isHovered ? '#3b82f6' : '#22c55e';
            ctx.lineWidth = isHovered ? 3 : 2;
            ctx.strokeRect(x, y, width, height);

            // Fill with semi-transparent color on hover
            if (isHovered) {
                ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
                ctx.fillRect(x, y, width, height);
            }

            // Draw confidence badge
            if (block.confidence) {
                const confidence = Math.round(block.confidence * 100);
                const badgeText = `${confidence}%`;

                ctx.font = '12px monospace';
                ctx.fillStyle = isHovered ? '#3b82f6' : '#22c55e';
                ctx.fillText(badgeText, x, y - 5);
            }
        });
    }, [textBlocks, hoveredBlock, scale]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        // Find clicked block
        const scaleX = canvas.width / 1000;
        const scaleY = canvas.height / 1000;

        const clickedBlock = textBlocks.find(block => {
            const bx = block.bbox.x * scaleX;
            const by = block.bbox.y * scaleY;
            const bw = block.bbox.width * scaleX;
            const bh = block.bbox.height * scaleY;

            return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
        });

        if (clickedBlock && onBlockClick) {
            onBlockClick(clickedBlock);
        }
    };

    const handleCanvasHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        const scaleX = canvas.width / 1000;
        const scaleY = canvas.height / 1000;

        const hoveredIndex = textBlocks.findIndex(block => {
            const bx = block.bbox.x * scaleX;
            const by = block.bbox.y * scaleY;
            const bw = block.bbox.width * scaleX;
            const bh = block.bbox.height * scaleY;

            return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
        });

        setHoveredBlock(hoveredIndex >= 0 ? hoveredIndex : null);
    };

    const isPDF = fileType?.toLowerCase().includes('pdf');

    return (
        <div className="relative">
            {/* Controls */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                        disabled={pageNumber <= 1}
                        className="px-3 py-1 bg-white border rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm">
                        Page {pageNumber} of {numPages || 1}
                    </span>
                    <button
                        onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                        disabled={pageNumber >= numPages}
                        className="px-3 py-1 bg-white border rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                        className="px-3 py-1 bg-white border rounded"
                    >
                        -
                    </button>
                    <span className="text-sm">{Math.round(scale * 100)}%</span>
                    <button
                        onClick={() => setScale(Math.min(2.0, scale + 0.1))}
                        className="px-3 py-1 bg-white border rounded"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Document View */}
            <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                <div ref={pageRef} className="relative inline-block">
                    {isPDF ? (
                        <Document
                            file={fileUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            className="flex justify-center"
                        >
                            <Page
                                pageNumber={pageNumber}
                                scale={scale}
                                renderTextLayer={true}
                                renderAnnotationLayer={false}
                            />
                        </Document>
                    ) : (
                        <img
                            src={fileUrl}
                            alt="Document"
                            style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
                            className="max-w-full"
                        />
                    )}

                    {/* Bounding Box Overlay Canvas */}
                    {textBlocks.length > 0 && (
                        <canvas
                            ref={canvasRef}
                            className="absolute top-0 left-0 pointer-events-auto cursor-pointer"
                            onClick={handleCanvasClick}
                            onMouseMove={handleCanvasHover}
                            onMouseLeave={() => setHoveredBlock(null)}
                        />
                    )}
                </div>
            </div>

            {/* Legend */}
            {textBlocks.length > 0 && (
                <div className="mt-3 text-sm text-gray-600 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-green-500"></div>
                        <span>Detected Text</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 bg-blue-100"></div>
                        <span>Hovered/Selected</span>
                    </div>
                    <span className="text-xs">Click a box to highlight its text</span>
                </div>
            )}
        </div>
    );
};
