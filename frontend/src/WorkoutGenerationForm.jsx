import { useState } from "react"
import PropTypes from "prop-types"
import { api } from "./api"
import { GENDERS, FITNESS_LEVELS, GOALS } from "./constants"

const WorkoutGenerationForm = ({ onWorkoutGenerated }) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    height: "",
    weight: "",
    age: "",
    gender: "",
    fitnessLevel: "",
    goal: "",
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      const data = await api("/generate_workout", { method: "POST", body: formData })
      onWorkoutGenerated(data.workout)
    } catch (error) {
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset disabled={busy}>
      <div className="form-group">
        <label htmlFor="height">Height (cm)</label>
        <input
          type="number" min="1" step="1"
          max="300" name="height"
          id="height"
          value={formData.height}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="weight">Weight (kg)</label>
        <input
          type="number" min="1" step="1"
          max="500" name="weight"
          id="weight"
          value={formData.weight}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="age">Age</label>
        <input
          type="number" min="1" step="1"
          max="120" name="age"
          id="age"
          value={formData.age}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="gender">Gender</label>
        <select
          name="gender"
          id="gender"
          value={formData.gender}
          onChange={handleChange}
          required
        >
          <option value="">Select Gender</option>
          {GENDERS.map((gender) => (
            <option key={gender.value} value={gender.value}>
              {gender.title}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="fitnessLevel">Fitness Level</label>
        <select
          name="fitnessLevel"
          id="fitnessLevel"
          value={formData.fitnessLevel}
          onChange={handleChange}
          required
        >
          <option value="">Select Fitness Level</option>
          {FITNESS_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.title}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="goal">Goal</label>
        <select
          name="goal"
          id="goal"
          value={formData.goal}
          onChange={handleChange}
          required
        >
          <option value="">Select Goal</option>
          {GOALS.map((goal) => (
            <option key={goal.value} value={goal.value}>
              {goal.title}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn">
        {busy ? "Generating…" : "Generate Workout"}
      </button>
      </fieldset>
      {busy && <p role="status">Creating your plan. This can take up to two minutes.</p>}
      {error && <p role="alert" className="error">{error}</p>}
    </form>
  )
}

WorkoutGenerationForm.propTypes = { onWorkoutGenerated: PropTypes.func.isRequired }
export default WorkoutGenerationForm
