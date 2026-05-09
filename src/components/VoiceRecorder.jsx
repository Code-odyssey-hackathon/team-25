import { useState, useRef } from 'react';
import { useToast } from '../context/ToastContext';

export default function VoiceRecorder({ onTranscriptionComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const { showToast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      showToast('Could not access microphone. Please check permissions.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const response = await fetch('/api/voice-report', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to process audio');
      
      const data = await response.json();
      if (data.transcript) {
        showToast('Voice transcribed successfully!', 'success');
        onTranscriptionComplete(data.transcript, data.parsed_data);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      showToast('Transcription failed. Please try typing your description.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '1.5rem', border: '1px solid var(--color-glass-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '2rem' }}>🎙️</div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Voice Complaint (AI Powered)</h3>
          <p className="text-gray" style={{ margin: 0, fontSize: '0.85rem' }}>Speak in any of the 22 Indian languages. AI will transcribe and auto-fill the form.</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {!isRecording ? (
          <button 
            type="button"
            className="btn-primary" 
            onClick={startRecording}
            disabled={isProcessing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ef4444' }}
          >
            ⏺️ Start Recording
          </button>
        ) : (
          <button 
            type="button"
            className="btn-danger" 
            onClick={stopRecording}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'pulse 1.5s infinite' }}
          >
            ⏹️ Stop Recording
          </button>
        )}
        
        {isProcessing && <span style={{ color: '#f59e0b', fontSize: '0.9rem', fontWeight: 600 }}>⏳ Transcribing with Bhashini...</span>}
        {audioUrl && !isRecording && !isProcessing && (
          <audio controls src={audioUrl} style={{ height: 36, maxWidth: 200 }} />
        )}
      </div>
    </div>
  );
}
