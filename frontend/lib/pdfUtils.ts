import jsPDF from 'jspdf';
import { generateUrl } from './utils';

export const downloadFormAsPDF = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Create PDF directly with jsPDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Add title
    const titleElement = element.querySelector('h1');
    if (titleElement) {
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(titleElement.textContent || 'Form Document', margin, yPosition);
      yPosition += 15;
    }

    // Add subtitle
    const subtitleElement = element.querySelector('p');
    if (subtitleElement) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(subtitleElement.textContent || '', margin, yPosition);
      yPosition += 10;
    }

    // Extract and add form data from cards
    const cards = element.querySelectorAll('[class*="card"]');
    for (const card of cards) {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      // Add card title (skip if this is the agreement card)
      const agreementDiv = card.querySelector('.mb-6.p-4.border.rounded-lg.bg-gray-50');
      if (!agreementDiv) {
        const cardTitle = card.querySelector('[class*="card-title"], h3, h4');
        if (cardTitle) {
          yPosition += 5;
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(cardTitle.textContent || '', margin, yPosition);
          yPosition += 8;
        }
      }

      // Special handling for agreement text
      if (agreementDiv) {
        const agreementTitle = agreementDiv.querySelector('h3');
        if (agreementTitle) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(agreementTitle.textContent || '', margin, yPosition);
          yPosition += 8;
        }

        const agreementParagraphs = agreementDiv.querySelectorAll('p');
        for (const p of agreementParagraphs) {
          const text = p.textContent?.trim();
          if (text) {
            // Check if we need a new page
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = margin;
            }

            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            const maxWidth = pageWidth - margin * 2;
            const lines = pdf.splitTextToSize(text, maxWidth);

            if (Array.isArray(lines)) {
              lines.forEach((line: string) => {
                pdf.text(line, margin, yPosition);
                yPosition += 4;
              });
            } else {
              pdf.text(text, margin, yPosition);
              yPosition += 4;
            }

            yPosition += 2; // Small gap between paragraphs
          }
        }
        yPosition += 5; // Gap after agreement text
        continue; // Skip normal label processing for this card
      }

      // Add card content
      const labels = card.querySelectorAll('label');
      for (const label of labels) {
        const labelText = label.textContent?.trim();
        const valueElement = label.nextElementSibling || label.parentElement?.querySelector('p, span');

        if (labelText && valueElement && valueElement.textContent) {
          const valueText = valueElement.textContent.trim();

          // Check if we need a new page
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${labelText}:`, margin, yPosition);

          pdf.setFont('helvetica', 'normal');
          const maxWidth = pageWidth - margin * 2;
          const lines = pdf.splitTextToSize(valueText, maxWidth - 40);

          if (Array.isArray(lines)) {
            lines.forEach((line: string) => {
              pdf.text(line, margin + 40, yPosition);
              yPosition += 5;
            });
          } else {
            pdf.text(valueText, margin + 40, yPosition);
            yPosition += 5;
          }

          yPosition += 3; // Small gap between fields
        }
      }

      // Handle images within this card
      const images = card.querySelectorAll('img');
      for (const img of images) {
        const imgSrc = img.getAttribute('src');
        const imgAlt = img.getAttribute('alt') || 'Image';

        if (imgSrc) {
          try {
            // Convert relative URLs to absolute backend URLs
            const absoluteUrl = generateUrl(imgSrc);

            // Check if we need a new page for the image
            if (yPosition > pageHeight - 50) {
              pdf.addPage();
              yPosition = margin;
            }

            // Load image and convert to base64
            const imgData = await loadImageAsBase64(absoluteUrl);

            // Add image label
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${imgAlt}:`, margin, yPosition);
            yPosition += 8;

            // Add image to PDF (max width 80mm, maintain aspect ratio)
            const imgWidth = 80;
            const imgHeight = 40; // Fixed height for signatures
            pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 5;

          } catch (error) {
            console.warn(`Failed to load image ${imgSrc}:`, error);
            // Add placeholder text if image fails to load
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`[Image: ${imgAlt} - Failed to load]`, margin, yPosition);
            yPosition += 8;
          }
        }
      }

      yPosition += 5; // Gap between cards
    }

    // Download the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Helper function to load image as base64
const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image to canvas
      ctx.drawImage(img, 0, 0);

      // Convert to base64 (try PNG first for signatures, fallback to JPEG)
      let dataURL: string;
      try {
        dataURL = canvas.toDataURL('image/png');
      } catch (pngError) {
        console.warn('PNG conversion failed, trying JPEG:', pngError);
        dataURL = canvas.toDataURL('image/jpeg', 0.8);
      }
      resolve(dataURL);
    };

    img.onerror = (error) => {
      console.error(`Failed to load image: ${url}`, error);
      reject(new Error(`Failed to load image: ${url}`));
    };

    img.src = url;
  });
};