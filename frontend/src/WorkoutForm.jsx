import { useState } from "react"
import PropTypes from "prop-types"
import { api } from "./api"

const emptyExercise = () => ({ name: '', sets: '', repetitions: '' })
export default function WorkoutForm({ existingWorkout = {}, updateCallback, onCancel }) {
  const [name, setName] = useState(existingWorkout.name || '')
  const [exercises, setExercises] = useState(() => existingWorkout.exercises?.map(e => ({ ...e })) || [emptyExercise()])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  function change(index, field, value) {
    setExercises(items => items.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }
  async function submit(event) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      await api(existingWorkout.id ? '/update_workout/' + existingWorkout.id : '/create_workout', {
        method: existingWorkout.id ? 'PATCH' : 'POST',
        body: { name: name.trim(), exercises: exercises.map(e => ({ name: e.name.trim(), sets: Number(e.sets), repetitions: Number(e.repetitions) })) },
      })
      updateCallback()
    } catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  return <form onSubmit={submit}>
    <fieldset disabled={busy}><label className="form-group">Workout name<input autoFocus required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>
      {exercises.map((exercise, index) => <div className="exercise-row" key={index}>
        <label>Exercise {index + 1}<input required maxLength={100} value={exercise.name} onChange={e => change(index, 'name', e.target.value)} /></label>
        <label>Sets<input required type="number" min="1" max="100" step="1" value={exercise.sets} onChange={e => change(index, 'sets', e.target.value)} /></label>
        <label>Reps<input required type="number" min="1" max="1000" step="1" value={exercise.repetitions} onChange={e => change(index, 'repetitions', e.target.value)} /></label>
        <button type="button" disabled={exercises.length === 1} onClick={() => setExercises(items => items.filter((_, i) => i !== index))}>Remove</button>
      </div>)}
      <div className="actions"><button type="button" disabled={exercises.length >= 50} onClick={() => setExercises([...exercises, emptyExercise()])}>Add exercise</button>
        <button className="btn" type="submit">{busy ? 'Saving…' : 'Save workout'}</button><button type="button" onClick={onCancel}>Cancel</button></div>
    </fieldset>{error && <p className="error" role="alert">{error}</p>}
  </form>
}
WorkoutForm.propTypes = { existingWorkout: PropTypes.object, updateCallback: PropTypes.func.isRequired, onCancel: PropTypes.func.isRequired }
