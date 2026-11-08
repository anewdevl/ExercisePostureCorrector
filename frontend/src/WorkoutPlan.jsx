import { useState } from "react"
import PropTypes from "prop-types"
import { Link } from "react-router-dom"
import WorkoutTable from "./WorkoutTable"
import { api } from "./api"

function SaveDay({ day }) {
  const [name, setName] = useState(day.day + ' workout')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      await api('/create_workout', { method: 'POST', body: {
        name: name.trim(), exercises: day.exercises.map(e => ({ name: e.exercise, sets: Number(e.sets), repetitions: Number(e.repetitions) })),
      } })
      setSaved(true)
    } catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  return <div className="no-print">{saved ? <p role="status">Saved. <Link className="track-link" to="/workouts">Open your workouts to edit or train →</Link></p> :
    <form className="actions" onSubmit={save}><label>Workout name for {day.day}<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} disabled={busy} /></label>
      <button disabled={busy}>{busy ? 'Saving…' : 'Save ' + day.day}</button></form>}
    {error && <p role="alert" className="error">{error}</p>}
  </div>
}
SaveDay.propTypes = { day: PropTypes.object.isRequired }

export default function WorkoutPlan({ workoutData }) {
  return <div className="workout-plan">
    <button className="btn no-print" onClick={() => window.print()}>Print / Save PDF</button>
    <div className="print-plan"><h2>Your weekly exercise plan</h2>
      {workoutData.map(day => <article className="panel" key={day.day}><h3>{day.day}</h3>
        {day.exercises.length ? <><WorkoutTable exercises={day.exercises} /><SaveDay key={JSON.stringify(day)} day={day} /></> : <p>Recovery day</p>}
      </article>)}
    </div>
  </div>
}
WorkoutPlan.propTypes = { workoutData: PropTypes.array.isRequired }
