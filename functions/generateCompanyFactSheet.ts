import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;

    // Header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.text('NexusVectis', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Next-Generation Fleet Intelligence Platform', pageWidth / 2, yPos, { align: 'center' });
    
    // Add line
    yPos += 12;
    pdf.setDrawColor(0, 122, 204);
    pdf.line(20, yPos, pageWidth - 20, yPos);
    
    // Company Overview
    yPos += 15;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Company Overview', 20, yPos);
    
    yPos += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const companyText = 'NexusVectis is a Copenhagen-based logistics intelligence company founded in January 2026. We build AI-powered fleet management software that enables logistics operators to control their entire fleet operations using natural language commands.';
    const companyLines = pdf.splitTextToSize(companyText, pageWidth - 40);
    pdf.text(companyLines, 20, yPos);
    yPos += (companyLines.length * 5) + 10;

    // Key Facts
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Key Facts', 20, yPos);
    
    yPos += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    const facts = [
      'Founded: January 2026',
      'Headquarters: Copenhagen, Denmark',
      'Team: Lean, focused team with deep logistics expertise',
      'Technology: Mistral 7B fine-tuned for fleet operations',
      'Supported Transport Modes: Trucks, Ships, Drones, Trains, Aircraft',
      'Tracking Technologies: GPS, AIS, ADS-B, LoRa, RFID',
      'Key Features: Natural Language Commands, Real-time Tracking, Predictive Analytics'
    ];

    facts.forEach(fact => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text('• ' + fact, 25, yPos);
      yPos += 8;
    });

    // Core Features
    yPos += 5;
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Core Features', 20, yPos);
    
    yPos += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    const features = [
      'FLEET AI: Natural language command interface for fleet control',
      'Live Tracking: Real-time position, speed, heading for all transport modes',
      'Predictive Analytics: ETA prediction, maintenance forecasting, demand forecasting',
      'AI Optimization: Route optimization, fuel efficiency, cost reduction',
      'Security: Military-grade encryption, role-based access control, audit logging',
      'Integrations: REST API, webhooks, pre-built connectors'
    ];

    features.forEach(feature => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text('• ' + feature, 25, yPos);
      yPos += 8;
    });

    // Contact
    yPos += 10;
    if (yPos > pageHeight - 40) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Contact Information', 20, yPos);
    
    yPos += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    pdf.text('Email: press@nexusvectis.com', 20, yPos);
    yPos += 8;
    pdf.text('Website: www.nexusvectis.com', 20, yPos);
    yPos += 8;
    pdf.text('Location: Copenhagen, Denmark', 20, yPos);

    // Generate PDF
    const pdfBytes = pdf.output('arraybuffer');
    
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=NexusVectis-Company-Fact-Sheet.pdf'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});