Deno.serve(async (req) => {
  try {
    // Logo data - we'll create a simple JSON with logo URLs and info
    const logoData = {
      logos: [
        {
          name: 'Full Logo - Light Background',
          url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png',
          description: 'Use on light backgrounds, PNG format with transparency'
        },
        {
          name: 'Full Logo - Dark Background',
          url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png',
          description: 'Use on dark backgrounds, PNG format with transparency'
        }
      ],
      guidelines: {
        minimumSize: '100px width',
        clearSpace: '10% of logo width on all sides',
        colorVariations: 'Full color only - no color modifications allowed',
        usage: 'Use full logo for website headers, marketing materials, and official communications'
      },
      contact: 'For media inquiries and logo usage questions: press@nexusvectis.com'
    };

    // Create a text file with logo information and download links
    let content = 'NEXUSVECTIS LOGO PACKAGE\n';
    content += '=========================\n\n';
    content += 'LOGOS INCLUDED:\n\n';
    
    logoData.logos.forEach((logo, idx) => {
      content += `${idx + 1}. ${logo.name}\n`;
      content += `   Description: ${logo.description}\n`;
      content += `   Download: ${logo.url}\n\n`;
    });

    content += '\nLOGO GUIDELINES:\n';
    content += `- Minimum Size: ${logoData.guidelines.minimumSize}\n`;
    content += `- Clear Space: ${logoData.guidelines.clearSpace}\n`;
    content += `- Colors: ${logoData.guidelines.colorVariations}\n`;
    content += `- Usage: ${logoData.guidelines.usage}\n\n`;
    content += `Contact: ${logoData.contact}\n`;

    // Return as downloadable text file
    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename=NexusVectis-Logo-Package.txt'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});