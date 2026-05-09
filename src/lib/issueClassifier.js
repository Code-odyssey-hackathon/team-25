/**
 * JanaVaani — Issue Classifier
 *
 * Classifies infrastructure issues from uploaded images using AI
 * with robust timeout handling and fallback strategies.
 */

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = (error) => reject(error);
});

const CLASSIFY_TIMEOUT = 15_000; // 15 seconds total for classification

/**
 * Classify an infrastructure issue from an image.
 * @param {File} file - The image file to classify
 * @returns {Promise<Object>} - { success, issue_type, confidence, description, method }
 */
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CLASSIFY_TIMEOUT);

    const response = await fetch('/api/classify-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64: base64String, fileName: file.name }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Classification API error:', response.status);
      return {
        success: false,
        issue_type: 'OTHER',
        confidence: 0,
        description: `Classification API returned ${response.status}. Please select issue type manually.`,
        method: 'api-error'
      };
    }

    const data = await response.json();
    console.log('[Classify] Issue classification result:', data);

    // Handle manual-fallback and error-fallback methods gracefully
    // These are successful responses from the API indicating AI was unavailable
    if (data.method === 'manual-fallback' || data.method === 'error-fallback') {
      return {
        success: true, // Not a hard failure — just needs manual input
        issue_type: 'OTHER',
        confidence: 0,
        description: data.description || 'Please select the issue type manually.',
        method: data.method,
        aiStatus: data.aiStatus || 'unavailable',
        suggestedActions: data.suggestedActions || []
      };
    }

    return {
      success: data.success !== false,
      issue_type: data.issue_type || 'OTHER',
      confidence: data.confidence || 0,
      description: data.description || '',
      method: data.method || 'unknown'
    };

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Classification request timed out');
      return {
        success: false,
        issue_type: 'OTHER',
        confidence: 0,
        description: 'Classification timed out. Please select the issue type manually.',
        method: 'timeout'
      };
    }
    console.error('Issue classification error:', error);
    return {
      success: false,
      issue_type: 'OTHER',
      confidence: 0,
      description: 'Classification service unavailable. Please select the issue type manually.',
      method: 'error'
    };
  }
}