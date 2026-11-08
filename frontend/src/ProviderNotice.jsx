import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from './api'
import { providers } from './providers'

export default function ProviderNotice() {
  const [settings, setSettings] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    api('/settings', { signal: controller.signal }).then(setSettings).catch(() => {})
    return () => controller.abort()
  }, [])
  return <p className="provider-notice">{settings ?
    <>AI: {providers.find(item => item.id === settings.provider)?.name || settings.provider} ({settings.provider === 'ollama' ? 'local' : 'cloud'}){!settings.ready && ' — configuration needed'}. </> : 'Check your AI provider before generating. '}
    <Link className="track-link" to="/settings">Provider settings</Link></p>
}
