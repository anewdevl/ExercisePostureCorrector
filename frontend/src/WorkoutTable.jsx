import PropTypes from "prop-types"

const WorkoutTable = ({ exercises }) => {
  return (
    <table className="workout-table">
      <thead>
        <tr>
          <th>Exercise</th>
          <th>Sets</th>
          <th>Reps</th>
        </tr>
      </thead>
      <tbody>
        {exercises.map((exercise, index) => (
          <tr key={index}>
            <td>{exercise.exercise}</td>
            <td>{exercise.sets}</td>
            <td>{exercise.repetitions}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

WorkoutTable.propTypes = { exercises: PropTypes.array.isRequired }
export default WorkoutTable
