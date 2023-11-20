import { useEffect, useState } from "react";
import "./App.css";
import { AudioRecorder } from "react-audio-voice-recorder";
import { Github } from "lucide-react";

const emotions = ["😡", "😆", "🤢", "😮", "😌"];

function App() {
  const [audio, setAudio] = useState<string>("");
  const [emojiIdx, setEmojiIdx] = useState(0);

  const addAudioElement = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setAudio(url);
  };

  const detectEmotion = async () => {
    try {
      const formData = new FormData();
      const audioBlob = await fetch(audio).then((res) => res.blob());
      formData.append(
        "voice",
        new Blob([audioBlob], { type: "audio/wav" }),
        "audio.wav"
      );

      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Predictions:", data.predictions);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    const cb = () => setEmojiIdx((p) => (p + 1) % emotions.length);
    const interval = setInterval(cb, 400);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const isAudio = audio !== "";

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontWeight: "500",
          }}
        >
          {!isAudio ? "Start by tapping on Mic" : "Audio Recorded"}
        </h2>
        <AudioRecorder
          onRecordingComplete={addAudioElement}
          audioTrackConstraints={{
            noiseSuppression: true,
            echoCancellation: true,
          }}
          showVisualizer
        />
        {isAudio && <audio src={audio} controls />}
        {isAudio && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginTop: "1rem",
              fontSize: "1.2rem",
            }}
          >
            <button onClick={detectEmotion}>
              {emotions[emojiIdx]}&nbsp;&nbsp;Detect Emotion
            </button>
            <button
              onClick={() => {
                setAudio("");
              }}
            >
              ❌&nbsp;&nbsp;Cancel
            </button>
          </div>
        )}
      </div>
      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          display: "flex",
          gap: "1rem",
          fontSize: "1.2rem",
        }}
      >
        <a
          href="#"
          style={{
            display: "flex",
            color: "white",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Github /> Code
        </a>
      </div>
    </>
  );
}

export default App;
