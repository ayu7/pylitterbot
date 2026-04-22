"""FastAPI backend for Litter Robot UI."""

import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add parent directory to path to import pylitterbot
sys.path.insert(0, str(__file__).rsplit("\\", 1)[0].rsplit("\\", 1)[0])

from pylitterbot import Account

_LOGGER = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Litter Robot UI",
    description="API for controlling and monitoring Litter Robots",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
_account: Account | None = None
_robots: dict = {}


class ActivityResponse(BaseModel):
    """Activity response model."""

    messageId: str
    userId: str
    eventId: str
    serial: str
    robotName: str
    type: str
    timestamp: str
    subtype: str | None = None
    categories: list[str] | None = None


class RobotStatusResponse(BaseModel):
    """Robot status response model."""

    id: str
    name: str
    model: str
    serial: str
    is_online: bool
    power_status: str
    cycle_count: int
    cycle_capacity: int
    is_waste_drawer_full: bool
    status: str
    last_seen: str | None
    is_sleeping: bool
    night_light_mode_enabled: bool
    panel_lock_enabled: bool


class RobotControlRequest(BaseModel):
    """Robot control request model."""

    action: str
    value: Any = None


@app.on_event("startup")
async def startup_event():
    """Initialize robots on startup."""
    global _account, _robots
    try:
        # Read credentials from credentials.txt
        credentials_path = Path(__file__).parent.parent / "credentials.txt"
        if not credentials_path.exists():
            _LOGGER.error(
                f"Credentials file not found at {credentials_path}. "
                "Please create it with email on line 1 and password on line 2."
            )
            return

        with open(credentials_path, "r") as f:
            lines = f.read().strip().split("\n")
            if len(lines) < 2:
                _LOGGER.error(
                    "Credentials file must have email on line 1 and password on line 2"
                )
                return

            email = lines[0].strip()
            password = lines[1].strip()

        # Initialize account and connect
        _account = Account()
        _LOGGER.info(f"Connecting to Litter Robot account: {email}")
        await _account.connect(email, password, load_robots=True, load_pets=True)
        _LOGGER.info("Successfully connected to Litter Robot account")

        # Store robots
        for robot in _account.robots:
            _robots[robot.id] = robot
            _LOGGER.info(f"Robot loaded: {robot.name} ({robot.model})")

    except Exception as e:
        _LOGGER.error(f"Failed to initialize robots: {e}")
        raise


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/robots")
async def get_robots():
    """Get all available robots."""
    if not _robots:
        raise HTTPException(
            status_code=503,
            detail="No robots available. Check server startup logs.",
        )

    return {
        "robots": [
            {
                "id": robot.id,
                "name": robot.name,
                "model": robot.model,
                "serial": robot.serial,
            }
            for robot in _robots.values()
        ]
    }


@app.get("/robots/{robot_id}/status")
async def get_robot_status(robot_id: str):
    """Get detailed status of a specific robot."""
    if robot_id not in _robots:
        raise HTTPException(status_code=404, detail="Robot not found")

    robot = _robots[robot_id]
    return {
        "id": robot.id,
        "name": robot.name,
        "model": robot.model,
        "serial": robot.serial,
        "is_online": robot.is_online,
        "power_status": robot.power_status,
        "cycle_count": robot.cycle_count,
        "cycle_capacity": robot.cycle_capacity,
        "is_waste_drawer_full": robot.is_waste_drawer_full,
        "status": robot.status_text or "Unknown",
        "last_seen": robot.last_seen.isoformat() if robot.last_seen else None,
        "is_sleeping": robot.is_sleeping,
        "night_light_mode_enabled": robot.night_light_mode_enabled,
        "panel_lock_enabled": robot.panel_lock_enabled,
    }


@app.get("/robots/{robot_id}/waste_drawer_level")
async def get_robot_waste_drawer_level(robot_id: str):
    """Get the waste drawer level for a specific robot."""
    if robot_id not in _robots:
        raise HTTPException(status_code=404, detail="Robot not found")
    robot = _robots[robot_id]

    try:
        waste_level = robot.waste_drawer_level
        _LOGGER.info(f"Retrieved waste drawer level for robot {robot_id}")
        return {
            "waste_drawer_level": waste_level,
        }
    except Exception as e:
        _LOGGER.error(
            f"Failed to retrieve waste drawer level for robot {robot_id}: {e}"
        )
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve waste drawer level: {str(e)}"
        )


@app.get("/robots/{robot_id}/litter_level")
async def get_robot_litter_level(robot_id: str):
    """Get the litter level for a specific robot."""
    if robot_id not in _robots:
        raise HTTPException(status_code=404, detail="Robot not found")
    robot = _robots[robot_id]

    try:
        litter_level = robot.litter_level
        _LOGGER.info(f"Retrieved litter level for robot {robot_id}")
        return {
            "litter_level": litter_level,
        }
    except Exception as e:
        _LOGGER.error(f"Failed to retrieve litter level for robot {robot_id}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve litter level: {str(e)}"
        )


@app.get("/robots/{robot_id}/activities")
async def get_robot_activities(robot_id: str, limit: int = 20):
    """Get recent activities for a robot."""
    if robot_id not in _robots:
        raise HTTPException(status_code=404, detail="Robot not found")

    robot = _robots[robot_id]

    # Get activities from the robot
    activities = []
    try:
        activities = await robot.get_activities(limit=limit)
        _LOGGER.info(f"Retrieved {len(activities)} activities for robot {robot_id}")
    except Exception as e:
        _LOGGER.warning(f"Failed to retrieve activities for robot {robot_id}: {e}")

    return {"activities": activities}


@app.post("/robots/{robot_id}/control")
async def control_robot(robot_id: str, request: RobotControlRequest):
    """Send a control command to a robot."""
    if robot_id not in _robots:
        raise HTTPException(status_code=404, detail="Robot not found")

    robot = _robots[robot_id]
    valid_actions = [
        "clean",
        "power_on",
        "power_off",
        "night_light_on",
        "night_light_off",
        "lock_on",
        "lock_off",
    ]

    if request.action not in valid_actions:
        raise HTTPException(
            status_code=400, detail=f"Invalid action. Must be one of {valid_actions}"
        )

    try:
        # Send control command based on action
        if request.action == "clean":
            await robot.start_cleaning()
        elif request.action == "power_on":
            await robot.set_power_status(True)
        elif request.action == "power_off":
            await robot.set_power_status(False)
        elif request.action == "night_light_on":
            await robot.set_night_light(True)
        elif request.action == "night_light_off":
            await robot.set_night_light(False)
        elif request.action == "lock_on":
            await robot.set_panel_lockout(True)
        elif request.action == "lock_off":
            await robot.set_panel_lockout(False)

        _LOGGER.info(f"Sent {request.action} command to robot {robot_id}")
        return {
            "robot_id": robot_id,
            "action": request.action,
            "status": "success",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        _LOGGER.error(f"Failed to send control command to robot {robot_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send command: {str(e)}")


@app.post("/robots/{robot_id}/reset-drawer")
async def reset_drawer(robot_id: str):
    """Reset the waste drawer counter."""
    if robot_id not in _robots:
        raise HTTPException(status_code=404, detail="Robot not found")

    robot = _robots[robot_id]

    try:
        await robot.reset_waste_drawer()
        _LOGGER.info(f"Reset waste drawer counter for robot {robot_id}")
        return {
            "robot_id": robot_id,
            "action": "reset_drawer",
            "status": "success",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        _LOGGER.error(f"Failed to reset waste drawer for robot {robot_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reset drawer: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
