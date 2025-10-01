import pyaudio
import wave

def record_audio(duration, filename):
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 2
    RATE = 44100
    RECORD_SECONDS = duration
    audio = pyaudio.PyAudio()

    record = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)
    
    print("Recording...")
    frames = []
    for i in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
        data = record.read(CHUNK)
        frames.append(data)
    print("Recording finished.")
    
    record.stop_stream()
    record.close()
    audio.terminate()
    
    wave_file = wave.open(filename, 'wb')
    wave_file.setnchannels(CHANNELS)
    wave_file.setsampwidth(audio.get_sample_size(FORMAT))
    wave_file.setframerate(RATE)
    wave_file.writeframes(b''.join(frames))
    wave_file.close()

    return filename

if __name__ == "__main__":
    record_audio(10, "record1.wav")