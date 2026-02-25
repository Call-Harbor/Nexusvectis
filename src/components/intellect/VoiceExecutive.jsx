import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function VoiceExecutive({ onVoiceCommand, isListening, setIsListening }) {
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'da-DK';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            processVoiceCommand(transcript);
          } else {
            interimTranscript += transcript;
          }
        }
        setTranscript(interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          toast.error(`Stemme-fejl: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setTranscript('');
      };

      recognitionRef.current = recognition;
    }
  }, [setIsListening]);

  const processVoiceCommand = (text) => {
    const command = text.toLowerCase().trim();
    setTranscript('');

    // Voice command patterns
    const patterns = {
      'vis flåde status': 'SHOW_FLEET_STATUS',
      'flåde status': 'SHOW_FLEET_STATUS',
      'analyser dsv': 'ANALYZE_DSV',
      'analyser dsv som kunde': 'ANALYZE_DSV',
      'optimer ruter': 'OPTIMIZE_ROUTES',
      'optimer ruter for trafik': 'OPTIMIZE_ROUTES',
      'aktiver swarm': 'ACTIVATE_SWARM',
      'threat status': 'THREAT_STATUS',
      'sikkerhedsstatus': 'THREAT_STATUS',
    };

    let detectedCommand = null;
    for (const [pattern, cmd] of Object.entries(patterns)) {
      if (command.includes(pattern)) {
        detectedCommand = cmd;
        break;
      }
    }

    if (detectedCommand) {
      onVoiceCommand(detectedCommand, command);
      speak(`Aktiverer ${command}`);
    } else {
      speak('Kommando ikke genkendt. Prøv "vis flåde status" eller "analyser DSV"');
    }
  };

  const speak = (text) => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'da-DK';
    utterance.rate = 1;
    synthRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current.start();
      speak('Lytter nu. Hvad kan jeg gøre for dig?');
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3 items-end">
      {/* Listening indicator */}
      {isListening && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="bg-slate-800 border border-cyan-500/50 rounded-xl p-4 max-w-xs"
        >
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-red-500"
            />
            <span className="text-sm font-semibold text-cyan-400">Lytter...</span>
          </div>
          {transcript && (
            <p className="text-xs text-slate-300 italic">{transcript}</p>
          )}
        </motion.div>
      )}

      {/* Voice button */}
      <Button
        onClick={toggleListening}
        className={`rounded-full w-16 h-16 flex items-center justify-center transition-all ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600'
        }`}
        title={isListening ? 'Stop lytning' : 'Start stemmestyring'}
      >
        {isListening ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </Button>

      {/* Voice hint */}
      <div className="text-xs text-slate-400 text-right max-w-xs">
        <p>💬 Sig: "Nexus, vis flåde status"</p>
      </div>
    </div>
  );
}