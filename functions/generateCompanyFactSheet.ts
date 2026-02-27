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
    const companyText = 'NexusVectis is a Copenhagen-based logistics intelligence company founded in January 2026. We build AI-powered fleet management software that enables logistics operators to control their entire fleet operations using natural language commands. Developed by a lean team combining deep logistics expertise with cutting-edge AI capabilities, NexusVectis has achieved production readiness in just 8 weeks, demonstrating the power of focused innovation in the logistics sector.';
    const companyLines = pdf.splitTextToSize(companyText, pageWidth - 40);
    pdf.text(companyLines, 20, yPos);
    yPos += (companyLines.length * 5) + 10;

    // Key Facts
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Key Facts & Milestones', 20, yPos);
    
    yPos += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    const facts = [
      'Founded: January 2026 in Copenhagen, Denmark',
      'Development Timeline: 8-week sprint from concept to production',
      'Team: Specialized team combining logistics expertise with advanced AI',
      'Primary Technology: Mistral 7B fine-tuned on logistics data',
      'Transport Modes: Trucks, Ships, Drones, Trains, Aircraft',
      'Tracking: GPS, AIS, ADS-B, LoRa, RFID',
      'Production Status: 99.2% command accuracy achieved',
      'Architecture: Digital Twin Federation with GDPR compliance',
      'Predictive: ETA, maintenance (92% accuracy), demand forecasting'
    ];

    facts.forEach(fact => {
      if (yPos > pageHeight - 20) {
        pdf.addPage();
        yPos = 20;
      }
      const factLines = pdf.splitTextToSize(fact, pageWidth - 50);
      pdf.text(factLines, 25, yPos);
      yPos += (factLines.length * 4) + 3;
    });

    // AI Technology
    yPos += 5;
    if (yPos > pageHeight - 70) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('AI Technology & Innovation', 20, yPos);
    
    yPos += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    const aiTech = [
      'Base Model: Mistral 7B - lightweight language model optimized for efficiency',
      'Fine-tuning: Trained on logistics-specific datasets and operational protocols',
      'Natural Language: Understands complex multi-step logistics commands with context awareness',
      'Parallel Analysis: Runs 50+ concurrent AI analyses for simultaneous optimization',
      'Distributed Intelligence: Edge AI + central optimization for sub-second latency',
      'Autonomous Decisions: AI-powered recommendations for routes, maintenance, resources',
      'Federated Learning: Privacy-preserving AI that improves continuously',
      'Multi-Modal: Processes telemetry, GPS, AIS, weather, traffic, regulatory constraints'
    ];

    aiTech.forEach(tech => {
      if (yPos > pageHeight - 20) {
        pdf.addPage();
        yPos = 20;
      }
      const techLines = pdf.splitTextToSize(tech, pageWidth - 50);
      pdf.text(techLines, 25, yPos);
      yPos += (techLines.length * 4) + 3;
    });

    // Core Features
    yPos += 5;
    if (yPos > pageHeight - 70) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Core Platform Features', 20, yPos);
    
    yPos += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    const features = [
      'FLEET AI: Natural language control for entire fleet operations',
      'Real-Time Tracking: Visibility across all transport modes',
      'Predictive Maintenance: AI predicts needs 92% accurately in advance',
      'Route Optimization: Minimizes distance, fuel, and delivery times',
      'Digital Twin: Privacy-focused, GDPR-compliant architecture',
      'Security: AI-powered detection and response with zero-trust',
      'Cost Analysis: Real-time visibility with efficiency recommendations',
      'Integrations: REST API, webhooks, and ERP/WMS connectors'
    ];

    features.forEach(feature => {
      if (yPos > pageHeight - 20) {
        pdf.addPage();
        yPos = 20;
      }
      const featureLines = pdf.splitTextToSize(feature, pageWidth - 50);
      pdf.text(featureLines, 25, yPos);
      yPos += (featureLines.length * 4) + 3;
    });

    // Market Position & Impact
    yPos += 10;
    if (yPos > pageHeight - 70) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Market Position & Impact', 20, yPos);
    
    yPos += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    const impact = [
      'World\'s First: Only platform combining natural language control with multi-modal fleet tracking',
      'Development Speed: Achieved production-ready status in 8 weeks - unprecedented in logistics AI',
      'Accuracy: 99.2% command understanding rate in rigorous production testing',
      'Scalability: Architecture designed to handle thousands of concurrent fleets globally',
      'Sustainability: Green TMS capabilities reduce CO2 emissions through intelligent route optimization',
      'Accessibility: Makes advanced AI-driven fleet optimization accessible to logistics companies of all sizes'
    ];

    impact.forEach(item => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text('• ' + item, 25, yPos);
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
    pdf.text('Media & Press Contact', 20, yPos);
    
    yPos += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    pdf.text('Email: press@nexusvectis.com', 20, yPos);
    yPos += 8;
    pdf.text('Website: www.nexusvectis.com', 20, yPos);
    yPos += 8;
    pdf.text('Headquarters: Copenhagen, Denmark', 20, yPos);
    yPos += 8;
    pdf.text('Founded: January 2026', 20, yPos);

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