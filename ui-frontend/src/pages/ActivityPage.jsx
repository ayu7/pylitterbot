import React, { useEffect, useState } from 'react'
import { robotService } from '../services/robotService'
import '../styles/ActivityPage.css'

export const ActivityPage = ({ robotId }) => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true)
        const data = await robotService.getRobotActivities(robotId, 50)
        setActivities(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
    const interval = setInterval(fetchActivities, 60000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [robotId])

  if (loading && activities.length === 0) {
    return <div className="activity-page"><p>Loading activities...</p></div>
  }

  return (
    <div className="activity-page">
      <h1>Recent Activities</h1>
      {error && <div className="error-message">{error}</div>}
      {activities.length === 0 ? (
        <p>No activities yet</p>
      ) : (
        <div className="activities-list">
          {activities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-time">
                {new Date(activity.timestamp).toLocaleString()}
              </div>
              <div className="activity-robot-name">{activity.robotName}</div>
              <div className="activity-action">{activity.type}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
