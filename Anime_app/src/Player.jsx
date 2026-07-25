import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Settings, 
  FastForward, Shield, Zap, Sparkles, Users 
} from 'lucide-react';

export default function Player({ 
  source, 
  title, 
  savedSpeed, 
  savedQuality, 
  onSpeedChange, 
  onQualityChange,
  watchTogetherActive,
  onSyncEvent 
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(savedSpeed || 1.0);
  const [quality, setQuality] = useState(savedQuality || '1080p');
  const [upscaleEnabled, setUpscaleEnabled] = useState(true);

  // Speed Options including high speed multipliers
  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0];
  const qualityOptions = ['1080p', '720p', '480p', '4K (Torrent)'];

  // Demo HLS / Video stream
  const sampleVideoUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handleSpeedSelect = (newSpeed) => {
    setSpeed(newSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
    onSpeedChange(newSpeed);
    if (watchTogetherActive && onSyncEvent) {
      onSyncEvent({ type: 'SPEED_CHANGE', speed: newSpeed });
    }
  };

  const handleSeamlessQualitySwitch = (newQuality) => {
    const savedTime = videoRef.current ? videoRef.current.currentTime : 0;
    const wasPlaying = isPlaying;
    setQuality(newQuality);
    onQualityChange(newQuality);

    // Seamlessly restore playback time without pausing
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = savedTime;
        if (wasPlaying) videoRef.current.play();
      }
    }, 50);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="player-container">
      {/* Video element with canvas upscale overlay simulated */}
      <video
        ref={videoRef}
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: upscaleEnabled ? 'contrast(1.08) saturate(1.15) sharpen(1px)' : 'none'
        }}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
      />

      {/* Anime4K AI Upscale Active Indicator */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        background: upscaleEnabled ? 'linear-gradient(135deg, #7c4dff, #00e676)' : 'rgba(0,0,0,0.6)',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backdropFilter: 'blur(8px)'
      }}>
        <Sparkles size={14} />
        {upscaleEnabled ? 'Anime4K AI Upscale ACTIVE (1080P/4K)' : 'Стандартное качество'}
      </div>

      {/* Watch Together Indicator */}
      {watchTogetherActive && (
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(124, 77, 255, 0.9)',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Users size={14} />
          Совместный просмотр (Синхронно)
        </div>
      )}

      {/* Overlay Player Controls */}
      <div className="player-controls">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <span style={{ fontSize: '13px', color: '#ccc' }}>
              {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
            </span>
          </div>

          {/* Speed Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#aaa', marginRight: '4px' }}>Скорость:</span>
            <div className="speed-selector">
              {speedOptions.map((s) => (
                <button
                  key={s}
                  className={`speed-btn ${speed === s ? 'active' : ''}`}
                  onClick={() => handleSpeedSelect(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Quality & Upscale Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              value={quality}
              onChange={(e) => handleSeamlessQualitySwitch(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '6px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {qualityOptions.map(q => <option key={q} value={q} style={{ background: '#181a22' }}>{q}</option>)}
            </select>

            <button
              onClick={() => setUpscaleEnabled(!upscaleEnabled)}
              title="Переключить AI Улучшение Качества"
              style={{
                background: upscaleEnabled ? '#7c4dff' : 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Zap size={14} /> AI 1080P
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
