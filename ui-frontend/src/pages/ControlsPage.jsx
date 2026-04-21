import React, { useEffect, useState } from 'react'
import { robotService } from '../services/robotService'
import '../styles/ControlsPage.css'

export const ControlsPage = ({ robotId }) => {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true)
        const data = await robotService.getRobotStatus(robotId)
        setStatus(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [robotId])

  const handleControl = async (action) => {
    try {
      setFeedbackMessage(null)
      const result = await robotService.controlRobot(robotId, action)
      setFeedbackMessage(`${action} command sent successfully`)
      // Refresh status after command
      const data = await robotService.getRobotStatus(robotId)
      setStatus(data)
      setTimeout(() => setFeedbackMessage(null), 3000)
    } catch (err) {
      setFeedbackMessage(`Error: ${err.message}`)
    }
  }

  const handleResetDrawer = async () => {
    if (window.confirm('Are you sure you want to reset the waste drawer counter?')) {
      try {
        setFeedbackMessage(null)
        await robotService.resetDrawer(robotId)
        setFeedbackMessage('Drawer counter reset successfully')
        const data = await robotService.getRobotStatus(robotId)
        setStatus(data)
        setTimeout(() => setFeedbackMessage(null), 3000)
      } catch (err) {
        setFeedbackMessage(`Error: ${err.message}`)
      }
    }
  }

  if (loading || !status) {
    return <div className="controls-page"><p>Loading controls...</p></div>
  }

  return (
    <div className="controls-page">
      <h1>Litter Robot Controls</h1>

      {/* Robot Info Card */}
      <div className="robot-info-card">
        <h2>{status.name}</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Model:</span>
            <span className="value">{status.model}</span>
          </div>
          <div className="info-item">
            <span className="label">Serial:</span>
            <span className="value">{status.serial}</span>
          </div>
          <div className="info-item">
            <span className="label">Status:</span>
            <span className={`value status-${status.status.toLowerCase()}`}>{status.status}</span>
          </div>
          <div className="info-item">
            <span className="label">Online:</span>
            <span className={`value status-${status.is_online ? 'online' : 'offline'}`}>
              {status.is_online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="status-card">
        <h3>Status Information</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="label">Power:</span>
            <span className="value">{status.power_status === 'AC' ? 'AC Power' : 'Battery'}</span>
          </div>
          <div className="status-item">
            <span className="label">Cycle Count:</span>
            <span className="value">{status.cycle_count} / {status.cycle_capacity}</span>
          </div>
          <div className="status-item">
            <span className="label">Waste Drawer:</span>
            <span className={`value ${status.is_waste_drawer_full ? 'drawer-full' : 'drawer-ok'}`}>
              {status.is_waste_drawer_full ? 'FULL' : 'OK'}
            </span>
          </div>
          <div className="status-item">
            <span className="label">Sleep Mode:</span>
            <span className="value">{status.is_sleeping ? 'Sleeping' : 'Active'}</span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="controls-section">
        <h3>Controls</h3>
        <div className="button-grid">
          <button className="control-btn primary" onClick={() => handleControl('clean')}>
            Clean Now
          </button>
          <button
            className={`control-btn ${status.night_light_mode_enabled ? 'active' : ''}`}
            onClick={() => handleControl(status.night_light_mode_enabled ? 'night_light_off' : 'night_light_on')}
          >
            Night Light {status.night_light_mode_enabled ? 'ON' : 'OFF'}
          </button>
          <button
            className={`control-btn ${status.panel_lock_enabled ? 'active' : ''}`}
            onClick={() => handleControl(status.panel_lock_enabled ? 'lock_off' : 'lock_on')}
          >
            Panel Lock {status.panel_lock_enabled ? 'ON' : 'OFF'}
          </button>
          <button
            className={`control-btn ${status.is_online ? 'danger' : 'disabled'}`}
            onClick={() => handleControl('power_off')}
            disabled={!status.is_online}
          >
            Power Off
          </button>
        </div>
      </div>

      {/* Drawer Management */}
      {status.is_waste_drawer_full && (
        <div className="alert-section warning">
          <p>⚠️ Waste drawer is full. Please empty it.</p>
          <button className="drawer-reset-btn" onClick={handleResetDrawer}>
            Reset Drawer Counter
          </button>
        </div>
      )}

      {/* Feedback Messages */}
      {feedbackMessage && (
        <div className={`feedback-message ${feedbackMessage.includes('Error') ? 'error' : 'success'}`}>
          {feedbackMessage}
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
  )
}
