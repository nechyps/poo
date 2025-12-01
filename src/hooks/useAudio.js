import { useState, useEffect, useRef } from 'react'
import clickSound from '../assets/music/mixkit-select-click-1109.wav'
import gameMusic from '../assets/music/game-gaming-minecraft-background-music-377647 (1).mp3'

const STORAGE_KEY = 'tamagotchi_audio_settings'

// Глобальные экземпляры аудио для предотвращения дублирования
let globalMusicAudio = null
let globalClickAudio = null

export function useAudio() {
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

  // Initialize audio (only once, используем глобальные экземпляры)
  useEffect(() => {
    // Используем глобальный экземпляр музыки, если он уже создан
    if (!globalMusicAudio) {
      globalMusicAudio = new Audio(gameMusic)
      globalMusicAudio.loop = true
      globalMusicAudio.volume = musicVolume
      globalMusicAudio.preload = 'auto'
    }
    musicRef.current = globalMusicAudio

    // Используем глобальный экземпляр клика, если он уже создан
    if (!globalClickAudio) {
      globalClickAudio = new Audio(clickSound)
      globalClickAudio.preload = 'auto'
      globalClickAudio.volume = sfxVolume
    }
    clickAudioRef.current = globalClickAudio
  }, [])

  // Update music volume
  useEffect(() => {
    if (globalMusicAudio) {
      globalMusicAudio.volume = musicVolume
    }
  }, [musicVolume])

  // Update SFX volume
  useEffect(() => {
    if (globalClickAudio) {
      globalClickAudio.volume = sfxVolume
    }
  }, [sfxVolume])

  // Handle music toggle (используем глобальный экземпляр)
  useEffect(() => {
    if (globalMusicAudio) {
      if (isMusicOn) {
        // Если музыка включена, запускаем её (если ещё не играет)
        if (globalMusicAudio.paused) {
          globalMusicAudio.play().catch(error => {
            console.log('Music play prevented:', error)
          })
        }
      } else {
        // Если музыка выключена, останавливаем её
        globalMusicAudio.pause()
      }
    }
  }, [isMusicOn])

  const playClickSound = () => {
    if (isSfxOn && globalClickAudio) {
      // Создаем клон аудио элемента для каждого клика, чтобы избежать наложения звуков
      const audioClone = globalClickAudio.cloneNode()
      audioClone.volume = sfxVolume
      audioClone.currentTime = 0
      audioClone.play().catch(error => {
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

  const startMusic = () => {
    if (globalMusicAudio && isMusicOn) {
      globalMusicAudio.play().catch(error => {
        console.log('Music start prevented:', error)
      })
    }
  }

  const stopMusic = () => {
    if (globalMusicAudio) {
      globalMusicAudio.pause()
      globalMusicAudio.currentTime = 0
    }
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
    playClickSound,
    startMusic,
    stopMusic
  }
}

