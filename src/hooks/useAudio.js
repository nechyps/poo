import { useState, useEffect, useRef } from 'react'
import clickSound from '../assets/music/mixkit-select-click-1109.wav'
import gameMusic from '../assets/music/game-gaming-minecraft-background-music-377647 (1).mp3'

const STORAGE_KEY = 'tamagotchi_audio_settings'

export function useAudio(autoplayMusic = false) {
  const [isMusicOn, setIsMusicOn] = useState(true)
  const [isSfxOn, setIsSfxOn] = useState(true)
  const [musicVolume, setMusicVolume] = useState(0.5)
  const [sfxVolume, setSfxVolume] = useState(0.5)
  
  const musicRef = useRef(null)
  const clickAudioRef = useRef(null)

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const settings = JSON.parse(saved)
        setIsMusicOn(settings.isMusicOn ?? true)
        setIsSfxOn(settings.isSfxOn ?? true)
        setMusicVolume(settings.musicVolume ?? 0.5)
        setSfxVolume(settings.sfxVolume ?? 0.5)
      }
    } catch (error) {
      console.error('Failed to load audio settings:', error)
    }
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        isMusicOn,
        isSfxOn,
        musicVolume,
        sfxVolume
      }))
    } catch (error) {
      console.error('Failed to save audio settings:', error)
    }
  }, [isMusicOn, isSfxOn, musicVolume, sfxVolume])

  // Initialize audio (only once)
  useEffect(() => {
    // Initialize music only if not already created
    if (!musicRef.current) {
      musicRef.current = new Audio(gameMusic)
      musicRef.current.loop = true
      musicRef.current.volume = musicVolume
      musicRef.current.preload = 'auto'
    }

    // Initialize click sound only if not already created
    if (!clickAudioRef.current) {
      clickAudioRef.current = new Audio(clickSound)
      clickAudioRef.current.preload = 'auto'
      clickAudioRef.current.volume = sfxVolume
    }

    // Start music automatically if autoplayMusic is true and music is enabled
    if (autoplayMusic && isMusicOn && musicRef.current) {
      musicRef.current.play().catch(error => {
        console.log('Autoplay prevented, user interaction required')
      })
    }

    return () => {
      // Don't destroy audio on unmount, just pause
      if (musicRef.current && !musicRef.current.paused) {
        musicRef.current.pause()
      }
    }
  }, [autoplayMusic, isMusicOn])

  // Update music volume
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = musicVolume
    }
  }, [musicVolume])

  // Update SFX volume
  useEffect(() => {
    if (clickAudioRef.current) {
      clickAudioRef.current.volume = sfxVolume
    }
  }, [sfxVolume])

  // Handle music toggle
  useEffect(() => {
    if (musicRef.current) {
      if (isMusicOn) {
        musicRef.current.play().catch(error => {
          console.log('Music play prevented:', error)
        })
      } else {
        musicRef.current.pause()
      }
    }
  }, [isMusicOn])

  const playClickSound = () => {
    if (isSfxOn && clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0
      clickAudioRef.current.play().catch(error => {
        console.log('Click sound prevented:', error)
      })
    }
  }

  const toggleMusic = () => {
    setIsMusicOn(prev => !prev)
  }

  const toggleSfx = () => {
    setIsSfxOn(prev => !prev)
  }

  return {
    isMusicOn,
    isSfxOn,
    musicVolume,
    sfxVolume,
    setMusicVolume,
    setSfxVolume,
    toggleMusic,
    toggleSfx,
    playClickSound
  }
}

