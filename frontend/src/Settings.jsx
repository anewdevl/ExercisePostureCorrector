import { useEffect, useState } from 'react'
import { api } from './api'
import { providers } from './providers'

export default function Settings() {
  const [values, setValues] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    api('/settings', { signal: controller.signal }).then(setValues).catch(error => {
      if (error.name !== 'AbortError') setError(error.message)
    })
    return () => controller.abort()
  }, [])
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const data = await api('/settings', { method: 'PUT', body: {
        provider: values.provider, ...Object.fromEntries(providers.map(({ id }) => [id + 'Model', (values[id + 'Model'] || '').trim()])),
      } })
      setValues(data)
      setNotice(data.ready ? 'Provider saved. Future AI requests use this provider.' : 'Settings saved. Add the selected provider’s key and model, then restart after changing .env.')
    } catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  const selected = providers.find(item => item.id === values?.provider)
  return <main className="app-page settings-page"><p className="eyebrow">YOUR AI, YOUR CHOICE</p><h1>AI settings</h1>
    <p>Choose a cloud provider or Ollama on your local server. Requests never switch providers automatically.</p>
    {error && <p role="alert" className="error">{error}</p>}
    {!values ? <p role="status">{error ? 'Reload this page to retry.' : 'Loading settings…'}</p> :
      <form className="panel" onSubmit={save}><fieldset disabled={busy}>
        <label className="form-group">Provider<select value={values.provider} onChange={e => { setValues({ ...values, provider: e.target.value }); setNotice('') }}>
          {providers.map(item => <option key={item.id} value={item.id}>{item.name} — {item.id === 'ollama' ? 'local' : 'cloud'}</option>)}</select></label>
        <label className="form-group">{selected.name} model<input value={values[selected.id + 'Model'] || ''} maxLength={150} required onChange={e => setValues({ ...values, [selected.id + 'Model']: e.target.value })} placeholder="Exact model ID from this provider’s documentation" /></label>
        {selected.id === 'gemini' && <p className="muted">Testing suggestion: gemini-3.5-flash-lite. Free-tier access and limits depend on your API project; check Google AI Studio before sending requests.</p>}
        {selected.key && <>
          <p className="muted">{selected.name} key: {values[selected.id + 'KeyConfigured'] ? 'configured on the server' : 'not configured'}. Add <code>{selected.key}=your_key_here</code> to this file, save it, then restart the server:</p>
          <p className="env-path"><code>./flask-server/.env</code><br /><small>Relative to the AIWorkout-Merged project root.</small></p>
          <p className="muted">Keys stay in the server configuration and are sent only to their provider for authentication. They are never displayed or stored in this browser.</p>
          <p>Your prompts and entered planning details will be sent to {selected.company} when you generate a plan or send a chat message. API charges and quotas may apply.</p>
        </>}
        <p><a className="track-link" href={selected.docs} target="_blank" rel="noreferrer">API documentation ↗</a>{selected.keys && <> · <a className="track-link" href={selected.keys} target="_blank" rel="noreferrer">Get an API key ↗</a> · <a className="track-link" href={selected.pricing} target="_blank" rel="noreferrer">Pricing and limits ↗</a></>}</p>
        <button className="btn" type="submit">{busy ? 'Saving…' : 'Save provider'}</button>
      </fieldset></form>}
    {notice && <p role="status">{notice}</p>}
  </main>
}
