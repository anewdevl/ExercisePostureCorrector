import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { api } from "./api"
import ProviderNotice from "./ProviderNotice"

export default function ChatbotUI() {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function send(event) {
    event.preventDefault()
    if (!draft.trim() || busy) return
    setBusy(true); setError('')
    const content = draft.trim()
    try {
      const data = await api('/chat', { method: 'POST', body: { message: content, history: messages.slice(-20) } })
      setMessages(items => [...items, { role: 'user', content }, { role: 'assistant', content: data.response }])
      setDraft('')
    } catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  return <main className="app-page chat-page">
    <div className="page-heading"><div><p className="eyebrow">A LITTLE GUIDANCE</p><h1>Fitness assistant</h1><p>Talk through your routine, exercise choices, and training goals.</p></div>
      <button disabled={busy || !messages.length} onClick={() => setMessages([])}>Clear chat</button></div>
    <ProviderNotice />
    <div className="panel"><div className="chat-messages" role="log" aria-live="polite">
      {!messages.length && <p className="muted">Try “Help me plan three training days this week.”</p>}
      {messages.map((message, i) => <article className={'message ' + message.role} key={i}><strong>{message.role === 'user' ? 'You' : 'Assistant'}</strong><ReactMarkdown>{message.content}</ReactMarkdown></article>)}
      {busy && <p role="status">Thinking…</p>}
    </div>
    {error && <p role="alert" className="error">{error}</p>}
    <form onSubmit={send} className="chat-input"><label htmlFor="message" className="sr-only">Your message</label>
      <input id="message" value={draft} maxLength={4000} disabled={busy} onChange={e => setDraft(e.target.value)} placeholder="Ask about your workout…" required />
      <button className="btn" disabled={busy || !draft.trim()}>{busy ? 'Sending…' : 'Send'}</button></form></div>
  </main>
}
