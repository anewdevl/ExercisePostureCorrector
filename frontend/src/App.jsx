import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation } from "react-router-dom"
import Home from "./Home"
import Generate from "./Generate"
import ChatbotUI from "./ChatbotUI"
import WorkoutForm from "./WorkoutForm"
import WorkoutList from "./WorkoutList"
import { api } from "./api"
import logo from "./img/logo1.png"
import "./App.css"
import Training from "./Training"
import Settings from "./Settings"

function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setMenuOpen(false); window.scrollTo(0, 0) }, [pathname])
  return <header className={pathname === '/' ? '' : 'app-header'}>
    <Link to="/" className="logo" aria-label="AIWorkout home"><img src={logo} alt="AIWorkout" /></Link>
    <nav aria-label="Main navigation"><ul id="navigation" className={'navlist ' + (menuOpen ? 'open' : '')}>
      {[['/', 'Home'], ['/workouts', 'Plan'], ['/chat', 'Chat'], ['/generate', 'Generate'], ['/train', 'Train'], ['/history', 'History'], ['/settings', 'Settings']].map(([to, name]) =>
        <li key={to}><NavLink to={to} end>{name}</NavLink></li>)}
    </ul></nav>
    <div className="right-content">
      <Link to="/workouts" className="nav-btn">My Workouts</Link>
      <button id="menu-icon" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="navigation" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
    </div>
  </header>
}

function Workouts() {
  const [workouts, setWorkouts] = useState([])
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    api('/workouts', { signal: controller.signal }).then(data => setWorkouts(data.workouts))
      .catch(error => { if (error.name !== 'AbortError') setError(error.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [revision])
  return <main className="app-page">
    <div className="page-heading"><div><p className="eyebrow">YOUR ROUTINE</p><h1>My workouts</h1><p>Build, refine, and keep your training plans in one place.</p></div>
      <button className="btn" onClick={() => setEditing({})}>Create workout</button></div>
    {error && <div role="alert" className="error">{error} <button onClick={() => setRevision(v => v + 1)}>Retry</button></div>}
    {loading ? <p role="status">Loading workouts…</p> : <WorkoutList workouts={workouts} updateWorkout={setEditing} updateCallback={() => setRevision(v => v + 1)} />}
    {editing && <div className="panel editor"><h2>{editing.id ? 'Edit workout' : 'Create workout'}</h2>
      <WorkoutForm key={editing.id || 'new'} existingWorkout={editing} updateCallback={() => { setEditing(null); setRevision(v => v + 1) }} onCancel={() => setEditing(null)} />
    </div>}
  </main>
}

function TrainingRoute() {
  const location = useLocation()
  return <Training key={location.key} />
}

export default function App() {
  return <BrowserRouter><Navigation /><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/workouts" element={<Workouts />} />
    <Route path="/chat" element={<ChatbotUI />} />
    <Route path="/generate" element={<Generate />} />
    <Route path="/train" element={<TrainingRoute />} />
    <Route path="/history" element={<TrainingRoute />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="*" element={<main className="app-page"><h1>Page not found</h1><Link className="btn" to="/">Back home</Link></main>} />
  </Routes></BrowserRouter>
}
