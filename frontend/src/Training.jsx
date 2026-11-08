import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './Training.css'

async function request(path, body, signal) {
  let response
  try {
    response = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal || AbortSignal.timeout(20000),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Cannot reach the tracker. Check the server connection and try again.', { cause: error })
  }
  const data = await response.json().catch(() => null)
  if (!response.ok || !data) throw new Error(data?.error || 'The tracker could not complete this request.')
  return data
}

export default function Training() {
  const location = useLocation()
  const selected = location.state?.exercise
  const [page, setPage] = useState(location.pathname === '/history' ? 'history' : 'train')
  const [health, setHealth] = useState(null)
  const [exercise, setExercise] = useState(selected?.name || 'Squats')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [metrics, setMetrics] = useState(null)
  const [workouts, setWorkouts] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const exerciseChanged = useRef(false)
  const video = useRef(null)
  const canvas = useRef(null)
  const stream = useRef(null)
  const session = useRef(null)
  const timer = useRef(null)
  const controller = useRef(null)
  const mounted = useRef(true)
  const running = useRef(false)
  const generation = useRef(0)

  async function checkHealth() {
    setError('')
    try {
      const data = await request('/api/training/health')
      setHealth(data)
      if (selected?.trackingId) {
        const catalogResponse = await request('/api/catalog')
        const match = catalogResponse.exercises.find(item => item.id === selected.trackingId)
        if (match) setExercise(match.name)
      }
    }
    catch (error) { setError(error.message) }
  }
  useEffect(() => {
    mounted.current = true
    checkHealth()
    if (location.pathname === '/history') loadHistory()
    return () => {
      mounted.current = false
      generation.current += 1
      running.current = false
      clearTimeout(timer.current)
      controller.current?.abort()
      stream.current?.getTracks().forEach(track => track.stop())
      if (session.current) fetch('/api/training/sessions/' + session.current + '/end', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', keepalive: true,
      }).catch(() => {})
    }
  // Route changes remount this page; refs own the camera/session lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadHistory() {
    setHistoryLoading(true); setError('')
    try { const data = await request('/api/training/history'); setWorkouts(data.workouts) }
    catch (error) { setError(error.message) }
    finally { setHistoryLoading(false) }
  }

  function releaseCamera() {
    running.current = false
    clearTimeout(timer.current)
    controller.current?.abort()
    stream.current?.getTracks().forEach(track => track.stop())
    stream.current = null
    if (video.current) video.current.srcObject = null
  }

  async function stop() {
    generation.current += 1
    releaseCamera()
    setStatus('saving'); setError('')
    try {
      if (session.current) {
        const result = await request('/api/training/sessions/' + session.current + '/end', {})
        setNotice(result.saved ? 'Session saved to your history.' : result.message)
        session.current = null
      }
      setStatus('idle')
    } catch (error) { setError(error.message); setStatus('unsaved') }
  }

  async function capture() {
    if (!running.current || !video.current || !session.current) return
    if (video.current.readyState < 2) { timer.current = setTimeout(capture, 200); return }
    const target = canvas.current
    target.width = 640
    target.height = Math.round(640 * video.current.videoHeight / video.current.videoWidth)
    target.getContext('2d').drawImage(video.current, 0, 0, target.width, target.height)
    controller.current = new AbortController()
    const timeout = setTimeout(() => controller.current?.abort(), 20000)
    try {
      const data = await request('/api/training/sessions/' + session.current + '/frame',
        { image: target.toDataURL('image/jpeg', .75) }, controller.current.signal)
      if (running.current && mounted.current) setMetrics(data)
    } catch (error) {
      if (running.current) {
        releaseCamera()
        setError(error.name === 'AbortError' ? 'Camera processing timed out. Finish this session and try again.' : error.message)
        setStatus('unsaved')
      }
    } finally {
      clearTimeout(timeout)
      if (running.current) timer.current = setTimeout(capture, 200)
    }
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access requires localhost or a secure HTTPS connection.'); return
    }
    const attempt = ++generation.current
    setStatus('starting'); setError(''); setNotice(''); setMetrics(null)
    try {
      const camera = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false })
      if (!mounted.current || attempt !== generation.current) { camera.getTracks().forEach(track => track.stop()); return }
      stream.current = camera
      video.current.srcObject = camera
      await video.current.play()
      const data = await request('/api/training/sessions', { exercise, planExerciseId: selected && !exerciseChanged.current ? selected.planExerciseId : undefined })
      if (!mounted.current || attempt !== generation.current) {
        camera.getTracks().forEach(track => track.stop())
        await request('/api/training/sessions/' + data.token + '/end', {})
        return
      }
      session.current = data.token
      camera.getVideoTracks()[0].onended = () => {
        if (running.current) { releaseCamera(); setError('Camera disconnected. Finish the session to save recorded movement.'); setStatus('unsaved') }
      }
      running.current = true
      setStatus('running')
      capture()
    } catch (error) {
      releaseCamera()
      if (mounted.current) {
        setStatus(session.current ? 'unsaved' : 'idle')
        setError(error.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in your browser, then try again.' :
          error.name === 'NotFoundError' ? 'No camera was found. Connect a camera and try again.' : error.message)
      }
    }
  }
  const active = status !== 'idle'
  const totalReps = workouts.reduce((sum, workout) => sum + workout.repetitions, 0)
  return <div className="app-page training-workspace">
    <div className="training-tabs" aria-label="Training views">
      <button disabled={active} aria-pressed={page === 'train'} onClick={() => { setPage('train'); setError('') }}>Train</button>
      <button disabled={active} aria-pressed={page === 'history'} onClick={() => { setPage('history'); loadHistory() }}>History</button>
    </div>
    <main>
      <div className="intro"><p className="eyebrow">{page === 'train' ? 'MOVE WITH INTENTION' : 'YOUR TRAINING LOG'}</p>
        <h1>{page === 'train' ? <>Every rep.<br /><span>A little better.</span></> : <>Your work,<br /><span>recorded.</span></>}</h1>
        <p>{page === 'train' ? 'Choose an exercise, start your camera, and follow your movement in real time.' : 'Real sessions and measured activity. No invented scores or calorie counts.'}</p>
      </div>
      {error && <div role="alert" className="error">{error} {!health && <button onClick={checkHealth}>Retry connection</button>}</div>}
      {notice && <div role="status" className="notice">{notice}</div>}
      {page === 'train' ? <>
        <div className="workspace"><section className="camera-panel">
          <div className="panel-heading"><h2>Movement studio</h2><span className={'badge ' + (status === 'running' ? 'live' : '')}>{status === 'running' ? '● LIVE' : 'CAMERA OFF'}</span></div>
          <div className="camera-view">
            <video ref={video} muted playsInline className={metrics?.image && status === 'running' ? 'source-video' : ''} />
            {metrics?.image && status === 'running' && <img src={metrics.image} alt="Your camera with detected pose landmarks" />}
            {status !== 'running' && <div className="camera-placeholder"><div className="frame-icon">⌑</div><h3>{status === 'starting' ? 'Connecting your camera…' : 'Your next session starts here'}</h3><p>Position your whole body in view.<br />Use good lighting and leave room to move.</p></div>}
          </div>
          <div className="camera-footer"><span>{status === 'running' ? metrics?.message || 'Finding your pose…' : 'Camera starts only when you choose Start session.'}</span></div>
        </section><aside className="controls">
          <p className="eyebrow">01 / SET UP</p><h2>Make it your session</h2>
          <label htmlFor="exercise">Exercise</label><select id="exercise" value={exercise} disabled={active || !health} onChange={e => { exerciseChanged.current = true; setExercise(e.target.value) }}>
            {(health?.exercises || ['Squats']).map(name => <option key={name}>{name}</option>)}</select>
          {selected && !exerciseChanged.current && selected.workoutName && <p className="helper">From {selected.workoutName} · {selected.sets} sets × {selected.repetitions} reps</p>}
          <p className="helper">The tracker estimates repetitions from visible joint positions. Tracking can be interrupted by occlusion or poor lighting.</p>
          {health && !health.poseAvailable && <p role="status" className="error">Pose detection is unavailable. Check the server setup.</p>}
          <div className="metrics" aria-live="polite"><div><strong>{exercise === 'Plank' ? (metrics?.hold || 0).toFixed(1) : metrics?.repetitions || 0}</strong><span>{exercise === 'Plank' ? 'hold / seconds' : 'repetitions'}</span></div><div><strong>{Math.floor(metrics?.elapsed || 0)}<small>s</small></strong><span>session time</span></div></div>
          {status === 'idle' ? <button className="primary" onClick={start} disabled={!health?.poseAvailable}>Start session <span>↗</span></button> :
            <button className="primary" onClick={stop} disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : status === 'starting' ? 'Cancel' : status === 'unsaved' ? 'Finish & save' : 'Stop & save'}</button>}
          <div className="privacy"><h3>Your camera, your control.</h3><p>Frames are processed by the tracker on this computer. Images are not saved. Stop ends camera access.</p></div>
        </aside></div>
        <div className="notes"><article><span>01</span><h3>Find your frame</h3><p>Keep your body and joints visible from head to foot.</p></article><article><span>02</span><h3>Move at your pace</h3><p>Follow the rep count and pose overlay as you move.</p></article><article><span>03</span><h3>Keep the record</h3><p>Stop and save to add the session to your local history.</p></article></div>
      </> : <section className="history-panel"><div className="panel-heading"><h2>{workouts.length} sessions · {totalReps} repetitions</h2><button disabled={historyLoading} onClick={loadHistory}>Refresh</button></div>
        {historyLoading ? <p role="status">Loading sessions…</p> : !workouts.length ? <div className="empty"><h3>Your first session is ahead of you.</h3><p>Complete a tracked workout and it will appear here.</p><button className="primary" onClick={() => setPage('train')}>Start training</button></div> :
          <div className="table-scroll"><table><thead><tr><th>Exercise</th><th>Recorded</th><th>Reps</th><th>Session time</th><th>Workout</th><th>Notes</th></tr></thead><tbody>{workouts.map(w => <tr key={w.id}><td>{w.exercise}</td><td>{new Date(w.completedAt).toLocaleString()}</td><td>{w.repetitions}</td><td>{w.duration}s</td><td>{w.workoutName || 'Free training'}</td><td>{w.feedback}</td></tr>)}</tbody></table></div>}
      </section>}
    </main><p className="helper">Stop and save before leaving. Movement estimates are not a validated form score.</p>
    <canvas ref={canvas} hidden />
  </div>
}

