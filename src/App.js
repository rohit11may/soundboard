import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { BsPlus } from "react-icons/bs";
import { GiSpeaker } from "react-icons/gi";
import { AiOutlineStop } from "react-icons/ai";
import { useAudioRecorder } from "react-audio-voice-recorder";
import "./App.css";

function App() {
  const [sounds, setSounds] = useState([]);
  const [soundName, setSoundName] = useState("");

  const {
    startRecording,
    stopRecording,
    recordingBlob,
    isRecording,
    mediaRecorder,
  } = useAudioRecorder();

  useEffect(() => {
    fetchSounds();
  }, []);

  const fetchSounds = async () => {
    const { data } = await supabase.from("sounds").select("*");
    if (data) {
      setSounds(data);
    }
  };

  const handleRecord = () => {
    startRecording();
  };

  const handleStop = () => {
    stopRecording();
  };

  const handleSave = async () => {
    const { data, error } = await supabase
      .from("sounds")
      .insert([{ name: soundName }])
      .select();
    if (data) {
      const sound = data[0];
      console.log(recordingBlob);

      await supabase.storage
        .from("sounds")
        .upload(`${sound.id}.webm`, recordingBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "audio/webm",
        });

      setSounds((prevSounds) => [...prevSounds, sound]);
      setSoundName("");
    }
    if (error) {
      console.error("Error saving sound:", error);
    }
  };

  const handlePlay = async (sound) => {
    try {
      const { data, error } = await supabase.storage
        .from('sounds')
        .download(`${sound.id}.webm`);
  
      if (error) {
        console.error('Error downloading audio:', error);
        return;
      }
  
      const audioBlob = new Blob([data], { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
  
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };
  
  return (
    <div className="App">
      <h1 className="title">Soundboard</h1>
      <div className="soundboard">
        {sounds.map((sound) => (
          <button
            key={sound.id}
            className="sound-button"
            onClick={() => handlePlay(sound)}
          >
            <GiSpeaker className="speaker-icon" />
            {sound.name}
          </button>
        ))}
        {isRecording ? (
          <button className="stop-button" onClick={handleStop}>
            <AiOutlineStop className="stop-icon" />
          </button>
        ) : (
          <button className="add-sound-button" onClick={handleRecord}>
            <BsPlus className="plus-icon" />
          </button>
        )}
      </div>
      {isRecording && mediaRecorder && (
        <div className="recording-info">
          <p>Recording...</p>
          <p>Time: {mediaRecorder.current?.seconds}</p>
        </div>
      )}
      {recordingBlob && (
        <div className="save-container">
          <input
            type="text"
            placeholder="Enter sound name"
            value={soundName}
            onChange={(e) => setSoundName(e.target.value)}
            className="sound-name-input"
          />
          <button onClick={handleSave} className="save-button">
            Save
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
