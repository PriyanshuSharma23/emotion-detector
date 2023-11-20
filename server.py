from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import librosa
import io, soundfile
from pydub import AudioSegment
import os
from sklearn.preprocessing import StandardScaler as scaler

def save_bytes_as_wav(file_name, byte_data):
    try:
        # Assuming the byte_data represents the content of a WAV file
        with open(file_name, 'wb') as wav_file:
            wav_file.write(byte_data)
        print(f"WAV file '{file_name}' saved successfully.")
    except Exception as e:
        print(f"Error saving WAV file: {str(e)}")

app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "*"}})

model = joblib.load('speech_model.pkl')
def extract_feature(data, mfcc, chroma, mel):
    try:
        with soundfile.SoundFile(io.BytesIO(data)) as sound_file:
            X = sound_file.read(dtype="float32")
            X = librosa.to_mono(X)
            sample_rate = sound_file.samplerate

            if chroma:
                stft = np.abs(librosa.stft(X))

            result = np.array([])

            if mfcc:
                mfccs = np.mean(librosa.feature.mfcc(y=X, sr=sample_rate, n_mfcc=40).T, axis=0)
                result = np.hstack((result, mfccs))

            if chroma:
                chroma = np.mean(librosa.feature.chroma_stft(S=stft, sr=sample_rate).T, axis=0)
                result = np.hstack((result, chroma))

            if mel:
                mel = np.mean(librosa.feature.melspectrogram(y=X, sr=sample_rate).T, axis=0)
                result = np.hstack((result, mel))

            return result

    except Exception as e:
        print(f"Error in extract_feature: {str(e)}")
        return np.array([])

@app.route('/', methods=['GET'])
def home():
    return "<h1> API </h1>"

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'voice' not in request.files:
            return jsonify({'error': 'No voice file provided'})

        voice_data = request.files['voice'].read()

        audio = AudioSegment.from_file(io.BytesIO(voice_data), format="webm")
        wav_data = audio.export(format="wav").read()

        save_bytes_as_wav('test.wav', wav_data)

        features = [extract_feature(wav_data, mfcc=True, chroma=True, mel=True)]
        features = scaler().fit(features).transform(features)

        predictions = model.predict(features)

        return jsonify({'predictions': predictions.tolist() if predictions else 'No predictions available'})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
