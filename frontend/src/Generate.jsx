import { useState } from "react"
import WorkoutGenerationForm from "./WorkoutGenerationForm"
import WorkoutPlan from "./WorkoutPlan"
import ProviderNotice from "./ProviderNotice"

const Generate = () => {
  const [generatedWorkout, setGeneratedWorkout] = useState(null)

  const handleWorkoutGenerated = (workout) => {
    setGeneratedWorkout(workout)
  }

  return (
    <main className="app-page">
      <h1>Generate Workout Plan</h1>
      <ProviderNotice />
      <div className="generate-page">
        <div className="form-section">
          <h2>Enter Your Details</h2>
          <WorkoutGenerationForm onWorkoutGenerated={handleWorkoutGenerated} />
        </div>
        <div className="result-section">
          <h2>Your Workout Plan</h2>
          {generatedWorkout ? (
            <WorkoutPlan workoutData={generatedWorkout} />
          ) : (
            <p>Fill out the form to generate your workout plan.</p>
          )}
        </div>
      </div>
    </main>
  )
}

export default Generate
