import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { file_urls } = body;

    if (!file_urls || file_urls.length === 0) {
      return Response.json({ processed_files: [] });
    }

    const processedFiles = [];

    for (const fileUrl of file_urls) {
      try {
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
          console.error(`Failed to fetch file: ${fileUrl}`);
          continue;
        }

        const contentType = fileResponse.headers.get('content-type') || '';
        let content = '';
        let fileType = 'unknown';

        // Handle different file types
        if (contentType.includes('text') || fileUrl.endsWith('.txt') || fileUrl.endsWith('.csv') || fileUrl.endsWith('.json') || fileUrl.endsWith('.js') || fileUrl.endsWith('.ts') || fileUrl.endsWith('.html') || fileUrl.endsWith('.css') || fileUrl.endsWith('.xml') || fileUrl.endsWith('.md')) {
          content = await fileResponse.text();
          fileType = 'text';
        } else if (contentType.includes('pdf') || fileUrl.endsWith('.pdf')) {
          // For PDF files, fetch and attempt to extract text (basic)
          const arrayBuffer = await fileResponse.arrayBuffer();
          // Try basic PDF text extraction by converting to string
          const bytes = new Uint8Array(arrayBuffer);
          let textContent = '';
          for (let i = 0; i < bytes.length; i++) {
            const byte = bytes[i];
            if (byte >= 32 && byte <= 126) {
              textContent += String.fromCharCode(byte);
            } else if (byte === 10 || byte === 13) {
              textContent += '\n';
            }
          }
          content = textContent || '[PDF content - text extraction not available, but file was processed]';
          fileType = 'pdf';
        } else if (contentType.includes('json') || fileUrl.endsWith('.json')) {
          content = await fileResponse.text();
          fileType = 'json';
          try {
            // Validate JSON
            JSON.parse(content);
          } catch (e) {
            console.error('Invalid JSON file:', e);
          }
        } else if (contentType.includes('image') || fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          // For images, send to InvokeLLM with vision capability
          fileType = 'image';
          content = `[Image file - will be processed with vision: ${fileUrl}]`;
        } else if (contentType.includes('spreadsheet') || fileUrl.endsWith('.xlsx') || fileUrl.endsWith('.xls') || fileUrl.endsWith('.csv')) {
          // For spreadsheets/CSV
          if (fileUrl.endsWith('.csv') || contentType.includes('csv')) {
            content = await fileResponse.text();
            fileType = 'csv';
          } else {
            content = '[Excel/Spreadsheet file - requires specialized parsing]';
            fileType = 'spreadsheet';
          }
        } else {
          // Try as text by default
          content = await fileResponse.text();
          fileType = 'text';
        }

        // Limit content size (first 50KB)
        if (content.length > 50000) {
          content = content.substring(0, 50000) + '\n\n[... file content truncated - showing first 50KB ...]';
        }

        processedFiles.push({
          url: fileUrl,
          type: fileType,
          content: content,
          size_bytes: content.length
        });
      } catch (error) {
        console.error(`Error processing file ${fileUrl}:`, error);
        processedFiles.push({
          url: fileUrl,
          type: 'error',
          content: `Error reading file: ${error.message}`,
          size_bytes: 0
        });
      }
    }

    return Response.json({ processed_files: processedFiles });
  } catch (error) {
    console.error('processFileContent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});