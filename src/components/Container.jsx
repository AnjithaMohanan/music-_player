import { useState, useEffect } from "react";
import Dexie from "dexie";

const Container = () => {
  const [uploadedFile, setUploadedFile] = useState({
    file: null,
    success: false,
  });
  const [playlist, setPlaylist] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  const db = new Dexie("audioPlayerDatabase");
  db.version(1).stores({
    songs: "++id, name, song",
    playbackState: "id, currentSongIndex",
  });

  const resetDB = () => {
    db.delete().then(() => {
      window.location.reload(false);
    });
  };

  const onFileChange = (event) => {
    setUploadedFile({ file: event.target.files[0], success: false });
  };

  const getSongs = async () => {
    try {
      const songs = await db.songs.toArray();
      if (songs.length > 0) {
        setPlaylist(songs);
        const lastPlaybackState = await db.playbackState.get(1);
        if (lastPlaybackState) {
          setCurrentSongIndex(lastPlaybackState.currentSongIndex);
        }
      }
    } catch (e) {
      console.error("Error fetching songs:", e);
    }
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const onFileUpload = () => {
    if (uploadedFile.file) {
      getBase64(uploadedFile.file).then((res) => {
        db.songs
          .add({
            name: uploadedFile.file.name,
            song: res,
          })
          .then(() => {
            setUploadedFile({ file: null, success: true });
            getSongs();
          })
          .catch((e) => alert(`Upload Unsuccessful. Error: ${e}`));
      });
    }
  };

  useEffect(() => {
    getSongs();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <div className="upload-section">
          <h3>Steps:</h3>
          <ol>
            <li>Upload an audio file.</li>
            <li>After a successful upload, listen to the audio.</li>
            <li>Use the reset button to reset the database.</li>
          </ol>
          <input
            type="file"
            name="song"
            id="song"
            accept="audio/*"
            onChange={onFileChange}
          />
          <button onClick={onFileUpload}>Upload</button>
        </div>
        <div className="play-section">
          <h3>{playlist.length > 0 ? "Play the song" : "Upload a song"}</h3>
          {playlist.length > 0 && (
            <div>
              <p>{playlist[currentSongIndex].name}</p>
              <audio
                src={playlist[currentSongIndex].song}
                controls
                onEnded={() => {
                  setCurrentSongIndex(
                    (prevIndex) => (prevIndex + 1) % playlist.length
                  );
                  db.playbackState.put({
                    id: 1,
                    currentSongIndex: (currentSongIndex + 1) % playlist.length,
                  });
                }}
              ></audio>
            </div>
          )}
          <button onClick={resetDB}>Reset</button>
        </div>
      </div>
    </div>
  );
};

export default Container;
