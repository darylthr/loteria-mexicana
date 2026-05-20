import { useEffect, useRef, useState } from 'react'

export function useBackgroundMusic(src: string, defaultVolume = 0.4) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [muted, setMuted] = useState(false)
  const [volume, setVolumeState] = useState(defaultVolume)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = defaultVolume
    audioRef.current = audio

    // Browsers block autoplay until a user gesture; attempt silently
    audio.play()
      .then(() => setStarted(true))
      .catch(() => {})

    return () => { audio.pause(); audio.src = '' }
  }, [src])

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted
  }, [muted])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const toggleMute = () => {
    // If autoplay was blocked, start playback on first user interaction
    if (!started && audioRef.current) {
      audioRef.current.play().then(() => setStarted(true)).catch(() => {})
    }
    setMuted(m => !m)
  }

  const setVolume = (v: number) => {
    setVolumeState(v)
    if (!started && audioRef.current) {
      audioRef.current.play().then(() => setStarted(true)).catch(() => {})
    }
  }

  return { muted, volume, toggleMute, setVolume }
}
