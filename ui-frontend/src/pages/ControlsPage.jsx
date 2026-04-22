import React, { useEffect, useState } from 'react'
import { robotService } from '../services/robotService'
import '../styles/ControlsPage.css'

const DeviceCard = ({ robot, onAction }) => {
  const [status, setStatus] = useState(null)
  const [wastePercentage, setWastePercentage] = useState(0)
  const [litterPercentage, setLitterPercentage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true)
        const data = await robotService.getRobotStatus(robot.id)
        const wastePercentage = await robotService.getRobotWaste(robot.id);
        const litterPercentage = await robotService.getRobotLitter(robot.id);
        setWastePercentage(wastePercentage)
        setLitterPercentage(litterPercentage)
        setStatus(data)
      } catch (err) {
        console.error('Failed to fetch status:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)

    return () => clearInterval(interval)
  }, [robot.id])

  const handleAction = async (action) => {
    setActionLoading(action)
    try {
      await onAction(robot.id, action)
      const data = await robotService.getRobotStatus(robot.id)
      setStatus(data)
    } catch (err) {
      console.error('Action failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const getWasteLevelColor = (percentage) => {
    if (percentage < 25) return '#27ae60'
    if (percentage < 50) return '#f39c12'
    if (percentage < 75) return '#e67e22'
    return '#e74c3c'
  }

  const getLitterLevelColor = (percentage) => {
    if (percentage < 25) return '#e74c3c'
    if (percentage < 50) return '#e67e22'
    if (percentage < 75) return '#f39c12'
    return '#27ae60'
  }

  if (loading || !status) {
    return (
      <div className="device-card loading">
        <div className="device-header">
          <h3>{robot.name}</h3>
          <div className="device-model">{robot.model}</div>
        </div>
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  return (
    <div className="device-card">
      <div className="device-header">
        <h3>{robot.name}</h3>
        <div className="device-model">{robot.model}</div>
        <div className={`device-status ${status.is_online ? 'online' : 'offline'}`}>
          {status.is_online ? '● Online' : '● Offline'}
        </div>
      </div>

      <div className="device-body">
        <div className="levels-section">
          <div className="level-indicator">
            <div className="level-bar-container">
              <div
                className="level-bar waste-level"
                style={{
                  height: `${wastePercentage}%`,
                  backgroundColor: getWasteLevelColor(wastePercentage)
                }}
              />
            </div>
            <div className="level-label">Waste</div>
            <div className="level-value">{Math.round(wastePercentage)}%</div>
          </div>

          <div className="level-indicator">
            <div className="level-bar-container">
              <div
                className="level-bar litter-level"
                style={{
                  height: `${litterPercentage}%`,
                  backgroundColor: getLitterLevelColor(litterPercentage)
                }}
              />
            </div>
            <div className="level-label">Litter</div>
            <div className="level-value">{Math.round(litterPercentage)}%</div>
          </div>
        </div>

        <div className="device-info">
          <div className="info-item">
            <span className="label">Power:</span>
            <span className="value">{status.power_status}</span>
          </div>
          <div className="info-item">
            <span className="label">Status:</span>
            <span className="value">{status.status}</span>
          </div>
          <div className="info-item">
            <span className="label">Last Seen:</span>
            <span className="value">
              {status.last_seen ? new Date(status.last_seen).toLocaleString() : 'Never'}
            </span>
          </div>
        </div>

        <div className="actions-section">
          <button
            className={`action-btn clean ${actionLoading === 'clean' ? 'loading' : ''}`}
            onClick={() => handleAction('clean')}
            disabled={actionLoading !== null}
            title="Clean Now"
          >
            ⟲
          </button>

          <button
            className={`action-btn night-light ${status.night_light_mode_enabled ? 'active' : ''}`}
            onClick={() => handleAction(status.night_light_mode_enabled ? 'night_light_off' : 'night_light_on')}
            disabled={actionLoading !== null}
            title={status.night_light_mode_enabled ? 'Turn Off Night Light' : 'Turn On Night Light'}
          >
            🟒
          </button>

          <button
            className={`action-btn lock ${status.panel_lock_enabled ? 'active' : ''}`}
            onClick={() => handleAction(status.panel_lock_enabled ? 'lock_off' : 'lock_on')}
            disabled={actionLoading !== null}
            title={status.panel_lock_enabled ? 'Unlock Panel' : 'Lock Panel'}
          >
            {status.panel_lock_enabled ? '⚿' : '⌧'}
          </button>

          <button
            className={`action-btn power ${actionLoading === 'power_off' ? 'loading' : ''}`}
            onClick={() => handleAction('power_off')}
            disabled={actionLoading !== null || !status.is_online}
            title="Power Off"
          >
            ⏻
          </button>
        </div>

        {status.is_waste_drawer_full && (
          <div className="alert-banner">
            <span>Waste drawer is full - please empty</span>
            <button
              className="reset-btn"
              onClick={() => handleAction('reset_drawer')}
              disabled={actionLoading !== null}
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export const ControlsPage = ({ robotId }) => {
  const [robots, setRobots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)

  useEffect(() => {
    const loadRobots = async () => {
      try {
        setLoading(true)
        const robotList = await robotService.getRobots()
        setRobots(robotList)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadRobots()
  }, [])

  const handleDeviceAction = async (robotId, action) => {
    try {
      setFeedbackMessage(null)
      const result = await robotService.controlRobot(robotId, action)
      setFeedbackMessage(`${action.replace('_', ' ')} command sent successfully`)
      setTimeout(() => setFeedbackMessage(null), 3000)
    } catch (err) {
      setFeedbackMessage(`Error: ${err.message}`)
      setTimeout(() => setFeedbackMessage(null), 5000)
    }
  }

  if (loading) {
    return <div className="controls-page"><p>Loading devices...</p></div>
  }

  if (error) {
    return <div className="controls-page"><p className="error-message">{error}</p></div>
  }

  return (
    <div className="controls-page">
      <h1>Devices</h1>

      {feedbackMessage && (
        <div className={`feedback-message ${feedbackMessage.includes('Error') ? 'error' : 'success'}`}>
          {feedbackMessage}
        </div>
      )}

      <div className="devices-grid">
        {robots.map((robot) => (
          <DeviceCard
            key={robot.id}
            robot={robot}
            onAction={handleDeviceAction}
          />
        ))}
      </div>

      {robots.length === 0 && (
        <div className="no-devices">
          <p>No devices found. Please check your Litter Robot account.</p>
        </div>
      )}
    </div>
  )
}
