// Enhanced voice-to-form functionality
function handleTranscriptionComplete(transcript, parsedData) {
    // Enhanced voice-to-form parsing
    const updatedForm = {
      ...form,
      description: transcript,
      ...(parsedData?.issue_type ? { issue_type: parsedData.issue_type } : {}),
      ...(parsedData?.severity ? { severity: parsedData.severity } : {}),
      ...(parsedData?.location_name ? { location_name: parsedData.location_name } : {}),
      ...(parsedData?.address ? { address: parsedData.address } : {}),
      ...(parsedData?.city ? { city: parsedData.city } : {}),
      ...(parsedData?.state ? { state: parsedData.state } : {}),
      ...(parsedData?.pincode ? { pincode: parsedData.pincode } : {}),
      ...(parsedData?.district_code ? { district_code: parsedData.district_code } : {}),
    };
    
    setForm(updatedForm);
    
    // Show success message with what was filled
    const filledFields = [];
    if (parsedData?.issue_type) filledFields.push('Issue Type');
    if (parsedData?.severity) filledFields.push('Severity');
    if (parsedData?.location_name) filledFields.push('Location');
    if (parsedData?.address) filledFields.push('Address');
    if (parsedData?.city) filledFields.push('City');
    if (parsedData?.pincode) filledFields.push('Pincode');
    
    if (filledFields.length > 0) {
      showToast(`Voice input filled: ${filledFields.join(', ')}`, 'success');
    } else {
      showToast('Voice transcribed successfully!', 'success');
    }
  }