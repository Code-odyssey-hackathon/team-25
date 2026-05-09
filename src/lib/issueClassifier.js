/**
 * JanaVaani — Issue Classifier
 * 
 * Classifies infrastructure issues from uploaded images using AI
 */

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = (error) => reject(error);
});

export async function classifyIssue(file) {
  if (!file) {
    return { 
      success: false, 
      issue_type: 'OTHER', 
      confidence: 0,
      description: 'No file to classify' 
    };
  }

  try {
    const base64String = await fileToBase64(file);

    const response = await fetch('/api/classify-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64: base64String, fileName: file.name }),
    });

    if (!response.ok) {
      console.error('Classification API error:', response.status);
      return { 
        success: false, 
        issue_type: 'OTHER', 
        confidence: 0,
        description: 'Classification failed - service unavailable' 
      };
    }

    const data = await response.json();
    console.log('[Classify] Issue classification result:', data);

    return {
      success: data.success,
      issue_type: data.issue_type,
      confidence: data.confidence,
      description: data.description
    };

  } catch (error) {
    console.error('Issue classification error:', error);
    return { 
      success: false, 
      issue_type: 'OTHER', 
      confidence: 0,
      description: 'Classification check failed' 
    };
  }
}