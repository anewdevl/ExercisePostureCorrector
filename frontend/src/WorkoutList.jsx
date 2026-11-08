import { useState } from "react"
import PropTypes from "prop-types"
import { Link } from "react-router-dom"
import { api } from "./api"

export default function WorkoutList({ workouts, updateWorkout, updateCallback }) {
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function remove(id) {
    setBusy(true); setError('')
    try { await api('/delete_workout/' + id, { method: 'DELETE' }); setPending(null); updateCallback() }
    catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  return <div className="workout-list">
    {!workouts.length && <div className="panel"><h2>A fresh start</h2><p>Create your first workout to start building a routine.</p></div>}
    {error && <p role="alert" className="error">{error}</p>}
    <div className="workout-grid">{workouts.map(workout => <article className="panel" key={workout.id}>
      <h2>{workout.name}</h2><ul>{workout.exercises.map(e => <li className="exercise-summary" key={e.id}><span>{e.name}</span><span>{e.sets} × {e.repetitions}</span>
        {e.trackingId ? <Link className="track-link" to="/train" state={{ exercise: { name: e.name, trackingId: e.trackingId, planExerciseId: e.id, workoutName: workout.name, sets: e.sets, repetitions: e.repetitions } }}>Track</Link> : <small className="muted">Plan only</small>}</li>)}</ul>
      <div className="actions">{pending === workout.id ? <><span>Delete this workout?</span><button disabled={busy} onClick={() => remove(workout.id)}>{busy ? 'Deleting…' : 'Confirm delete'}</button><button disabled={busy} onClick={() => setPending(null)}>Cancel</button></> :
        <><button onClick={() => updateWorkout(workout)}>Edit</button><button onClick={() => setPending(workout.id)}>Delete</button></>}</div>
    </article>)}</div>
  </div>
}
WorkoutList.propTypes = { workouts: PropTypes.array.isRequired, updateWorkout: PropTypes.func.isRequired, updateCallback: PropTypes.func.isRequired }
