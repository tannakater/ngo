import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
  margin?: number;
  displayValue?: boolean;
  background?: string;
  lineColor?: string;
}

export function Barcode({ 
  value, 
  width = 2, 
  height = 100, 
  fontSize = 20, 
  margin = 10, 
  displayValue = true, 
  background = "#ffffff", 
  lineColor = "#000000" 
}: BarcodeProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format: "CODE128",
          width,
          height,
          fontSize,
          margin,
          displayValue,
          background,
          lineColor
        });
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }
  }, [value, width, height, fontSize, margin, displayValue, background, lineColor]);

  return <svg ref={barcodeRef} />;
}
